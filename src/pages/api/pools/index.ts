import type { APIRoute } from "astro";

import { json, readJson } from "../../../lib/api";
import { getAppData, hasDatabase, query } from "../../../lib/db";

export const GET: APIRoute = async () => {
  const data = await getAppData();
  return json({ pools: data.pools });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await readJson<any>(request);
  const id = body.id ?? `pool-${crypto.randomUUID()}`;

  if (hasDatabase()) {
    await query(
      `insert into pools (id, name, location, owner_id, provider_id, volume, treatment_type, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, body.name, body.location, body.owner_id, body.provider_id, body.volume, body.treatment_type, body.status ?? "ok"],
    );
  }

  return json({ id, ...body }, 201);
};
