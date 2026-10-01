import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Shell } from "@/components/shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useCorpusState } from "@/lib/corpus-context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | Social Network Metadata Extractor" },
      { name: "description", content: "Sign in to build your private Instagram metadata corpus and knowledge graph." },
      { property: "og:title", content: "Sign in | Metadata Extractor" },
      { property: "og:description", content: "Access your private knowledge corpus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useCorpusState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/my-corpus" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/my-corpus" },
      });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Check your inbox to confirm your email, then sign in.");
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) setMsg(r.error.message ?? "Google sign-in failed.");
  }

  const input =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <Shell title={mode === "in" ? "Sign in" : "Create an account"} subtitle="Your saved corpus is private to your account.">
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
          <input
            className={input}
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button disabled={busy} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
          </button>
        </form>
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-xs text-primary underline underline-offset-4">
          {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </Shell>
  );
}
