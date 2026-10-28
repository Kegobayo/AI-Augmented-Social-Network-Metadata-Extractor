import { useEffect, useMemo, useRef, useState } from "react";
import { forceX, forceY, forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationNodeDatum } from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { Minus, Plus, RotateCcw, X } from "lucide-react";

import type { Corpus } from "@/lib/enrichment";
import { SentimentPill } from "@/components/shell";

const W = 640;
const H = 460;
const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];

type N = SimulationNodeDatum & { id: string; r: number; community: string };

export function NetworkGraph({ corpus }: { corpus: Corpus }) {
  const { AUTHORS, EDGES, ENRICHED } = corpus;
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [t, setT] = useState({ x: 0, y: 0, k: 1 });
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const communities = useMemo(() => [...new Set(AUTHORS.map((a) => a.community))], [AUTHORS]);
  const color = (c: string) => PALETTE[communities.indexOf(c) % PALETTE.length]!;

  const nodes = useMemo(() => {
    const max = Math.max(1, ...AUTHORS.map((a) => a.influence));
    const ns: N[] = AUTHORS.map((a, i) => {
      const ang = i * 2.39996;
      const rad = 12 * Math.sqrt(i + 1);
      return { id: a.id, community: a.community, r: 10 + (a.influence / max) * 16, x: W / 2 + rad * Math.cos(ang), y: H / 2 + rad * Math.sin(ang) };
    });
    const ids = new Set(ns.map((n) => n.id));
    const links = EDGES.filter(([a, b]) => ids.has(a) && ids.has(b)).map(([source, target]) => ({ source, target }));
    const sim = forceSimulation(ns)
      .force("link", forceLink<N, { source: string; target: string }>(links).id((d) => d.id).distance(140))
      .force("charge", forceManyBody().strength(-320))
      .force("center", forceCenter(W / 2, H / 2))
      .force("x", forceX(W / 2).strength(0.12))
      .force("y", forceY(H / 2).strength(0.16))
      .force("collide", forceCollide<N>().radius((d) => d.r + 14))
      .stop();
    for (let i = 0; i < 300; i++) sim.tick();
    return Object.fromEntries(ns.map((n) => [n.id, n]));
  }, [AUTHORS, EDGES]);

  useEffect(() => {
    if (!svgRef.current) return;
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 4])
      .on("zoom", (e) => setT({ x: e.transform.x, y: e.transform.y, k: e.transform.k }));
    zoomRef.current = z;
    select(svgRef.current).call(z);
    return () => void select(svgRef.current!).on(".zoom", null);
  }, []);

  const zoomBy = (f: number) => svgRef.current && zoomRef.current && select(svgRef.current).call(zoomRef.current.scaleBy, f);
  const reset = () => svgRef.current && zoomRef.current && select(svgRef.current).call(zoomRef.current.transform, zoomIdentity);

  const focus = hover ?? selected;
  const neighbours = useMemo(() => {
    const s = new Set<string>();
    if (focus) for (const [a, b] of EDGES) { if (a === focus) s.add(b); if (b === focus) s.add(a); }
    return s;
  }, [focus, EDGES]);

  const detail = useMemo(() => {
    if (!selected) return null;
    const author = AUTHORS.find((a) => a.id === selected);
    if (!author) return null;
    const posts = ENRICHED.filter((p) => p.author === selected);
    const out = EDGES.filter(([a]) => a === selected).map(([, b]) => b);
    const inn = EDGES.filter(([, b]) => b === selected).map(([a]) => a);
    const tagCount = new Map<string, number>();
    const pairs = new Map<string, number>();
    for (const p of posts) {
      const tags = [...new Set(p.hashtags.map((h) => h.toLowerCase()))].sort();
      tags.forEach((x) => tagCount.set(x, (tagCount.get(x) ?? 0) + 1));
      for (let i = 0; i < tags.length; i++)
        for (let j = i + 1; j < tags.length; j++) {
          const k = `${tags[i]}|${tags[j]}`;
          pairs.set(k, (pairs.get(k) ?? 0) + 1);
        }
    }
    const tags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const kept = new Set(tags.map(([t]) => t));
    const tagEdges = [...pairs.entries()]
      .map(([k, w]) => ({ a: k.split("|")[0]!, b: k.split("|")[1]!, w }))
      .filter((e) => kept.has(e.a) && kept.has(e.b));
    return { author, posts, out, inn, tags, tagEdges };
  }, [selected, AUTHORS, ENRICHED, EDGES]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <div className="relative self-start overflow-hidden rounded-xl border border-border bg-background">
        <div className="absolute right-2 top-2 z-10 flex gap-1">
          {[
            { icon: Plus, label: "Zoom in", on: () => zoomBy(1.3) },
            { icon: Minus, label: "Zoom out", on: () => zoomBy(1 / 1.3) },
            { icon: RotateCcw, label: "Reset view", on: reset },
          ].map(({ icon: I, label, on }) => (
            <button key={label} aria-label={label} onClick={on} className="grid size-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground">
              <I className="size-4" />
            </button>
          ))}
        </div>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-[460px] w-full cursor-grab touch-none active:cursor-grabbing">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0L10,5L0,10z" fill="var(--muted-foreground)" />
            </marker>
          </defs>
          <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>
            {EDGES.map(([a, b], i) => {
              const s = nodes[a], d = nodes[b];
              if (!s || !d) return null;
              const on = !focus || a === focus || b === focus;
              const dx = d.x! - s.x!, dy = d.y! - s.y!, len = Math.hypot(dx, dy) || 1;
              return (
                <line key={i} x1={s.x} y1={s.y} x2={d.x! - (dx / len) * (d.r + 2)} y2={d.y! - (dy / len) * (d.r + 2)}
                  stroke={on && focus ? "var(--primary)" : "var(--muted-foreground)"} strokeWidth={on && focus ? 1.8 : 1}
                  opacity={on ? 0.75 : 0.12} markerEnd="url(#arrow)" />
              );
            })}
            {Object.values(nodes).map((n) => {
              const on = !focus || n.id === focus || neighbours.has(n.id);
              return (
                <g key={n.id} className="cursor-pointer" opacity={on ? 1 : 0.25}
                  onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
                  onClick={(e) => { e.stopPropagation(); setSelected(n.id === selected ? null : n.id); }}>
                  <circle cx={n.x} cy={n.y} r={n.r} fill={color(n.community)}
                    stroke={n.id === selected ? "var(--foreground)" : "var(--card)"} strokeWidth={n.id === selected ? 3 : 1.5} />
                  <text x={n.x} y={n.y! + n.r + 11} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--foreground)" pointerEvents="none">{n.id}</text>
                </g>
              );
            })}
          </g>
        </svg>
        <div className="flex flex-wrap gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          {communities.map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full" style={{ background: color(c) }} />{c}
            </span>
          ))}
          <span className="ml-auto">Scroll to zoom · drag to pan · click a node</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        {!detail ? (
          <div className="grid h-full min-h-60 place-items-center text-center text-sm text-muted-foreground">
            Click any account in the graph to see its connections, comment threads and hashtag co-occurrences.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-base font-semibold text-foreground">{detail.author.id}</div>
                <div className="text-xs text-muted-foreground">
                  {detail.author.community} · {detail.author.posts} posts · {detail.author.followers.toLocaleString()} followers
                </div>
              </div>
              <button aria-label="Close" onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
            </div>

            <section>
              <h4 className="mb-2 text-sm font-semibold">Connections</h4>
              {[["Mentions / follows", detail.out], ["Mentioned by", detail.inn]].map(([label, list]) => (
                <div key={label as string} className="mb-2">
                  <div className="label-caps mb-1 text-[11px] text-muted-foreground">{label as string} ({(list as string[]).length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(list as string[]).length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                    {(list as string[]).map((id) => (
                      <button key={id} onClick={() => setSelected(id)} className="rounded-full bg-primary-subtle px-2 py-0.5 font-mono text-[11px] text-primary hover:opacity-80">{id}</button>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold">Hashtag co-occurrence</h4>
              {detail.tags.length === 0 ? <p className="text-xs text-muted-foreground">No hashtags.</p> : <TagGraph tags={detail.tags} edges={detail.tagEdges} />}
            </section>

            <section>
              <h4 className="mb-2 text-sm font-semibold">Comment threads</h4>
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {detail.posts.map((p) => (
                  <div key={p.id} className="rounded-lg border border-border p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">{p.topic.label}</span>
                      <SentimentPill value={p.sentiment} />
                    </div>
                    <p className="line-clamp-2 text-xs text-foreground">{p.caption}</p>
                    <ul className="mt-2 space-y-1 border-l-2 border-primary/40 pl-2">
                      {p.comments_sample.length === 0 && <li className="text-xs text-muted-foreground">No comments captured.</li>}
                      {p.comments_sample.map((c, i) => <li key={i} className="text-xs text-muted-foreground">“{c}”</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function TagGraph({ tags, edges }: { tags: [string, number][]; edges: { a: string; b: string; w: number }[] }) {
  const size = 260, c = size / 2, R = 95;
  const max = Math.max(...tags.map(([, n]) => n));
  const pos = Object.fromEntries(tags.map(([t], i) => {
    const a = (i / tags.length) * Math.PI * 2 - Math.PI / 2;
    return [t, { x: c + R * Math.cos(a), y: c + R * Math.sin(a), a }];
  }));
  const maxW = Math.max(1, ...edges.map((e) => e.w));
  return (
    <svg viewBox={`-40 0 ${size + 80} ${size}`} className="w-full">
      {edges.map((e, i) => (
        <line key={i} x1={pos[e.a]!.x} y1={pos[e.a]!.y} x2={pos[e.b]!.x} y2={pos[e.b]!.y}
          stroke="var(--chart-3)" strokeWidth={0.8 + (e.w / maxW) * 2.5} opacity={0.55} />
      ))}
      {tags.map(([t, n]) => {
        const p = pos[t]!;
        const right = Math.cos(p.a) >= 0;
        return (
          <g key={t}>
            <circle cx={p.x} cy={p.y} r={4 + (n / max) * 6} fill="var(--chart-1)" />
            <text x={p.x + (right ? 12 : -12)} y={p.y + 3} textAnchor={right ? "start" : "end"} fontSize="9" fontFamily="var(--font-mono)" fill="var(--foreground)">{t}</text>
          </g>
        );
      })}
    </svg>
  );
}
