import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { Panel, Shell, SentimentPill, Stat } from "@/components/shell";
import { useCorpusState } from "@/lib/corpus-context";
import { connectInstagram, getConnection, removeSavedPost, syncInstagram, unlinkInstagram } from "@/lib/instagram-graph.functions";

export const Route = createFileRoute("/my-corpus")({
  head: () => ({
    meta: [
      { title: "My corpus | Social Network Metadata Extractor" },
      { name: "description", content: "Link your Instagram account, import posts and manage your long-term knowledge corpus." },
      { property: "og:title", content: "My corpus | Metadata Extractor" },
      { property: "og:description", content: "The shared Instagram metadata corpus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyCorpus,
});

type Conn = { username: string | null; followers: number | null; updated_at: string } | null;

function MyCorpus() {
  const { saved, refresh, corpus } = useCorpusState();
  const connect = useServerFn(connectInstagram);
  const sync = useServerFn(syncInstagram);
  const fetchConn = useServerFn(getConnection);
  const unlink = useServerFn(unlinkInstagram);
  const del = useServerFn(removeSavedPost);
  const [conn, setConn] = useState<Conn>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadConn() {
    setConn(await fetchConn());
  }
  useEffect(() => {
    void loadConn();
  }, []);

  async function doConnect(e: React.FormEvent) {
    e.preventDefault();
    setBusy("connect");
    setMsg(null);
    try {
      const r = await connect({ data: { token } });
      if (r.ok) {
        setToken("");
        setMsg(`Linked @${r.username}. Now import your posts.`);
        await loadConn();
      } else setMsg(r.error);
    } catch (err) {
      setMsg((err as Error).message);
    }
    setBusy(null);
  }

  async function doSync() {
    setBusy("sync");
    setMsg(null);
    try {
      const r = await sync({ data: { limit: 25 } });
      setMsg(r.ok ? `Imported ${r.imported} posts into your corpus.` : r.error);
      await refresh();
    } catch (err) {
      setMsg((err as Error).message);
    }
    setBusy(null);
  }

  async function disconnect() {
    await unlink();
    setConn(null);
  }

  async function remove(id: string) {
    await del({ data: { id } });
    await refresh();
  }

  return (
    <Shell title="My corpus" subtitle={`Shared corpus, open to everyone. Saved posts power the dashboard, corpus browser, network map and queries.`}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value={saved.length} label="Saved posts" />
        <Stat value={corpus.isDemo ? 0 : corpus.AUTHORS.length} label="Accounts" />
        <Stat value={corpus.isDemo ? 0 : corpus.EDGES.length} label="Mention ties" />
        <Stat value={corpus.isDemo ? 0 : corpus.HASHTAG_STATS.length} label="Hashtags" />
      </div>

      <Panel className="mt-6" title="Instagram account" hint="Official Instagram API">
        {conn ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-foreground">
              Linked to <span className="font-mono">@{conn.username}</span>
              {conn.followers != null ? ` · ${conn.followers.toLocaleString()} followers` : ""}
            </p>
            <button
              onClick={doSync}
              disabled={busy === "sync"}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {busy === "sync" ? "Importing…" : "Import latest 25 posts"}
            </button>
            <button onClick={disconnect} className="text-xs text-muted-foreground underline underline-offset-4">
              Unlink
            </button>
          </div>
        ) : (
          <form onSubmit={doConnect} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste an Instagram access token for your Business or Creator account (from your Meta developer app, “Instagram API with
              Instagram Login”). It is stored securely on the server and never shown in the browser again.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="IGAA…"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                disabled={busy === "connect"}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                {busy === "connect" ? "Checking…" : "Link account"}
              </button>
            </div>
          </form>
        )}
        {msg ? <p className="mt-3 text-sm text-foreground">{msg}</p> : null}
      </Panel>

      <Panel className="mt-5" title="Saved posts" hint={`${saved.length} records`}>
        {saved.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing saved yet. Import from your Instagram account above, or analyse a post link on the dashboard and save it. Until then the
            app shows the demo corpus.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="label-caps pb-2">Date</th>
                <th className="label-caps pb-2">Account</th>
                <th className="label-caps pb-2">Caption</th>
                <th className="label-caps pb-2 text-right">Likes</th>
                <th className="label-caps pb-2 text-right">Reach</th>
                <th className="label-caps pb-2 text-right">Sentiment</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {saved.map((p) => (
                <tr key={p.id} className="border-b border-rule/60 last:border-0 align-top">
                  <td className="py-2 font-mono text-xs">{p.posted_at.slice(0, 10)}</td>
                  <td className="py-2 font-mono text-xs">{p.author}</td>
                  <td className="max-w-md py-2 text-xs text-muted-foreground">
                    {p.permalink ? (
                      <a href={p.permalink} target="_blank" rel="noreferrer" className="hover:text-foreground">
                        {p.caption.slice(0, 120) || "(no caption)"}
                      </a>
                    ) : (
                      p.caption.slice(0, 120)
                    )}
                  </td>
                  <td className="py-2 text-right font-mono text-xs">{p.likes.toLocaleString()}</td>
                  <td className="py-2 text-right font-mono text-xs">{p.reach?.toLocaleString() ?? "—"}</td>
                  <td className="py-2 text-right">
                    <SentimentPill value={p.sentiment ?? 0} />
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => remove(p.id)} className="text-xs text-negative underline underline-offset-4">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </Shell>
  );
}
