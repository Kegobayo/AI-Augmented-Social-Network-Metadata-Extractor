/**
 * Entity and sentiment marks.
 *
 * Entities render inline on real caption text as highlighter styles, not
 * colors alone: TECHNOLOGY = solid highlight, LOCATION = wavy underline,
 * ORGANISATION = 1px outline box, DOMAIN = dotted underline, METRIC/MONEY =
 * thin neutral underline. Sentiment values always carry a sign, so color is
 * never the only cue.
 */
import type { ReactNode } from "react";

import type { EntityType } from "@/lib/enrichment";

const MARK_CLASS: Record<EntityType, string> = {
  TECHNOLOGY: "mark-tech",
  LOCATION: "mark-location",
  ORGANISATION: "mark-org",
  DOMAIN: "mark-domain",
  METRIC: "mark-metric",
  MONEY: "mark-metric",
};

export function Mark({ type, children }: { type: EntityType; children: ReactNode }) {
  return <span className={MARK_CLASS[type]}>{children}</span>;
}

const LEGEND: [EntityType, string][] = [
  ["TECHNOLOGY", "Technology"],
  ["LOCATION", "Location"],
  ["ORGANISATION", "Organisation"],
  ["DOMAIN", "Domain"],
];

export function MarkLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted ${className}`}>
      {LEGEND.map(([type, label]) => (
        <span key={type} className="flex items-center gap-1.5">
          <Mark type={type}>{label}</Mark>
        </span>
      ))}
    </p>
  );
}

export type SimpleEntity = { text: string; type: EntityType };

/**
 * Render caption text with inline entity marks and hashtags set in
 * semi-bold with a highlight on hover.
 */
export function MarkedText({
  text,
  entities = [],
  hashtags = [],
}: {
  text: string;
  entities?: SimpleEntity[];
  hashtags?: string[];
}) {
  const map = new Map<string, EntityType>();
  for (const e of entities) map.set(e.text.toLowerCase(), e.type);
  const parts = text.split(/(\s+)/);

  return (
    <>
      {parts.map((part, i) => {
        if (!part.trim()) return part;
        if (part.startsWith("#") && part.length > 1) {
          return (
            <span key={i} className="hashtag">
              {part}
            </span>
          );
        }
        const bare = part.replace(/[^a-z0-9₦,%.]/gi, "").toLowerCase();
        const type = bare ? map.get(bare) : undefined;
        if (type) {
          return (
            <Mark key={i} type={type}>
              {part}
            </Mark>
          );
        }
        return part;
      })}
    </>
  );
}

/** Signed sentiment, never rendering a negative zero. */
export function formatSent(v: number): string {
  const rounded = Math.round(v * 100) / 100;
  if (rounded === 0) return "0.00";
  return `${rounded < 0 ? "-" : "+"}${Math.abs(rounded).toFixed(2)}`;
}

export function SentimentValue({ value, className = "" }: { value: number; className?: string }) {
  const tone =
    value > 0.08 ? "text-positive" : value < -0.08 ? "text-negative" : "text-neutral";
  return (
    <span className={`font-semibold tabular-nums ${tone} ${className}`}>
      {formatSent(value)}
    </span>
  );
}

/**
 * Citation tab in an AI answer: a small highlighter chip that opens (and
 * scrolls to) the supporting post in the evidence panel.
 */
export function CitationTab({
  n,
  label,
  onOpen,
  onHover,
}: {
  n: number;
  label: string;
  onOpen: () => void;
  onHover?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={onHover}
      title={`Show the post behind citation ${n} (${label}) in the evidence panel`}
      className="mark-tech mx-0.5 inline-flex h-[1.3em] min-w-[1.9em] items-center justify-center align-baseline rounded-[2px] text-[0.68em] font-semibold transition-transform duration-150 hover:scale-110"
    >
      [{n}]
    </button>
  );
}
