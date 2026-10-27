import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { ReportData } from "./report";

/** Use the same semantic palette as the app, resolved by the browser. */
function palette() {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("Report colours could not be prepared.");
  const styles = getComputedStyle(document.documentElement);
  const color = (token: string) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = styles.getPropertyValue(token).trim();
    ctx.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
    return rgb(r / 255, g / 255, b / 255);
  };
  return { ink: color("--foreground"), muted: color("--muted-foreground"), accent: color("--primary"), paper: color("--card"), rule: color("--border") };
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (font.widthOfTextAtSize([line, word].filter(Boolean).join(" "), size) <= width) {
      line = [line, word].filter(Boolean).join(" ");
    } else {
      if (line) lines.push(line);
      line = "";
      for (const char of word) {
        if (font.widthOfTextAtSize(line + char, size) > width) { lines.push(line); line = ""; }
        line += char;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function reportPdf(report: ReportData): Promise<Blob> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle("Aura Insight — Knowledge Report");
  pdf.setAuthor(report.brand);
  const response = await fetch("/fonts/report-sans.ttf");
  if (!response.ok) throw new Error("The report font could not be loaded.");
  const font = await pdf.embedFont(await response.arrayBuffer(), { subset: true });
  const supported = new Set(font.getCharacterSet());
  const safeText = (value: string) => Array.from(value).map((c) => supported.has(c.codePointAt(0) ?? 0) ? c : "?").join("");
  const colors = palette();
  let page = pdf.addPage([595.28, 841.89]);
  let y = 730;
  const text = (value: string, x: number, top: number, size = 10, color = colors.ink) => {
    // A missing glyph is explicitly replaced, rather than crashing the export.
    page.drawText(safeText(value), { x, y: top, font, size, color });
  };
  const header = () => {
    page.drawRectangle({ x: 0, y: 0, width: 595.28, height: 841.89, color: colors.paper });
    page.drawRectangle({ x: 40, y: 792, width: 28, height: 4, color: colors.accent });
    text(report.brand, 78, 788, 18, colors.accent);
    text("KNOWLEDGE REPORT", 40, 756, 10, colors.muted);
  };
  header();
  const ensure = (height: number) => {
    if (y - height >= 62) return;
    page = pdf.addPage([595.28, 841.89]); header(); y = 730;
  };
  const paragraph = (value: string, size = 10, color = colors.ink) => {
    const lines = wrap(safeText(value), font, size, 515);
    const height = lines.length * (size + 7) + 5;
    if (height <= 668) ensure(height);
    for (const line of lines) {
      ensure(size + 7); text(line, 40, y, size, color); y -= size + 7;
    }
    y -= 5;
  };
  const heading = (value: string) => { ensure(55); y -= 14; text(value, 40, y, 15, colors.accent); y -= 25; };
  paragraph(`${report.corpus}  |  ${report.period.from} to ${report.period.to}`, 11);
  paragraph(`Generated ${new Date(report.generatedAt).toUTCString()}`, 9, colors.muted);
  paragraph(`${report.posts} posts  •  ${report.accounts} accounts  •  Mean sentiment ${report.meanSentiment.toFixed(3)}`, 11);
  heading("Sentiment trend");
  ensure(170);
  const chartTop = y;
  const chartBottom = y - 112;
  const left = 74, width = 460;
  for (const value of [-1, 0, 1]) {
    const cy = chartBottom + (value + 1) * 56;
    page.drawLine({ start: { x: left, y: cy }, end: { x: left + width, y: cy }, thickness: 0.5, color: colors.rule });
    text(String(value), 44, cy - 3, 9, colors.muted);
  }
  const points = report.sentimentTrend.map((p, i) => ({
    x: left + (report.sentimentTrend.length === 1 ? width / 2 : i * width / Math.max(1, report.sentimentTrend.length - 1)),
    y: chartBottom + (Math.max(-1, Math.min(1, p.sentiment)) + 1) * 56,
  }));
  points.forEach((p, i) => {
    const previous = points[i - 1];
    if (previous) page.drawLine({ start: previous, end: p, color: colors.accent, thickness: 2 });
    page.drawCircle({ x: p.x, y: p.y, size: 2.5, color: colors.accent });
  });
  text(report.sentimentTrend[0]?.week ?? "No data", left, chartBottom - 19, 9, colors.muted);
  const last = report.sentimentTrend.at(-1);
  if (report.sentimentTrend.length > 1 && last) text(last.week, left + width - 45, chartBottom - 19, 9, colors.muted);
  y = chartTop - 154;
  paragraph("Polarity scale: -1 negative, 0 neutral, +1 positive. Values match the selected corpus.", 9, colors.muted);
  for (const p of report.sentimentTrend) paragraph(`${p.week}  |  ${p.sentiment.toFixed(3)}  |  ${p.posts} posts`, 9);
  heading("Top entities");
  if (!report.topEntities.length) paragraph("No entities were extracted in this corpus.");
  for (const entity of report.topEntities) paragraph(`${entity.text}  ·  ${entity.type}  ·  ${entity.count} mentions`);
  heading("AI summary");
  if (!report.aiSummaries.length) paragraph("No AI summary available. Generate an answer or analyse a post before exporting to include one.");
  for (const summary of report.aiSummaries) {
    ensure(95);
    paragraph(summary.source, 11, colors.accent);
    for (const line of summary.text.split("\n").filter(Boolean)) {
      if (/^#+\s/.test(line)) ensure(75);
      paragraph(line.replace(/^#+\s*/, "").replace(/\*\*/g, ""));
    }
    if (summary.postIds.length) paragraph(`Source posts: ${summary.postIds.join(", ")}`, 9, colors.muted);
  }
  pdf.getPages().forEach((p, i) => {
    page = p;
    text(`${report.brand}  |  ${report.corpus}`, 40, 31, 8, colors.muted);
    text(`${i + 1} / ${pdf.getPageCount()}`, 520, 31, 8, colors.muted);
  });
  const bytes = await pdf.save();
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}