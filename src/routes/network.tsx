/**
 * Network — follower graph with pattern-filled communities, account register,
 * hashtag co-occurrence and hashtag reach. Selecting a node fills the
 * evidence rail with that account's posts.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Shell } from "@/components/shell";
import { NetworkGraph, NetworkLegend } from "@/components/network-graph";
import { SentimentValue } from "@/components/marks";
import { useCorpus, useCorpusState } from "@/lib/corpus-context";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Network | Aura Insight" },
      {
        name: "description",
        content:
          "Who shapes the conversation: the follower graph, detected communities, influence ranking and hashtag co-occurrence.",
      },
      { property: "og:title", content: "Network | Aura Insight" },
      { property: "og:description", content: "Accounts, ties, communities and hashtag co-occurrence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Network,
});

function Network() {
  const { AUTHORS, CO_OCCURRENCE, HASHTAG_STATS, EDGES, ENRICHED } = useCorpus();
  const { openEvidence } = useCorpusState();
  const [focus, setFocus] = useState<string | null>(null);

  function selectAccount(id: string) {
    const posts = ENRICHED.filter((p) => p.author === id);
    setFocus(id);
    if (posts.length) openEvidence(posts, posts[0]!.id);
  }

  return (
    <Shell title="Network">
      <section>
        <p className="label">Node size is influence (in-ties, reach and engagement); fill pattern is the detected community. Click a node to see its posts.</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="specimen-panel p-4">
            <NetworkGraph authors={AUTHORS} edges={EDGES} focusId={focus} onSelect={selectAccount} />
            <div className="mt-2">
              <NetworkLegend authors={AUTHORS} />
            </div>
          </div>
          <div>
            <h3 className="text-[18px] font-semibold text-foreground">Account register</h3>
            <div className="mt-3 max-h-[430px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-page">
                  <tr className="border-b border-line-strong text-left">
                    <th className="py-2 font-medium">Account</th>
                    <th className="py-2 font-medium">Type</th>
                    <th className="py-2 text-right font-medium">In</th>
                    <th className="py-2 text-right font-medium">Out</th>
                    <th className="py-2 text-right font-medium">Influence</th>
                    <th className="py-2 text-right font-medium">Mood</th>
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
                        onClick={() => selectAccount(a.id)}
                        className={`cursor-pointer border-b border-line transition-colors duration-150 last:border-0 hover:bg-page ${focus === a.id ? "bg-page" : ""}`}
                      >
                        <td className="py-2">
                          <div className="text-foreground">{a.id}</div>
                          <div className="label">{a.dominantTopic}</div>
                        </td>
                        <td className="py-2 text-muted">{a.category}</td>
                        <td className="py-2 text-right text-muted">{a.inDegree}</td>
                        <td className="py-2 text-right text-muted">{a.outDegree}</td>
                        <td className="py-2 text-right font-semibold text-foreground">{a.influence}</td>
                        <td className="py-2 text-right">
                          <SentimentValue value={a.avgSentiment} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-8 border-t border-line pt-8 lg:grid-cols-2">
        <div>
          <h3 className="text-[18px] font-semibold text-foreground">Hashtag co-occurrence</h3>
          <p className="label mt-1">Tag pairs that appear on the same posts at least twice.</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-line-strong text-left">
                <th className="py-2 font-medium">Tag pair</th>
                <th className="py-2 pr-6 text-right font-medium">Together</th>
                <th className="w-28 py-2 font-medium">Strength</th>
              </tr>
            </thead>
            <tbody>
              {CO_OCCURRENCE.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-3 text-muted">
                    No tag pairs repeat in this corpus yet.
                  </td>
                </tr>
              ) : (
                CO_OCCURRENCE.slice(0, 12).map((e) => (
                <tr key={`${e.a}${e.b}`} className="border-b border-line last:border-0">
                  <td className="py-2">
                    <span className="hashtag">{e.a}</span>
                    <span className="mx-1.5 text-muted">with</span>
                    <span className="hashtag">{e.b}</span>
                  </td>
                  <td className="py-2 pr-6 text-right text-muted">{e.weight}</td>
                  <td className="py-2">
                    <span
                      className="inline-block h-2 rounded-sm bg-ink/80"
                      style={{ width: `${Math.max(6, (e.weight / (CO_OCCURRENCE[0]?.weight ?? 1)) * 100)}%` }}
                    />
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="text-[18px] font-semibold text-foreground">Hashtag reach</h3>
          <p className="label mt-1">Likes plus shares per tag.</p>
          <div className="mt-4 space-y-2.5">
            {HASHTAG_STATS.slice(0, 14).map((h) => (
              <div key={h.tag} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate">
                  <span className="hashtag">{h.tag}</span>
                </span>
                <span className="relative h-2.5 flex-1">
                  <span
                    className="absolute left-0 top-0 h-2.5 rounded-sm bg-ink/80"
                    style={{ width: `${Math.max(2, (h.reach / (HASHTAG_STATS[0]?.reach ?? 1)) * 100)}%` }}
                  />
                </span>
                <span className="w-14 shrink-0 text-right text-muted">{(h.reach / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
