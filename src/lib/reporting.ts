import { z } from "zod";
import { calculateEcoScore } from "./ecoScore";

export type ReportLanguage = "fr" | "en" | "es";
export const reportLanguage = z.enum(["fr", "en", "es"]);
export const reportMonth = z
  .string()
  .regex(/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/);
export const measurementInput = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  pool_id: z.string().trim().min(1).max(100),
  ph: z.number().finite().min(0).max(14),
  chlorine: z.number().finite().min(0).max(50),
  temperature: z.number().finite().min(0).max(60),
  orp: z.number().finite().min(-1000).max(1500).nullable().optional(),
  alkalinity: z.number().finite().min(0).max(1000).nullable().optional(),
  hardness: z.number().finite().min(0).max(2000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  measured_at: z.string().datetime({ offset: true }).optional(),
  lang: reportLanguage.default("fr"),
});
export type MeasurementInput = z.infer<typeof measurementInput>;
export const reportRequest = z.object({
  month: reportMonth,
  pool: z.string().trim().min(1).max(100).optional(),
  measurement: z.string().trim().min(1).max(100).optional(),
  observation: measurementInput.optional(),
  lang: reportLanguage.default("fr"),
});

// Monitoring reference ranges, not a regulatory certification.
export const reportRanges = { ph: [7.2, 7.6], chlorine: [1, 3] } as const;
type Row = Record<string, unknown>;
export type ReportDataset = {
  pools: Row[];
  measurements: Row[];
  operationalChecks: Row[];
  interventions: Row[];
};
export type ReportMeasurement = {
  id: string;
  measuredAt: string;
  ph: number | null;
  chlorine: number | null;
  temperature: number | null;
  orp: number | null;
  alkalinity: number | null;
  hardness: number | null;
};
export type ReportCheck = {
  id: string;
  checkedAt: string;
  status: string;
  coverOk: boolean | null;
  filtrationOk: boolean | null;
  safetyOk: boolean | null;
  cleanlinessOk: boolean | null;
};
export type ReportIntervention = {
  id: string;
  scheduledAt: string;
  type: string;
  status: string;
};
export type PoolReport = {
  poolId: string;
  poolName: string;
  propertyName: string;
  location: string;
  status: "stable" | "attention" | "empty";
  measurements: ReportMeasurement[];
  checks: ReportCheck[];
  interventions: ReportIntervention[];
  validMeasurements: number;
  waterAlerts: number;
  incompleteMeasurements: number;
  checkAlerts: number;
  incompleteChecks: number;
  urgentInterventions: number;
  completedInterventions: number;
  waterInRangePercent: number | null;
  averagePh: number | null;
  averageChlorine: number | null;
  ecoScore: number | null;
  ecoGrade: string | null;
};
export type MonthlyReport = {
  month: string;
  periodStart: string;
  periodEnd: string;
  pools: PoolReport[];
  focusedMeasurement?: ReportMeasurement;
  totals: {
    pools: number;
    measurements: number;
    checks: number;
    interventions: number;
    waterAlerts: number;
    checkAlerts: number;
    incompleteMeasurements: number;
    incompleteChecks: number;
    urgentInterventions: number;
    completedInterventions: number;
    attentionPools: number;
    waterInRangePercent: number | null;
    averageEcoScore: number | null;
  };
};

export function monthBounds(month: string) {
  reportMonth.parse(month);
  const [year, number] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, number - 1, 1));
  const end = new Date(Date.UTC(year, number, 1));
  return {
    start,
    end,
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: new Date(end.getTime() - 1).toISOString().slice(0, 10),
  };
}

function numeric(value: unknown): number | null {
  if (value == null || value === "" || typeof value === "boolean") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function dateValue(value: unknown): string {
  const date = new Date(value instanceof Date ? value : String(value ?? ""));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}
function bool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}
function average(values: (number | null)[]) {
  const numbers = values.filter((value): value is number => value !== null);
  return numbers.length
    ? Math.round(
        (numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 100,
      ) / 100
    : null;
}
const isInRange = (value: number, range: readonly [number, number]) =>
  value >= range[0] && value <= range[1];

export function buildMonthlyReport(
  data: ReportDataset,
  month: string,
  poolId?: string,
): MonthlyReport {
  const bounds = monthBounds(month);
  const periodRows = (rows: Row[], id: string, field: string) =>
    rows
      .filter(
        (row) =>
          row.pool_id === id &&
          dateValue(row[field]) >= bounds.start.toISOString() &&
          dateValue(row[field]) < bounds.end.toISOString(),
      )
      .sort((a, b) => dateValue(a[field]).localeCompare(dateValue(b[field])));
  const pools = data.pools
    .filter((pool) => !poolId || pool.id === poolId)
    .map((pool): PoolReport => {
      const id = String(pool.id);
      const rawMeasurements = periodRows(data.measurements, id, "measured_at");
      const rawInterventions = periodRows(
        data.interventions,
        id,
        "scheduled_at",
      );
      const measurements = rawMeasurements.map((row) => ({
        id: String(row.id),
        measuredAt: dateValue(row.measured_at),
        ph: numeric(row.ph),
        chlorine: numeric(row.chlorine),
        temperature: numeric(row.temperature),
        orp: numeric(row.orp),
        alkalinity: numeric(row.alkalinity),
        hardness: numeric(row.hardness),
      }));
      const checks = periodRows(data.operationalChecks, id, "checked_at").map(
        (row) => ({
          id: String(row.id),
          checkedAt: dateValue(row.checked_at),
          status: String(row.status ?? ""),
          coverOk: bool(row.cover_ok),
          filtrationOk: bool(row.filtration_ok),
          safetyOk: bool(row.safety_ok),
          cleanlinessOk: bool(row.cleanliness_ok),
        }),
      );
      const interventions = rawInterventions.map((row) => ({
        id: String(row.id),
        scheduledAt: dateValue(row.scheduled_at),
        type: String(row.type ?? ""),
        status: String(row.status ?? ""),
      }));
      const valid = measurements.filter(
        (item) => item.ph !== null && item.chlorine !== null,
      );
      const waterAlerts = valid.filter(
        (item) =>
          !isInRange(item.ph!, reportRanges.ph) ||
          !isInRange(item.chlorine!, reportRanges.chlorine),
      ).length;
      const incompleteMeasurements = measurements.length - valid.length;
      const checkValues = (item: ReportCheck) => [
        item.coverOk,
        item.filtrationOk,
        item.safetyOk,
        item.cleanlinessOk,
      ];
      const checkAlerts = checks.filter(
        (item) =>
          item.status === "attention" ||
          item.status === "critical" ||
          checkValues(item).includes(false),
      ).length;
      const incompleteChecks = checks.filter(
        (item) =>
          checkValues(item).includes(null) ||
          !["ok", "attention", "critical"].includes(item.status),
      ).length;
      const urgentInterventions = interventions.filter(
        (item) => item.status === "urgent",
      ).length;
      const completedInterventions = interventions.filter(
        (item) => item.status === "done",
      ).length;
      const empty =
        !measurements.length && !checks.length && !interventions.length;
      const attention =
        !valid.length ||
        waterAlerts +
          checkAlerts +
          incompleteMeasurements +
          incompleteChecks +
          urgentInterventions >
          0;
      const latest = measurements.at(-1);
      const eco =
        latest?.ph !== null && latest?.chlorine !== null && latest
          ? calculateEcoScore(
              {
                id,
                volume: numeric(pool.volume),
                treatment_type: String(pool.treatment_type ?? ""),
              },
              rawMeasurements.map((row) => ({
                ph: numeric(row.ph),
                chlorine: numeric(row.chlorine),
                temperature: numeric(row.temperature),
                orp: numeric(row.orp),
                measured_at: dateValue(row.measured_at),
              })),
              rawInterventions.map((row) => ({
                type: String(row.type ?? ""),
                status: String(row.status ?? ""),
                scheduled_at: dateValue(row.scheduled_at),
              })),
            )
          : null;
      return {
        poolId: id,
        poolName: String(pool.name ?? ""),
        propertyName: String(pool.property_name ?? ""),
        location: String(pool.location ?? ""),
        status: empty ? "empty" : attention ? "attention" : "stable",
        measurements,
        checks,
        interventions,
        validMeasurements: valid.length,
        waterAlerts,
        incompleteMeasurements,
        checkAlerts,
        incompleteChecks,
        urgentInterventions,
        completedInterventions,
        waterInRangePercent: valid.length
          ? Math.round(((valid.length - waterAlerts) / valid.length) * 100)
          : null,
        averagePh: average(measurements.map((item) => item.ph)),
        averageChlorine: average(measurements.map((item) => item.chlorine)),
        ecoScore: eco?.global_score ?? null,
        ecoGrade: eco?.grade ?? null,
      };
    });
  const sum = (getter: (pool: PoolReport) => number) =>
    pools.reduce((total, pool) => total + getter(pool), 0);
  const validCount = sum((pool) => pool.validMeasurements);
  const waterAlerts = sum((pool) => pool.waterAlerts);
  return {
    month,
    periodStart: bounds.periodStart,
    periodEnd: bounds.periodEnd,
    pools,
    totals: {
      pools: pools.length,
      measurements: sum((pool) => pool.measurements.length),
      checks: sum((pool) => pool.checks.length),
      interventions: sum((pool) => pool.interventions.length),
      waterAlerts,
      checkAlerts: sum((pool) => pool.checkAlerts),
      incompleteMeasurements: sum((pool) => pool.incompleteMeasurements),
      incompleteChecks: sum((pool) => pool.incompleteChecks),
      urgentInterventions: sum((pool) => pool.urgentInterventions),
      completedInterventions: sum((pool) => pool.completedInterventions),
      attentionPools: pools.filter((pool) => pool.status === "attention")
        .length,
      waterInRangePercent: validCount
        ? Math.round(((validCount - waterAlerts) / validCount) * 100)
        : null,
      averageEcoScore: average(pools.map((pool) => pool.ecoScore)),
    },
  };
}

export const analysisSchema = z.object({
  summary: z.string().trim().min(1).max(1800),
  highlights: z.array(z.string().trim().min(1).max(500)).min(1).max(5),
  recommendations: z.array(z.string().trim().min(1).max(500)).min(1).max(5),
});
export type ReportAnalysis = z.infer<typeof analysisSchema> & {
  source: "huggingface" | "rules";
  reason?:
    | "not_configured"
    | "auth"
    | "rate_limited"
    | "timeout"
    | "unavailable"
    | "invalid_response";
  generatedAt: string;
  model?: string;
};

export function automaticAnalysis(
  report: MonthlyReport,
  lang: ReportLanguage,
): ReportAnalysis {
  const t = report.totals;
  const alerts = t.waterAlerts + t.checkAlerts;
  const missing = t.incompleteMeasurements + t.incompleteChecks;
  const empty = !t.measurements && !t.checks && !t.interventions;
  const copy = {
    fr: {
      summary: empty
        ? `Aucune donnée enregistrée sur la période ${report.month}. L'état des bassins ne peut pas être évalué.`
        : `${t.measurements} mesures et ${t.checks} contrôles sur ${t.pools} bassin(s). ${t.attentionPools} bassin(s) à vérifier sur la période ${report.month}.`,
      water: `Mesures dans les plages de référence : ${t.waterInRangePercent === null ? "non évaluables" : `${t.waterInRangePercent} %`}.`,
      alerts: `${alerts} relevé(s) avec écart ou contrôle à reprendre ; ${missing} relevé(s) incomplet(s).`,
      interventions: `${t.completedInterventions} intervention(s) réalisée(s), ${t.urgentInterventions} urgente(s).`,
      action:
        alerts || t.urgentInterventions
          ? "Faire vérifier les écarts et les contrôles signalés par le pisciniste, puis documenter les nouvelles mesures."
          : "Poursuivre les mesures et contrôles réguliers, et documenter les interventions.",
      missing:
        "Compléter les relevés manquants avant de conclure sur l'état du bassin.",
    },
    en: {
      summary: empty
        ? `No data recorded for ${report.month}. Pool conditions cannot be assessed.`
        : `${t.measurements} measurements and ${t.checks} checks across ${t.pools} pool(s). ${t.attentionPools} pool(s) to review for ${report.month}.`,
      water: `Measurements within reference ranges: ${t.waterInRangePercent === null ? "not assessable" : `${t.waterInRangePercent}%`}.`,
      alerts: `${alerts} reading(s) outside reference ranges or failed checks; ${missing} incomplete record(s).`,
      interventions: `${t.completedInterventions} completed intervention(s), ${t.urgentInterventions} urgent.`,
      action:
        alerts || t.urgentInterventions
          ? "Ask the pool professional to review flagged readings and checks, then record follow-up measurements."
          : "Continue regular measurements and checks, and document interventions.",
      missing: "Complete missing records before assessing pool conditions.",
    },
    es: {
      summary: empty
        ? `No hay datos registrados para ${report.month}. No se puede evaluar el estado de las piscinas.`
        : `${t.measurements} mediciones y ${t.checks} controles en ${t.pools} piscina(s). ${t.attentionPools} piscina(s) por revisar en ${report.month}.`,
      water: `Mediciones dentro de los rangos de referencia: ${t.waterInRangePercent === null ? "no evaluables" : `${t.waterInRangePercent} %`}.`,
      alerts: `${alerts} registro(s) con desviaciones o controles pendientes; ${missing} registro(s) incompleto(s).`,
      interventions: `${t.completedInterventions} intervención(es) realizada(s), ${t.urgentInterventions} urgente(s).`,
      action:
        alerts || t.urgentInterventions
          ? "Pedir al profesional que revise las mediciones y controles señalados y registre nuevas mediciones."
          : "Continuar las mediciones y controles regulares y documentar las intervenciones.",
      missing:
        "Completar los registros faltantes antes de evaluar el estado de la piscina.",
    },
  }[lang];
  return {
    source: "rules",
    summary: copy.summary,
    highlights: [copy.water, copy.alerts, copy.interventions],
    recommendations: [
      copy.action,
      ...(empty ||
      missing ||
      report.pools.some((pool) => !pool.validMeasurements)
        ? [copy.missing]
        : []),
    ],
    generatedAt: new Date().toISOString(),
  };
}

export function reportCsv(report: MonthlyReport) {
  const quote = (value: unknown) => {
    let text = value == null ? "" : String(value);
    // Prevent spreadsheet formula execution from editable pool/property names.
    if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = [
    [
      "month",
      "pool",
      "property",
      "status",
      "measurements",
      "checks",
      "water_in_range_percent",
      "water_alerts",
      "check_alerts",
      "incomplete_measurements",
      "incomplete_checks",
      "completed_interventions",
      "urgent_interventions",
      "estimated_eco_score",
    ],
    ...report.pools.map((pool) => [
      report.month,
      pool.poolName,
      pool.propertyName,
      pool.status,
      pool.measurements.length,
      pool.checks.length,
      pool.waterInRangePercent,
      pool.waterAlerts,
      pool.checkAlerts,
      pool.incompleteMeasurements,
      pool.incompleteChecks,
      pool.completedInterventions,
      pool.urgentInterventions,
      pool.ecoScore,
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(quote).join(",")).join("\r\n");
}
