import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { analyzeText } from "@/lib/enrichment";

export default defineTool({
  name: "analyze_post_text",
  title: "Analyse post text",
  description:
    "Classify an Instagram caption into a topic and score its sentiment, emotion and named entities using the app's enrichment engine.",
  inputSchema: {
    caption: z.string().trim().min(1).max(3000).describe("Caption and optionally comments."),
    hashtags: z.array(z.string().max(100)).max(60).default([]).describe("Hashtags, e.g. ['#ootd']."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ caption, hashtags }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const tags = hashtags.length ? hashtags : (caption.match(/#[\w]+/g) ?? []);
    const a = analyzeText(caption, tags);
    const result = {
      topic: a.topic,
      topicConfidence: a.topicConfidence,
      matchedTerms: a.topicTerms,
      sentiment: a.sentiment,
      sentimentLabel: a.sentimentLabel,
      emotion: a.emotion,
      entities: a.entities.map((e) => ({ text: e.text, type: e.type })),
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result };
  },
});
