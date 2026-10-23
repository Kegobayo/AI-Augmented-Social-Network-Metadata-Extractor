/**
 * My corpus — link an Instagram Business/Creator account, import posts and
 * manage the shared, long-term corpus.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { Shell, Stat } from "@/components/shell";
import { SentimentValue } from "@/components/marks";
import { useCorpusState } from "@/lib/corpus-context";
import {
  connectInstagram,
  getConnection,
  removeSavedPost,
  syncInstagram,
  unlinkInstagram,
} from "@/lib/instagram-graph.functions";

export const Route = createFileRoute("/my-corpus")({
  head: () => ({
    meta: [
      { title: "My corpus | Aura Insight" },
      {
        name: "description",
        content: "Link your Instagram account, import posts and manage the shared knowledge corpus.",
      },
      { property: "og:title", content: "My corpus | Aura Insight" },
      { property: "og:description", content: "Import posts and manage the shared Instagram metadata corpus." },
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

  const inputClass =
    "rounded-lg border border-input bg-specimen px-3 text-sm text-foreground outline-none placeholder:text-muted";

  return (
    <Shell
      title="My corpus"
      subtitle="The shared corpus, open to everyone. Saved posts power the overview, corpus browser, network map and queries."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={saved.length} label="Saved posts" />
        <Stat value={corpus.isDemo ? 0 : corpus.AUTHORS.length} label="Accounts" />
        <Stat value={corpus.isDemo ? 0 : corpus.EDGES.length} label="Mention ties" />
        <Stat value={corpus.isDemo ? 0 : corpus.HASHTAG_STATS.length} label="Hashtags" />
      </div>

      <section className="mt-10 border-t border-line pt-8">
        <h3 className="text-[18px] font-semibold text-foreground">Instagram account</h3>
        <p className="label mt-1">Official Instagram API — the token is stored on the server and never shown again.</p>
        <div className="mt-4 specimen-panel p-5">
          {conn ? (
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-sm text-foreground">
                Linked to <span className="font-semibold">@{conn.username}</span>
                {conn.followers != null ? ` · ${conn.followers.toLocaleString()} followers` : ""}
              </p>
              <button
                onClick={doSync}
                disabled={busy === "sync"}
                className="inline-flex h-10 items-center rounded-lg bg-highlight px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:brightness-95 disabled:opacity-60"
              >
                {busy === "sync" ? "Importing…" : "Import latest 25 posts"}
              </button>
              <button
                onClick={disconnect}
                className="text-[13px] text-muted underline underline-offset-4 transition-colors duration-150 hover:text-foreground"
              >
                Unlink
              </button>
            </div>
          ) : (
            <form onSubmit={doConnect} className="space-y-3">
              <p className="max-w-[65ch] text-sm text-muted">
                Paste an Instagram access token for your Business or Creator account (from your Meta
                developer app, “Instagram API with Instagram Login”).
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="password"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="IGAA…"
                  className={`h-10 flex-1 ${inputClass}`}
                />
                <button
                  disabled={busy === "connect"}
                  className="inline-flex h-10 items-center rounded-lg bg-ink px-4 text-sm font-medium text-specimen transition-colors duration-150 hover:bg-ink/90 disabled:opacity-60"
                >
                  {busy === "connect" ? "Checking…" : "Link account"}
                </button>
              </div>
            </form>
          )}
          {msg ? <p className="mt-3 text-sm text-foreground">{msg}</p> : null}
        </div>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[18px] font-semibold text-foreground">Saved posts</h3>
          <span className="label">{saved.length} records</span>
        </div>
        <div className="mt-4">
          {saved.length === 0 ? (
            <p className="quote text-muted">
              Nothing saved yet. Import from your Instagram account above, or analyse a post link from
              the top bar and save it. Until then the app shows the demo corpus.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Account</th>
                  <th className="py-2 font-medium">Caption</th>
                  <th className="py-2 text-right font-medium">Likes</th>
                  <th className="py-2 text-right font-medium">Reach</th>
                  <th className="py-2 text-right font-medium">Mood</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {saved.map((p) => (
                  <tr key={p.id} className="border-b border-line align-top last:border-0">
                    <td className="py-2 text-muted">{p.posted_at.slice(0, 10)}</td>
                    <td className="py-2 text-foreground">{p.author}</td>
                    <td className="max-w-md py-2 text-muted">
                      {p.permalink ? (
                        <a
                          href={p.permalink}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-foreground"
                        >
                          {p.caption.slice(0, 120) || "(no caption)"}
                        </a>
                      ) : (
                        p.caption.slice(0, 120)
                      )}
                    </td>
                    <td className="py-2 text-right text-muted">{p.likes.toLocaleString()}</td>
                    <td className="py-2 text-right text-muted">{p.reach?.toLocaleString() ?? "—"}</td>
                    <td className="py-2 text-right">
                      <SentimentValue value={p.sentiment ?? 0} />
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => remove(p.id)}
                        className="text-[13px] text-negative underline underline-offset-4"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </Shell>
  );
}
