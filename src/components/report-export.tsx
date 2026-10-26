import { useEffect, useMemo, useState } from "react";
import { Download, FileJson, FileText, Loader2, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCorpusState } from "@/lib/corpus-context";
import { createReport, deliverReport, reportCsv, type ReportSummary } from "@/lib/report";

export function ReportExport({ summary }: { summary?: ReportSummary | null }) {
  const { corpus, saved, loading } = useCorpusState();
  const [pdf, setPdf] = useState<Blob | null>(null);
  const [pdfError, setPdfError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const report = useMemo(() => {
    const ids = new Set(corpus.RAW.map((p) => p.id));
    const summaries = summary ? [summary] : corpus.isDemo ? [] : saved
      .filter((row) => ids.has(row.external_id) && row.ai_insight?.trim())
      .map((row) => ({ text: row.ai_insight ?? "", source: `Saved insight · ${row.author}`, postIds: [row.external_id] }));
    return createReport(corpus, summaries, new Date().toISOString());
  }, [corpus, saved, summary]);

  useEffect(() => {
    let active = true;
    setPdf(null); setPdfError("");
    import("@/lib/report-pdf").then((module) => module.reportPdf(report)).then((blob) => {
      if (active) setPdf(blob);
    }).catch(() => { if (active) setPdfError("PDF unavailable. Please retry or choose CSV / JSON."); });
    return () => { active = false; };
  }, [report]);

  function download(format: "pdf" | "csv" | "json") {
    setDownloadError("");
    const blob = format === "pdf" ? pdf : format === "csv"
      ? new Blob([reportCsv(report)], { type: "text/csv;charset=utf-8" })
      : new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    if (!blob) return;
    void deliverReport(blob, `aura-insight-report-${report.generatedAt.slice(0, 10)}.${format}`)
      .catch(() => setDownloadError("The report could not be downloaded. Please try again."));
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
      {(pdfError || downloadError) && <p role="alert" className="text-sm text-negative">{downloadError || pdfError}</p>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 rounded-xl" disabled={loading}><Download />Export Report</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!pdf} onSelect={() => download("pdf")}>
            {pdf ? <FileText /> : <Loader2 className="animate-spin" />} {pdf ? "PDF document" : pdfError ? "PDF unavailable" : "Preparing PDF…"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => download("csv")}><Table />CSV spreadsheet</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => download("json")}><FileJson />JSON data</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}