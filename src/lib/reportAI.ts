import { createHash } from "node:crypto";
import {
  analysisSchema,
  automaticAnalysis,
  type MonthlyReport,
  type ReportAnalysis,
  type ReportLanguage,
} from "./reporting";

type AIConfig = {
  token?: string;
  model?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
};
const cache = new Map<string, { expires: number; analysis: ReportAnalysis }>();
const pending = new Map<string, Promise<ReportAnalysis>>();
const MAX_CACHE = 100;

function environmentConfig() {
  return {
    token: process.env.HF_TOKEN ?? import.meta.env?.HF_TOKEN,
    model: process.env.HF_MODEL ?? import.meta.env?.HF_MODEL,
  };
}
export function reportAIConfigured() {
  const { token, model } = environmentConfig();
  return Boolean(token?.trim() && model?.trim());
}

export async function generateReportAnalysis(
  report: MonthlyReport,
  lang: ReportLanguage,
  config: AIConfig = {},
): Promise<ReportAnalysis> {
  const environment = environmentConfig();
  const token = config.token ?? environment.token;
  const model = config.model ?? environment.model;
  const fallback = (reason: ReportAnalysis["reason"]) => ({
    ...automaticAnalysis(report, lang),
    reason,
  });
  if (!token?.trim() || !model?.trim()) return fallback("not_configured");
  if (
    !report.totals.measurements &&
    !report.totals.checks &&
    !report.totals.interventions
  )
    return automaticAnalysis(report, lang);
  // Observations are anonymized: no owners, addresses, notes or credentials.
  let remainingMeasurements = 200;
  const evidence = {
    month: report.month,
    ranges: { ph: [7.2, 7.6], chlorine_mg_l: [1, 3] },
    totals: report.totals,
    focusedMeasurement: report.focusedMeasurement
      ? { ...report.focusedMeasurement, id: undefined }
      : undefined,
    pools: [...report.pools]
      .sort(
        (a, b) =>
          Number(b.status === "attention") - Number(a.status === "attention"),
      )
      .slice(0, 30)
      .map((pool) => {
        const selected =
          remainingMeasurements > 0
            ? pool.measurements.slice(-Math.min(remainingMeasurements, 60))
            : [];
        remainingMeasurements -= selected.length;
        return {
          status: pool.status,
          measurements: pool.measurements.length,
          checks: pool.checks.length,
          averagePh: pool.averagePh,
          averageChlorine: pool.averageChlorine,
          waterInRangePercent: pool.waterInRangePercent,
          waterAlerts: pool.waterAlerts,
          checkAlerts: pool.checkAlerts,
          incompleteMeasurements: pool.incompleteMeasurements,
          incompleteChecks: pool.incompleteChecks,
          urgentInterventions: pool.urgentInterventions,
          completedInterventions: pool.completedInterventions,
          estimatedEcoScore: pool.ecoScore,
          changes: Object.fromEntries(
            [
              "ph",
              "chlorine",
              "temperature",
              "orp",
              "alkalinity",
              "hardness",
            ].map((field) => {
              const values = pool.measurements
                .map((item) => item[field as keyof typeof item])
                .filter((value): value is number => typeof value === "number");
              return [
                field,
                values.length > 1
                  ? {
                      first: values[0],
                      last: values.at(-1),
                      delta:
                        Math.round((values.at(-1)! - values[0]) * 100) / 100,
                    }
                  : null,
              ];
            }),
          ),
          observations: selected.map(({ id, ...values }) => values),
          omittedMeasurements: pool.measurements.length - selected.length,
        };
      }),
    omittedPools: Math.max(0, report.pools.length - 30),
  };
  const key = createHash("sha256")
    .update(
      JSON.stringify({
        model,
        lang,
        evidence,
        tokenHash: createHash("sha256").update(token).digest("hex"),
      }),
    )
    .digest("hex");
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.analysis;
  if (pending.has(key)) return pending.get(key)!;
  const task = (async (): Promise<ReportAnalysis> => {
    try {
      const response = await (config.fetcher ?? fetch)(
        "https://router.huggingface.co/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(config.timeoutMs ?? 45000),
          body: JSON.stringify({
            model,
            max_tokens: 1400,
            temperature: 0.2,
            stream: false,
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "pool_report",
                strict: true,
                schema: {
                  type: "object",
                  additionalProperties: false,
                  required: ["summary", "highlights", "recommendations"],
                  properties: {
                    summary: { type: "string" },
                    highlights: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 1,
                      maxItems: 5,
                    },
                    recommendations: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 1,
                      maxItems: 5,
                    },
                  },
                },
              },
            },
            messages: [
              {
                role: "system",
                content: `You are the Bluu3 pool reporting assistant powered by Hugging Face. Write exclusively in ${{ fr: "French (use bassin, chlore, alcalinité, dureté; never pool or chlorine)", en: "English", es: "Spanish" }[lang]}. Analyze the provided measurements: pH, chlorine (mg/L), temperature (C), ORP (mV), alkalinity (mg/L), hardness (mg/L), and changes over time. When focusedMeasurement is provided, make that single observation the subject of the summary and recommendations; other data are monthly context. Use the precomputed changes.delta to describe trends; do not call a parameter stable when its delta is nonzero. Historical readings describe their recorded dates, not the present day. Summarize only the provided evidence. Values and reference ranges are fixed; do not invent observations, legal compliance, savings, diagnoses, chemical dosages or swimming authorization. Only pH and chlorine have supplied reference ranges. For ORP, temperature, alkalinity and hardness, describe recorded values and trends; do not classify them as normal or abnormal or invent target ranges. If needed, recommend professional comparison with the equipment and product specifications. Flag missing data. The eco score is an MVP estimate, not measured environmental savings. Prioritize urgent interventions and checks. Individual pools are anonymized; do not refer to B1/B2 identifiers in your output. If omittedPools or omittedMeasurements is positive, use aggregates for complete-period statements and acknowledge limited detail. Return ONLY JSON with summary (short paragraph), highlights (1-5 short strings), recommendations (1-5 actionable strings for the professional).`,
              },
              { role: "user", content: JSON.stringify(evidence) },
            ],
          }),
        },
      );
      if (!response.ok) {
        // Never return provider bodies: they can echo configuration or sensitive request data.
        return fallback(
          response.status === 401 || response.status === 403
            ? "auth"
            : response.status === 429
              ? "rate_limited"
              : "unavailable",
        );
      }
      const body = await response.json();
      const content = body?.choices?.[0]?.message?.content;
      if (
        typeof content !== "string" ||
        body?.choices?.[0]?.finish_reason === "length"
      )
        return fallback("invalid_response");
      const clean = content
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
      let parsed;
      try {
        parsed = analysisSchema.safeParse(JSON.parse(clean));
      } catch {
        return fallback("invalid_response");
      }
      if (!parsed.success) return fallback("invalid_response");
      const analysis: ReportAnalysis = {
        ...parsed.data,
        source: "huggingface",
        model,
        generatedAt: new Date().toISOString(),
      };
      if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
      cache.set(key, { analysis, expires: Date.now() + 15 * 60 * 1000 });
      return analysis;
    } catch (error) {
      return fallback(
        error instanceof Error &&
          ["TimeoutError", "AbortError"].includes(error.name)
          ? "timeout"
          : "unavailable",
      );
    }
  })();
  pending.set(key, task);
  try {
    return await task;
  } finally {
    pending.delete(key);
  }
}
