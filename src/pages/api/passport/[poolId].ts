import type { APIRoute } from "astro";

import { json } from "../../../lib/api";
import { getAppData } from "../../../lib/db";

export const GET: APIRoute = async ({ params }) => {
  const data = await getAppData();
  const pool = data.pools.find((item: any) => item.id === params.poolId);
  if (!pool) return json({ error: "Piscine introuvable" }, 404);

  return json({
    pool,
    property: data.properties.find((item: any) => item.id === pool.property_id),
    owner: data.users.find((item: any) => item.id === pool.owner_id),
    provider: data.users.find((item: any) => item.id === pool.provider_id),
    measurements: data.measurements.filter((item: any) => item.pool_id === pool.id),
    operational_checks: data.operationalChecks.filter((item: any) => item.pool_id === pool.id),
    interventions: data.interventions.filter((item: any) => item.pool_id === pool.id),
    eco_score: data.ecoScores.find((item: any) => item.pool_id === pool.id),
    passport: data.poolPassports.find((item: any) => item.pool_id === pool.id),
    reports: data.reports.filter((item: any) => item.pool_id === pool.id),
  });
};
