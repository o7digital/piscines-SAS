import type { APIRoute } from "astro";

import { json, readJson } from "../../../lib/api";
import { getAppData, hasDatabase, query } from "../../../lib/db";

export const GET: APIRoute = async () => {
  const data = await getAppData();
  return json({ operational_checks: data.operationalChecks });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await readJson<any>(request);
  const id = body.id ?? `chk-${crypto.randomUUID()}`;

  if (hasDatabase()) {
    await query(
      `insert into operational_checks
        (id, pool_id, provider_id, cover_ok, filtration_ok, safety_ok, cleanliness_ok, status, notes, checked_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,coalesce($10, now()))
       on conflict (id) do update set cover_ok = excluded.cover_ok, filtration_ok = excluded.filtration_ok, safety_ok = excluded.safety_ok, cleanliness_ok = excluded.cleanliness_ok, status = excluded.status, notes = excluded.notes, checked_at = excluded.checked_at`,
      [
        id,
        body.pool_id,
        body.provider_id,
        Boolean(body.cover_ok ?? true),
        Boolean(body.filtration_ok ?? true),
        Boolean(body.safety_ok ?? true),
        Boolean(body.cleanliness_ok ?? true),
        body.status ?? "ok",
        body.notes ?? "",
        body.checked_at,
      ],
    );
  }

  return json({ id, ...body }, 201);
};
