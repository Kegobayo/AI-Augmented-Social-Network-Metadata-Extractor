/**
 * LedgerBar — a topic as a horizontal ledger row: bar length = share of
 * posts, a sentiment tick at the end of the bar and the signed score.
 * Clicking a bar fills the evidence rail with that topic's posts.
 */
import { formatSent, SentimentValue } from "@/components/marks";

export function LedgerBar({
  label,
  count,
  total,
  sentiment,
  highlighted = false,
  note,
  onClick,
}: {
  label: string;
  count: number;
  total: number;
  sentiment: number;
  highlighted?: boolean;
  note?: string;
  onClick?: () => void;
}) {
  const pct = total > 0 ? Math.max(1.5, Math.round((count / total) * 100)) : 0;
  const tickColor =
    sentiment > 0.08
      ? "var(--positive)"
      : sentiment < -0.08
        ? "var(--negative)"
        : "var(--neutral)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[minmax(7.5rem,13rem)_1fr_auto] items-center gap-3 border-b border-line py-2.5 text-left transition-colors duration-150 last:border-0 hover:bg-page"
    >
      <span className="truncate text-sm text-foreground" title={label}>
        {label}
        {note ? <span className="label ml-2">{note}</span> : null}
      </span>
      <span className="relative block h-2.5" aria-hidden="true">
        <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
        <span
          className={`absolute left-0 top-0 h-2.5 rounded-sm ${highlighted ? "bg-highlight" : "bg-ink/85"}`}
          style={{ width: `${pct}%` }}
        />
        <span
          className="absolute top-[-2px] h-3.5 w-[3px] rounded-[1px]"
          style={{ left: `calc(${pct}% - 1px)`, backgroundColor: tickColor }}
          title={`Mood ${formatSent(sentiment)}`}
        />
      </span>
      <span className="flex shrink-0 items-center gap-3 text-[13px] tabular-nums text-muted">
        <span>
          {count} {count === 1 ? "post" : "posts"}
        </span>
        <SentimentValue value={sentiment} />
      </span>
    </button>
  );
}
