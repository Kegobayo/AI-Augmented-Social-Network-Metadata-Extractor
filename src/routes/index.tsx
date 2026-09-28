import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Panel, Shell, Stat, SentimentPill } from "@/components/shell";
import {
  AUTHORS,
  CORPUS_STATS,
  ENRICHED,
  HASHTAG_STATS,
  entityFrequency,
  sentimentTimeline,
  topicDistribution,
} from "@/lib/enrichment";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Knowledge Dashboard | AI-Augmented Social Network Metadata Extractor" },
      {
        name: "description",
        content:
          "Dynamic knowledge dashboard over enriched Instagram metadata: topic distribution, sentiment trends, influencer networks and hashtag co-occurrence.",
      },
      { property: "og:title", content: "Knowledge Dashboard | Generative Knowledge Management" },
      {
        property: "og:description",
        content:
          "Topic distribution, sentiment trends and influencer analysis over an enriched Instagram metadata corpus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const topics = topicDistribution();
  const timeline = sentimentTimeline();
  const entities = entityFrequency(12);
  const influencers = [...AUTHORS].sort((a, b) => b.influence - a.influence).slice(0, 6);
  const topPosts = [...ENRICHED]
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5);

  return (
    <Shell
      title="Dynamic knowledge dashboard"
      subtitle={`${CORPUS_STATS.posts} enriched posts from ${CORPUS_STATS.authors} accounts, ${CORPUS_STATS.span.from} to ${CORPUS_STATS.span.to}.`}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat value={CORPUS_STATS.posts} label="Posts ingested" />
        <Stat value={CORPUS_STATS.authors} label="Accounts" />
        <Stat value={CORPUS_STATS.ties} label="Follower ties" />
        <Stat value={CORPUS_STATS.hashtags} label="Distinct hashtags" />
        <Stat value={CORPUS_STATS.entities} label="Entities extracted" />
        <Stat
          value={(CORPUS_STATS.interactions / 1000).toFixed(0) + "k"}
          label="Interactions"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="Topic distribution" hint="BERTopic surrogate">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topics} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} stroke="var(--rule)" />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis
                type="category"
                dataKey="short"
                width={92}
                stroke="var(--muted-foreground)"
                fontSize={11}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
                formatter={(v: number, _n, p) => [`${v} posts`, p.payload.label]}
              />
              <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                {topics.map((t) => (
                  <Cell key={t.id} fill={t.colorVar} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <ul className="mt-3 space-y-1.5 text-sm">
            {topics.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-foreground">
                  <span
                    className="inline-block size-2.5 rounded-[2px]"
                    style={{ background: t.colorVar }}
                  />
                  {t.label}
                </span>
                <SentimentPill value={t.sentiment} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Sentiment trend across the collection window" hint="RoBERTa surrogate">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeline} margin={{ left: -16, right: 12, top: 8 }}>
              <CartesianGrid stroke="var(--rule)" />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis domain={[-0.6, 0.6]} stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="sentiment"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--chart-1)" }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-3 text-sm text-muted-foreground">
            Mean polarity across the corpus is{" "}
            <SentimentPill value={CORPUS_STATS.avgSentiment} />. Negative dips coincide with grid
            reliability and estimated billing discussions; recoveries follow solar and cold-chain
            outcome posts.
          </p>
        </Panel>

        <Panel title="Most influential accounts" hint="Graph centrality">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="label-caps pb-2">Account</th>
                <th className="label-caps pb-2">Community</th>
                <th className="label-caps pb-2 text-right">In-ties</th>
                <th className="label-caps pb-2 text-right">Influence</th>
              </tr>
            </thead>
            <tbody>
              {influencers.map((a) => (
                <tr key={a.id} className="border-b border-rule/60 last:border-0">
                  <td className="py-2 font-mono text-xs text-foreground">{a.id}</td>
                  <td className="py-2 text-xs text-muted-foreground">{a.community}</td>
                  <td className="py-2 text-right font-mono text-xs">{a.inDegree}</td>
                  <td className="py-2 text-right font-mono text-xs font-semibold">
                    {a.influence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link
            to="/network"
            className="mt-3 inline-block text-sm text-primary underline underline-offset-4"
          >
            Open full network analysis
          </Link>
        </Panel>

        <Panel title="Extracted entities by frequency" hint="NER surrogate">
          <div className="flex flex-wrap gap-2">
            {entities.map((e) => (
              <span
                key={e.text}
                className="rounded-sm border border-border bg-secondary px-2 py-1 text-xs"
              >
                <span className="font-medium text-foreground">{e.text}</span>
                <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">
                  {e.type.slice(0, 4)} ×{e.count}
                </span>
              </span>
            ))}
          </div>
          <h4 className="label-caps mt-5 mb-2">Leading hashtags</h4>
          <div className="space-y-1.5">
            {HASHTAG_STATS.slice(0, 8).map((h) => (
              <div key={h.tag} className="flex items-center gap-3 text-xs">
                <span className="w-40 font-mono text-foreground">{h.tag}</span>
                <span
                  className="h-2 rounded-[2px] bg-chart-2"
                  style={{ width: `${(h.count / HASHTAG_STATS[0].count) * 55}%` }}
                />
                <span className="font-mono text-muted-foreground">{h.count}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mt-5" title="Highest engagement rate (interactions ÷ followers)" hint="Layer 1 metrics">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rule text-left">
              <th className="label-caps pb-2">ID</th>
              <th className="label-caps pb-2">Account</th>
              <th className="label-caps pb-2">Topic</th>
              <th className="label-caps pb-2 text-right">Eng. rate</th>
              <th className="label-caps pb-2 text-right">Save ratio</th>
              <th className="label-caps pb-2 text-right">Sentiment</th>
            </tr>
          </thead>
          <tbody>
            {topPosts.map((p) => (
              <tr key={p.id} className="border-b border-rule/60 last:border-0">
                <td className="py-2 font-mono text-xs">{p.id}</td>
                <td className="py-2 font-mono text-xs">{p.author}</td>
                <td className="py-2 text-xs text-muted-foreground">{p.topic.label}</td>
                <td className="py-2 text-right font-mono text-xs">{p.engagementRate}%</td>
                <td className="py-2 text-right font-mono text-xs">{p.saveRatio}%</td>
                <td className="py-2 text-right">
                  <SentimentPill value={p.sentiment} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </Shell>
  );
}
