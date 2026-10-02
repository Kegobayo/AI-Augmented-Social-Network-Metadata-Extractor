import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { RawPost } from "@/data/corpus";
import { buildCorpus, DEMO_CORPUS, type Corpus } from "@/lib/enrichment";
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

type Ctx = {
  corpus: Corpus;
  user: User | null;
  authReady: boolean;
  saved: SavedRow[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const CorpusContext = createContext<Ctx>({
  corpus: DEMO_CORPUS,
  user: null,
  authReady: false,
  saved: [],
  loading: false,
  refresh: async () => {},
});

export function CorpusProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(false);

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

  const corpus = useMemo(
    () => (saved.length ? buildCorpus(saved.map(rowToRaw), mentionEdges(saved)) : DEMO_CORPUS),
    [saved],
  );

  return (
    <CorpusContext.Provider value={{ corpus, user, authReady, saved, loading, refresh }}>
      {children}
    </CorpusContext.Provider>
  );
}

export const useCorpusState = () => useContext(CorpusContext);
export const useCorpus = () => useContext(CorpusContext).corpus;
