import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeText } from "./enrichment";

const inputSchema = z.object({
  url: z
    .string()
    .trim()
    .url()
    .max(500)
    .refine((u) => /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[\w-]+/i.test(u), {
      message: "Please enter an Instagram post or reel link.",
    }),
  caption: z.string().max(3000).optional(),
});

function meta(html: string, prop: string) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? decode(m[1]!) : "";
}

function decode(s: string) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function num(s?: string) {
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/([\d.]+)\s*([KM])?/i);
  if (!m) return null;
  const mult = m[2]?.toUpperCase() === "M" ? 1e6 : m[2]?.toUpperCase() === "K" ? 1e3 : 1;
  return Math.round(Number(m[1]) * mult);
}

async function fetchPublicMeta(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; facebookexternalhit/1.1; +http://www.facebook.com/externalhit_uatext.php)",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const desc = meta(html, "og:description") || meta(html, "description");
    const title = meta(html, "og:title");
    const image = meta(html, "og:image");
    if (!desc && !title) return null;
    const likes = num(desc.match(/([\d.,]+\s*[KM]?)\s+likes?/i)?.[1]);
    const comments = num(desc.match(/([\d.,]+\s*[KM]?)\s+comments?/i)?.[1]);
    const author = desc.match(/-\s*([\w.]+)\s+on\s/i)?.[1] ?? title.match(/@?([\w.]+)/)?.[1] ?? null;
    const caption = desc.match(/:\s*["“](.*)["”]\.?\s*$/s)?.[1] ?? title.replace(/^.*?:\s*/, "");
    return { likes, comments, author, caption: caption.trim(), image: image || null };
  } catch {
    return null;
  }
}

async function aiInsight(payload: string, apiKey: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      input: [
        {
          role: "system",
          content: `You analyse the impression an Instagram post creates on its audience, for a knowledge-management research tool.
Use only the metadata supplied. Write concise markdown (under 250 words) with these headings:
## Overall impression
## Audience reaction
## Tone and messaging
## Recommendations
Be specific; if data (e.g. engagement counts) is missing, say what cannot be concluded.`,
        },
        { role: "user", content: payload },
      ],
    }),
  });
  if (!res.ok || !res.body) {
    console.error(`AI gateway error [${res.status}]: ${await res.text().catch(() => "")}`);
    if (res.status === 429) throw new Error("Too many requests right now. Please try again shortly.");
    if (res.status === 402) throw new Error("The workspace AI credits are exhausted.");
    throw new Error(`The AI service returned an error (${res.status}).`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const frames = buf.split("\n\n");
    buf = frames.pop() ?? "";
    for (const f of frames)
      for (const line of f.split("\n")) {
        if (!line.startsWith("data:")) continue;
        try {
          const e = JSON.parse(line.slice(5).trim());
          if (e.type === "response.output_text.delta" && typeof e.delta === "string") out += e.delta;
        } catch {
          /* ignore */
        }
      }
  }
  return out;
}

export const analyzeInstagramPost = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const fetched = await fetchPublicMeta(data.url);
    const caption = (data.caption?.trim() || fetched?.caption || "").trim();
    if (!caption) {
      return {
        ok: false as const,
        needsCaption: true,
        error:
          "Instagram did not share this post's details publicly. Paste the caption (and any comments) below and try again.",
      };
    }
    const hashtags = caption.match(/#[\w]+/g) ?? [];
    const mentions = caption.match(/@[\w.]+/g) ?? [];
    const analysis = analyzeText(caption, hashtags);

    const apiKey = process.env["LOVABLE_API_KEY"];
    let insight = "";
    let insightError: string | null = null;
    if (!apiKey) insightError = "The AI service is not configured.";
    else {
      try {
        insight = await aiInsight(
          [
            `URL: ${data.url}`,
            `Author: ${fetched?.author ?? "unknown"}`,
            `Likes: ${fetched?.likes ?? "unknown"}; Comments: ${fetched?.comments ?? "unknown"}`,
            `Caption / text: ${caption}`,
            `Hashtags: ${hashtags.join(" ") || "none"}; Mentions: ${mentions.join(" ") || "none"}`,
            `Automated enrichment — topic: ${analysis.topic}; sentiment: ${analysis.sentimentLabel} (${analysis.sentiment}); emotion: ${analysis.emotion}; entities: ${analysis.entities.map((e) => e.text).join(", ") || "none"}`,
          ].join("\n"),
          apiKey,
        );
      } catch (e) {
        insightError = e instanceof Error ? e.message : "AI analysis failed.";
      }
    }

    return {
      ok: true as const,
      source: data.caption?.trim() ? ("pasted" as const) : ("instagram" as const),
      author: fetched?.author ?? null,
      likes: fetched?.likes ?? null,
      comments: fetched?.comments ?? null,
      image: fetched?.image ?? null,
      caption,
      hashtags,
      mentions,
      analysis,
      insight,
      insightError,
    };
  });
