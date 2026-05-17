import type { APIRoute } from "astro";
import PDFDocument from "pdfkit";

import { getAppData } from "../../../lib/db";

export const GET: APIRoute = async ({ params, url }) => {
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

  const type = params.type === "passport" ? "Pool Passport MVP" : params.type === "intervention" ? "Rapport intervention" : "Rapport piscine mensuel";
  const measurements = data.measurements.filter((item: any) => item.pool_id === pool.id).slice(0, 5);
  const checks = data.operationalChecks.filter((item: any) => item.pool_id === pool.id).slice(0, 5);
  const interventions = data.interventions.filter((item: any) => item.pool_id === pool.id).slice(0, 5);
  const score = data.ecoScores.find((item: any) => item.pool_id === pool.id);
  const property = data.properties.find((item: any) => item.id === pool.property_id);
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
  doc.fontSize(12).text(score ? `${score.global_score}/100 - grade ${score.grade}` : "Non calculé");
  doc.moveDown();
  doc.fontSize(16).text("Dernières mesures");
  measurements.forEach((item: any) => {
    doc.fontSize(11).text(`${new Date(item.measured_at).toLocaleDateString("fr-FR")} - pH ${item.ph}, chlore ${item.chlorine}, temp. ${item.temperature} C - ${item.notes ?? ""}`);
  });
  doc.moveDown();
  doc.fontSize(16).text("Checks operationnels");
  checks.forEach((item: any) => {
    doc.fontSize(11).text(`${new Date(item.checked_at).toLocaleDateString("fr-FR")} - ${item.status} - ${item.notes ?? ""}`);
  });
  doc.moveDown();
  doc.fontSize(16).text("Interventions");
  interventions.forEach((item: any) => {
    doc.fontSize(11).text(`${new Date(item.scheduled_at).toLocaleDateString("fr-FR")} - ${item.type} - ${item.status} - ${item.notes ?? ""}`);
  });
  doc.moveDown();
  doc.fontSize(16).text("Recommandations");
  doc.fontSize(11).text("Maintenir un suivi régulier, traiter rapidement les valeurs critiques et documenter chaque intervention.");
  doc.end();

  const pdf = await done;
  return new Response(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="bluu3-${params.type ?? "rapport"}-${pool.id}.pdf"`,
    },
  });
};
