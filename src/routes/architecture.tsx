/**
 * How it works — the real pipeline behind the app, from collection to cited
 * answers, plus the knowledge facets and the SECI framing.
 */
import { createFileRoute } from "@tanstack/react-router";

import { Shell } from "@/components/shell";
import { CORPUS_STATS } from "@/lib/enrichment";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "How it works | Aura Insight" },
      {
        name: "description",
        content:
          "The pipeline behind Aura Insight: Instagram collection, AI enrichment, vector and graph storage, and cited generative answers.",
      },
      { property: "og:title", content: "How it works | Aura Insight" },
      {
        property: "og:description",
        content: "Collection, enrichment, storage and retrieval-augmented answers, step by step.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Architecture,
});

const LAYERS = [
  {
    step: "Collect",
    title: "Data ingestion & the Instagram source",
    body: "Authorised Graph API access or ethical collection tooling, handling authentication, rate limiting and PII anonymisation. Raw output: posts, reels, stories and comments with timestamps, likes, saves, shares, hashtags, follower ties and author information.",
    impl: `This build ships an anonymised demonstration corpus of ${CORPUS_STATS.posts} posts and ${CORPUS_STATS.ties} follower ties so the pipeline is reproducible without platform credentials; your own account can be linked on My corpus.`,
  },
  {
    step: "Enrich",
    title: "AI-augmented metadata extraction",
    body: "Text pre-processing and anonymisation, followed by named entity and concept extraction, topic modelling, sentiment and emotion scoring, and network graph mapping for influencers and community clusters.",
    impl: "Implemented as deterministic in-browser surrogates for spaCy, BERTopic and RoBERTa, plus label-propagation community detection over the follower graph.",
  },
  {
    step: "Store",
    title: "The generative knowledge core",
    body: "A vector index holding semantic embeddings of enriched chunks, a graph store holding relational metadata, and a retrieval engine combining semantic search with graph traversal.",
    impl: "A 96-dimension hashed embedding index with cosine retrieval, boosted by author influence and hashtag overlap.",
  },
  {
    step: "Ask",
    title: "Answers and knowledge consumption",
    body: "A retrieval-augmented language model synthesises answers for decision makers, and the results are consumed through the overview, corpus inspector, network analysis and query interface.",
    impl: "Synthesis runs server-side against a hosted language model, returning citations to post identifiers that open in the evidence panel.",
  },
];

const FACETS: [string, string][] = [
  ["Who", "Author identity, category, follower ties and community membership"],
  ["What", "Caption text, entities, modelled topic, hashtags and media type"],
  ["When", "Post timestamp, collection window and sentiment trend position"],
  ["Where", "Location tag and the spatial spread of the conversation"],
  ["How", "Engagement mechanics: likes, comments, saves, shares, amplification"],
  ["Why", "Motive inferred from topic, emotion and comment discourse"],
];

function Architecture() {
  return (
    <Shell
      title="How it works"
      subtitle="The pipeline behind the app — collect, enrich, store, ask — and what the research underneath it adds."
    >
      <ol>
        {LAYERS.map((l) => (
          <li key={l.step} className="border-b border-line py-7 first:pt-0 last:border-0">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[13px] font-semibold text-muted">{l.step}</span>
              <h3 className="text-[18px] font-semibold text-foreground">{l.title}</h3>
            </div>
            <p className="mt-2 max-w-[75ch] text-[15px] leading-relaxed text-foreground">{l.body}</p>
            <p className="mt-2 max-w-[75ch] border-l-2 border-highlight pl-3 text-sm text-muted">
              In this build: {l.impl}
            </p>
          </li>
        ))}
      </ol>

      <section className="mt-10 grid gap-10 border-t border-line pt-8 lg:grid-cols-2">
        <div>
          <h3 className="text-[18px] font-semibold text-foreground">Knowledge facets captured per record</h3>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {FACETS.map(([q, d]) => (
                <tr key={q} className="border-b border-line align-top last:border-0">
                  <td className="w-16 py-2.5 text-[15px] font-semibold text-foreground">{q}</td>
                  <td className="py-2.5 text-muted">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="text-[18px] font-semibold text-foreground">From tacit to explicit knowledge</h3>
          <p className="quote mt-3 text-[15px] text-foreground">
            Posting behaviour — composing a caption, selecting hashtags, tagging a location, responding
            in comment threads — externalises judgement that would otherwise stay tacit. The enrichment
            layer codifies that behaviour as structured metadata, the vector and graph stores combine it
            across accounts, and the generative layer internalises it again as a cited brief a decision
            maker can act on.
          </p>
          <p className="quote mt-4 text-[15px] text-muted">
            Limitation acknowledged in the study: metadata can only capture the explicit and implicit
            strata. Fully tacit expertise resists codification, so generated output is presented as
            evidence-linked synthesis rather than automated decision making.
          </p>
        </div>
      </section>
    </Shell>
  );
}
