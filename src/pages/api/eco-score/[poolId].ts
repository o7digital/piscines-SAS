import type { APIRoute } from "astro";

import { json } from "../../../lib/api";
import { getAppData, refreshEcoScore } from "../../../lib/db";

export const GET: APIRoute = async ({ params }) => {
  const poolId = params.poolId;
  if (!poolId) return json({ error: "poolId requis" }, 400);

  const data = await getAppData();
  const current = data.ecoScores.find((item: any) => item.pool_id === poolId);
  const calculated = await refreshEcoScore(poolId);

  return json({ eco_score: calculated ?? current });
};
