/**
 * Ask — generative query interface. Answers render in Literata with
 * highlighter citation tabs; every claim opens the supporting post in the
 * evidence rail. Retrieved posts feed the rail directly.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Shell } from "@/components/shell";
import { CitationTab, SentimentValue } from "@/components/marks";
import { type Retrieved } from "@/lib/enrichment";
import { useCorpus, useCorpusState } from "@/lib/corpus-context";
import { askKnowledgeBase } from "@/lib/rag.functions";

export const Route = createFileRoute("/ask")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q.slice(0, 600) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Ask | Aura Insight" },
      {
        name: "description",
        content:
          "Ask natural-language questions of the Instagram corpus and receive cited answers — every claim links back to the posts behind it.",
      },
      { property: "og:title", content: "Ask your corpus | Aura Insight" },
      {
        property: "og:description",
        content: "Cited answers over retrieved Instagram posts, readable in the evidence panel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ask,
});

const SUGGESTIONS = [
  "What are the main concerns about renewable energy discussed in this dataset?",
  "Which accounts drive the food security conversation, and what evidence do they present?",
  "Summarise the metering and tariff complaints for a policy decision maker.",
  "What does the corpus suggest about the link between energy access and health outcomes?",
];

/** Inline markdown (bold, italic) with [pXXX] citations as highlighter tabs. */
function renderInline(
  text: string,
  citationIndex: Map<string, number>,
  onCitation: (id: string) => void,
  onHover: (id: string) => void,
  prefix = "",
) {
  const parts = text.split(/(\[p\d{3}\])/g);
  return parts.map((part, i) => {
    const key = `${prefix}-${i}`;
    const cite = part.match(/^\[(p\d{3})\]$/);
    if (cite) {
      const id = cite[1]!;
      const n = citationIndex.get(id);
      if (n != null) {
        return (
          <CitationTab key={key} n={n} label={id} onOpen={() => onCitation(id)} onHover={() => onHover(id)} />
        );
      }
      return <span key={key}>[{id}]</span>;
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      const bkey = `${key}b${j}`;
      if (bp.startsWith("**") && bp.endsWith("**") && bp.length > 4) {
        return <strong key={bkey}>{bp.slice(2, -2)}</strong>;
      }
      const italicParts = bp.split(/(\*[^*\s][^*]*\*)/g);
      return italicParts.map((seg, k) => {
        const ikey = `${bkey}-${k}`;
        if (seg.length > 2 && seg.startsWith("*") && seg.endsWith("*")) {
          return <em key={ikey}>{seg.slice(1, -1)}</em>;
        }
        return <span key={ikey}>{seg}</span>;
      });
    });
  });
}

function Ask() {
  const { q } = Route.useSearch();
  const { retrieve } = useCorpus();
  const { openEvidence, setEvidence, focusEvidence, setRailOpen } = useCorpusState();
  const ask = useServerFn(askKnowledgeBase);
  const [question, setQuestion] = useState(q ?? "");
  const [mode, setMode] = useState<"answer" | "brief">("answer");
  const [retrieved, setRetrieved] = useState<Retrieved[]>([]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 3 || loading) return;
    setLoading(true);
    setError("");
    setAnswer("");
    const hits = retrieve(trimmed, 6);
    setRetrieved(hits);
    try {
      const result = await ask({
        data: {
          question: trimmed,
          mode,
          chunks: hits.map((h) => ({ id: h.post.id, text: h.post.chunk })),
        },
      });
      if (result.ok) {
        setAnswer(result.answer);
        setEvidence(hits.map((h) => h.post));
        if (window.innerWidth >= 1024) setRailOpen(true);
      } else {
        setError(result.error);
      }
    } catch {
      setError("The request could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const citationIndex = new Map(retrieved.map((r, i) => [r.post.id, i + 1]));

  function onCitation(id: string) {
    openEvidence(retrieved.map((r) => r.post), id);
  }

  return (
    <Shell title="Ask">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(question);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder="e.g. What are the main concerns about renewable energy in this corpus?"
          aria-label="Question"
          className="flex-1 resize-y rounded-lg border border-input bg-specimen px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted"
        />
        <div className="flex gap-3">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "answer" | "brief")}
            aria-label="Answer format"
            className="h-12 self-start rounded-lg border border-input bg-specimen px-3 text-sm outline-none"
          >
            <option value="answer">Cited answer</option>
            <option value="brief">Decision brief</option>
          </select>
          <button
            type="submit"
            disabled={loading || question.trim().length < 3}
            className="h-12 rounded-lg bg-highlight px-5 text-sm font-semibold text-ink transition-colors duration-150 hover:brightness-95 disabled:opacity-50"
          >
            {loading ? "Reading the posts…" : "Ask"}
          </button>
        </div>
      </form>
      <p className="label mt-2">
        Every claim is cited with the post it came from. Retrieval takes the 6 nearest posts.
      </p>
      <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuestion(s);
              void run(s);
            }}
            className="text-left underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-ink"
          >
            {s}
          </button>
        ))}
      </p>

      <section className="mt-10 border-t border-line pt-8">
        {error && <p className="text-sm text-negative">{error}</p>}
        {loading && !answer && <p className="quote text-muted">Retrieving the nearest posts and reading them…</p>}
        {!loading && !answer && !error && (
          <p className="quote text-muted">
            Ask a question and the answer appears here, grounded in the retrieved posts. Each citation
            tab opens the supporting post in the evidence panel.
          </p>
        )}
        {answer && (
          <>
            <p className="label flex items-center gap-3">
              Grounded in {retrieved.length} posts
              <button
                type="button"
                onClick={() => setRailOpen(true)}
                className="rounded-md border border-line-strong px-2 py-0.5 text-[13px] text-foreground transition-colors duration-150 hover:bg-page lg:hidden"
              >
                Show posts
              </button>
            </p>
            <div className="quote mt-3 space-y-3">
              {answer
                .split("\n")
                .filter(Boolean)
                .map((line, i) =>
                  line.startsWith("##") ? (
                    <h4 key={i} className="pt-2 text-[16px] font-semibold text-foreground">
                      {line.replace(/^#+\s*/, "")}
                    </h4>
                  ) : (
                    <p key={i}>
                      {renderInline(
                        line.replace(/^[-*]\s+/, "• "),
                        citationIndex,
                        onCitation,
                        focusEvidence,
                        `l${i}`,
                      )}
                    </p>
                  ),
                )}
            </div>
          </>
        )}
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h3 className="text-[18px] font-semibold text-foreground">Retrieved posts</h3>
        <p className="label mt-1">Also shown in the evidence panel, with the words behind each answer.</p>
        {retrieved.length === 0 ? (
          <p className="label mt-4">Nothing retrieved yet.</p>
        ) : (
          <ol className="mt-4">
            {retrieved.map((r) => (
              <li
                key={r.post.id}
                className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 border-b border-line py-2.5 text-sm last:border-0"
              >
                <span className="shrink-0 font-semibold text-foreground">
                  [{citationIndex.get(r.post.id)}] {r.post.author}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-muted">{r.post.caption}</span>
                  <span className="label mt-0.5 flex flex-wrap items-center gap-x-3">
                    <span>{r.post.topic.label}</span>
                    <SentimentValue value={r.post.sentiment} />
                    <span>match {r.score.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => onCitation(r.post.id)}
                      className="underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-foreground"
                    >
                      show in evidence
                    </button>
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </Shell>
  );
}
