import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { FOLLOW_EDGES, RAW_POSTS, type RawPost } from "@/data/corpus";
import { buildCorpus, DEMO_CORPUS, type Corpus, type EnrichedPost } from "@/lib/enrichment";
import type { Database } from "@/integrations/supabase/types";

type SavedRow = Database["public"]["Tables"]["saved_posts"]["Row"];

const MEDIA: Record<string, RawPost["mediaType"]> = {
  IMAGE: "image",
  CAROUSEL_ALBUM: "carousel",
  VIDEO: "reel",
  REELS: "reel",
  STORY: "story",
};

export function rowToRaw(r: SavedRow): RawPost {
  return {
    id: r.external_id,
    author: r.author.startsWith("@") ? r.author : `@${r.author}`,
    authorCategory: "influencer",
    followers: Math.max(1, r.followers),
    mediaType: MEDIA[r.media_type.toUpperCase()] ?? (r.media_type as RawPost["mediaType"]) ?? "image",
    caption: r.caption,
    hashtags: r.hashtags,
    location: "—",
    timestamp: r.posted_at,
    likes: r.likes,
    comments: r.comments,
    saves: r.saves,
    shares: r.shares,
    comments_sample: r.comments_sample,
  };
}

/** Ties are derived from @mentions: author -> mentioned account. */
function mentionEdges(rows: SavedRow[]): [string, string][] {
  const set = new Set<string>();
  for (const r of rows) {
    const a = r.author.startsWith("@") ? r.author : `@${r.author}`;
    for (const m of r.mentions) {
      const b = m.startsWith("@") ? m : `@${m}`;
      if (b.toLowerCase() !== a.toLowerCase()) set.add(`${a}|${b}`);
    }
  }
  return [...set].map((k) => k.split("|") as [string, string]);
}

/**
 * Keep the most recent `days` of posts, measured back from the newest post in
 * the set (not wall-clock now, so the historical demo corpus stays filterable).
 * Falls back to the unfiltered set when a range would leave too little data
 * for the charts and tables to render.
 */
function withinDays<T>(items: T[], days: number | null, ts: (item: T) => string): T[] {
  if (!days || items.length === 0) return items;
  const max = Math.max(...items.map((i) => Date.parse(ts(i))));
  const cutoff = max - days * 86_400_000;
  const filtered = items.filter((i) => Date.parse(ts(i)) >= cutoff);
  return filtered.length >= 3 ? filtered : items;
}

export type CorpusSource = "auto" | "demo" | "saved";

type Ctx = {
  corpus: Corpus;
  user: User | null;
  authReady: boolean;
  saved: SavedRow[];
  loading: boolean;
  refresh: () => Promise<void>;
  source: CorpusSource;
  setSource: (s: CorpusSource) => void;
  days: number | null;
  setDays: (d: number | null) => void;
  /* Evidence rail state: the posts behind whatever the user selected. */
  evidence: EnrichedPost[];
  evidenceFocus: string | null;
  railOpen: boolean;
  setRailOpen: (open: boolean) => void;
  setEvidence: (posts: EnrichedPost[]) => void;
  focusEvidence: (postId: string | null) => void;
  openEvidence: (posts: EnrichedPost[], focusId?: string) => void;
};

const CorpusContext = createContext<Ctx>({
  corpus: DEMO_CORPUS,
  user: null,
  authReady: false,
  saved: [],
  loading: false,
  refresh: async () => {},
  source: "auto",
  setSource: () => {},
  days: null,
  setDays: () => {},
  evidence: [],
  evidenceFocus: null,
  railOpen: false,
  setRailOpen: () => {},
  setEvidence: () => {},
  focusEvidence: () => {},
  openEvidence: () => {},
});

export function CorpusProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<CorpusSource>("auto");
  const [days, setDays] = useState<number | null>(null);
  const [evidence, setEvidenceState] = useState<EnrichedPost[]>([]);
  const [evidenceFocus, setEvidenceFocus] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      setUser(s.session?.user ?? null);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_posts")
      .select("*")
      .eq("user_id", "00000000-0000-0000-0000-000000000000")
      .order("posted_at", { ascending: false })
      .limit(1000);
    if (!error) setSaved(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setEvidence = useCallback((posts: EnrichedPost[]) => {
    setEvidenceState(posts);
  }, []);

  const focusEvidence = useCallback((postId: string | null) => {
    setEvidenceFocus(postId);
  }, []);

  const openEvidence = useCallback((posts: EnrichedPost[], focusId?: string) => {
    setEvidenceState(posts);
    setEvidenceFocus(focusId ?? null);
    setRailOpen(true);
  }, []);

  const rangedSaved = useMemo(() => withinDays(saved, days, (r) => r.posted_at), [saved, days]);
  const rangedRaw = useMemo(() => withinDays(RAW_POSTS, days, (p) => p.timestamp), [days]);

  const corpus = useMemo(() => {
    if (source !== "demo" && rangedSaved.length) {
      return buildCorpus(rangedSaved.map(rowToRaw), mentionEdges(rangedSaved));
    }
    return buildCorpus(rangedRaw, FOLLOW_EDGES, true);
  }, [source, rangedSaved, rangedRaw]);

  return (
    <CorpusContext.Provider
      value={{
        corpus,
        user,
        authReady,
        saved,
        loading,
        refresh,
        source,
        setSource,
        days,
        setDays,
        evidence,
        evidenceFocus,
        railOpen,
        setRailOpen,
        setEvidence,
        focusEvidence,
        openEvidence,
      }}
    >
      {children}
    </CorpusContext.Provider>
  );
}

export const useCorpusState = () => useContext(CorpusContext);
export const useCorpus = () => useContext(CorpusContext).corpus;
