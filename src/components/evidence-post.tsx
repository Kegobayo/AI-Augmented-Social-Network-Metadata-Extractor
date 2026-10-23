/**
 * EvidencePost — one source post as it appears in the evidence rail:
 * account, date, caption in Literata with entity marks, hashtags and
 * engagement. Also reused as the hero sample on the landing page.
 */
import { MarkedText, SentimentValue } from "@/components/marks";
import type { EnrichedPost } from "@/lib/enrichment";

export function EvidencePost({
  post,
  focused = false,
  score,
}: {
  post: EnrichedPost;
  focused?: boolean;
  score?: number;
}) {
  return (
    <article
      id={`ev-${post.id}`}
      className={`border-b border-line py-4 last:border-0 ${focused ? "evidence-flash rounded-sm" : ""}`}
    >
      <header className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{post.author}</span>
        <span className="label shrink-0">
          {new Date(post.timestamp).toLocaleDateString("en", { day: "numeric", month: "short" })}
          {score != null ? ` · match ${score.toFixed(2)}` : ""}
        </span>
      </header>
      <p className="quote mt-2 text-[15px]">
        <MarkedText text={post.caption} entities={post.entities} hashtags={post.hashtags} />
      </p>
      {post.hashtags.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[13px] text-muted">
          {post.hashtags.map((h) => (
            <span key={h} className="hashtag">
              {h}
            </span>
          ))}
        </p>
      )}
      <footer className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
        <span>
          {post.likes.toLocaleString()} likes · {post.comments} comments · {post.saves} saves ·{" "}
          {post.shares} shares
        </span>
        <SentimentValue value={post.sentiment} />
        <span className="truncate">{post.topic.label}</span>
      </footer>
    </article>
  );
}
