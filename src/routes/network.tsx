import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { NetworkGraph } from "@/components/network-graph";

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

function Network() {
  const corpus = useCorpus();
  const { AUTHORS, CO_OCCURRENCE, HASHTAG_STATS } = corpus;
  const [, setFocus] = useState<string | null>(null);

  return (
    <Shell
      title="Network"
      subtitle="Who influences whom: the follower graph, detected communities, influence ranking and hashtag reach."
    >
      <Panel title="Interactive network graph" hint="Click a node" hintHelp={METRIC_HELP.community} className="mb-5">
        <NetworkGraph corpus={corpus} />
      </Panel>
      <div className="grid gap-5">
        <Panel
          title="Account register"
          hint="Node attributes"
          hintHelp={METRIC_HELP.graphCentrality}
        >
          <div className="max-h-[430px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-rule text-left">
                  <th className="label-caps px-2 pb-2">Account</th>
                  <th className="label-caps px-2 pb-2">Type</th>
                  <th className="label-caps px-2 pb-2 text-right">
                    <span className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      In
                      <MetricHelp label="In-ties" text={METRIC_HELP.inTies} />
                    </span>
                  </th>
                  <th className="label-caps px-2 pb-2 text-right">
                    <span className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      Out
                      <MetricHelp label="Out-ties" text={METRIC_HELP.outTies} />
                    </span>
                  </th>
                  <th className="label-caps px-2 pb-2 text-right">
                    <span className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      Infl.
                      <MetricHelp label="Influence" text={METRIC_HELP.influence} />
                    </span>
                  </th>
                  <th className="label-caps px-2 pb-2 text-right">
                    <span className="flex items-center justify-end gap-1.5 whitespace-nowrap">
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
                      <td className="py-2 px-2">
                        <div className="font-mono text-xs text-foreground">{a.id}</div>
                        <div className="text-[11px] text-muted-foreground">{a.dominantTopic}</div>
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">{a.category}</td>
                      <td className="py-2 px-2 text-right font-mono text-xs">{a.inDegree}</td>
                      <td className="py-2 px-2 text-right font-mono text-xs">{a.outDegree}</td>
                      <td className="py-2 px-2 text-right font-mono text-xs font-semibold">
                        {a.influence}
                      </td>
                      <td className="py-2 px-2 text-right">
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
                <th className="label-caps px-2 pb-2">Tag pair</th>
                <th className="label-caps px-2 pb-2 text-right">
                  <span className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    Co-occurrences
                    <MetricHelp label="Co-occurrences" text={METRIC_HELP.coOccurrences} />
                  </span>
                </th>
                <th className="label-caps px-2 pb-2">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    Strength
                    <MetricHelp label="Strength" text={METRIC_HELP.strength} />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {CO_OCCURRENCE.slice(0, 12).map((e) => (
                <tr key={`${e.a}${e.b}`} className="border-b border-rule/60 last:border-0">
                  <td className="py-2 px-2 font-mono text-xs">
                    {e.a} <span className="text-muted-foreground">↔</span> {e.b}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-xs">{e.weight}</td>
                  <td className="py-2 px-2">
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
