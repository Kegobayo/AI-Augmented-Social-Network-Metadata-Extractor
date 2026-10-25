/**
 * Layer 2 — AI-Augmented Metadata Extraction & Enrichment.
 *
 * Deterministic, in-browser surrogates for the pipeline described in the
 * methodology chapter: NER (spaCy), topic modelling (BERTopic), sentiment and
 * emotion scoring (RoBERTa) and network graph mapping. Running them locally
 * keeps the corpus reproducible for evaluation; the generative layer (RAG) is
 * the only component that calls a live language model.
 */

import { RAW_POSTS, FOLLOW_EDGES, type RawPost } from "@/data/corpus";

/* ------------------------------------------------------------------ text */

const STOPWORDS = new Set(
  `a an and are as at be been but by for from had has have he her his i if in into is it its of on or our she that the their them then there these they this to was we were what when where which who will with you your not no now only over after before more most some such than too very can cannot do does did done just also about above below up down out off again further once here why how all any both each few other same so`.split(
    /\s+/,
  ),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9₦%\s.-]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ""))
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/* ------------------------------------------------------------ NER module */

export type Entity = { text: string; type: EntityType };
export type EntityType = "LOCATION" | "ORGANISATION" | "TECHNOLOGY" | "DOMAIN" | "METRIC" | "MONEY";

const GAZETTEER: Record<string, EntityType> = {
  lagos: "LOCATION",
  ikeja: "LOCATION",
  surulere: "LOCATION",
  yaba: "LOCATION",
  akoka: "LOCATION",
  abuja: "LOCATION",
  kano: "LOCATION",
  kaduna: "LOCATION",
  enugu: "LOCATION",
  ibadan: "LOCATION",
  oyo: "LOCATION",
  osun: "LOCATION",
  borno: "LOCATION",
  jos: "LOCATION",
  sokoto: "LOCATION",
  nigeria: "LOCATION",
  nigerian: "LOCATION",
  unilag: "ORGANISATION",
  brightpath: "ORGANISATION",
  agrotech: "ORGANISATION",
  commission: "ORGANISATION",
  university: "ORGANISATION",
  universities: "ORGANISATION",
  clinic: "ORGANISATION",
  clinics: "ORGANISATION",
  solar: "TECHNOLOGY",
  inverter: "TECHNOLOGY",
  battery: "TECHNOLOGY",
  batteries: "TECHNOLOGY",
  lithium: "TECHNOLOGY",
  "mini-grid": "TECHNOLOGY",
  minigrid: "TECHNOLOGY",
  grid: "TECHNOLOGY",
  meter: "TECHNOLOGY",
  metering: "TECHNOLOGY",
  sensors: "TECHNOLOGY",
  sms: "TECHNOLOGY",
  embeddings: "TECHNOLOGY",
  retrieval: "TECHNOLOGY",
  database: "TECHNOLOGY",
  metadata: "TECHNOLOGY",
  generator: "TECHNOLOGY",
  generators: "TECHNOLOGY",
  diesel: "TECHNOLOGY",
  energy: "DOMAIN",
  electricity: "DOMAIN",
  health: "DOMAIN",
  healthcare: "DOMAIN",
  malaria: "DOMAIN",
  vaccine: "DOMAIN",
  education: "DOMAIN",
  agriculture: "DOMAIN",
  farmers: "DOMAIN",
  tomato: "DOMAIN",
  tomatoes: "DOMAIN",
  irrigation: "DOMAIN",
  tariff: "DOMAIN",
  policy: "DOMAIN",
  knowledge: "DOMAIN",
};

export function extractEntities(text: string): Entity[] {
  const found = new Map<string, Entity>();
  for (const token of tokenize(text)) {
    const type = GAZETTEER[token];
    if (type) found.set(token, { text: token, type });
  }
  for (const m of text.match(/\d+(\.\d+)?\s?(percent|%|kva|hours|homes|students|clinics)/gi) ?? []) {
    found.set(m.toLowerCase(), { text: m.trim(), type: "METRIC" });
  }
  for (const m of text.match(/₦[\d,]+/g) ?? []) {
    found.set(m, { text: m, type: "MONEY" });
  }
  return [...found.values()];
}

/* -------------------------------------------------------- topic modelling */

export type Topic = { id: string; label: string; keywords: string[]; colorVar: string };

/**
 * Topic taxonomy — the five research themes plus currently trending Instagram
 * themes. Matching runs on caption tokens and hashtags (including compound
 * hashtags such as #solarpower or #aiart, matched by keyword stems).
 */
export const TOPICS: Topic[] = [
  { id: "t1", label: "Renewable energy & off-grid supply", colorVar: "var(--chart-1)",
    keywords: ["solar", "solarenergy", "renewableenergy", "renewable", "inverter", "battery", "lithium", "offgrid", "cleantech", "diesel", "minigrid", "cleanenergy", "greenenergy"] },
  { id: "t2", label: "Grid reliability & energy policy", colorVar: "var(--chart-2)",
    keywords: ["grid", "nationalgrid", "blackout", "powersector", "tariff", "metering", "meter", "consumerrights", "energyaccess", "electricity", "nepa", "fuelsubsidy", "petrol"] },
  { id: "t3", label: "Food security & agritech", colorVar: "var(--chart-3)",
    keywords: ["agritech", "coldchain", "foodsecurity", "farmers", "farming", "agriculture", "tomato", "tomatoes", "harvest", "drought", "irrigation", "yield", "agribusiness"] },
  { id: "t4", label: "Public health & wellness", colorVar: "var(--chart-4)",
    keywords: ["healthcare", "publichealth", "malaria", "vaccine", "clinics", "health", "mentalhealth", "wellness", "selfcare", "hospital", "doctor", "nutrition", "therapy"] },
  { id: "t5", label: "Education, data & knowledge management", colorVar: "var(--chart-5)",
    keywords: ["education", "knowledgemanagement", "metadata", "research", "datascience", "digitalliteracy", "skills", "opendata", "seminar", "tacitknowledge", "socialnetworkanalysis", "students", "university", "learning", "scholarship"] },
  { id: "t6", label: "AI & technology", colorVar: "var(--chart-6)",
    keywords: ["ai", "artificialintelligence", "generativeai", "chatgpt", "openai", "machinelearning", "tech", "technology", "coding", "developer", "startup", "software", "gadget", "iphone", "robotics", "aiart", "rag"] },
  { id: "t7", label: "Business, finance & entrepreneurship", colorVar: "var(--chart-7)",
    keywords: ["business", "entrepreneur", "entrepreneurship", "smallbusiness", "finance", "money", "investing", "crypto", "bitcoin", "fintech", "sales", "marketing", "branding", "naira", "economy", "hustle", "sidehustle"] },
  { id: "t8", label: "Fashion & beauty", colorVar: "var(--chart-8)",
    keywords: ["fashion", "style", "ootd", "outfit", "beauty", "makeup", "skincare", "hair", "streetwear", "model", "asoebi", "luxury", "nails"] },
  { id: "t9", label: "Entertainment, music & culture", colorVar: "var(--chart-9)",
    keywords: ["music", "afrobeats", "nollywood", "movie", "film", "concert", "celebrity", "comedy", "skit", "dance", "art", "artist", "bbnaija", "netflix", "meme", "viral"] },
  { id: "t10", label: "Sports & fitness", colorVar: "var(--chart-10)",
    keywords: ["football", "soccer", "sports", "fitness", "gym", "workout", "superfalcons", "supereagles", "premierleague", "basketball", "athlete", "running", "afcon"] },
  { id: "t11", label: "Travel, food & lifestyle", colorVar: "var(--chart-11)",
    keywords: ["travel", "wanderlust", "vacation", "food", "foodie", "recipe", "restaurant", "lifestyle", "home", "interior", "family", "wedding", "photography", "nature"] },
  { id: "t12", label: "Climate & environment", colorVar: "var(--chart-12)",
    keywords: ["climate", "climatechange", "climateaction", "sustainability", "sustainable", "environment", "flood", "recycling", "plastic", "pollution", "netzero", "ecofriendly"] },
  { id: "t13", label: "Politics, governance & social causes", colorVar: "var(--chart-13)",
    keywords: ["politics", "election", "government", "policy", "governance", "protest", "endsars", "activism", "humanrights", "democracy", "corruption", "community", "charity", "ngo"] },
  { id: "t14", label: "General & emerging", colorVar: "var(--chart-14)", keywords: [] },
];

const FALLBACK = TOPICS[TOPICS.length - 1]!;

/** Classify text into a topic; returns the matched terms as evidence. */
export function classifyTopic(tokens: string[], hashtags: string[]) {
  const tags = hashtags.map((h) => h.replace("#", "").toLowerCase());
  let best = FALLBACK;
  let bestScore = 0;
  let bestTerms: string[] = [];
  for (const topic of TOPICS) {
    if (!topic.keywords.length) continue;
    const terms = new Set<string>();
    let score = 0;
    for (const t of tokens) if (topic.keywords.includes(t)) { score += 1; terms.add(t); }
    for (const h of tags) {
      // Hashtags weigh double; compound tags match by keyword stem (min 4 chars).
      const hit = topic.keywords.find((k) => h === k || (k.length >= 4 && h.includes(k)));
      if (hit) { score += 2; terms.add(`#${h}`); }
    }
    if (score > bestScore) {
      bestScore = score;
      best = topic;
      bestTerms = [...terms];
    }
  }
  const confidence = bestScore ? Math.min(0.97, 0.45 + bestScore * 0.08) : 0.3;
  return { topic: best, confidence, terms: bestTerms };
}

/* ------------------------------------------------- sentiment and emotion */

const POSITIVE = `proud cheaper clear excellent good great happy impressive improve improved lovely progress reached reduced solid success wonderful works working zero-loss beautiful solvable higher fell dropped won saved best love`.split(/\s+/);
const NEGATIVE = `collapsed slow blackout lost frustrating frustration expensive worrying severe drought risk complaint robbery exhausting terrible waste failure delays spoilage problem barrier bottleneck trails poor mistakes stress`.split(/\s+/);

export type Emotion = "trust" | "concern" | "optimism" | "frustration" | "neutral";

function scoreSentiment(text: string) {
  const tokens = tokenize(text);
  let pos = 0;
  let neg = 0;
  for (const t of tokens) {
    if (POSITIVE.includes(t)) pos++;
    if (NEGATIVE.includes(t)) neg++;
  }
  const raw = (pos - neg) / Math.max(4, pos + neg + 3);
  const polarity = Math.max(-1, Math.min(1, Number(raw.toFixed(3))));
  const label = polarity > 0.08 ? "positive" : polarity < -0.08 ? "negative" : "neutral";
  let emotion: Emotion = "neutral";
  if (polarity > 0.25) emotion = "optimism";
  else if (polarity > 0.08) emotion = "trust";
  else if (polarity < -0.25) emotion = "frustration";
  else if (polarity < -0.08) emotion = "concern";
  return { polarity, label: label as "positive" | "negative" | "neutral", emotion };
}

/* -------------------------------------------------------------- embedding */

const DIM = 96;

/** Hashed bag-of-words embedding — a deterministic stand-in for a sentence encoder. */
export function embed(text: string): number[] {
  const vec = new Array(DIM).fill(0);
  for (const token of tokenize(text)) {
    let h = 2166136261;
    for (let i = 0; i < token.length; i++) {
      h ^= token.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    vec[Math.abs(h) % DIM] += 1;
  }
  const norm = Math.hypot(...vec) || 1;
  return vec.map((v) => v / norm);
}

export function cosine(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
}

/* ------------------------------------------------------- enriched records */

export type EnrichedPost = RawPost & {
  tokens: string[];
  entities: Entity[];
  topic: Topic;
  topicConfidence: number;
  sentiment: number;
  sentimentLabel: "positive" | "negative" | "neutral";
  emotion: Emotion;
  engagementRate: number;
  saveRatio: number;
  amplification: number;
  embedding: number[];
  chunk: string;
};

function enrich(post: RawPost): EnrichedPost {
  const fullText = `${post.caption} ${post.hashtags.join(" ")} ${post.comments_sample.join(" ")}`;
  const tokens = tokenize(fullText);
  const { topic, confidence } = classifyTopic(tokens, post.hashtags);
  const { polarity, label, emotion } = scoreSentiment(`${post.caption} ${post.comments_sample.join(" ")}`);
  const interactions = post.likes + post.comments + post.saves + post.shares;
  return {
    ...post,
    tokens,
    entities: extractEntities(fullText),
    topic,
    topicConfidence: confidence,
    sentiment: polarity,
    sentimentLabel: label,
    emotion,
    engagementRate: Number(Math.min(100, (interactions / post.followers) * 100).toFixed(1)),
    saveRatio: Number(((post.saves / Math.max(1, post.likes)) * 100).toFixed(1)),
    amplification: Number(((post.shares / Math.max(1, post.likes)) * 100).toFixed(1)),
    embedding: embed(fullText),
    chunk: [
      `Post ${post.id} by ${post.author} (${post.authorCategory}, ${post.followers.toLocaleString()} followers)`,
      `Posted ${post.timestamp.slice(0, 10)} from ${post.location} as a ${post.mediaType}.`,
      `Caption: ${post.caption}`,
      `Hashtags: ${post.hashtags.join(" ")}`,
      `Engagement: ${post.likes} likes, ${post.comments} comments, ${post.saves} saves, ${post.shares} shares.`,
      `Topic: ${topic.label}. Sentiment: ${label} (${polarity}). Emotion: ${emotion}.`,
      `Representative comments: ${post.comments_sample.join(" | ")}`,
    ].join("\n"),
  };
}

export type AuthorNode = {
  id: string;
  category: RawPost["authorCategory"];
  followers: number;
  posts: number;
  inDegree: number;
  outDegree: number;
  influence: number;
  community: string;
  avgSentiment: number;
  dominantTopic: string;
};

function labelPropagation(nodes: string[], edges: [string, string][]) {
  const labels = new Map(nodes.map((n) => [n, n]));
  const neighbours = new Map<string, string[]>(nodes.map((n) => [n, []]));
  for (const [a, b] of edges) {
    neighbours.get(a)?.push(b);
    neighbours.get(b)?.push(a);
  }
  for (let iter = 0; iter < 12; iter++) {
    for (const n of nodes) {
      const counts = new Map<string, number>();
      for (const nb of neighbours.get(n) ?? []) {
        const l = labels.get(nb)!;
        counts.set(l, (counts.get(l) ?? 0) + 1);
      }
      let bestLabel = labels.get(n)!;
      let bestCount = 0;
      for (const [l, c] of [...counts.entries()].sort((x, y) => x[0].localeCompare(y[0]))) {
        if (c > bestCount) {
          bestCount = c;
          bestLabel = l;
        }
      }
      labels.set(n, bestLabel);
    }
  }
  return labels;
}

export type HashtagStat = { tag: string; count: number; reach: number };

export type CoOccurrence = { a: string; b: string; weight: number };

export type Retrieved = { post: EnrichedPost; score: number; graphBoost: number };

export type Corpus = ReturnType<typeof buildCorpus>;

export function buildCorpus(raw: RawPost[], edges: [string, string][], isDemo = false) {
  const ENRICHED: EnrichedPost[] = raw.map(enrich);

  /* ------------------------------------------------------- network analysis */



  const AUTHORS: AuthorNode[] = (() => {
    const ids = [...new Set([...ENRICHED.map((p) => p.author), ...edges.flat()])].sort();
    const labels = labelPropagation(ids, edges);
    const communityNames = new Map<string, string>();
    let idx = 0;
    const names = ["Energy transition cluster", "Knowledge & education cluster", "Livelihood & health cluster", "Peripheral cluster"];

    return ids.map((id) => {
      const posts = ENRICHED.filter((p) => p.author === id);
      const inDegree = edges.filter(([, b]) => b === id).length;
      const outDegree = edges.filter(([a]) => a === id).length;
      const followers = posts[0]?.followers ?? 1000;
      const totalEngagement = posts.reduce((s, p) => s + p.likes + p.comments + p.saves + p.shares, 0);
      const raw = labels.get(id)!;
      if (!communityNames.has(raw)) communityNames.set(raw, names[idx++ % names.length]!);
      const topicCounts = new Map<string, number>();
      for (const p of posts) topicCounts.set(p.topic.label, (topicCounts.get(p.topic.label) ?? 0) + 1);
      const dominantTopic = [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      return {
        id,
        category: posts[0]?.authorCategory ?? "citizen",
        followers,
        posts: posts.length,
        inDegree,
        outDegree,
        influence: Number(
          (
            inDegree * 8 +
            Math.log10(followers + 1) * 6 +
            Math.log10(totalEngagement + 1) * 5
          ).toFixed(1),
        ),
        community: communityNames.get(raw)!,
        avgSentiment: posts.length
          ? Number((posts.reduce((s, p) => s + p.sentiment, 0) / posts.length).toFixed(3))
          : 0,
        dominantTopic,
      };
    });
  })();

  /* ------------------------------------------------- hashtag co-occurrence */


  const HASHTAG_STATS: HashtagStat[] = (() => {
    const map = new Map<string, HashtagStat>();
    for (const p of ENRICHED) {
      for (const tag of p.hashtags) {
        const cur = map.get(tag) ?? { tag, count: 0, reach: 0 };
        cur.count++;
        cur.reach += p.likes + p.shares;
        map.set(tag, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  })();


  const CO_OCCURRENCE: CoOccurrence[] = (() => {
    const map = new Map<string, CoOccurrence>();
    for (const p of ENRICHED) {
      const tags = [...p.hashtags].sort();
      for (let i = 0; i < tags.length; i++) {
        for (let j = i + 1; j < tags.length; j++) {
          const key = `${tags[i]}|${tags[j]}`;
          const cur = map.get(key) ?? { a: tags[i]!, b: tags[j]!, weight: 0 };
          cur.weight++;
          map.set(key, cur);
        }
      }
    }
    return [...map.values()].filter((e) => e.weight > 1).sort((a, b) => b.weight - a.weight);
  })();

  /* ------------------------------------------------------ retrieval engine */


  /**
   * Layer 3 retrieval: semantic similarity over the vector index, boosted by
   * graph context (author influence and hashtag overlap with the query).
   */
  const IDF: Map<string, number> = (() => {
    const df = new Map<string, number>();
    for (const p of ENRICHED) {
      for (const t of new Set(p.tokens)) df.set(t, (df.get(t) ?? 0) + 1);
    }
    const idf = new Map<string, number>();
    for (const [t, n] of df) idf.set(t, Math.log(1 + ENRICHED.length / n));
    return idf;
  })();

  function tfidf(tokens: string[]) {
    const vec = new Map<string, number>();
    for (const t of tokens) vec.set(t, (vec.get(t) ?? 0) + (IDF.get(t) ?? Math.log(1 + ENRICHED.length)));
    const norm = Math.hypot(...vec.values()) || 1;
    for (const [t, v] of vec) vec.set(t, v / norm);
    return vec;
  }

  const POST_VECTORS = new Map(ENRICHED.map((p) => [p.id, tfidf(p.tokens)]));

  function sparseCosine(a: Map<string, number>, b: Map<string, number>) {
    let s = 0;
    for (const [t, v] of a) s += v * (b.get(t) ?? 0);
    return s;
  }

  function retrieve(query: string, k = 6): Retrieved[] {
    const qTokens = tokenize(query);
    const q = tfidf(qTokens);
    const qSet = new Set(qTokens);
    const maxInfluence = Math.max(1, ...AUTHORS.map((a) => a.influence));
    return ENRICHED.map((post) => {
      const semantic = sparseCosine(q, POST_VECTORS.get(post.id)!);
      const tagOverlap = post.hashtags.filter((h) => qSet.has(h.replace("#", ""))).length;
      const author = AUTHORS.find((a) => a.id === post.author);
      const graphBoost = Number(
        ((author ? author.influence / maxInfluence : 0) * 0.04 + tagOverlap * 0.05).toFixed(4),
      );
      return { post, score: Number((semantic + graphBoost).toFixed(4)), graphBoost };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }


  /* --------------------------------------------------------- corpus summary */

  const CORPUS_STATS = {
    posts: ENRICHED.length,
    authors: AUTHORS.length,
    hashtags: HASHTAG_STATS.length,
    entities: new Set(ENRICHED.flatMap((p) => p.entities.map((e) => e.text))).size,
    ties: edges.length,
    interactions: ENRICHED.reduce((s, p) => s + p.likes + p.comments + p.saves + p.shares, 0),
    avgSentiment: Number(
      (ENRICHED.reduce((s, p) => s + p.sentiment, 0) / Math.max(1, ENRICHED.length)).toFixed(3),
    ),
    span: {
      from: (ENRICHED.map((p) => p.timestamp).sort()[0] ?? "").slice(0, 10),
      to: (ENRICHED.map((p) => p.timestamp).sort().at(-1) ?? "").slice(0, 10),
    },
  };

  function topicDistribution() {
    return TOPICS.map((t) => {
      const posts = ENRICHED.filter((p) => p.topic.id === t.id);
      return {
        id: t.id,
        label: t.label,
        short: t.label.split(/[ ,&]/)[0],
        count: posts.length,
        colorVar: t.colorVar,
        sentiment: posts.length
          ? Number((posts.reduce((s, p) => s + p.sentiment, 0) / posts.length).toFixed(3))
          : 0,
        engagement: posts.reduce((s, p) => s + p.likes + p.comments + p.saves + p.shares, 0),
      };
    });
  }

  function sentimentTimeline() {
    const byWeek = new Map<string, { week: string; sentiment: number; n: number; posts: number }>();
    for (const p of [...ENRICHED].sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
      const d = new Date(p.timestamp);
      const week = `${d.toLocaleString("en", { month: "short" })} ${String(d.getDate()).padStart(2, "0")}`;
      const cur = byWeek.get(week) ?? { week, sentiment: 0, n: 0, posts: 0 };
      cur.sentiment += p.sentiment;
      cur.n++;
      cur.posts++;
      byWeek.set(week, cur);
    }
    return [...byWeek.values()].map((v) => ({
      week: v.week,
      sentiment: Number((v.sentiment / v.n).toFixed(3)),
      posts: v.posts,
    }));
  }

  function entityFrequency(limit = 14) {
    const map = new Map<string, { text: string; type: EntityType; count: number }>();
    for (const p of ENRICHED) {
      for (const e of p.entities) {
        const cur = map.get(e.text) ?? { text: e.text, type: e.type, count: 0 };
        cur.count++;
        map.set(e.text, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
  }


  return { isDemo, RAW: raw, EDGES: edges, ENRICHED, AUTHORS, HASHTAG_STATS, CO_OCCURRENCE, CORPUS_STATS, retrieve, topicDistribution, sentimentTimeline, entityFrequency };
}

export const DEMO_CORPUS = buildCorpus(RAW_POSTS, FOLLOW_EDGES, true);
export const { ENRICHED, AUTHORS, HASHTAG_STATS, CO_OCCURRENCE, CORPUS_STATS, retrieve, topicDistribution, sentimentTimeline, entityFrequency } = DEMO_CORPUS;

/** Enrich an arbitrary external caption (e.g. a pasted Instagram post). */
export function analyzeText(text: string, hashtags: string[] = []) {
  const tokens = tokenize(`${text} ${hashtags.join(" ")}`);
  const { topic, confidence, terms } = classifyTopic(tokens, hashtags);
  const s = scoreSentiment(text);
  return {
    topic: topic.label,
    topicId: topic.id,
    topicTerms: terms,
    topicConfidence: Number(confidence.toFixed(2)),
    sentiment: s.polarity,
    sentimentLabel: s.label,
    emotion: s.emotion,
    entities: extractEntities(text),
  };
}
