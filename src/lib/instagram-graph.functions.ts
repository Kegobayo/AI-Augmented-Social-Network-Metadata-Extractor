import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { analyzeText } from "./enrichment";

/**
 * Layer 1 — authorised ingestion through the official Instagram API
 * (Instagram Login). Each signed-in user links their own Business/Creator
 * account with an access token; the token is stored server-side only.
 */

/** Single shared workspace — the app is open to everyone, no sign-in. */
const SHARED = "00000000-0000-0000-0000-000000000000";

const GRAPH = "https://graph.instagram.com/v23.0";

async function graph<T>(path: string, token: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const res = await fetch(url);
  const body = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: number } } & T;
  if (!res.ok || body.error) {
    const msg = body.error?.message ?? `Instagram returned ${res.status}`;
    console.error(`Instagram API error [${res.status}] ${path}: ${msg}`);
    throw new Error(msg);
  }
  return body;
}

export const connectInstagram = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().trim().min(20).max(1000) }).parse(d))
  .handler(async ({ data }) => {
    let me: { user_id?: string; id?: string; username?: string; followers_count?: number };
    try {
      me = await graph("me", data.token, { fields: "user_id,username,followers_count" });
    } catch (e) {
      return { ok: false as const, error: `Instagram rejected this token: ${(e as Error).message}` };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("instagram_connections").upsert({
      user_id: SHARED,
      ig_user_id: me.user_id ?? me.id ?? null,
      username: me.username ?? null,
      followers: me.followers_count ?? null,
      access_token: data.token,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error(error);
      return { ok: false as const, error: "Could not save the connection." };
    }
    return { ok: true as const, username: me.username ?? "" };
  });

type Media = {
  id: string;
  caption?: string;
  media_type?: string;
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
  username?: string;
};

export const syncInstagram = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(50).default(25) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conn } = await supabaseAdmin
      .from("instagram_connections")
      .select("access_token, username, followers")
      .eq("user_id", SHARED)
      .maybeSingle();
    if (!conn) return { ok: false as const, error: "Link your Instagram account first." };
    const token = conn.access_token;

    let media: Media[];
    try {
      const res = await graph<{ data: Media[] }>("me/media", token, {
        fields:
          "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,username",
        limit: String(data.limit),
      });
      media = res.data ?? [];
    } catch (e) {
      return { ok: false as const, error: `Instagram: ${(e as Error).message}` };
    }

    const rows = [];
    for (const m of media) {
      const metrics: Record<string, number> = {};
      try {
        const ins = await graph<{ data: { name: string; values?: { value: number }[]; total_value?: { value: number } }[] }>(
          `${m.id}/insights`,
          token,
          { metric: "reach,saved,shares,views" },
        );
        for (const d of ins.data ?? []) metrics[d.name] = d.total_value?.value ?? d.values?.[0]?.value ?? 0;
      } catch {
        /* insights unavailable for some media types */
      }
      let comments: string[] = [];
      try {
        const c = await graph<{ data: { text: string }[] }>(`${m.id}/comments`, token, { fields: "text", limit: "8" });
        comments = (c.data ?? []).map((x) => x.text).filter(Boolean);
      } catch {
        /* comments permission may be missing */
      }
      const caption = m.caption ?? "";
      const hashtags = caption.match(/#[\w]+/g)?.map((h) => h.toLowerCase()) ?? [];
      const mentions = caption.match(/@[\w.]+/g) ?? [];
      const a = analyzeText(`${caption} ${comments.join(" ")}`, hashtags);
      rows.push({
        user_id: SHARED,
        source: "instagram",
        external_id: `ig_${m.id}`,
        author: `@${m.username ?? conn.username ?? "me"}`,
        followers: conn.followers ?? 0,
        media_type: m.media_product_type === "REELS" ? "REELS" : (m.media_type ?? "IMAGE"),
        caption,
        hashtags,
        mentions,
        permalink: m.permalink ?? null,
        media_url: m.thumbnail_url ?? m.media_url ?? null,
        posted_at: m.timestamp ?? new Date().toISOString(),
        likes: m.like_count ?? 0,
        comments: m.comments_count ?? 0,
        saves: metrics["saved"] ?? 0,
        shares: metrics["shares"] ?? 0,
        reach: metrics["reach"] ?? null,
        views: metrics["views"] ?? null,
        comments_sample: comments,
        topic: a.topic,
        sentiment: a.sentiment,
        emotion: a.emotion,
        entities: a.entities,
      });
    }

    if (rows.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("saved_posts").upsert(rows, { onConflict: "user_id,external_id" });
      if (error) {
        console.error(error);
        return { ok: false as const, error: "Could not save the imported posts." };
      }
    }
    return { ok: true as const, imported: rows.length };
  });

const saveSchema = z.object({
  url: z.string().url().max(500),
  author: z.string().max(100).nullable(),
  likes: z.number().int().nullable(),
  comments: z.number().int().nullable(),
  image: z.string().max(2000).nullable(),
  caption: z.string().max(3000),
  hashtags: z.array(z.string().max(100)).max(60),
  mentions: z.array(z.string().max(100)).max(60),
  insight: z.string().max(8000).nullable(),
});

/** Save a post analysed from a link on the dashboard into the user's corpus. */
export const saveAnalyzedPost = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => saveSchema.parse(d))
  .handler(async ({ data }) => {
    const code = data.url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([\w-]+)/i)?.[1] ?? data.url;
    const hashtags = data.hashtags.map((h) => h.toLowerCase());
    const a = analyzeText(data.caption, hashtags);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("saved_posts").upsert(
      {
        user_id: SHARED,
        source: "link",
        external_id: `url_${code}`,
        author: `@${(data.author ?? "unknown").replace(/^@/, "")}`,
        media_type: /\/reels?\//i.test(data.url) ? "REELS" : "IMAGE",
        caption: data.caption,
        hashtags,
        mentions: data.mentions,
        permalink: data.url,
        media_url: data.image,
        likes: data.likes ?? 0,
        comments: data.comments ?? 0,
        topic: a.topic,
        sentiment: a.sentiment,
        emotion: a.emotion,
        entities: a.entities,
        ai_insight: data.insight,
      },
      { onConflict: "user_id,external_id" },
    );
    if (error) {
      console.error(error);
      return { ok: false as const, error: "Could not save this post." };
    }
    return { ok: true as const };
  });

export const getConnection = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("instagram_connections")
    .select("username, followers, updated_at")
    .eq("user_id", SHARED)
    .maybeSingle();
  return data ?? null;
});

export const unlinkInstagram = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("instagram_connections").delete().eq("user_id", SHARED);
  return { ok: true as const };
});

export const removeSavedPost = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("saved_posts").delete().eq("id", data.id).eq("user_id", SHARED);
    return { ok: true as const };
  });
