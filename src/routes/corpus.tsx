import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { MetricHelp, Panel, Shell, SentimentPill } from "@/components/shell";
import { TOPICS, type EnrichedPost } from "@/lib/enrichment";
import { useCorpus } from "@/lib/corpus-context";
import { METRIC_HELP } from "@/lib/metric-help";

export const Route = createFileRoute("/corpus")({
  head: () => ({
    meta: [
      { title: "Corpus & Metadata Inspector | Social Network Metadata Extractor" },
      {
        name: "description",
        content:
          "Browse the ingested Instagram corpus and inspect every extracted and AI-enriched metadata field per post.",
      },
      { property: "og:title", content: "Corpus & Metadata Inspector" },
      {
        property: "og:description",
        content: "Post gallery with descriptive, structural and AI-enriched metadata per record.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Corpus,
});

function Corpus() {
  const { ENRICHED } = useCorpus();
  const [query, setQuery] = useState("");
  const [topicId, setTopicId] = useState("all");
  const [selectedId, setSelectedId] = useState(ENRICHED[0]!.id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ENRICHED.filter((p) => {
      const matchesTopic = topicId === "all" || p.topic.id === topicId;
      const matchesQuery =
        !q ||
        p.caption.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.hashtags.join(" ").toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);
      return matchesTopic && matchesQuery;
    });
  }, [query, topicId, ENRICHED]);

  const selected = ENRICHED.find((p) => p.id === selectedId) ?? filtered[0] ?? ENRICHED[0]!;

  return (
    <Shell
      title="Corpus"
      subtitle="Every post in the corpus with its full metadata record — caption, hashtags, engagement and AI enrichment."
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by caption, account, hashtag or location…"
          className="h-10 min-w-64 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-ring"
        />
        <select
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="h-10 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-ring"
        >
          <option value="all">All topics</option>
          {TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="label-caps">{filtered.length} records</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`paper-panel w-full p-4 text-left transition-colors hover:border-ring ${
                p.id === selected.id ? "border-primary ring-1 ring-primary/20" : ""
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs text-muted-foreground">
                  {p.id} · {p.author}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {p.mediaType} · {p.timestamp.slice(0, 10)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-foreground">{p.caption}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground"
                  style={{ background: p.topic.colorVar }}
                >
                  {p.topic.label}
                </span>
                <span className="font-mono text-muted-foreground">
                  ♥ {p.likes.toLocaleString()} · ⤵ {p.saves} · ↗ {p.shares}
                </span>
                <SentimentPill value={p.sentiment} />
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No records match this filter.</p>
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <MetadataRecord post={selected} />
        </div>
      </div>
    </Shell>
  );
}

function Row({
  field,
  value,
  help,
}: {
  field: string;
  value: React.ReactNode;
  help?: string;
}) {
  return (
    <tr className="border-b border-rule/60 last:border-0 align-top">
      <td className="label-caps w-44 py-1.5 pr-3">
        <span className="flex items-center gap-1.5">
          {field}
          {help ? <MetricHelp label={field} text={help} /> : null}
        </span>
      </td>
      <td className="py-1.5 text-sm text-foreground">{value}</td>
    </tr>
  );
}

function MetadataRecord({ post }: { post: EnrichedPost }) {
  return (
    <Panel title={`Metadata record ${post.id}`} hint="Descriptive · structural · enriched">
      <table className="w-full">
        <tbody>
          <Row field="Author" value={<span className="font-mono text-xs">{post.author}</span>} />
          <Row field="Author category" value={post.authorCategory} />
          <Row field="Followers" value={post.followers.toLocaleString()} />
          <Row field="Media type" value={post.mediaType} />
          <Row field="Location tag" value={post.location} />
          <Row field="Timestamp" value={<span className="font-mono text-xs">{post.timestamp}</span>} />
          <Row field="Caption" value={post.caption} />
          <Row
            field="Hashtags"
            value={<span className="font-mono text-xs">{post.hashtags.join("  ")}</span>}
          />
          <Row
            field="Engagement"
            value={
              <span className="font-mono text-xs">
                {post.likes.toLocaleString()} likes · {post.comments} comments · {post.saves} saves ·{" "}
                {post.shares} shares
              </span>
            }
          />
          <Row
            field="Engagement rate"
            value={`${post.engagementRate}% of followers`}
            help={METRIC_HELP.engagementRate}
          />
          <Row
            field="Save ratio"
            value={`${post.saveRatio}%`}
            help={METRIC_HELP.saveRatio}
          />
          <Row
            field="Amplification"
            value={`${post.amplification}%`}
            help={METRIC_HELP.amplification}
          />
          <Row
            field="Topic (modelled)"
            help={METRIC_HELP.topicConfidence}
            value={
              <>
                {post.topic.label}{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  p={post.topicConfidence.toFixed(2)}
                </span>
              </>
            }
          />
          <Row
            field="Sentiment"
            help={METRIC_HELP.sentiment}
            value={
              <>
                {post.sentimentLabel} <SentimentPill value={post.sentiment} /> · emotion:{" "}
                {post.emotion}
              </>
            }
          />
          <Row
            field="Named entities"
            help={METRIC_HELP.namedEntities}
            value={
              <div className="flex flex-wrap gap-1.5">
                {post.entities.map((e) => (
                  <span
                    key={e.text}
                    className="rounded-md border border-border bg-secondary px-1.5 py-0.5 text-xs"
                  >
                    {e.text}
                    <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                      {e.type.slice(0, 4)}
                    </span>
                  </span>
                ))}
              </div>
            }
          />
          <Row
            field="Comment sample"
            value={
              <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {post.comments_sample.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            }
          />
          <Row
            field="Vector index"
            help={METRIC_HELP.vectorIndex}
            value={
              <span className="font-mono text-xs text-muted-foreground">
                96-dim embedding · [{post.embedding.slice(0, 6).map((v) => v.toFixed(2)).join(", ")} …]
              </span>
            }
          />
        </tbody>
      </table>
    </Panel>
  );
}
