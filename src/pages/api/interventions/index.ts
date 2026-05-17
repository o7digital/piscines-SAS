import type { APIRoute } from "astro";

import { json, readJson } from "../../../lib/api";
import { getAppData, hasDatabase, query, refreshEcoScore } from "../../../lib/db";

export const GET: APIRoute = async () => {
  const data = await getAppData();
  return json({ interventions: data.interventions });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await readJson<any>(request);
  const id = body.id ?? `int-${crypto.randomUUID()}`;

  if (hasDatabase()) {
    await query(
      `insert into interventions (id, pool_id, provider_id, type, status, scheduled_at, notes, report_url)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, body.pool_id, body.provider_id, body.type, body.status ?? "scheduled", body.scheduled_at, body.notes, body.report_url],
    );
    await refreshEcoScore(body.pool_id);
  }

  return json({ id, ...body }, 201);
};
