import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { SHARED_CORPUS, supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_corpus",
  title: "Search saved corpus",
  description:
    "Search the shared corpus of saved Instagram posts by keyword, hashtag, account or topic, returning metadata and enrichment.",
  inputSchema: {
    query: z.string().trim().max(200).optional().describe("Text to find in captions, e.g. 'solar' or '#ootd'."),
    author: z.string().trim().max(100).optional().describe("Account handle, e.g. '@brand'."),
    topic: z.string().trim().max(100).optional().describe("Topic label fragment, e.g. 'Fashion'."),
    limit: z.number().int().min(1).max(50).default(20).describe("Maximum posts to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, author, topic, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    let q = supabaseForUser(ctx)
      .from("saved_posts")
      .select("external_id, author, media_type, caption, hashtags, permalink, posted_at, likes, comments, saves, shares, reach, views, topic, sentiment, emotion")
      .eq("user_id", SHARED_CORPUS)
      .order("posted_at", { ascending: false })
      .limit(limit);
    if (query) q = q.ilike("caption", `%${query.replace(/[%_]/g, "")}%`);
    if (author) q = q.ilike("author", `%${author.replace(/^@/, "").replace(/[%_]/g, "")}%`);
    if (topic) q = q.ilike("topic", `%${topic.replace(/[%_]/g, "")}%`);
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const posts = (data ?? []).map((p) => ({
      id: p.external_id,
      author: p.author,
      mediaType: p.media_type,
      caption: p.caption,
      hashtags: p.hashtags,
      permalink: p.permalink,
      postedAt: p.posted_at,
      likes: p.likes,
      comments: p.comments,
      saves: p.saves,
      shares: p.shares,
      reach: p.reach,
      views: p.views,
      topic: p.topic,
      sentiment: p.sentiment,
      emotion: p.emotion,
    }));
    return {
      content: [{ type: "text", text: posts.length ? JSON.stringify(posts, null, 2) : "No matching saved posts." }],
      structuredContent: { posts },
    };
  },
});
