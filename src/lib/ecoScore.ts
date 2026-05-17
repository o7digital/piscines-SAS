export type EcoScoreInputPool = {
  id: string;
  volume?: number | null;
  treatment_type?: string | null;
};

export type EcoScoreInputMeasurement = {
  ph?: number | null;
  chlorine?: number | null;
  temperature?: number | null;
  orp?: number | null;
  measured_at?: string | Date | null;
};

export type EcoScoreInputIntervention = {
  type?: string | null;
  status?: string | null;
  scheduled_at?: string | Date | null;
};

export type EcoScoreResult = {
  water_score: number;
  energy_score: number;
  chemistry_score: number;
  transport_score: number;
  co2_score: number;
  global_score: number;
  grade: "A" | "B" | "C" | "D" | "E";
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function getEcoGrade(score: number): EcoScoreResult["grade"] {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "E";
}

export function calculateEcoScore(
  pool: EcoScoreInputPool,
  measurements: EcoScoreInputMeasurement[],
  interventions: EcoScoreInputIntervention[],
): EcoScoreResult {
  const latest = [...measurements].sort(
    (a, b) => new Date(b.measured_at ?? 0).getTime() - new Date(a.measured_at ?? 0).getTime(),
  )[0];

  let chemistry = 100;
  if (!latest) chemistry -= 35;
  if (latest?.ph == null || latest.ph < 7.2 || latest.ph > 7.6) chemistry -= 22;
  if (latest?.chlorine == null || latest.chlorine < 1.5 || latest.chlorine > 3.0) chemistry -= 22;
  if (latest?.orp != null && latest.orp < 650) chemistry -= 12;
  if (latest?.temperature != null && latest.temperature > 31) chemistry -= 8;

  const correctiveCount = interventions.filter((item) =>
    String(item.type ?? "").toLowerCase().includes("correct"),
  ).length;
  const regularityBonus = measurements.length >= 3 ? 8 : measurements.length * 2;
  const treatmentBonus = String(pool.treatment_type ?? "").toLowerCase().includes("salt") ? 6 : 0;
  const volumePenalty = Number(pool.volume ?? 0) > 80 ? 8 : 0;

  const water_score = clamp(78 + regularityBonus + treatmentBonus - volumePenalty - correctiveCount * 5);
  const energy_score = clamp(82 + treatmentBonus - volumePenalty - correctiveCount * 4);
  const chemistry_score = clamp(chemistry + regularityBonus);
  const transport_score = clamp(88 - correctiveCount * 12 + regularityBonus);
  const co2_score = clamp(84 - correctiveCount * 10 + treatmentBonus - volumePenalty);
  const global_score = clamp(
    water_score * 0.3 +
      energy_score * 0.3 +
      chemistry_score * 0.2 +
      transport_score * 0.1 +
      co2_score * 0.1,
  );

  return {
    water_score,
    energy_score,
    chemistry_score,
    transport_score,
    co2_score,
    global_score,
    grade: getEcoGrade(global_score),
  };
}
