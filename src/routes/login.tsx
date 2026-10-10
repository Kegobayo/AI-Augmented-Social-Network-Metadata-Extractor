import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Shell } from "@/components/shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { oauthReturnPath } from "@/lib/oauth-return-path";

/** Sign-in used only when connecting an AI assistant. The app itself stays open. */
export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ next: oauthReturnPath(s.next) }),
  head: () => ({
    meta: [
      { title: "Connect an assistant | Aura Insight" },
      { name: "description", content: "Sign in to let an AI assistant use Aura Insight's knowledge tools." },
      { property: "og:title", content: "Connect an assistant | Aura Insight" },
      { property: "og:description", content: "Sign in to connect an AI assistant to Aura Insight." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = next;
    });
  }, [next]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else window.location.href = next;
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: new URL(next, window.location.origin).href },
      });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Check your inbox to confirm your email; the link brings you back here.");
      else window.location.href = next;
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: new URL(`/login?next=${encodeURIComponent(next)}`, window.location.origin).href,
    });
    if (r.error) setMsg(r.error.message ?? "Google sign-in failed.");
    else if (!r.redirected) window.location.href = next;
  }

  const input =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <Shell title="Connect an AI assistant" subtitle="Sign in so the assistant can use Aura Insight's tools on your behalf.">
      <div className="paper-panel mx-auto max-w-sm space-y-4 p-6">
        <button
          onClick={google}
          className="w-full rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Continue with Google
        </button>
        <div className="label-caps text-center">or</div>
        <form onSubmit={submit} className="space-y-3">
          <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={busy} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
          </button>
        </form>
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-xs text-primary underline underline-offset-4">
          {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
        <button onClick={() => void navigate({ to: "/" })} className="block text-xs text-muted-foreground underline underline-offset-4">
          Back to the dashboard
        </button>
      </div>
    </Shell>
  );
}
