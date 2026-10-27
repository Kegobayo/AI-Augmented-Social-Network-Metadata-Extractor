import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { DEMO_CORPUS } from "./enrichment";
import { createReport, reportCsv } from "./report";

describe("knowledge report", () => {
  it("packages the selected corpus trend, entities, and AI summary without changing values", () => {
    const summary = { text: "Solar evidence [p001]", source: "Question", postIds: ["p001"] };
    const report = createReport(DEMO_CORPUS, [summary], "2026-10-26T11:31:00Z");
    assert.deepEqual(report.sentimentTrend, DEMO_CORPUS.sentimentTimeline());
    assert.deepEqual(report.topEntities, DEMO_CORPUS.entityFrequency(12));
    assert.deepEqual(report.aiSummaries, [summary]);
    assert.equal(report.posts, DEMO_CORPUS.RAW.length);
    assert.equal(report.generatedAt, "2026-10-26T11:31:00Z");
  });
  it("preserves CSV quotes and multiline summaries and neutralises spreadsheet formulas", () => {
    const report = createReport(DEMO_CORPUS, [{ text: '=SUM(1,2)\n"quoted"', source: "@author", postIds: ["p001"] }], "2026-10-26T11:31:00Z");
    const csv = reportCsv(report);
    assert.ok(csv.includes('"\'=SUM(1,2)\n""quoted"""'));
    assert.ok(csv.includes('"\'@author"'));
    assert.ok(csv.includes('"p001"'));
  });
  it("does not invent an AI summary when none exists", () => {
    assert.deepEqual(createReport(DEMO_CORPUS, [], "2026-10-26T11:31:00Z").aiSummaries, []);
  });
});