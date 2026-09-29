import { createFileRoute } from "@tanstack/react-router";

import { Panel, Shell } from "@/components/shell";
import { CORPUS_STATS } from "@/lib/enrichment";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "System Architecture | AI-Augmented Metadata Extractor" },
      {
        name: "description",
        content:
          "Four-layer architecture of the AI-augmented social network metadata extractor: ingestion, enrichment, generative knowledge core and knowledge consumption.",
      },
      { property: "og:title", content: "System Architecture" },
      {
        property: "og:description",
        content:
          "Ingestion, AI enrichment, generative knowledge core and consumption layers, mapped to the research methodology.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Architecture,
});

const LAYERS = [
  {
    n: "Layer 1",
    title: "Data ingestion & Instagram source",
    body: "Authorised Graph API access or ethical collection tooling, handling authentication, rate limiting and PII anonymisation. Raw output: posts, reels, stories and comments with timestamps, likes, saves, shares, hashtags, follower ties and author information.",
    impl: `This prototype ships an anonymised demonstration corpus of ${CORPUS_STATS.posts} posts and ${CORPUS_STATS.ties} follower ties so the pipeline is reproducible without platform credentials.`,
  },
  {
    n: "Layer 2",
    title: "AI-augmented metadata extraction & enrichment",
    body: "Text pre-processing and anonymisation, followed by named entity and concept extraction, topic modelling, sentiment and emotion scoring, and network graph mapping for influencers and community clusters.",
    impl: "Implemented as deterministic in-browser surrogates for spaCy, BERTopic and RoBERTa, plus label-propagation community detection over the follower graph.",
  },
  {
    n: "Layer 3",
    title: "Generative knowledge management core",
    body: "A vector index holding semantic embeddings of enriched chunks, a graph store holding relational metadata, a retrieval engine combining semantic search with graph traversal, and a large language model performing synthesis through retrieval-augmented generation.",
    impl: "A 96-dimension hashed embedding index with cosine retrieval, boosted by author influence and hashtag overlap; synthesis runs server-side against a hosted language model, returning citations to post identifiers.",
  },
  {
    n: "Layer 4",
    title: "Application & knowledge consumption",
    body: "Interactive query interface, dynamic knowledge dashboard with trends, network graphs and cited reports, serving researchers, analysts and decision makers.",
    impl: "The dashboard, corpus inspector, network analysis view and generative query interface in this application.",
  },
];

const FACETS = [
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
      title="System architecture and methodology mapping"
      subtitle="How the running application implements the four-phase design proposed in Chapter Three."
    >
      <div className="space-y-4">
        {LAYERS.map((l) => (
          <div key={l.n} className="paper-panel p-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="label-caps">{l.n}</span>
              <h3 className="text-base font-semibold text-foreground">{l.title}</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{l.body}</p>
            <p className="mt-2 border-l-2 border-accent pl-3 text-sm text-muted-foreground">
              In this build: {l.impl}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Knowledge facets captured per record" hint="Primitive questions">
          <table className="w-full text-sm">
            <tbody>
              {FACETS.map(([q, d]) => (
                <tr key={q} className="border-b border-rule/60 last:border-0 align-top">
                  <td className="w-20 py-2 font-serif text-base font-semibold text-foreground">
                    {q}
                  </td>
                  <td className="py-2 text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="From tacit to explicit knowledge" hint="SECI alignment">
          <p className="text-sm leading-relaxed text-foreground">
            Posting behaviour — composing a caption, selecting hashtags, tagging a location,
            responding in comment threads — externalises judgement that would otherwise stay tacit.
            The enrichment layer codifies that behaviour as structured metadata, the vector and graph
            stores combine it across accounts, and the generative layer internalises it again as a
            cited brief a decision maker can act on.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Limitation acknowledged in the study: metadata can only capture the explicit and implicit
            strata. Fully tacit expertise resists codification, so generated output is presented as
            evidence-linked synthesis rather than automated decision making.
          </p>
        </Panel>
      </div>
    </Shell>
  );
}
