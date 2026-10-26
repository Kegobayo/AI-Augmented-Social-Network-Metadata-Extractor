import type { Corpus } from "@/lib/enrichment";

export type ReportSummary = { text: string; source: string; postIds: string[] };
export type ReportData = {
  brand: string;
  generatedAt: string;
  corpus: string;
  period: { from: string; to: string };
  posts: number;
  accounts: number;
  meanSentiment: number;
  sentimentTrend: { week: string; sentiment: number; posts: number }[];
  topEntities: { text: string; type: string; count: number }[];
  aiSummaries: ReportSummary[];
};

export function createReport(corpus: Corpus, summaries: ReportSummary[], generatedAt: string): ReportData {
  return {
    brand: "Aura Insight", generatedAt,
    corpus: corpus.isDemo ? "Demo corpus" : "My corpus",
    period: corpus.CORPUS_STATS.span,
    posts: corpus.CORPUS_STATS.posts,
    accounts: corpus.CORPUS_STATS.authors,
    meanSentiment: corpus.CORPUS_STATS.avgSentiment,
    sentimentTrend: corpus.sentimentTimeline(),
    topEntities: corpus.entityFrequency(12),
    aiSummaries: summaries.filter((s) => s.text.trim()),
  };
}

function csvCell(value: string | number) {
  // Prevent spreadsheet formulas in captions, entities and AI output.
  const text = String(value);
  const safe = /^[\s]*[=+@-]/.test(text) && typeof value === "string" ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function reportCsv(report: ReportData): string {
  const rows: (string | number)[][] = [
    ["section", "label", "value", "type_or_source", "post_count_or_ids"],
    ["report", "Brand", report.brand], ["report", "Generated at", report.generatedAt],
    ["report", "Corpus", report.corpus], ["report", "Period from", report.period.from],
    ["report", "Period to", report.period.to], ["report", "Posts", report.posts],
    ["report", "Accounts", report.accounts], ["report", "Mean sentiment", report.meanSentiment],
    ...report.sentimentTrend.map((p) => ["sentiment_trend", p.week, p.sentiment, "", p.posts]),
    ...report.topEntities.map((e) => ["top_entities", e.text, e.count, e.type, ""]),
    ...report.aiSummaries.map((s) => ["ai_summary", s.source, s.text, s.source, s.postIds.join("; ")]),
  ];
  if (!report.aiSummaries.length) rows.push(["ai_summary", "Status", "No AI summary available. Generate an answer or analyse a post first."]);
  return "\uFEFF" + rows.map((row) => Array.from({ length: 5 }, (_, i) => csvCell(row[i] ?? "")).join(",")).join("\r\n");
}

export async function deliverReport(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (error) { if ((error as DOMException).name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}