/**
 * Node-link map of the conversation, shared by the overview and network
 * pages. Node size = influence; communities are separated by fill pattern
 * (solid, stripes, dots, hatch) rather than a rainbow palette. Clicking a
 * node selects the account.
 */
import { useMemo } from "react";

import type { AuthorNode } from "@/lib/enrichment";

export type { AuthorNode };

function Patterns() {
  return (
    <defs>
      <pattern id="np-0" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="var(--ink)" fillOpacity="0.92" />
      </pattern>
      <pattern id="np-1" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="7" height="7" fill="var(--specimen)" />
        <rect width="3.5" height="7" fill="var(--ink)" fillOpacity="0.85" />
      </pattern>
      <pattern id="np-2" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--specimen)" />
        <circle cx="4" cy="4" r="2.1" fill="var(--ink)" fillOpacity="0.85" />
      </pattern>
      <pattern id="np-3" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="var(--specimen)" />
        <path d="M0 8L8 0M-2 2L2 -2M6 10L10 6" stroke="var(--ink)" strokeOpacity="0.7" strokeWidth="1.4" />
      </pattern>
    </defs>
  );
}

/** Small swatch matching the graph's community fill, for legends. */
export function PatternSwatch({ index, className = "" }: { index: number; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={`inline-block size-3.5 rounded-[2px] ${className}`} aria-hidden="true">
      <defs>{/* reuse global pattern ids via href */}</defs>
      <rect width="12" height="12" fill={`url(#np-${index % 4})`} stroke="var(--line-strong)" strokeWidth="0.5" />
    </svg>
  );
}

export function NetworkGraph({
  authors,
  edges,
  focusId = null,
  onSelect,
  className = "",
}: {
  authors: AuthorNode[];
  edges: [string, string][];
  focusId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const layout = useMemo(() => {
    const r = 158;
    const cx = 280;
    const cy = 195;
    return authors.map((a, i) => {
      const angle = (i / Math.max(1, authors.length)) * Math.PI * 2 - Math.PI / 2;
      return { ...a, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
  }, [authors]);

  const pos = Object.fromEntries(layout.map((n) => [n.id, n]));
  const maxInfluence = Math.max(1, ...authors.map((a) => a.influence));
  const communities = [...new Set(authors.map((a) => a.community))];
  const patternOf = (community: string) => communities.indexOf(community) % 4;

  return (
    <svg
      viewBox="0 0 560 390"
      className={`w-full ${className}`}
      role="img"
      aria-label="Node-link map of accounts, sized by influence and grouped by community"
    >
      <Patterns />
      {edges.map(([a, b], i) => {
        const from = pos[a];
        const to = pos[b];
        if (!from || !to) return null;
        const active = !focusId || focusId === a || focusId === b;
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="var(--line-strong)"
            strokeWidth={active ? 1 : 0.6}
            opacity={active ? 0.9 : 0.2}
          />
        );
      })}
      {layout.map((n) => {
        const active = !focusId || focusId === n.id;
        const radius = 9 + (n.influence / maxInfluence) * 15;
        return (
          <g
            key={n.id}
            onClick={() => onSelect?.(n.id)}
            className={onSelect ? "cursor-pointer" : ""}
            opacity={active ? 1 : 0.35}
          >
            <circle
              cx={n.x}
              cy={n.y}
              r={radius}
              fill={`url(#np-${patternOf(n.community)})`}
              stroke="var(--ink)"
              strokeWidth={focusId === n.id ? 2 : 1}
            />
            <text
              x={n.x}
              y={n.y + radius + 13}
              textAnchor="middle"
              fontSize="11"
              fill="var(--ink)"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {n.id.replace("@", "")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function NetworkLegend({ authors }: { authors: AuthorNode[] }) {
  const communities = [...new Set(authors.map((a) => a.community))];
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted">
      {communities.map((c, i) => (
        <li key={c} className="flex items-center gap-2">
          <PatternSwatch index={i} />
          {c}
        </li>
      ))}
    </ul>
  );
}
