import { Link, useRouterState } from "@tanstack/react-router";
import {
  Database,
  FolderOpen,
  Info,
  LayoutDashboard,
  Moon,
  Share2,
  Sparkles,
  Sun,
  Upload,
} from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { MetricLabel } from "@/components/metric-hint";
import { useCorpusState } from "@/lib/corpus-context";

const NAV = [
  {
    group: "Explore",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard },
      { to: "/ask", label: "Ask your data", icon: Sparkles },
      { to: "/network", label: "Network", icon: Share2 },
      { to: "/corpus", label: "Corpus", icon: Database },
    ],
  },
  {
    group: "Workspace",
    items: [{ to: "/my-corpus", label: "My corpus", icon: FolderOpen }],
  },
  {
    group: "About",
    items: [{ to: "/architecture", label: "How it works", icon: Info }],
  },
] as const;

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  return (
    <button
      type="button"
      aria-label="Toggle light and dark mode"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        try {
          localStorage.setItem("theme", next ? "dark" : "light");
        } catch {
          /* private mode */
        }
      }}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                Aura Insight
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Instagram metadata, answered
              </span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((section) => (
          <SidebarGroup key={section.group}>
            <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active =
                    item.to === "/" ? currentPath === "/" : currentPath.startsWith(item.to);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className="data-[active=true]:bg-primary-subtle data-[active=true]:font-medium data-[active=true]:text-primary"
                      >
                        <Link to={item.to}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

function TopBar({ title }: { title: string }) {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const { source, setSource, days, setDays, saved } = useCorpusState();
  const section = NAV.find((g) =>
    g.items.some((i) => (i.to === "/" ? currentPath === "/" : currentPath.startsWith(i.to))),
  );
  const hasSaved = saved.length > 0;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
      <SidebarTrigger className="shrink-0" />
      <div className="min-w-0">
        <p className="label-caps hidden sm:block">{section?.group ?? "Explore"}</p>
        <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <select
          aria-label="Corpus"
          value={source === "demo" || !hasSaved ? "demo" : "saved"}
          onChange={(e) => setSource(e.target.value === "demo" ? "demo" : "saved")}
          className="hidden h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-ring md:block"
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
          className="hidden h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-ring lg:block"
        >
          <option value="all">All time</option>
          <option value="30">Last 30 days</option>
          <option value="7">Last 7 days</option>
        </select>
        <ThemeToggle />
        <Link
          to="/my-corpus"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Import posts</span>
        </Link>
      </div>
    </header>
  );
}

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
    <SidebarProvider style={{ "--sidebar-width": "260px" } as CSSProperties}>
      <AppSidebar />
      <SidebarInset>
        <TopBar title={title} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1200px] animate-fade-up">
            <h2 className="text-[28px] font-bold tracking-tight text-foreground">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function Panel({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`paper-panel p-6 ${className}`}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {hint ? <span className="label-caps">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function Stat({
  value,
  label,
  hint,
}: {
  value: string | number;
  label: string;
  hint?: string;
}) {
  return (
    <div className="paper-panel px-5 py-4">
      <div className="text-[28px] font-bold leading-8 tracking-tight text-foreground [font-variant-numeric:tabular-nums]">
        {value}
      </div>
      <div className="label-caps mt-1.5">
        {hint ? <MetricLabel label={label} text={hint} side="bottom" /> : label}
      </div>
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
