import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { MetricHelp, Panel, Shell, SentimentPill } from "@/components/shell";
import { useCorpus } from "@/lib/corpus-context";
import { METRIC_HELP } from "@/lib/metric-help";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Social Network Analysis | Metadata Extractor" },
      {
        name: "description",
        content:
          "Follower graph, community detection, influencer ranking and hashtag co-occurrence over the enriched Instagram metadata corpus.",
      },
      { property: "og:title", content: "Social Network Analysis" },
      {
        property: "og:description",
        content: "Nodes, ties, communities and hashtag co-occurrence in the metadata corpus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Network,
});

const COMMUNITY_COLORS: Record<string, string> = {};
function colorFor(community: string) {
  if (!COMMUNITY_COLORS[community]) {
    const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
    COMMUNITY_COLORS[community] = palette[Object.keys(COMMUNITY_COLORS).length % palette.length]!;
  }
  return COMMUNITY_COLORS[community]!;
}

function Network() {
  const { AUTHORS, CO_OCCURRENCE, HASHTAG_STATS, EDGES: FOLLOW_EDGES } = useCorpus();
  const [focus, setFocus] = useState<string | null>(null);

  const layout = useMemo(() => {
    const r = 175;
    const cx = 260;
    const cy = 205;
    return AUTHORS.map((a, i) => {
      const angle = (i / AUTHORS.length) * Math.PI * 2 - Math.PI / 2;
      return { ...a, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
  }, [AUTHORS]);

  const pos = Object.fromEntries(layout.map((n) => [n.id, n]));
  const maxInfluence = Math.max(...AUTHORS.map((a) => a.influence));
  const communities = [...new Set(AUTHORS.map((a) => a.community))];

  return (
    <Shell
      title="Network"
      subtitle="Who influences whom: the follower graph, detected communities, influence ranking and hashtag reach."
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Panel
          title="Follower graph"
          hint="Label propagation communities"
          hintHelp={METRIC_HELP.community}
        >
          <svg viewBox="0 0 520 410" className="w-full">
            {FOLLOW_EDGES.map(([a, b], i) => {
              const from = pos[a];
              const to = pos[b];
              if (!from || !to) return null;
              const active = !focus || focus === a || focus === b;
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="var(--rule)"
                  strokeWidth={active ? 1.4 : 0.6}
                  opacity={active ? 0.9 : 0.25}
                />
              );
            })}
            {layout.map((n) => {
              const active = !focus || focus === n.id;
              const radius = 8 + (n.influence / maxInfluence) * 13;
              return (
                <g
                  key={n.id}
                  onMouseEnter={() => setFocus(n.id)}
                  onMouseLeave={() => setFocus(null)}
                  className="cursor-pointer"
                  opacity={active ? 1 : 0.35}
                >
                  <circle cx={n.x} cy={n.y} r={radius} fill={colorFor(n.community)} opacity={0.85} />
                  <text
                    x={n.x}
                    y={n.y + radius + 12}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    fill="var(--foreground)"
                  >
                    {n.id}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            {communities.map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ background: colorFor(c) }}
                />
                {c}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Node radius encodes influence (in-degree, reach and cumulative engagement). Hover a node
            to isolate its ties.
          </p>
        </Panel>

        <Panel
          title="Account register"
          hint="Node attributes"
          hintHelp={METRIC_HELP.graphCentrality}
        >
          <div className="max-h-[430px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-rule text-left">
                  <th className="label-caps pb-2">Account</th>
                  <th className="label-caps pb-2">Type</th>
                  <th className="label-caps pb-2 text-right">
                    <span className="flex items-center justify-end gap-1.5">
                      In
                      <MetricHelp label="In-ties" text={METRIC_HELP.inTies} />
                    </span>
                  </th>
                  <th className="label-caps pb-2 text-right">
                    <span className="flex items-center justify-end gap-1.5">
                      Out
                      <MetricHelp label="Out-ties" text={METRIC_HELP.outTies} />
                    </span>
                  </th>
                  <th className="label-caps pb-2 text-right">
                    <span className="flex items-center justify-end gap-1.5">
                      Infl.
                      <MetricHelp label="Influence" text={METRIC_HELP.influence} />
                    </span>
                  </th>
                  <th className="label-caps pb-2 text-right">
                    <span className="flex items-center justify-end gap-1.5">
                      Sent.
                      <MetricHelp label="Sentiment" text={METRIC_HELP.accountSentiment} />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...AUTHORS]
                  .sort((a, b) => b.influence - a.influence)
                  .map((a) => (
                    <tr
                      key={a.id}
                      onMouseEnter={() => setFocus(a.id)}
                      onMouseLeave={() => setFocus(null)}
                      className="border-b border-rule/60 last:border-0 hover:bg-secondary"
                    >
                      <td className="py-2">
                        <div className="font-mono text-xs text-foreground">{a.id}</div>
                        <div className="text-[11px] text-muted-foreground">{a.dominantTopic}</div>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">{a.category}</td>
                      <td className="py-2 text-right font-mono text-xs">{a.inDegree}</td>
                      <td className="py-2 text-right font-mono text-xs">{a.outDegree}</td>
                      <td className="py-2 text-right font-mono text-xs font-semibold">
                        {a.influence}
                      </td>
                      <td className="py-2 text-right">
                        <SentimentPill value={a.avgSentiment} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel
          title="Hashtag co-occurrence"
          hint="Weight ≥ 2"
          hintHelp={METRIC_HELP.coOccurrences}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="label-caps pb-2">Tag pair</th>
                <th className="label-caps pb-2 text-right">
                  <span className="flex items-center justify-end gap-1.5">
                    Co-occurrences
                    <MetricHelp label="Co-occurrences" text={METRIC_HELP.coOccurrences} />
                  </span>
                </th>
                <th className="label-caps pb-2">
                  <span className="flex items-center gap-1.5">
                    Strength
                    <MetricHelp label="Strength" text={METRIC_HELP.strength} />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {CO_OCCURRENCE.slice(0, 12).map((e) => (
                <tr key={`${e.a}${e.b}`} className="border-b border-rule/60 last:border-0">
                  <td className="py-2 font-mono text-xs">
                    {e.a} <span className="text-muted-foreground">↔</span> {e.b}
                  </td>
                  <td className="py-2 text-right font-mono text-xs">{e.weight}</td>
                  <td className="py-2">
                    <span
                      className="inline-block h-2 rounded-[2px] bg-chart-3"
                      style={{ width: `${(e.weight / CO_OCCURRENCE[0]!.weight) * 90}px` }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Hashtag reach"
          hint="Likes + shares per tag"
          hintHelp={METRIC_HELP.hashtagReach}
        >
          <div className="space-y-2">
            {HASHTAG_STATS.slice(0, 14).map((h) => (
              <div key={h.tag} className="flex items-center gap-3 text-xs">
                <span className="w-44 font-mono text-foreground">{h.tag}</span>
                <span
                  className="h-2.5 rounded-[2px] bg-chart-1"
                  style={{ width: `${(h.reach / HASHTAG_STATS[0]!.reach) * 45 + 4}%` }}
                />
                <span className="font-mono text-muted-foreground">
                  {(h.reach / 1000).toFixed(1)}k
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </Shell>
  );
}
