import type { APIRoute } from "astro";

import { json, readJson } from "../../../lib/api";
import { getAppData, hasDatabase, query } from "../../../lib/db";

export const GET: APIRoute = async () => {
  const data = await getAppData();
  return json({ reports: data.reports });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await readJson<any>(request);
  const id = body.id ?? `rep-${crypto.randomUUID()}`;

  if (hasDatabase()) {
    await query(
      `insert into reports (id, pool_id, type, title, period_start, period_end, pdf_url, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (id) do update set type = excluded.type, title = excluded.title, period_start = excluded.period_start, period_end = excluded.period_end, pdf_url = excluded.pdf_url, status = excluded.status`,
      [id, body.pool_id, body.type, body.title, body.period_start, body.period_end, body.pdf_url, body.status ?? "draft"],
    );
  }

  return json({ id, ...body }, 201);
};
