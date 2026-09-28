import assert from "node:assert/strict";
import { test } from "node:test";
import { mvpData } from "../src/data/mvp";
import {
  automaticAnalysis,
  buildMonthlyReport,
  measurementInput,
  monthBounds,
  reportCsv,
  type ReportDataset,
} from "../src/lib/reporting";
import { generateReportAnalysis } from "../src/lib/reportAI";
import { renderReportPdf } from "../src/lib/reportPdf";

const report = buildMonthlyReport(mvpData, "2026-05");
const output = {
  summary: "Analyse des relevés.",
  highlights: ["pH à surveiller."],
  recommendations: ["Faire vérifier le bassin."],
};
const provider = (content: unknown, finish_reason = "stop") =>
  new Response(
    JSON.stringify({ choices: [{ message: { content }, finish_reason }] }),
    { headers: { "Content-Type": "application/json" } },
  );

test("aggregates every reading without confusing portfolio totals with per-pool averages", () => {
  assert.deepEqual(report.totals, {
    pools: 4,
    measurements: 12,
    checks: 8,
    interventions: 5,
    waterAlerts: 5,
    checkAlerts: 3,
    incompleteMeasurements: 0,
    incompleteChecks: 0,
    urgentInterventions: 1,
    completedInterventions: 1,
    attentionPools: 2,
    waterInRangePercent: 58,
    averageEcoScore: 80.5,
  });
  assert.equal(
    report.pools.find((pool) => pool.poolId === "pool-mas-olivier")
      ?.waterInRangePercent,
    33,
  );
});

test("month boundaries include the final day, exclude the next month, and support leap years", () => {
  assert.equal(monthBounds("2024-02").periodEnd, "2024-02-29");
  const data: ReportDataset = {
    pools: [{ id: "p", name: "Pool" }],
    operationalChecks: [],
    interventions: [],
    measurements: [
      {
        id: "a",
        pool_id: "p",
        measured_at: "2026-05-31T23:59:59.999Z",
        ph: 7.4,
        chlorine: 2,
      },
      {
        id: "b",
        pool_id: "p",
        measured_at: "2026-06-01T00:00:00Z",
        ph: 7.4,
        chlorine: 2,
      },
      {
        id: "c",
        pool_id: "p",
        measured_at: "2026-05-01T01:00:00+02:00",
        ph: 7.4,
        chlorine: 2,
      },
    ],
  };
  assert.deepEqual(
    buildMonthlyReport(data, "2026-05").pools[0].measurements.map(
      (row) => row.id,
    ),
    ["a"],
  );
  assert.throws(() => monthBounds("2026-13"));
});

test("PostgreSQL dates and numeric strings normalize while missing fields remain unknown", () => {
  const data: ReportDataset = {
    pools: [{ id: "p" }],
    interventions: [],
    operationalChecks: [
      {
        id: "c",
        pool_id: "p",
        checked_at: new Date("2026-05-20"),
        status: "ok",
      },
    ],
    measurements: [
      {
        id: "a",
        pool_id: "p",
        measured_at: new Date("2026-05-15"),
        ph: "7.4",
        chlorine: "2",
        orp: "710",
        alkalinity: "90",
        hardness: "200",
      },
      {
        id: "b",
        pool_id: "p",
        measured_at: "2026-05-16",
        ph: null,
        chlorine: "",
      },
    ],
  };
  const pool = buildMonthlyReport(data, "2026-05").pools[0];
  assert.equal(pool.measurements[0].orp, 710);
  assert.equal(pool.measurements[0].alkalinity, 90);
  assert.equal(pool.measurements[0].hardness, 200);
  assert.equal(pool.incompleteMeasurements, 1);
  assert.equal(pool.incompleteChecks, 1);
  assert.equal(pool.status, "attention");
  assert.equal(pool.ecoScore, null);
});

test("an empty period never implies healthy water or an environmental score", () => {
  const empty = buildMonthlyReport(mvpData, "2026-09");
  assert.equal(empty.totals.waterInRangePercent, null);
  assert.equal(empty.totals.averageEcoScore, null);
  assert.ok(empty.pools.every((pool) => pool.status === "empty"));
  assert.match(
    automaticAnalysis(empty, "fr").summary,
    /ne peut pas être évalué/,
  );
});

test("pool filters exclude other pools and sort observations in chronological order", () => {
  const selected = buildMonthlyReport(
    mvpData,
    "2026-05",
    "pool-bastide-luberon",
  );
  assert.equal(selected.pools.length, 1);
  assert.deepEqual(
    selected.pools[0].measurements.map((row) => row.id),
    ["mea-11", "mea-10", "mea-9"],
  );
});

test("CSV safely escapes editable text and spreadsheet formula prefixes", () => {
  const csv = reportCsv({
    ...report,
    pools: [
      {
        ...report.pools[0],
        poolName: '=HYPERLINK("bad")',
        propertyName: 'Property, "one"',
      },
    ],
  });
  assert.match(csv, /'\=HYPERLINK/);
  assert.ok(csv.includes('"Property, ""one"""'));
  assert.ok(csv.startsWith("\uFEFF"));
});

test("new measurements reject missing required fields and out-of-range values", () => {
  assert.equal(
    measurementInput.safeParse({
      pool_id: "p",
      ph: 15,
      chlorine: 2,
      temperature: 27,
    }).success,
    false,
  );
  assert.equal(
    measurementInput.safeParse({
      pool_id: "p",
      ph: null,
      chlorine: 2,
      temperature: 27,
    }).success,
    false,
  );
  assert.equal(
    measurementInput.safeParse({
      pool_id: "p",
      ph: 7.4,
      chlorine: 2,
      temperature: 27,
      orp: null,
    }).success,
    true,
  );
});

test("AI receives every chemical parameter and the selected reading without personal information", async () => {
  const selected = buildMonthlyReport(
    mvpData,
    "2026-05",
    "pool-bastide-luberon",
  );
  selected.focusedMeasurement = selected.pools[0].measurements.at(-1);
  let calls = 0;
  const fetcher = (async (url, init) => {
    calls++;
    assert.equal(url, "https://router.huggingface.co/v1/chat/completions");
    const body = JSON.parse(String(init?.body));
    const evidence = JSON.parse(body.messages[1].content);
    assert.equal(evidence.focusedMeasurement.orp, 580);
    assert.equal(evidence.focusedMeasurement.alkalinity, 142);
    assert.equal(evidence.focusedMeasurement.hardness, 310);
    assert.equal(evidence.pools[0].observations.length, 3);
    for (const forbidden of [
      "Claire",
      "Julien",
      "Bastide",
      "notes",
      "pool_id",
      "secret-token",
    ])
      assert.ok(!body.messages[1].content.includes(forbidden));
    return provider(JSON.stringify(output));
  }) as typeof fetch;
  const config = { token: "secret-token", model: "test/evidence", fetcher };
  const [first, second] = await Promise.all([
    generateReportAnalysis(selected, "fr", config),
    generateReportAnalysis(selected, "fr", config),
  ]);
  assert.equal(first.source, "huggingface");
  assert.deepEqual(first, second);
  assert.equal(calls, 1);
  await generateReportAnalysis(selected, "fr", config);
  assert.equal(calls, 1);
});

for (const [status, reason] of [
  [401, "auth"],
  [403, "auth"],
  [429, "rate_limited"],
  [500, "unavailable"],
] as const) {
  test(`provider ${status} returns an explicit fallback without exposing its response`, async () => {
    const analysis = await generateReportAnalysis(report, "fr", {
      token: "token",
      model: `test/${status}`,
      fetcher: (async () =>
        new Response("private-provider-details", { status })) as typeof fetch,
    });
    assert.equal(analysis.source, "rules");
    assert.equal(analysis.reason, reason);
    assert.ok(!JSON.stringify(analysis).includes("private-provider-details"));
  });
}

for (const [content, finish] of [
  ["not json", "stop"],
  [
    JSON.stringify({ summary: "", highlights: [], recommendations: [] }),
    "stop",
  ],
  [JSON.stringify(output), "length"],
]) {
  test(`invalid or truncated provider output falls back (${content.slice(0, 12)}, ${finish})`, async () => {
    const analysis = await generateReportAnalysis(report, "en", {
      token: "token",
      model: `test/${content}/${finish}`,
      fetcher: (async () => provider(content, finish)) as typeof fetch,
    });
    assert.equal(analysis.reason, "invalid_response");
    assert.equal(analysis.source, "rules");
  });
}

test("timeout and unconfigured AI are distinguishable from an AI-generated result", async () => {
  const timedOut = await generateReportAnalysis(report, "fr", {
    token: "token",
    model: "test/timeout",
    fetcher: (async () => {
      throw new DOMException("timeout", "TimeoutError");
    }) as typeof fetch,
  });
  assert.equal(timedOut.reason, "timeout");
  const disabled = await generateReportAnalysis(report, "fr", {
    token: "",
    model: "",
  });
  assert.equal(disabled.reason, "not_configured");
});

test("monthly PDF renders all measurements and non-ASCII French text", async () => {
  const pdf = await renderReportPdf(
    report,
    automaticAnalysis(report, "fr"),
    "fr",
    true,
  );
  assert.ok(pdf.byteLength > 3000);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
});
