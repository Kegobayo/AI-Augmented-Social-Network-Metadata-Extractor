/**
 * Corpus — browse every post in the corpus with its full metadata record.
 * Captions render in Literata with inline entity marks.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Shell } from "@/components/shell";
import { MarkLegend, MarkedText, SentimentValue } from "@/components/marks";
import { TOPICS, type EnrichedPost } from "@/lib/enrichment";
import { useCorpus, useCorpusState } from "@/lib/corpus-context";

export const Route = createFileRoute("/corpus")({
  head: () => ({
    meta: [
      { title: "Corpus | Aura Insight" },
      {
        name: "description",
        content:
          "Browse the Instagram corpus and inspect every extracted and enriched metadata field per post.",
      },
      { property: "og:title", content: "Corpus | Aura Insight" },
      { property: "og:description", content: "Every post with its full metadata record." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Corpus,
});

function Row({ field, value }: { field: string; value: React.ReactNode }) {
  return (
    <tr className="border-b border-line align-top last:border-0">
      <td className="label w-40 py-2 pr-3">{field}</td>
      <td className="py-2 text-[15px] text-foreground">{value}</td>
    </tr>
  );
}

function MetadataRecord({ post }: { post: EnrichedPost }) {
  return (
    <div className="specimen-panel p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[18px] font-semibold text-foreground">Metadata record</h3>
        <span className="label">{post.id}</span>
      </div>
      <table className="w-full">
        <tbody>
          <Row field="Author" value={post.author} />
          <Row field="Author category" value={post.authorCategory} />
          <Row field="Followers" value={post.followers.toLocaleString()} />
          <Row field="Media type" value={post.mediaType} />
          <Row field="Location tag" value={post.location} />
          <Row field="Timestamp" value={post.timestamp} />
          <Row
            field="Caption"
            value={
              <span className="quote text-[15px]">
                <MarkedText text={post.caption} entities={post.entities} hashtags={post.hashtags} />
              </span>
            }
          />
          <Row
            field="Hashtags"
            value={
              <span className="flex flex-wrap gap-x-2 gap-y-0.5">
                {post.hashtags.map((h) => (
                  <span key={h} className="hashtag">
                    {h}
                  </span>
                ))}
              </span>
            }
          />
          <Row
            field="Engagement"
            value={`${post.likes.toLocaleString()} likes · ${post.comments} comments · ${post.saves} saves · ${post.shares} shares`}
          />
          <Row field="Engagement rate" value={`${post.engagementRate}% of followers`} />
          <Row field="Save ratio" value={`${post.saveRatio}%`} />
          <Row field="Amplification" value={`${post.amplification}%`} />
          <Row
            field="Topic (modelled)"
            value={
              <>
                {post.topic.label} <span className="label">p={post.topicConfidence.toFixed(2)}</span>
              </>
            }
          />
          <Row
            field="Sentiment"
            value={
              <>
                {post.sentimentLabel} <SentimentValue value={post.sentiment} /> · emotion: {post.emotion}
              </>
            }
          />
          <Row
            field="Named entities"
            value={
              <span className="flex flex-wrap gap-x-3 gap-y-1">
                {post.entities.map((e) => (
                  <span key={e.text} className={e.type === "TECHNOLOGY" ? "mark-tech" : e.type === "LOCATION" ? "mark-location" : e.type === "ORGANISATION" ? "mark-org" : e.type === "DOMAIN" ? "mark-domain" : "mark-metric"}>
                    {e.text}
                  </span>
                ))}
              </span>
            }
          />
          <Row
            field="Comment sample"
            value={
              <ul className="list-disc space-y-1 pl-4 text-muted">
                {post.comments_sample.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            }
          />
          <Row
            field="Vector index"
            value={
              <span className="label">
                96-dim embedding · [{post.embedding.slice(0, 6).map((v) => v.toFixed(2)).join(", ")} …]
              </span>
            }
          />
        </tbody>
      </table>
    </div>
  );
}

function Corpus() {
  const { ENRICHED } = useCorpus();
  const { setEvidence, openEvidence } = useCorpusState();
  const [query, setQuery] = useState("");
  const [topicId, setTopicId] = useState("all");
  const [selectedId, setSelectedId] = useState(ENRICHED[0]?.id ?? "");

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

  const selected = ENRICHED.find((p) => p.id === selectedId) ?? filtered[0] ?? ENRICHED[0];

  if (!selected) {
    return (
      <Shell title="Corpus">
        <p className="quote text-muted">No records match this filter.</p>
      </Shell>
    );
  }

  const inputClass =
    "rounded-lg border border-input bg-specimen px-3 text-sm text-foreground outline-none placeholder:text-muted";

  return (
    <Shell title="Corpus" subtitle="Every post in the corpus with its full metadata record — caption, hashtags, engagement and enrichment.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by caption, account, hashtag or location…"
          className={`h-10 min-w-64 flex-1 ${inputClass}`}
        />
        <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={`h-10 ${inputClass}`} aria-label="Topic filter">
          <option value="all">All topics</option>
          {TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="label">{filtered.length} records</span>
      </div>

      <MarkLegend className="mb-5" />

      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div>
          {filtered.map((p) => {
            const isSelected = p.id === selected.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedId(p.id);
                  setEvidence([p]);
                }}
                onDoubleClick={() => openEvidence([p], p.id)}
                className={`w-full border-b border-line px-1 py-4 text-left transition-colors duration-150 last:border-0 hover:bg-page ${
                  isSelected ? "bg-page" : ""
                }`}
                style={isSelected ? { boxShadow: `inset 3px 0 0 var(--highlight)` } : undefined}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">{p.author}</span>
                  <span className="label shrink-0">
                    {p.mediaType} · {p.timestamp.slice(0, 10)}
                  </span>
                </div>
                <p className="quote mt-1.5 line-clamp-2 text-[15px]">
                  <MarkedText text={p.caption} entities={p.entities} />
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                  <span>{p.topic.label}</span>
                  <SentimentValue value={p.sentiment} />
                  <span>{p.likes.toLocaleString()} likes · {p.saves} saves · {p.shares} shares</span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && <p className="label">No records match this filter.</p>}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <MetadataRecord post={selected} />
        </div>
      </div>
    </Shell>
  );
}
