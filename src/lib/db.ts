import pg from "pg";

import { mvpData } from "../data/mvp";
import { calculateEcoScore } from "./ecoScore";

const { Pool } = pg;

let pool: pg.Pool | undefined;

export function hasDatabase() {
  return Boolean(import.meta.env.DATABASE_URL);
}

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: import.meta.env.DATABASE_URL,
      ssl: import.meta.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  }

  return pool;
}

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}

export async function getAppData() {
  if (!hasDatabase()) return mvpData;

  const [users, pools, measurements, interventions, ecoScores, poolPassports] = await Promise.all([
    query("select * from users order by created_at asc"),
    query("select * from pools order by created_at asc"),
    query("select * from measurements order by measured_at desc"),
    query("select * from interventions order by scheduled_at asc"),
    query("select * from eco_scores order by created_at desc"),
    query("select * from pool_passports order by created_at desc"),
  ]);

  return { users, pools, measurements, interventions, ecoScores, poolPassports };
}

export async function refreshEcoScore(poolId: string) {
  const data = await getAppData();
  const poolRecord = data.pools.find((item: any) => item.id === poolId);
  if (!poolRecord) return null;

  const score = calculateEcoScore(
    poolRecord as any,
    data.measurements.filter((item: any) => item.pool_id === poolId) as any,
    data.interventions.filter((item: any) => item.pool_id === poolId) as any,
  );

  if (hasDatabase()) {
    await query(
      `insert into eco_scores
        (pool_id, water_score, energy_score, chemistry_score, transport_score, co2_score, global_score, grade)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        poolId,
        score.water_score,
        score.energy_score,
        score.chemistry_score,
        score.transport_score,
        score.co2_score,
        score.global_score,
        score.grade,
      ],
    );
  }

  return score;
}
