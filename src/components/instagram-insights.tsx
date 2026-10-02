import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeInstagramPost } from "@/lib/instagram.functions";
import { saveAnalyzedPost } from "@/lib/instagram-graph.functions";
import { useCorpusState } from "@/lib/corpus-context";
import { Panel, SentimentPill } from "@/components/shell";

type Result = Awaited<ReturnType<typeof analyzeInstagramPost>>;

function renderMarkdown(md: string) {
  return md.split("\n").map((line, i) => {
    if (line.startsWith("## "))
      return (
        <h4 key={i} className="mt-4 mb-1 font-serif text-base font-semibold text-foreground">
          {line.slice(3)}
        </h4>
      );
    if (/^[-*] /.test(line))
      return (
        <li key={i} className="ml-5 list-disc text-sm text-foreground">
          {line.slice(2).replace(/\*\*/g, "")}
        </li>
      );
    if (!line.trim()) return null;
    return (
      <p key={i} className="text-sm leading-relaxed text-foreground">
        {line.replace(/\*\*/g, "")}
      </p>
    );
  });
}

export function InstagramInsights() {
  const analyze = useServerFn(analyzeInstagramPost);
  const save = useServerFn(saveAnalyzedPost);
  const { refresh } = useCorpusState();
  const [saveState, setSaveState] = useState<string | null>(null);

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
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [showCaption, setShowCaption] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<Result, { ok: true }> | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setSaveState(null);
    try {
      const r = await analyze({ data: { url, caption: caption || undefined } });
      if (r.ok) setResult(r);
      else {
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

  return (
    <Panel className="mt-6" title="Analyse an Instagram post" hint="Impression insights">
      <form onSubmit={submit} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/…"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Analysing…" : "Get insights"}
          </button>
        </div>
        {showCaption ? (
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            placeholder="Paste the post caption and a few comments here"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowCaption(true)}
            className="text-xs text-primary underline underline-offset-4"
          >
            Add caption or comments manually (optional)
          </button>
        )}
      </form>

      {error ? <p className="mt-3 text-sm text-negative">{error}</p> : null}

      {result ? (
        <div className="mt-5 grid gap-5 md:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            {result.image ? (
              <img
                src={result.image}
                alt="Instagram post preview"
                className="w-full rounded-md border border-border object-cover"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["Author", result.author ? `@${result.author}` : "—"],
                ["Likes", result.likes?.toLocaleString() ?? "—"],
                ["Comments", result.comments?.toLocaleString() ?? "—"],
                ["Topic", result.analysis.topic],
                ["Emotion", result.analysis.emotion],
              ].map(([k, v]) => (
                <div key={k} className="paper-panel px-2 py-1.5">
                  <dt className="label-caps">{k}</dt>
                  <dd className="mt-0.5 text-foreground">{v}</dd>
                </div>
              ))}
              <div className="paper-panel px-2 py-1.5">
                <dt className="label-caps">Sentiment</dt>
                <dd className="mt-0.5">
                  <SentimentPill value={result.analysis.sentiment} />
                </dd>
              </div>
            </dl>
            {result.hashtags.length ? (
              <div className="flex flex-wrap gap-1">
                {result.hashtags.map((h) => (
                  <span key={h} className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[11px]">
                    {h}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="line-clamp-6 text-xs text-muted-foreground">{result.caption}</p>
                          <button
                onClick={doSave}
                className="w-full rounded-md border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary"
              >
                Save to my corpus
              </button>
            {saveState ? <p className="text-xs text-muted-foreground">{saveState}</p> : null}
          </div>
          <div>
            {result.insight ? (
              renderMarkdown(result.insight)
            ) : (
              <p className="text-sm text-negative">{result.insightError}</p>
            )}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
