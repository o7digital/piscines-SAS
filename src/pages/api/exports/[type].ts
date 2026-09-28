import type { APIRoute } from "astro";
import PDFDocument from "pdfkit";

import { getAppData, hasDatabase } from "../../../lib/db";
import { generateReportAnalysis } from "../../../lib/reportAI";
import {
  loadRequestedReport,
  readAnalysisRequest,
} from "../../../lib/reportApi";
import { defaultReportMonth } from "../../../lib/reportData";
import { reportCopy } from "../../../lib/reportCopy";
import { renderReportPdf, reportPdfResponse } from "../../../lib/reportPdf";
import { automaticAnalysis } from "../../../lib/reporting";

export const GET: APIRoute = async ({ params, url }) => {
  if (!["monthly", "passport", "intervention"].includes(params.type ?? ""))
    return new Response("Export introuvable", { status: 404 });
  if (params.type === "monthly") {
    const result = await loadRequestedReport({
      month: defaultReportMonth(),
      ...Object.fromEntries(url.searchParams),
    });
    if (result.error) return result.error;
    const analysis = automaticAnalysis(result.report, result.lang);
    return reportPdfResponse(
      await renderReportPdf(
        result.report,
        analysis,
        result.lang,
        !hasDatabase(),
      ),
      result.report.month,
    );
  }
  const data = await getAppData();
  const poolId = url.searchParams.get("pool") ?? data.pools[0]?.id;
  const pool = data.pools.find((item: any) => item.id === poolId);

  if (!pool) return new Response("Piscine introuvable", { status: 404 });

  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ margin: 48 });

  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const type =
    params.type === "passport"
      ? "Pool Passport MVP"
      : params.type === "intervention"
        ? "Rapport intervention"
        : "Rapport piscine mensuel";
  const measurements = data.measurements
    .filter((item: any) => item.pool_id === pool.id)
    .slice(0, 5);
  const checks = data.operationalChecks
    .filter((item: any) => item.pool_id === pool.id)
    .slice(0, 5);
  const interventions = data.interventions
    .filter((item: any) => item.pool_id === pool.id)
    .slice(0, 5);
  const score = data.ecoScores.find((item: any) => item.pool_id === pool.id);
  const property = data.properties.find(
    (item: any) => item.id === pool.property_id,
  );
  const owner = data.users.find((item: any) => item.id === pool.owner_id);
  const provider = data.users.find((item: any) => item.id === pool.provider_id);

  doc.fontSize(22).text(`Bluu3 - ${type}`);
  doc.moveDown();
  doc.fontSize(14).text(`Piscine: ${pool.name}`);
  doc.text(`Propriete: ${property?.name ?? "N/A"}`);
  doc.text(`Proprietaire: ${owner?.name ?? "N/A"}`);
  doc.text(`Provider: ${provider?.name ?? "N/A"}`);
  doc.text(`Localisation: ${pool.location}`);
  doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`);
  doc.moveDown();
  doc.fontSize(16).text("Eco-Score MVP");
  doc
    .fontSize(12)
    .text(
      score
        ? `${score.global_score}/100 - grade ${score.grade}`
        : "Non calculé",
    );
  doc.moveDown();
  doc.fontSize(16).text("Dernières mesures");
  measurements.forEach((item: any) => {
    doc
      .fontSize(11)
      .text(
        `${new Date(item.measured_at).toLocaleDateString("fr-FR")} - pH ${item.ph}, chlore ${item.chlorine}, temp. ${item.temperature} C - ${item.notes ?? ""}`,
      );
  });
  doc.moveDown();
  doc.fontSize(16).text("Checks operationnels");
  checks.forEach((item: any) => {
    doc
      .fontSize(11)
      .text(
        `${new Date(item.checked_at).toLocaleDateString("fr-FR")} - ${item.status} - ${item.notes ?? ""}`,
      );
  });
  doc.moveDown();
  doc.fontSize(16).text("Interventions");
  interventions.forEach((item: any) => {
    doc
      .fontSize(11)
      .text(
        `${new Date(item.scheduled_at).toLocaleDateString("fr-FR")} - ${item.type} - ${item.status} - ${item.notes ?? ""}`,
      );
  });
  doc.moveDown();
  doc.fontSize(16).text(reportCopy.fr.recommendations);
  doc
    .fontSize(11)
    .text(
      "Maintenir un suivi régulier, traiter rapidement les valeurs critiques et documenter chaque intervention.",
    );
  doc.end();

  const pdf = await done;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="bluu3-${params.type ?? "rapport"}-${pool.id}.pdf"`,
    },
  });
};

export const POST: APIRoute = async ({ params, request, clientAddress }) => {
  if (params.type !== "monthly")
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET" },
    });
  const input = await readAnalysisRequest(request, clientAddress);
  if (input.error) return input.error;
  const result = await loadRequestedReport(input.body);
  if (result.error) return result.error;
  const analysis = await generateReportAnalysis(result.report, result.lang);
  return reportPdfResponse(
    await renderReportPdf(result.report, analysis, result.lang, !hasDatabase()),
    result.report.month,
  );
};
