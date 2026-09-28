import PDFDocument from "pdfkit";
import { reportCopy } from "./reportCopy";
import type {
  MonthlyReport,
  ReportAnalysis,
  ReportLanguage,
} from "./reporting";

export async function renderReportPdf(
  report: MonthlyReport,
  analysis: ReportAnalysis,
  lang: ReportLanguage,
  demo = false,
) {
  const c = reportCopy[lang];
  const doc = new PDFDocument({
    margin: 48,
    size: "A4",
    info: {
      Title: `Bluu3 - ${c.reportTitle} - ${report.month}`,
      Author: "Bluu3",
    },
  });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  const heading = (title: string) => {
    doc
      .moveDown()
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#047857")
      .text(title)
      .moveDown(0.4);
    doc.font("Helvetica").fontSize(10).fillColor("#334155");
  };
  const line = (text: string) =>
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#334155")
      .text(text, { lineGap: 3 });
  const date = (value: string) =>
    new Date(value).toLocaleDateString(lang, { timeZone: "UTC" });
  const number = (value: number | null) =>
    value === null ? "-" : value.toLocaleString(lang);
  const check = (value: boolean | null) =>
    value === null ? c.unknown : value ? c.passed : c.failed;
  doc.font("Helvetica-Bold").fontSize(23).fillColor("#0f172a").text("Bluu3");
  doc.fontSize(17).text(c.reportTitle);
  doc.moveDown(0.5);
  line(`${c.period}: ${date(report.periodStart)} - ${date(report.periodEnd)}`);
  if (demo) line(`${c.demo}. ${c.demoNote}`);
  heading(c.portfolio);
  const t = report.totals;
  line(
    `${c.pool}: ${t.pools} | ${c.measurements}: ${t.measurements} | ${c.checks}: ${t.checks}`,
  );
  line(
    `${c.range}: ${number(t.waterInRangePercent)}${t.waterInRangePercent === null ? "" : " %"} | ${c.attention}: ${t.attentionPools}`,
  );
  line(
    `${c.completed}: ${t.completedInterventions} | ${c.urgentStatus}: ${t.urgentInterventions}`,
  );
  line(c.reference);
  heading(analysis.source === "huggingface" ? c.ai : c.automaticPdf);
  if (report.focusedMeasurement)
    line(
      `${c.date}: ${date(report.focusedMeasurement.measuredAt)} | ${c.measurements}: ${report.focusedMeasurement.id}`,
    );
  line(analysis.summary);
  analysis.highlights.forEach((text) => line(`- ${text}`));
  heading(c.recommendations);
  analysis.recommendations.forEach((text) => line(`- ${text}`));
  line(c.reviewNote);
  for (const pool of report.pools) {
    doc.addPage();
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#0f172a")
      .text(pool.poolName);
    line(`${pool.propertyName} | ${pool.location}`);
    line(
      `${c.status}: ${pool.status === "stable" ? c.stable : pool.status === "attention" ? c.review : c.empty}`,
    );
    line(
      `${c.eco}: ${number(pool.ecoScore)}${pool.ecoScore === null ? "" : `/100 (${pool.ecoGrade})`}. ${c.ecoNote}`,
    );
    line(
      `${pool.waterAlerts} ${c.waterAlerts} | ${pool.checkAlerts} ${c.checkAlerts} | ${pool.incompleteMeasurements + pool.incompleteChecks} ${c.incomplete}`,
    );
    heading(c.measurements);
    if (!pool.measurements.length) line(c.noMeasurements);
    for (const item of pool.measurements) {
      line(
        `${date(item.measuredAt)} | pH ${number(item.ph)} | ${c.chlorine}: ${number(item.chlorine)} mg/L | ${number(item.temperature)} °C`,
      );
      line(
        `ORP: ${number(item.orp)} mV | TAC: ${number(item.alkalinity)} mg/L | TH: ${number(item.hardness)} mg/L`,
      );
    }
    heading(c.checks);
    if (!pool.checks.length) line(c.noChecks);
    for (const item of pool.checks)
      line(
        `${date(item.checkedAt)} | ${c.cover}: ${check(item.coverOk)} | ${c.filtration}: ${check(item.filtrationOk)} | ${c.safety}: ${check(item.safetyOk)} | ${c.cleanliness}: ${check(item.cleanlinessOk)}`,
      );
    heading(c.interventions);
    if (!pool.interventions.length) line(c.noInterventions);
    for (const item of pool.interventions)
      line(
        `${date(item.scheduledAt)} | ${item.type} | ${item.status === "done" ? c.done : item.status === "urgent" ? c.urgentStatus : item.status === "scheduled" ? c.scheduled : c.unknown}`,
      );
  }
  doc.end();
  return done;
}

export function reportPdfResponse(pdf: Buffer, month: string) {
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bluu3-report-${month}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
