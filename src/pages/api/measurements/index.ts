import type { APIRoute } from "astro";
import { json } from "../../../lib/api";
import {
  getAppData,
  hasDatabase,
  query,
  refreshEcoScore,
} from "../../../lib/db";
import { generateReportAnalysis } from "../../../lib/reportAI";
import {
  loadRequestedReport,
  readAnalysisRequest,
} from "../../../lib/reportApi";
import { measurementInput } from "../../../lib/reporting";

export const GET: APIRoute = async () => {
  const data = await getAppData();
  return json({ measurements: data.measurements });
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const input = await readAnalysisRequest(
    request,
    clientAddress,
    measurementInput,
  );
  if (input.error) return input.error;
  const parsed = measurementInput.parse(input.body);
  const body = {
    ...parsed,
    id: parsed.id ?? `mea-${crypto.randomUUID()}`,
    measured_at: new Date(parsed.measured_at ?? Date.now()).toISOString(),
  };
  const data = await getAppData();
  if (!data.pools.some((pool: any) => pool.id === body.pool_id))
    return json({ error: "Pool not found" }, 404);
  const persisted = hasDatabase();
  if (persisted) {
    await query(
      `insert into measurements (id, pool_id, ph, chlorine, temperature, orp, alkalinity, hardness, notes, measured_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        body.id,
        body.pool_id,
        body.ph,
        body.chlorine,
        body.temperature,
        body.orp,
        body.alkalinity,
        body.hardness,
        body.notes,
        body.measured_at,
      ],
    );
    await refreshEcoScore(body.pool_id);
  }
  const result = await loadRequestedReport({
    month: new Date(body.measured_at).toISOString().slice(0, 7),
    pool: body.pool_id,
    measurement: body.id,
    lang: body.lang,
    ...(!persisted ? { observation: body } : {}),
  });
  if (result.error) return result.error;
  const analysis = await generateReportAnalysis(result.report, body.lang);
  const response = json({ ...body, analysis, persisted }, 201);
  response.headers.set("Cache-Control", "no-store");
  return response;
};
