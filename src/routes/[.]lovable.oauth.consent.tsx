import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthResult = { data: { redirect_url?: string; redirect_to?: string; client?: { name?: string } } | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // SSR has no localStorage session and would redirect signed-in users.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("This link is missing its authorization request. Start the connection again from your assistant.");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/login", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  head: () => ({
    meta: [
      { title: "Approve assistant access | Aura Insight" },
      { name: "description", content: "Approve or deny an AI assistant's access to Aura Insight." },
      { property: "og:title", content: "Approve assistant access | Aura Insight" },
      { property: "og:description", content: "Approve or deny an AI assistant's access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="paper-panel p-6">
        <h1 className="text-lg font-semibold text-foreground">Could not load this request</h1>
        <p className="mt-2 text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
        <p className="mt-2 text-sm text-muted-foreground">It may have expired. Start the connection again from your assistant.</p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = details?.client?.name ?? "An AI assistant";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = approve
        ? await oauth().approveAuthorization(authorization_id)
        : await oauth().denyAuthorization(authorization_id);
      if (error) throw new Error(error.message);
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) throw new Error("No redirect returned by the authorization server.");
      window.location.href = target;
    } catch (e) {
      setBusy(false);
      setError((e as Error).message);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="paper-panel space-y-4 p-6">
        <p className="label-caps">Aura Insight</p>
        <h1 className="text-xl font-semibold text-foreground">Connect {name}</h1>
        <p className="text-sm text-muted-foreground">
          {name} wants to use Aura Insight as you: search the shared post corpus, read the topic overview and analyse captions. It
          cannot change or delete anything.
        </p>
        {error ? <p role="alert" className="text-sm text-negative">{error}</p> : null}
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            Approve
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60"
          >
            Deny
          </button>
        </div>
      </div>
    </main>
  );
}
