/**
 * Overview (dashboard). One generated sentence with the figures in it, topic
 * ledger bars, mood line with pinned margin notes, the node-link map, entity
 * marks in context and a sortable engagement table. Clicking anything fills
 * the evidence rail with the posts behind it.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Shell } from "@/components/shell";
import { LedgerBar } from "@/components/ledger-bar";
import { NetworkGraph, NetworkLegend } from "@/components/network-graph";
import { MarkLegend, MarkedText, formatSent, SentimentValue, type SimpleEntity } from "@/components/marks";
import { useCorpus, useCorpusState } from "@/lib/corpus-context";
import type { EnrichedPost } from "@/lib/enrichment";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview | Aura Insight" },
      {
        name: "description",
        content:
          "One generated summary of the corpus, topic ledger bars, mood over time, the account network and top engagement — every figure traced to its posts.",
      },
      { property: "og:title", content: "Overview | Aura Insight" },
      {
        property: "og:description",
        content: "Topic ledger, mood line, network map and engagement table over the Instagram corpus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const SUGGESTED = [
  "What are the main concerns about renewable energy in this corpus?",
  "Which accounts drive the food security conversation?",
  "Summarise the metering and tariff complaints for a decision maker.",
];

const ENTITY_MARK: Record<string, string> = {
  TECHNOLOGY: "mark-tech",
  LOCATION: "mark-location",
  ORGANISATION: "mark-org",
  DOMAIN: "mark-domain",
  METRIC: "mark-metric",
  MONEY: "mark-metric",
};

function weekKey(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleString("en", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`;
}

type SortKey = "rate" | "save" | "sent";

function MoodLine({
  timeline,
  postsByWeek,
  onPick,
}: {
  timeline: { week: string; sentiment: number; posts: number }[];
  postsByWeek: Map<string, EnrichedPost[]>;
  onPick: (posts: EnrichedPost[]) => void;
}) {
  const W = 640;
  const H = 232;
  const x0 = 30;
  const x1 = 610;
  const yZero = 116;
  const scale = 150;
  const n = Math.max(1, timeline.length - 1);
  const xs = timeline.map((_, i) => x0 + (i * (x1 - x0)) / n);
  const ys = timeline.map((t) => yZero - t.sentiment * scale);

  const dips = timeline
    .map((t, i) => ({ ...t, i }))
    .filter((t) => t.sentiment < 0)
    .sort((a, b) => a.sentiment - b.sentiment)
    .slice(0, 2)
    .sort((a, b) => a.i - b.i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Mood over time, weekly mean polarity">
      <line x1={x0 - 8} y1={yZero} x2={x1 + 8} y2={yZero} stroke="var(--line-strong)" strokeWidth="1" strokeDasharray="3 4" />
      <polyline
        points={timeline.map((_, i) => `${xs[i]},${ys[i]}`).join(" ")}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.5"
      />
      {timeline.map((t, i) => (
        <g key={t.week}>
          <circle cx={xs[i]} cy={ys[i]} r="2.6" fill="var(--ink)" />
          <text x={xs[i]} y={H - 10} textAnchor="middle" fontSize="10" fill="var(--muted)" style={{ fontFamily: "var(--font-sans)" }}>
            {t.week}
          </text>
        </g>
      ))}
      {dips.map((d, di) => {
        const above = di % 2 === 0;
        const ny = above ? ys[d.i]! - 36 : ys[d.i]! + 42;
        const posts = postsByWeek.get(d.week) ?? [];
        const worst = [...posts].sort((a, b) => a.sentiment - b.sentiment)[0];
        const label = worst ? worst.topic.label.split(/[,&]/)[0]!.trim() : d.week;
        return (
          <g
            key={d.week}
            className="cursor-pointer"
            onClick={() => onPick(posts)}
            role="button"
            aria-label={`Posts behind the ${label} dip, mood ${formatSent(d.sentiment)}`}
          >
            <line x1={xs[d.i]} y1={ys[d.i]} x2={xs[d.i]} y2={ny} stroke="var(--line-strong)" strokeWidth="1" />
            <circle cx={xs[d.i]} cy={ys[d.i]} r="3.4" fill={d.sentiment < -0.08 ? "var(--negative)" : "var(--neutral)"} />
            <text x={xs[d.i]} y={ny} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink)" style={{ fontFamily: "var(--font-sans)" }}>
              {label}
            </text>
            <text x={xs[d.i]} y={ny + 13} textAnchor="middle" fontSize="10" fill="var(--muted)" style={{ fontFamily: "var(--font-sans)" }}>
              {formatSent(d.sentiment)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Dashboard() {
  const corpus = useCorpus();
  const { openEvidence, setEvidence } = useCorpusState();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [analysedTopic, setAnalysedTopic] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "rate", dir: -1 });

  const { CORPUS_STATS, ENRICHED, AUTHORS, EDGES, HASHTAG_STATS, entityFrequency, sentimentTimeline, topicDistribution, isDemo } = corpus;

  const topics = useMemo(
    () =>
      topicDistribution()
        .map((t) => (t.id === analysedTopic ? { ...t, count: t.count + 1, analysed: true } : { ...t, analysed: false }))
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count),
    [topicDistribution, analysedTopic],
  );
  const timeline = sentimentTimeline();
  const entities = entityFrequency(10);
  const influencers = [...AUTHORS].sort((a, b) => b.influence - a.influence).slice(0, 6);

  const postsByWeek = useMemo(() => {
    const map = new Map<string, EnrichedPost[]>();
    for (const p of ENRICHED) {
      const k = weekKey(p.timestamp);
      map.set(k, [...(map.get(k) ?? []), p]);
    }
    return map;
  }, [ENRICHED]);

  const avg = CORPUS_STATS.avgSentiment;
  const moodWord = avg > 0.08 ? "positive" : avg < -0.08 ? "negative" : "flat";
  const dipTopic = [...topics].filter((t) => t.count >= 2).sort((a, b) => a.sentiment - b.sentiment)[0];

  const sortedPosts = useMemo(() => {
    const list = [...ENRICHED];
    const get = (p: EnrichedPost) => (sort.key === "rate" ? p.engagementRate : sort.key === "save" ? p.saveRatio : p.sentiment);
    return list.sort((a, b) => (get(b) - get(a)) * sort.dir).slice(0, 8);
  }, [ENRICHED, sort]);

  function sortButton(key: SortKey, label: string) {
    const active = sort.key === key;
    return (
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: active ? ((s.dir * -1) as 1 | -1) : -1 }))}
        className={`inline-flex items-center gap-1 text-[13px] transition-colors duration-150 hover:text-foreground ${active ? "font-semibold text-foreground" : "text-muted"}`}
      >
        {label}
        <span aria-hidden="true">{active ? (sort.dir === -1 ? "↓" : "↑") : ""}</span>
      </button>
    );
  }

  return (
    <Shell title="Overview" onAnalysed={setAnalysedTopic}>
      {/* 1 — Ask the corpus */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = question.trim();
          if (q.length >= 3) void navigate({ to: "/ask", search: { q } });
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the corpus a question…"
          aria-label="Ask the corpus"
          className="h-12 flex-1 rounded-lg border border-input bg-specimen px-4 text-[15px] text-foreground outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={question.trim().length < 3}
          className="h-12 rounded-lg bg-ink px-6 text-sm font-medium text-specimen transition-colors duration-150 hover:bg-ink/90 disabled:opacity-50"
        >
          Ask
        </button>
      </form>
      <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
        {SUGGESTED.map((s) => (
          <Link key={s} to="/ask" search={{ q: s }} className="underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-ink">
            {s}
          </Link>
        ))}
      </p>

      {/* 2 — one generated sentence + quiet figures */}
      <section className="mt-10">
        <p className="quote">
          <strong>{CORPUS_STATS.posts} posts</strong> from <strong>{CORPUS_STATS.authors} accounts</strong>,{" "}
          {CORPUS_STATS.span.from} to {CORPUS_STATS.span.to}. Mood is {moodWord} overall (
          <SentimentValue value={avg} />
          {dipTopic && avg < 0.08 ? <> and dips when {dipTopic.label.toLowerCase()} comes up</> : null}).
        </p>
        <p className="label mt-2">
          {CORPUS_STATS.ties} follower ties · {CORPUS_STATS.hashtags} hashtags · {CORPUS_STATS.entities} entities ·{" "}
          {CORPUS_STATS.interactions.toLocaleString()} interactions ·{" "}
          {isDemo ? (
            <>
              demo corpus —{" "}
              <Link to="/my-corpus" className="underline underline-offset-4 transition-colors duration-150 hover:text-foreground">
                import Instagram posts
              </Link>{" "}
              to analyse real data
            </>
          ) : (
            "your saved corpus"
          )}
        </p>
      </section>

      {/* 3 — topics as ledger bars */}
      <section className="mt-12 border-t border-line pt-8">
        <h3 className="text-[18px] font-semibold text-foreground">Topics</h3>
        <p className="label mt-1">Bar length is the share of posts. Click a bar to see its posts.</p>
        <div className="mt-4">
          {topics.map((t) => (
            <LedgerBar
              key={t.id}
              label={t.label}
              count={t.count}
              total={topics.reduce((s, x) => s + x.count, 0)}
              sentiment={t.sentiment}
              highlighted={t.analysed}
              note={t.analysed ? "analysed post" : undefined}
              onClick={() =>
                openEvidence(ENRICHED.filter((p) => p.topic.id === t.id), ENRICHED.find((p) => p.topic.id === t.id)?.id)
              }
            />
          ))}
        </div>
        <div className="mt-4">
          <MarkLegend />
        </div>
      </section>

      {/* 4 — mood over time */}
      <section className="mt-12 border-t border-line pt-8">
        <h3 className="text-[18px] font-semibold text-foreground">Mood over time</h3>
        <p className="label mt-1">Weekly mean polarity around a zero baseline. Click a note to see the posts behind the dip.</p>
        <div className="mt-4 specimen-panel px-4 py-6">
          <MoodLine timeline={timeline} postsByWeek={postsByWeek} onPick={(posts) => posts.length && openEvidence(posts, posts[0]!.id)} />
        </div>
      </section>

      {/* 5 — who shapes the conversation */}
      <section className="mt-12 border-t border-line pt-8">
        <h3 className="text-[18px] font-semibold text-foreground">Who shapes the conversation</h3>
        <p className="label mt-1">Node size is influence; fill pattern is the detected community. Click a node to see its posts.</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="specimen-panel p-4">
            <NetworkGraph
              authors={AUTHORS}
              edges={EDGES}
              onSelect={(id) => {
                const posts = ENRICHED.filter((p) => p.author === id);
                setEvidence(posts);
                if (posts.length) openEvidence(posts, posts[0]!.id);
              }}
            />
            <div className="mt-2">
              <NetworkLegend authors={AUTHORS} />
            </div>
          </div>
          <table className="text-sm">
            <thead>
              <tr className="border-b border-line-strong text-left">
                <th className="py-2 font-medium">Account</th>
                <th className="py-2 font-medium">Community</th>
                <th className="py-2 text-right font-medium">In-ties</th>
                <th className="py-2 text-right font-medium">Influence</th>
              </tr>
            </thead>
            <tbody>
              {influencers.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => {
                    const posts = ENRICHED.filter((p) => p.author === a.id);
                    if (posts.length) openEvidence(posts, posts[0]!.id);
                  }}
                  className="cursor-pointer border-b border-line transition-colors duration-150 last:border-0 hover:bg-page"
                >
                  <td className="py-2 text-foreground">{a.id}</td>
                  <td className="py-2 text-muted">{a.community}</td>
                  <td className="py-2 text-right text-muted">{a.inDegree}</td>
                  <td className="py-2 text-right font-semibold text-foreground">{a.influence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link to="/network" className="mt-4 inline-block text-sm underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-ink">
          Open the full network analysis
        </Link>
      </section>

      {/* 6 — entities and hashtags in context */}
      <section className="mt-12 border-t border-line pt-8">
        <h3 className="text-[18px] font-semibold text-foreground">Entities and hashtags</h3>
        <p className="label mt-1">Top entities as they are marked in the captions, with how often they appear.</p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
          {entities.map((e) => (
            <li key={e.text} className="flex items-baseline gap-1.5">
              <span className={ENTITY_MARK[e.type] ?? ""}>{e.text}</span>
              <span className="label">×{e.count}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
          {HASHTAG_STATS.slice(0, 10).map((h) => (
            <span key={h.tag} className="flex items-baseline gap-1.5">
              <span className="hashtag">{h.tag}</span>
              <span className="label">×{h.count}</span>
            </span>
          ))}
        </p>
      </section>

      {/* 7 — top engagement */}
      <section className="mt-12 border-t border-line pt-8">
        <h3 className="text-[18px] font-semibold text-foreground">Top engagement</h3>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong text-left">
              <th className="py-2 font-medium">Account</th>
              <th className="py-2 font-medium">Topic</th>
              <th className="py-2 text-right font-medium">{sortButton("rate", "Eng. rate")}</th>
              <th className="py-2 text-right font-medium">{sortButton("save", "Save ratio")}</th>
              <th className="py-2 text-right font-medium">{sortButton("sent", "Mood")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedPosts.map((p) => (
              <tr
                key={p.id}
                onClick={() => openEvidence([p], p.id)}
                className="cursor-pointer border-b border-line transition-colors duration-150 last:border-0 hover:bg-page"
              >
                <td className="py-2 text-foreground">{p.author}</td>
                <td className="py-2 text-muted">{p.topic.label}</td>
                <td className="py-2 text-right text-foreground">
                  <span title="Interactions divided by followers, can exceed 100% for viral posts" className="underline decoration-dotted decoration-line-strong underline-offset-4">
                    {p.engagementRate}%
                  </span>
                </td>
                <td className="py-2 text-right text-muted">{p.saveRatio}%</td>
                <td className="py-2 text-right">
                  <SentimentValue value={p.sentiment} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="label mt-3">
          Engagement rate: interactions divided by followers, can exceed 100% for viral posts. Click a row to see the post.
        </p>
      </section>
    </Shell>
  );
}
