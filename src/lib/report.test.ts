import { describe, it, expect } from "bun:test";
import { DEMO_CORPUS } from "./enrichment";
import { createReport, reportCsv } from "./report";

describe("knowledge report", () => {
  it("packages the selected corpus trend, entities, and AI summary without changing values", () => {
    const summary = { text: "Solar evidence [p001]", source: "Question", postIds: ["p001"] };
    const report = createReport(DEMO_CORPUS, [summary], "2026-10-26T11:31:00Z");
    expect(report.sentimentTrend).toEqual(DEMO_CORPUS.sentimentTimeline());
    expect(report.topEntities).toEqual(DEMO_CORPUS.entityFrequency(12));
    expect(report.aiSummaries).toEqual([summary]);
    expect(report.posts).toBe(DEMO_CORPUS.RAW.length);
    expect(report.generatedAt).toBe("2026-10-26T11:31:00Z");
  });
  it("preserves CSV quotes and multiline summaries and neutralises spreadsheet formulas", () => {
    const report = createReport(DEMO_CORPUS, [{ text: '=SUM(1,2)\n"quoted"', source: "@author", postIds: ["p001"] }], "2026-10-26T11:31:00Z");
    const csv = reportCsv(report);
    expect(csv).toContain('"\'=SUM(1,2)\n""quoted"""');
    expect(csv).toContain('"\'@author"');
    expect(csv).toContain('"p001"');
  });
  it("does not invent an AI summary when none exists", () => {
    expect(createReport(DEMO_CORPUS, [], "2026-10-26T11:31:00Z").aiSummaries).toEqual([]);
  });
});