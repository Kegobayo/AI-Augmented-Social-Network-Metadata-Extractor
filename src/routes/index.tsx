/**
 * Landing page. The dashboard lives at /dashboard.
 * Order: navbar, hero, features, how it works, FAQ, closing band, footer.
 * One load motion only: the highlighter marks sweep across the hero caption
 * once, then the margin notes settle (disabled under prefers-reduced-motion).
 */
import { createFileRoute, Link } from "@tanstack/react-router";

import { SentimentValue } from "@/components/marks";
import { DEMO_CORPUS } from "@/lib/enrichment";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aura Insight — Find out what people are really saying" },
      {
        name: "description",
        content:
          "Ask your Instagram corpus a question and see the exact posts behind every answer. Topics, mood, networks and evidence, traced back to the source posts.",
      },
      { property: "og:title", content: "Aura Insight — Find out what people are really saying" },
      {
        property: "og:description",
        content: "Ask your Instagram corpus a question and see the exact posts behind every answer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const HERO_POST = DEMO_CORPUS.ENRICHED.find((p) => p.id === "p001") ?? DEMO_CORPUS.ENRICHED[0]!;

function Wordmark() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-[15px] font-bold text-highlight">
        A
      </span>
      <span className="text-sm font-semibold text-foreground">Aura Insight</span>
    </Link>
  );
}

function Navbar() {
  const link = "text-sm text-muted underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline";
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Wordmark />
        <nav className="ml-auto flex items-center gap-5">
          <Link to="/ask" className={`hidden sm:inline ${link}`}>
            Ask
          </Link>
          <Link to="/dashboard" className={`hidden sm:inline ${link}`}>
            Overview
          </Link>
          <Link to="/architecture" className={`hidden sm:inline ${link}`}>
            How it works
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex h-9 items-center rounded-lg border border-line-strong bg-specimen px-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-page"
          >
            Open the workbench
          </Link>
        </nav>
      </div>
    </header>
  );
}

function HeroCaptionMark({
  type,
  delay,
  children,
}: {
  type: "fill" | "tech" | "location" | "org" | "domain" | "metric";
  delay: number;
  children: string;
}) {
  const cls =
    type === "fill"
      ? "mark-tech hero-mark-fill"
      : type === "location"
        ? "mark-location hero-mark-line"
        : type === "org"
          ? "mark-org hero-mark-line"
          : type === "domain"
            ? "mark-domain hero-mark-line"
            : type === "metric"
              ? "mark-metric hero-mark-line"
              : "hero-mark-line";
  return (
    <span className={cls} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </span>
  );
}

function HeroNotes() {
  const notes: [string, React.ReactNode][] = [
    ["Topic", HERO_POST.topic.label],
    ["Mood", <SentimentValue key="m" value={HERO_POST.sentiment} />],
    ["Entities", `${HERO_POST.entities.length} marked in the caption`],
    ["Hashtags", `${HERO_POST.hashtags.length} tagged`],
  ];
  return (
    <ul className="space-y-4">
      {notes.map(([k, v], i) => (
        <li
          key={k}
          className="hero-note relative pl-6 before:absolute before:left-0 before:top-1/2 before:h-px before:w-4 before:bg-line-strong"
          style={{ animationDelay: `${850 + i * 90}ms` }}
        >
          <span className="label block">{k}</span>
          <span className="text-[13px] text-foreground">{v}</span>
        </li>
      ))}
    </ul>
  );
}

function Hero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div>
          <h1 className="max-w-[16ch] text-[40px] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-[48px]">
            Find out what people are really saying.
          </h1>
          <p className="quote mt-5 text-muted">
            Ask your Instagram corpus a question and see the exact posts behind every answer.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/ask"
              className="inline-flex h-11 items-center rounded-lg bg-highlight px-5 text-sm font-semibold text-ink transition-colors duration-150 hover:brightness-95"
            >
              Ask the demo corpus
            </Link>
            <Link
              to="/architecture"
              className="inline-flex h-11 items-center rounded-lg border border-line-strong bg-specimen px-5 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-page"
            >
              See how it works
            </Link>
          </div>
        </div>

        <figure className="specimen-panel p-5 sm:p-6">
          <figcaption className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
            <span className="text-sm font-semibold text-foreground">{HERO_POST.author}</span>
            <span className="label">
              {new Date(HERO_POST.timestamp).toLocaleDateString("en", { day: "numeric", month: "short" })} ·{" "}
              {HERO_POST.mediaType}
            </span>
          </figcaption>
          <div className="mt-4 grid gap-6 sm:grid-cols-[1fr_150px]">
            <div>
              <blockquote className="quote">
                Installed a <HeroCaptionMark type="metric" delay={0}>5kVA</HeroCaptionMark> hybrid{" "}
                <HeroCaptionMark type="fill" delay={80}>solar</HeroCaptionMark>{" "}
                <HeroCaptionMark type="fill" delay={160}>inverter</HeroCaptionMark> for a family in{" "}
                <HeroCaptionMark type="location" delay={240}>Ikeja</HeroCaptionMark> today.{" "}
                <HeroCaptionMark type="fill" delay={320}>Diesel</HeroCaptionMark> spend dropped from{" "}
                <HeroCaptionMark type="metric" delay={400}>₦90,000</HeroCaptionMark> to almost zero this month.
                Renewable <HeroCaptionMark type="domain" delay={480}>energy</HeroCaptionMark> is no longer a
                luxury, it is the cheaper option.
              </blockquote>
              <p className="mt-4 flex flex-wrap gap-x-2.5 gap-y-1 text-[13px]">
                {HERO_POST.hashtags.map((h, i) => (
                  <span key={h} className="hashtag hero-mark-line" style={{ animationDelay: `${560 + i * 60}ms` }}>
                    {h}
                  </span>
                ))}
              </p>
            </div>
            <HeroNotes />
          </div>
        </figure>
      </div>
    </section>
  );
}

function MockMetadata() {
  const rows: [string, React.ReactNode][] = [
    ["Author", "@solar_naija"],
    ["Posted", "2 Aug 2026 · Ikeja, Lagos · carousel"],
    [
      "Caption",
      <>
        Installed a <span className="mark-tech">solar</span> inverter for a family in{" "}
        <span className="mark-location">Ikeja</span>…
      </>,
    ],
    ["Hashtags", "#solarenergy #renewableenergy #lagos"],
    ["Engagement", "12,400 likes · 318 comments · 2,100 saves"],
    ["Topic", "Renewable energy & off-grid supply (p=0.77)"],
    ["Mood", <SentimentValue key="s" value={0.4} />],
  ];
  return (
    <dl className="specimen-panel text-sm">
      {rows.map(([k, v], i) => (
        <div
          key={k}
          className={`grid grid-cols-[6.5rem_1fr] gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}
        >
          <dt className="label">{k}</dt>
          <dd className="text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function MockLedger() {
  const bars: [string, number, number, number][] = [
    ["Renewable energy & off-grid", 9, 28, -0.12],
    ["Grid reliability & policy", 7, 28, -0.31],
    ["Education & knowledge", 5, 28, 0.22],
  ];
  return (
    <div className="specimen-panel p-4">
      {bars.map(([label, count, total, sent], i) => (
        <div
          key={label}
          className={`grid grid-cols-[1fr_auto] items-center gap-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}
        >
          <span className="relative block h-2.5">
            <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
            <span className="absolute left-0 top-0 h-2.5 rounded-sm bg-ink/85" style={{ width: `${(count / total) * 100}%` }} />
            <span
              className="absolute top-[-2px] h-3.5 w-[3px] rounded-[1px]"
              style={{ left: `calc(${(count / total) * 100}% - 1px)`, backgroundColor: sent < 0 ? "var(--negative)" : "var(--positive)" }}
            />
          </span>
          <span className="flex shrink-0 items-center gap-3 text-[13px]">
            <span className="max-w-[11rem] truncate text-foreground">{label}</span>
            <SentimentValue value={sent} />
          </span>
        </div>
      ))}
    </div>
  );
}

function MockAnswer() {
  return (
    <div className="specimen-panel p-4">
      <p className="label">Grounded in 6 posts</p>
      <p className="quote mt-2 text-[15px]">
        Households report the biggest savings from hybrid{" "}
        <span className="mark-tech">solar</span> installs, while the{" "}
        <span className="mark-domain">policy</span> response to grid failures is described as slow
        <button type="button" className="mark-tech mx-1 inline-flex h-[1.3em] min-w-[1.9em] items-center justify-center rounded-[2px] align-baseline text-[0.68em] font-semibold" title="Citation tab">
          [1]
        </button>
        <button type="button" className="mark-tech mx-0.5 inline-flex h-[1.3em] min-w-[1.9em] items-center justify-center rounded-[2px] align-baseline text-[0.68em] font-semibold" title="Citation tab">
          [3]
        </button>
      </p>
      <p className="label mt-3">Every claim links to the post it came from.</p>
    </div>
  );
}

function Features() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <h2 className="text-[18px] font-semibold text-foreground">Structured from raw posts</h2>
            <p className="mt-2 max-w-[52ch] text-[15px] text-muted">
              Every caption is kept as a source text. Entities are marked where they appear, and
              engagement, topic and mood are recorded alongside — nothing is reduced to a score alone.
            </p>
            <div className="mt-6">
              <MockMetadata />
            </div>
          </div>
          <div className="space-y-12">
            <div>
              <h2 className="text-[18px] font-semibold text-foreground">Topics and mood you can click through</h2>
              <p className="mt-2 max-w-[52ch] text-[15px] text-muted">
                Topics line up as ledger bars with a mood tick. Click one and the posts behind it
                appear in the evidence panel.
              </p>
              <div className="mt-6">
                <MockLedger />
              </div>
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-foreground">Answers you can check</h2>
              <p className="mt-2 max-w-[52ch] text-[15px] text-muted">
                Each sentence in an answer carries a citation tab. Open it to read the supporting
                words in the original post.
              </p>
              <div className="mt-6">
                <MockAnswer />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS: [string, string][] = [
  ["Collect", "Instagram Graph API pulls, authorisation, anonymisation"],
  ["Enrich", "spaCy entities, BERTopic topics, RoBERTa sentiment"],
  ["Store", "vector search index, graph of accounts and ties"],
  ["Ask", "retrieval-augmented generation with citations"],
];

function HowItWorks() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <h2 className="text-[18px] font-semibold text-foreground">How it works</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-4">
          {STEPS.map(([name, tools], i) => (
            <li key={name} className="relative border-t border-line-strong pt-4">
              <span className="absolute -top-[5px] left-0 size-2.5 rounded-full bg-highlight ring-1 ring-ink" />
              <span className="label">{i + 1}</span>
              <h3 className="text-[16px] font-semibold text-foreground">{name}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{tools}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-[70ch] text-[15px] text-muted">
          The demo corpus runs the same pipeline on 28 anonymised posts, so you can try the whole
          flow without connecting anything.
        </p>
      </div>
    </section>
  );
}

const FAQS: [string, React.ReactNode][] = [
  [
    "Where do the posts come from?",
    "The app starts with a demo corpus of 28 anonymised Instagram posts. You can import your own posts from a Business or Creator account through the official Instagram API on the My corpus page.",
  ],
  [
    "What do the highlights on captions mean?",
    <>
      Each mark is an entity the pipeline recognised: <span className="mark-tech">technology</span>{" "}
      gets a solid highlight, <span className="mark-location">locations</span> a wavy underline,{" "}
      <span className="mark-org">organisations</span> an outline box and{" "}
      <span className="mark-domain">domains</span> a dotted underline.
    </>,
  ],
  [
    "How are the answers kept honest?",
    "The model only sees retrieved posts from your corpus and must cite the post behind every claim. Each citation opens the supporting post in the evidence panel, and when the corpus does not contain the answer, the model says so.",
  ],
  [
    "Do I need an account to use it?",
    "No. Every page is open. Signing in is only used when you connect an external AI assistant through the app's data interface.",
  ],
  [
    "What can the numbers not tell me?",
    "True reach and impressions are shared by Instagram only with the account owner. The app works with public engagement — likes, comments, saves and shares — and says so rather than guessing.",
  ],
];

function Faq() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <h2 className="text-[18px] font-semibold text-foreground">Questions people ask</h2>
        <div className="faq mt-6 max-w-[70ch]">
          {FAQS.map(([q, a]) => (
            <details key={q} name="faq" className="border-b border-line">
              <summary className="flex items-center justify-between gap-4 py-3.5 text-[15px] font-medium text-foreground">
                {q}
              </summary>
              <p className="quote pb-4 text-[15px] text-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingBand() {
  return (
    <section className="bg-ink">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-16 sm:px-8">
        <h2 className="text-[32px] font-semibold tracking-tight text-specimen">
          Ask your first question.
        </h2>
        <Link
          to="/dashboard"
          className="inline-flex h-11 items-center rounded-lg bg-highlight px-5 text-sm font-semibold text-ink transition-colors duration-150 hover:brightness-95"
        >
          Open the workbench
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  const link = "text-[13px] text-muted underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline";
  return (
    <footer className="bg-page">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/ask" className={link}>
            Ask
          </Link>
          <Link to="/dashboard" className={link}>
            Overview
          </Link>
          <Link to="/network" className={link}>
            Network
          </Link>
          <Link to="/corpus" className={link}>
            Corpus
          </Link>
          <Link to="/my-corpus" className={link}>
            My corpus
          </Link>
          <Link to="/architecture" className={link}>
            How it works
          </Link>
        </nav>
        <p className="mt-4 text-[13px] text-muted">
          © 2026 Aura Insight · Instagram metadata, answered
        </p>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Faq />
        <ClosingBand />
      </main>
      <Footer />
    </div>
  );
}
