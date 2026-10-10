import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { SHARED_CORPUS, supabaseForUser } from "../supabase";

export default defineTool({
  name: "corpus_overview",
  title: "Corpus overview",
  description:
    "Summarise the shared corpus: post count, accounts, topic distribution with average sentiment, and top hashtags.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const { data, error } = await supabaseForUser(ctx)
      .from("saved_posts")
      .select("author, topic, sentiment, hashtags, likes, comments")
      .eq("user_id", SHARED_CORPUS)
      .limit(1000);
    if (error) throw new ToolError(error.message);
    const rows = data ?? [];
    const topics = new Map<string, { count: number; sentiment: number }>();
    const tags = new Map<string, number>();
    for (const r of rows) {
      const t = r.topic ?? "Unclassified";
      const cur = topics.get(t) ?? { count: 0, sentiment: 0 };
      cur.count += 1;
      cur.sentiment += r.sentiment ?? 0;
      topics.set(t, cur);
      for (const h of r.hashtags) tags.set(h, (tags.get(h) ?? 0) + 1);
    }
    const summary = {
      posts: rows.length,
      accounts: new Set(rows.map((r) => r.author)).size,
      interactions: rows.reduce((s, r) => s + r.likes + r.comments, 0),
      topics: [...topics.entries()]
        .map(([label, v]) => ({ label, count: v.count, avgSentiment: Number((v.sentiment / v.count).toFixed(3)) }))
        .sort((a, b) => b.count - a.count),
      topHashtags: [...tags.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([tag, count]) => ({ tag, count })),
    };
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }], structuredContent: summary };
  },
});
