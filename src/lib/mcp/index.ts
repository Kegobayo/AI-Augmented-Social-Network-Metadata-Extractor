import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchCorpus from "./tools/search-corpus";
import corpusOverview from "./tools/corpus-overview";
import analyzeTextTool from "./tools/analyze-text";

// Vite inlines the stable ref; the published SUPABASE_URL may be a proxy.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "aura-insight",
  title: "Aura Insight",
  version: "0.1.0",
  instructions:
    "Tools for Aura Insight, an Instagram metadata knowledge base. Search the shared corpus of saved posts, get a topic and hashtag overview, or analyse a caption's topic, sentiment and emotion.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchCorpus, corpusOverview, analyzeTextTool],
});
