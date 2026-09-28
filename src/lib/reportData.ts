import { mvpData } from "../data/mvp";
import { hasDatabase, query } from "./db";
import { monthBounds, type ReportDataset } from "./reporting";

export async function getReportPools() {
  if (!hasDatabase())
    return mvpData.pools.map((pool) => ({
      ...pool,
      property_name:
        mvpData.properties.find((property) => property.id === pool.property_id)
          ?.name ?? "",
    }));
  return query(`select p.*, prop.name as property_name from pools p
    left join properties prop on prop.id = p.property_id order by p.name`);
}

export async function getReportDataset(
  month: string,
  poolId?: string,
): Promise<ReportDataset> {
  const { start, end } = monthBounds(month);
  if (!hasDatabase()) return { ...mvpData, pools: await getReportPools() };
  const values = [start.toISOString(), end.toISOString(), poolId ?? null];
  const [pools, measurements, operationalChecks, interventions] =
    await Promise.all([
      query(
        `select p.*, prop.name as property_name from pools p left join properties prop on prop.id = p.property_id
      where ($1::text is null or p.id = $1) order by p.name`,
        [poolId ?? null],
      ),
      query(
        `select id, pool_id, ph, chlorine, temperature, orp, alkalinity, hardness, measured_at from measurements
      where measured_at >= $1 and measured_at < $2 and ($3::text is null or pool_id = $3) order by measured_at`,
        values,
      ),
      query(
        `select id, pool_id, cover_ok, filtration_ok, safety_ok, cleanliness_ok, status, checked_at from operational_checks
      where checked_at >= $1 and checked_at < $2 and ($3::text is null or pool_id = $3) order by checked_at`,
        values,
      ),
      query(
        `select id, pool_id, type, status, scheduled_at from interventions
      where scheduled_at >= $1 and scheduled_at < $2 and ($3::text is null or pool_id = $3) order by scheduled_at`,
        values,
      ),
    ]);
  return { pools, measurements, operationalChecks, interventions };
}

export function defaultReportMonth() {
  if (hasDatabase()) return new Date().toISOString().slice(0, 7);
  return (
    [...mvpData.measurements]
      .sort((a, b) => b.measured_at.localeCompare(a.measured_at))[0]
      ?.measured_at.slice(0, 7) ?? new Date().toISOString().slice(0, 7)
  );
}
