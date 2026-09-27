import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Layer 3 — Generative Knowledge Management Core.
 * Takes the chunks selected by the retrieval engine and asks the language model
 * to synthesise a cited answer for the decision maker.
 */

const inputSchema = z.object({
  question: z.string().min(3).max(600),
  chunks: z
    .array(z.object({ id: z.string(), text: z.string() }))
    .min(1)
    .max(10),
  mode: z.enum(["answer", "brief"]).default("answer"),
});

const SYSTEM = `You are the generative knowledge layer of an academic research system that
turns Instagram social-network metadata into decision support for analysts.

Rules:
- Answer only from the retrieved metadata records supplied by the user message.
- Cite every claim with the post identifier in square brackets, e.g. [p012]. Never invent an identifier.
- If the records do not support an answer, say so plainly and name what metadata would be needed.
- Write for a decision maker: findings first, hedged language avoided, no bullet padding.
- Reference engagement, sentiment, topic or network evidence where it strengthens the point.`;

const BRIEF = `Produce a short decision brief with exactly these sections, as markdown headings:
## Finding
## Supporting evidence
## Implication for decision makers
## Confidence and gaps`;

export const askKnowledgeBase = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { ok: false as const, error: "The AI service is not configured for this project." };
    }

    const context = data.chunks.map((c) => `--- RECORD ${c.id} ---\n${c.text}`).join("\n\n");
    const instruction = data.mode === "brief" ? BRIEF : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
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
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Question: ${data.question}\n\n${instruction}\n\nRetrieved metadata records:\n\n${context}`,
          },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      const body = await response.text().catch(() => "");
      console.error(`AI gateway error [${response.status}]: ${body}`);
      if (response.status === 429) {
        return { ok: false as const, error: "Too many requests right now. Please try again shortly." };
      }
      if (response.status === 402) {
        return { ok: false as const, error: "The workspace AI credits are exhausted. Add credits to continue." };
      }
      return { ok: false as const, error: `The AI service returned an error (${response.status}).` };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const event = JSON.parse(payload);
            if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
              answer += event.delta;
            }
          } catch {
            /* partial frame, ignore */
          }
        }
      }
    }

    if (!answer.trim()) {
      return { ok: false as const, error: "The model returned no answer for this question." };
    }
    return { ok: true as const, answer };
  });
