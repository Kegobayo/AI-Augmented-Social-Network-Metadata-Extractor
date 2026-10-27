/**
 * One-line explanations for every metric shown in the app.
 * Kept in one place so the same metric reads the same everywhere.
 * Wording must stay in step with the formulas in src/lib/enrichment.ts.
 */
export const METRIC_HELP = {
  posts: "Posts in the corpus after the current import and date filter are applied.",
  accounts: "Unique Instagram accounts that authored those posts.",
  ties: "Links between accounts — one for every time an account mentions or replies to another.",
  hashtags: "Unique hashtags across the corpus. Repeated uses of the same tag count once.",
  entities:
    "Distinct people, places, organisations and products the AI recognised in captions and comments.",
  interactions: "Likes, comments, saves and shares added together.",
  engagementRate:
    "(Likes + Comments + Saves + Shares) ÷ Followers × 100. Capped at 100% so a post that reached beyond its own followers still reads cleanly.",
  saveRatio:
    "Saves ÷ Likes × 100 — how many people who liked the post also saved it. A high value points to reference value rather than plain approval.",
  amplification:
    "Shares ÷ Likes × 100 — how many people who liked the post also passed it on.",
  graphCentrality:
    "How central an account is in the mention graph: its in-ties, follower count and cumulative engagement combined.",
  inTies: "Number of times this account was mentioned or replied to by others in the dataset.",
  outTies: "Number of times this account mentioned or replied to others in the dataset.",
  influence:
    "in-ties × 8 + log10(followers) × 6 + log10(total engagement) × 5. A relative ranking score, not a count of anything.",
  community:
    "Cluster assigned by label propagation: accounts that mention each other tend to settle in the same group.",
  accountSentiment: "Mean polarity of this account's posts, from -1 (negative) to +1 (positive).",
  sentiment: "Mean polarity of the posts shown, from -1 (negative) to +1 (positive).",
  coOccurrences: "Posts in which both hashtags appear together.",
  strength: "Bar length relative to the strongest tag pair in this table.",
  hashtagReach: "Likes + shares from the posts carrying this hashtag.",
  reach:
    "Impressions Instagram reports for the post. Only available for posts imported from your own account — the API shares them with nobody else, so analysed links show a dash.",
  topicConfidence:
    "The model's confidence, from 0 to 1, that this post belongs to the topic shown beside it.",
  namedEntities:
    "People, places, organisations and products recognised in the caption and comment sample.",
  vectorIndex:
    "A 96-dimension hashed bag-of-words embedding of the post, used to compare posts by meaning rather than by keyword.",
  retrievalK:
    "How many posts are pulled as evidence before the answer is written. Six keeps the answer grounded without burying it.",
  similarity:
    "How close this post is to your question, from text meaning plus a small boost for influential authors and matching hashtags.",
  graphBoost:
    "The part of the score added by author influence and hashtags your question also used.",
  mentionTies:
    "Links between accounts in your saved posts — one for every @mention one account makes of another.",
} as const;

export type MetricHelpKey = keyof typeof METRIC_HELP;
