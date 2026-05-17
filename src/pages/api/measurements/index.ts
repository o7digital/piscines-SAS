import type { APIRoute } from "astro";

import { json, readJson } from "../../../lib/api";
import { getAppData, hasDatabase, query, refreshEcoScore } from "../../../lib/db";

export const GET: APIRoute = async () => {
  const data = await getAppData();
  return json({ measurements: data.measurements });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await readJson<any>(request);
  const id = body.id ?? `mea-${crypto.randomUUID()}`;

  if (hasDatabase()) {
    await query(
      `insert into measurements (id, pool_id, ph, chlorine, temperature, orp, alkalinity, hardness, notes, measured_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,coalesce($10, now()))`,
      [id, body.pool_id, body.ph, body.chlorine, body.temperature, body.orp, body.alkalinity, body.hardness, body.notes, body.measured_at],
    );
    await refreshEcoScore(body.pool_id);
  }

  return json({ id, ...body }, 201);
};
