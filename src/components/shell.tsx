import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Dashboard", note: "Layer 4" },
  { to: "/corpus", label: "Corpus & metadata", note: "Layer 1–2" },
  { to: "/network", label: "Network analysis", note: "Layer 2" },
  { to: "/ask", label: "Generative query", note: "Layer 3" },
  { to: "/architecture", label: "Architecture", note: "Ch. 3" },
] as const;

export function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-rule bg-card">
        <div className="mx-auto max-w-[1180px] px-6 py-5">
          <p className="label-caps">AI-Augmented Social Network Metadata Extractor</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            Generative Knowledge Management Workbench
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            MSc Information Technology research prototype — Instagram metadata extraction, semantic
            enrichment and retrieval-augmented synthesis for decision support.
          </p>
        </div>
        <nav className="border-t border-rule">
          <div className="mx-auto flex max-w-[1180px] flex-wrap gap-1 px-6">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group border-b-2 border-transparent px-3 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-primary data-[status=active]:font-medium data-[status=active]:text-foreground"
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
                <span className="ml-2 font-mono text-[10px] uppercase tracking-wider opacity-50">
                  {item.note}
                </span>
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <div className="mb-6 border-l-2 border-accent pl-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </main>

      <footer className="mt-12 border-t border-rule py-6">
        <div className="mx-auto max-w-[1180px] px-6 text-xs text-muted-foreground">
          Demonstration corpus of anonymised Instagram metadata. Enrichment runs deterministically in
          the browser; the generative layer calls a hosted language model.
        </div>
      </footer>
    </div>
  );
}

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
    <section className={`paper-panel p-5 ${className}`}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {hint ? <span className="label-caps">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="paper-panel px-4 py-3">
      <div className="font-serif text-2xl font-semibold text-foreground">{value}</div>
      <div className="label-caps mt-1">{label}</div>
    </div>
  );
}

export function SentimentPill({ value }: { value: number }) {
  const tone =
    value > 0.08 ? "text-positive" : value < -0.08 ? "text-negative" : "text-muted-foreground";
  return (
    <span className={`font-mono text-xs ${tone}`}>
      {value > 0 ? "+" : ""}
      {value.toFixed(2)}
    </span>
  );
}
