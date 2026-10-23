/**
 * "Analyse an Instagram post" — pasted link → topic, sentiment, emotion and
 * an AI write-up of the impressions the post creates. Rendered inside the
 * top-bar slide-over. When Instagram blocks the fetch (often private posts)
 * the panel asks for the caption and a few comments instead.
 */
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { analyzeInstagramPost } from "@/lib/instagram.functions";
import { saveAnalyzedPost } from "@/lib/instagram-graph.functions";
import { useCorpusState } from "@/lib/corpus-context";
import { MarkedText, SentimentValue } from "@/components/marks";

type Result = Awaited<ReturnType<typeof analyzeInstagramPost>>;

function renderMarkdown(md: string) {
  return md.split("\n").map((line, i) => {
    if (line.startsWith("## "))
      return (
        <h4 key={i} className="mt-4 mb-1 text-[15px] font-semibold text-foreground">
          {line.slice(3)}
        </h4>
      );
    if (/^[-*] /.test(line))
      return (
        <li key={i} className="ml-5 list-disc text-[15px] text-foreground">
          {line.slice(2).replace(/\*\*/g, "")}
        </li>
      );
    if (!line.trim()) return null;
    return (
      <p key={i} className="text-[15px] leading-relaxed text-foreground">
        {line.replace(/\*\*/g, "")}
      </p>
    );
  });
}

function FactRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-0">
      <dt className="label shrink-0">{k}</dt>
      <dd className="text-right text-sm text-foreground">{v}</dd>
    </div>
  );
}

export function InstagramInsights({
  onAnalysed,
}: {
  onAnalysed?: ((topicId: string | null) => void) | undefined;
} = {}) {
  const analyze = useServerFn(analyzeInstagramPost);
  const save = useServerFn(saveAnalyzedPost);
  const { refresh } = useCorpusState();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [showCaption, setShowCaption] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<Result, { ok: true }> | null>(null);
  const [saveState, setSaveState] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    onAnalysed?.(null);
    setSaveState(null);
    try {
      const r = await analyze({ data: { url, caption: caption || undefined } });
      if (r.ok) {
        setResult(r);
        onAnalysed?.(r.analysis.topicId);
      } else {
        setError(r.error);
        if (r.needsCaption) setShowCaption(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg.includes("Instagram") ? "Please enter a valid Instagram post or reel link." : msg);
    } finally {
      setLoading(false);
    }
  }

  async function doSave() {
    if (!result) return;
    setSaveState("Saving…");
    try {
      const r = await save({
        data: {
          url,
          author: result.author,
          likes: result.likes,
          comments: result.comments,
          image: result.image,
          caption: result.caption,
          hashtags: result.hashtags,
          mentions: result.mentions,
          insight: result.insight || null,
        },
      });
      setSaveState(r.ok ? "Saved to your corpus." : r.error);
      if (r.ok) await refresh();
    } catch (e) {
      setSaveState((e as Error).message);
    }
  }

  const inputClass =
    "rounded-lg border border-input bg-specimen px-3 text-sm text-foreground outline-none transition-colors duration-150 placeholder:text-muted focus:bg-specimen";

  return (
    <div>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.instagram.com/p/…"
          className={`h-10 w-full ${inputClass}`}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-ink px-4 text-sm font-medium text-specimen transition-colors duration-150 hover:bg-ink/90 disabled:opacity-60"
        >
          {loading ? "Analysing…" : "Get insights"}
        </button>
        {showCaption ? (
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            placeholder="Paste the post caption and a few comments here"
            className={`w-full ${inputClass} py-2`}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowCaption(true)}
            className="text-[13px] text-muted underline underline-offset-4 transition-colors duration-150 hover:text-foreground"
          >
            Add caption or comments manually (optional)
          </button>
        )}
      </form>

      {error ? <p className="mt-3 text-sm text-negative">{error}</p> : null}

      {result ? (
        <div className="mt-6 space-y-5">
          {result.image ? (
            <img
              src={result.image}
              alt="Instagram post preview"
              className="max-h-64 w-full rounded-md border border-line object-cover"
              referrerPolicy="no-referrer"
            />
          ) : null}

          <dl>
            <FactRow k="Author" v={result.author ? `@${result.author}` : "—"} />
            <FactRow k="Likes" v={result.likes?.toLocaleString() ?? "—"} />
            <FactRow k="Comments" v={result.comments?.toLocaleString() ?? "—"} />
            <FactRow
              k="Sentiment"
              v={
                <span className="flex items-baseline justify-end gap-2">
                  {result.analysis.sentimentLabel} <SentimentValue value={result.analysis.sentiment} />
                </span>
              }
            />
            <FactRow k="Emotion" v={result.analysis.emotion} />
            <FactRow
              k="Topic"
              v={
                <>
                  {result.analysis.topic}{" "}
                  <span className="label">p={result.analysis.topicConfidence.toFixed(2)}</span>
                </>
              }
            />
          </dl>
          <p className="text-[13px] text-muted">
            {result.analysis.topicTerms.length
              ? `Matched: ${result.analysis.topicTerms.join(", ")}`
              : "No known theme matched — filed under emerging topics."}{" "}
            The analysed post is highlighted in the topic ledger on the overview page.
          </p>

          {result.hashtags.length ? (
            <p className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
              {result.hashtags.map((h) => (
                <span key={h} className="hashtag">
                  {h}
                </span>
              ))}
            </p>
          ) : null}

          {result.caption ? (
            <p className="quote text-[15px] text-foreground">
              <MarkedText text={result.caption} entities={result.analysis.entities} hashtags={result.hashtags} />
            </p>
          ) : null}

          <div className="border-t border-line pt-4">
            {result.insight ? (
              <div className="quote text-[15px]">{renderMarkdown(result.insight)}</div>
            ) : (
              <p className="text-sm text-negative">{result.insightError}</p>
            )}
          </div>

          <button
            onClick={doSave}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-highlight px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:brightness-95"
          >
            Save to my corpus
          </button>
          {saveState ? <p className="text-[13px] text-muted">{saveState}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
