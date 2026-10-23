/**
 * App shell — left icon rail (72px, expands to 220px on hover/pin), top bar
 * with corpus controls and the "Analyse a post" slide-over trigger, and the
 * persistent Evidence rail on the right (320px, bottom sheet on mobile).
 */
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Database,
  FolderOpen,
  Info,
  LayoutDashboard,
  Pin,
  PinOff,
  Plus,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { EvidencePost } from "@/components/evidence-post";
import { SentimentValue } from "@/components/marks";
import { InstagramInsights } from "@/components/instagram-insights";
import { useCorpusState } from "@/lib/corpus-context";

const NAV = [
  { to: "/ask", label: "Ask", short: "Ask", icon: Sparkles },
  { to: "/dashboard", label: "Overview", short: "Home", icon: LayoutDashboard },
  { to: "/network", label: "Network", short: "Net", icon: Share2 },
  { to: "/corpus", label: "Corpus", short: "Data", icon: Database },
  { to: "/my-corpus", label: "My corpus", short: "Mine", icon: FolderOpen },
  { to: "/architecture", label: "How it works", short: "How", icon: Info },
] as const;

function isActive(currentPath: string, to: string) {
  return to === "/dashboard" ? currentPath === "/dashboard" : currentPath.startsWith(to);
}

function Wordmark() {
  return (
    <>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink text-[15px] font-bold text-highlight">
        A
      </span>
      <span className="brand-full whitespace-nowrap text-sm font-semibold text-foreground">
        Aura Insight
      </span>
      <span className="brand-mini sr-only">Aura Insight</span>
    </>
  );
}

function RailItems({ className = "" }: { className?: string }) {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  return (
    <ul className={className}>
      {NAV.map((item) => {
        const active = isActive(currentPath, item.to);
        return (
          <li key={item.to}>
            <Link
              to={item.to}
              className={`rail-item mx-2 flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm transition-colors duration-150 hover:bg-page ${
                active ? "bg-page font-semibold text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.8} />
              <span className="rail-full whitespace-nowrap">{item.label}</span>
              <span className="rail-mini text-center text-[10px] leading-tight">{item.short}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function NavRail() {
  const [pinned, setPinned] = useState(false);
  return (
    <nav
      className={`nav-rail sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-line bg-page lg:flex ${pinned ? "pinned" : ""}`}
      aria-label="Primary"
    >
      <Link to="/dashboard" className="mb-4 flex items-center gap-2.5 overflow-hidden px-4 py-5">
        <Wordmark />
      </Link>
      <RailItems className="flex flex-1 flex-col gap-0.5 overflow-hidden" />
      <button
        type="button"
        onClick={() => setPinned((p) => !p)}
        aria-label={pinned ? "Unpin navigation rail" : "Pin navigation rail open"}
        className="mx-2 mb-4 flex items-center justify-center gap-2 rounded-md px-2.5 py-2.5 text-sm text-muted transition-colors duration-150 hover:bg-page hover:text-foreground"
      >
        {pinned ? <PinOff className="h-[18px] w-[18px]" /> : <Pin className="h-[18px] w-[18px]" />}
        <span className="rail-full whitespace-nowrap">{pinned ? "Unpin" : "Pin open"}</span>
      </button>
    </nav>
  );
}

function MobileNav() {
  return (
    <nav
      className="sticky top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-line bg-page px-2 py-2 lg:hidden"
      aria-label="Primary"
    >
      <Link to="/dashboard" className="flex shrink-0 items-center gap-2 px-2 pr-3">
        <Wordmark />
      </Link>
      <RailItems className="mobile-nav flex shrink-0 items-center gap-0.5" />
    </nav>
  );
}

function TopBar({ title, onAnalyse }: { title: string; onAnalyse: () => void }) {
  const { source, setSource, days, setDays, saved } = useCorpusState();
  const hasSaved = saved.length > 0;

  const selectClass =
    "h-9 rounded-lg border border-line-strong bg-specimen px-2.5 text-sm text-foreground outline-none transition-colors duration-150 hover:bg-page";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-page px-4 sm:px-6">
      <p className="truncate text-sm text-muted">{title}</p>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <select
          aria-label="Corpus"
          value={source === "demo" || !hasSaved ? "demo" : "saved"}
          onChange={(e) => setSource(e.target.value === "demo" ? "demo" : "saved")}
          className={`${selectClass} hidden md:block`}
        >
          <option value="demo">Demo corpus</option>
          <option value="saved" disabled={!hasSaved}>
            My corpus{hasSaved ? ` (${saved.length})` : ""}
          </option>
        </select>
        <select
          aria-label="Date range"
          value={days ?? "all"}
          onChange={(e) => setDays(e.target.value === "all" ? null : Number(e.target.value))}
          className={`${selectClass} hidden lg:block`}
        >
          <option value="all">All time</option>
          <option value="30">Last 30 days</option>
          <option value="7">Last 7 days</option>
        </select>
        <button
          type="button"
          onClick={onAnalyse}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-specimen px-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-page"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Analyse a post</span>
        </button>
        <Link
          to="/my-corpus"
          className="inline-flex h-9 items-center rounded-lg bg-highlight px-3 text-sm font-semibold text-ink transition-colors duration-150 hover:brightness-95"
        >
          Import posts
        </Link>
      </div>
    </header>
  );
}

function EvidenceList() {
  const { evidence, evidenceFocus } = useCorpusState();

  useEffect(() => {
    if (!evidenceFocus) return;
    const el = document.getElementById(`ev-${evidenceFocus}`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [evidenceFocus, evidence]);

  if (evidence.length === 0) {
    return (
      <p className="quote px-4 py-6 text-[15px] text-muted">
        Select a topic, a claim or a point on the chart to see the posts behind it.
      </p>
    );
  }

  return (
    <div className="px-4 pb-8">
      {evidence.map((p) => (
        <EvidencePost key={p.id} post={p} focused={evidenceFocus === p.id} />
      ))}
    </div>
  );
}

function EvidenceHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
      <span className="text-sm font-semibold text-foreground">Evidence</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close evidence panel"
        className="grid size-8 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-page hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function EvidenceRail() {
  const { railOpen, setRailOpen } = useCorpusState();
  if (!railOpen) return null;
  return (
    <aside
      className="sticky top-0 z-20 hidden h-screen w-[320px] shrink-0 flex-col border-l border-line bg-page lg:flex"
      aria-label="Evidence"
    >
      <EvidenceHeader onClose={() => setRailOpen(false)} />
      <div className="flex-1 overflow-y-auto">
        <EvidenceList />
      </div>
    </aside>
  );
}

function EvidenceSheet() {
  const { railOpen, setRailOpen } = useCorpusState();
  if (!railOpen) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 max-h-[62vh] overflow-y-auto border-t border-line bg-specimen lg:hidden">
      <EvidenceHeader onClose={() => setRailOpen(false)} />
      <EvidenceList />
    </div>
  );
}

function AnalyseSlideOver({
  open,
  onClose,
  onAnalysed,
}: {
  open: boolean;
  onClose: () => void;
  onAnalysed?: (topicId: string | null) => void;
}) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/25 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        role="dialog"
        aria-label="Analyse an Instagram post"
        className={`slide-over absolute inset-y-0 right-0 w-full max-w-[540px] overflow-y-auto border-l border-line bg-page ${open ? "open" : ""}`}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-5">
          <span className="text-base font-semibold">Analyse an Instagram post</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close analysis panel"
            className="grid size-8 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-page hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">
          <InstagramInsights onAnalysed={onAnalysed} />
        </div>
      </div>
    </div>
  );
}

export function Shell({
  title,
  subtitle,
  children,
  onAnalysed,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onAnalysed?: (topicId: string | null) => void;
}) {
  const [analyseOpen, setAnalyseOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <TopBar title={title} onAnalyse={() => setAnalyseOpen(true)} />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1080px]">
            <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-foreground">
              {title}
            </h2>
            {subtitle ? <p className="mt-2 max-w-[65ch] text-[15px] text-muted">{subtitle}</p> : null}
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
      <EvidenceRail />
      <EvidenceSheet />
      <AnalyseSlideOver open={analyseOpen} onClose={() => setAnalyseOpen(false)} onAnalysed={onAnalysed} />
    </div>
  );
}

/* ----------------------------------------------------------- primitives */

export function Panel({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`specimen-panel p-5 ${className}`}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-[18px] font-semibold text-foreground">{title}</h3>
        {hint ? <span className="label">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="specimen-panel px-4 py-3">
      <div className="text-[28px] font-bold leading-8 tracking-tight text-foreground [font-variant-numeric:tabular-nums]">
        {value}
      </div>
      <div className="label mt-0.5">{label}</div>
    </div>
  );
}

/** Signed sentiment value (kept for existing call sites). */
export function SentimentPill({ value }: { value: number }) {
  return <SentimentValue value={value} />;
}
