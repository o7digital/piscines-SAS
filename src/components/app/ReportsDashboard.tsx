import { useState } from "react";
import { reportCopy } from "../../lib/reportCopy";
import type {
  MonthlyReport,
  PoolReport,
  ReportAnalysis,
  ReportLanguage,
  ReportMeasurement,
} from "../../lib/reporting";
import ReportAnalysisPanel, { downloadReport } from "./ReportAnalysis";

type Props = {
  report: MonthlyReport;
  lang: ReportLanguage;
  selectedPool?: string;
  pools: { id: string; name: string }[];
  demo: boolean;
  aiEnabled: boolean;
  initialAnalysis: ReportAnalysis;
};
const inputStyle =
  "w-full min-w-0 rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300";

function Trend({
  measurements,
  field,
  lang,
}: {
  measurements: ReportMeasurement[];
  field: "ph" | "chlorine";
  lang: ReportLanguage;
}) {
  const data = measurements.filter((item) => item[field] !== null);
  const reference = field === "ph" ? [7.2, 7.6] : [1, 3];
  if (!data.length) return null;
  const min = Math.min(reference[0] - 0.3, ...data.map((item) => item[field]!));
  const max = Math.max(reference[1] + 0.3, ...data.map((item) => item[field]!));
  const timeMin = new Date(data[0].measuredAt).getTime();
  const timeMax = new Date(data.at(-1)!.measuredAt).getTime();
  const x = (item: ReportMeasurement) =>
    timeMax === timeMin
      ? 245
      : 45 +
        ((new Date(item.measuredAt).getTime() - timeMin) /
          (timeMax - timeMin)) *
          400;
  const y = (value: number) => 135 - ((value - min) / (max - min)) * 105;
  const c = reportCopy[lang];
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
      <p className="text-sm font-medium">
        {field === "ph" ? c.ph : `${c.chlorine} · mg/L`}
      </p>
      <svg
        viewBox="0 0 470 165"
        className="mt-2 w-full"
        role="img"
        aria-label={`${c.trends}: ${field === "ph" ? c.ph : c.chlorine}`}
      >
        <rect
          x="45"
          y={y(reference[1])}
          width="400"
          height={y(reference[0]) - y(reference[1])}
          fill="#34d399"
          opacity="0.1"
        />
        {reference.map((value) => (
          <g key={value}>
            <line
              x1="45"
              x2="445"
              y1={y(value)}
              y2={y(value)}
              stroke="#34d399"
              strokeDasharray="4 4"
              opacity="0.5"
            />
            <text x="4" y={y(value) + 4} fill="#94a3b8" fontSize="11">
              {value.toLocaleString(lang)}
            </text>
          </g>
        ))}
        <polyline
          points={data.map((item) => `${x(item)},${y(item[field]!)}`).join(" ")}
          fill="none"
          stroke="#6ee7b7"
          strokeWidth="2"
        />
        {data.map((item) => (
          <circle
            key={item.id}
            cx={x(item)}
            cy={y(item[field]!)}
            r="4"
            fill={
              item[field]! < reference[0] || item[field]! > reference[1]
                ? "#fbbf24"
                : "#6ee7b7"
            }
          >
            <title>{`${new Date(item.measuredAt).toLocaleDateString(lang, { timeZone: "UTC" })}: ${item[field]}`}</title>
          </circle>
        ))}
        <text x="45" y="158" fill="#94a3b8" fontSize="11">
          {new Date(data[0].measuredAt).toLocaleDateString(lang, {
            timeZone: "UTC",
          })}
        </text>
        {data.length > 1 && (
          <text x="445" y="158" textAnchor="end" fill="#94a3b8" fontSize="11">
            {new Date(data.at(-1)!.measuredAt).toLocaleDateString(lang, {
              timeZone: "UTC",
            })}
          </text>
        )}
      </svg>
    </div>
  );
}

export default function ReportsDashboard({
  report,
  lang,
  selectedPool,
  pools,
  demo,
  aiEnabled,
  initialAnalysis,
}: Props) {
  const c = reportCopy[lang];
  const [detailId, setDetailId] = useState(
    report.pools.find((pool) => pool.status === "attention")?.poolId ??
      report.pools[0]?.poolId,
  );
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const detail = report.pools.find((pool) => pool.poolId === detailId);
  const input = {
    month: report.month,
    ...(selectedPool ? { pool: selectedPool } : {}),
    lang,
  };
  const query = new URLSearchParams(input);
  const number = (value: number | null) =>
    value === null ? "—" : value.toLocaleString(lang);
  const status = (pool: PoolReport) =>
    pool.status === "stable"
      ? c.stable
      : pool.status === "attention"
        ? c.review
        : c.empty;
  const tone = (pool: PoolReport) =>
    pool.status === "attention"
      ? "bg-amber-400/10 text-amber-100"
      : pool.status === "stable"
        ? "bg-emerald-400/10 text-emerald-100"
        : "bg-white/5 text-white/50";
  async function exportPdf() {
    setExporting(true);
    setError("");
    try {
      await downloadReport(input);
    } catch (error) {
      setError(
        error instanceof Error && error.message === "rate_limited"
          ? c.rateLimited
          : c.error,
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            {c.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            {c.title}
          </h1>
          <p className="mt-3 text-white/65">{c.intro}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void exportPdf()}
            disabled={exporting}
            className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {exporting ? c.exporting : c.pdf}
          </button>
          <a
            href={`/api/reports/export?${query}`}
            className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/5"
          >
            {c.csv}
          </a>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-amber-100">
          {error}
        </p>
      )}
      {demo && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
          <span className="font-medium text-amber-100">{c.demo}</span>
          <p className="mt-1 text-xs">{c.demoNote}</p>
        </div>
      )}
      <form
        method="get"
        className="grid items-end gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 sm:grid-cols-[1fr_2fr_auto]"
      >
        <label className="min-w-0 space-y-2">
          <span className="text-sm text-white/70">{c.month}</span>
          <input
            type="month"
            name="month"
            min="1900-01"
            max="2199-12"
            defaultValue={report.month}
            required
            className={inputStyle}
          />
        </label>
        <label className="min-w-0 space-y-2">
          <span className="text-sm text-white/70">{c.pool}</span>
          <select
            aria-label={c.pool}
            name="pool"
            defaultValue={selectedPool ?? ""}
            className={inputStyle}
          >
            <option value="">{c.allPools}</option>
            {pools.map((pool) => (
              <option key={pool.id} value={pool.id}>
                {pool.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
        >
          {c.apply}
        </button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            c.measurements,
            report.totals.measurements,
            `${report.totals.checks} ${c.checks.toLowerCase()}`,
          ],
          [
            c.attention,
            report.totals.attentionPools,
            `${report.totals.waterAlerts} ${c.waterAlerts}`,
          ],
          [
            c.range,
            report.totals.waterInRangePercent === null
              ? "—"
              : `${report.totals.waterInRangePercent}%`,
            c.assessed,
          ],
          [
            c.completed,
            report.totals.completedInterventions,
            `${report.totals.urgentInterventions} ${c.urgent}`,
          ],
        ].map(([label, value, note]) => (
          <article
            key={label}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <p className="text-sm text-white/55">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-emerald-200">
              {value}
            </p>
            <p className="mt-2 text-xs text-white/50">{note}</p>
          </article>
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <h2 className="text-xl font-semibold">{c.portfolio}</h2>
          {!report.pools.length && <p className="text-white/65">{c.noPools}</p>}
          {report.pools.map((pool) => (
            <article
              key={pool.poolId}
              className={`rounded-2xl border p-5 ${detailId === pool.poolId ? "border-emerald-400/35 bg-emerald-400/5" : "border-white/10 bg-white/5"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{pool.poolName}</h3>
                  <p className="mt-1 text-xs text-white/50">
                    {pool.propertyName} · {pool.location}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${tone(pool)}`}
                >
                  {status(pool)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/65">
                <span>
                  {pool.measurements.length} {c.measurements.toLowerCase()}
                </span>
                <span>
                  {pool.checks.length} {c.checks.toLowerCase()}
                </span>
                <span>
                  {number(pool.waterInRangePercent)}
                  {pool.waterInRangePercent === null ? "" : "%"} ·{" "}
                  {c.range.toLowerCase()}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${pool.waterInRangePercent ?? 0}%` }}
                />
              </div>
              {pool.status === "attention" && (
                <p className="mt-3 text-xs text-amber-100">
                  {pool.waterAlerts} {c.waterAlerts} · {pool.checkAlerts}{" "}
                  {c.checkAlerts} ·{" "}
                  {pool.incompleteMeasurements + pool.incompleteChecks}{" "}
                  {c.incomplete}
                </p>
              )}
              {pool.status === "empty" && (
                <p className="mt-3 text-xs text-white/50">{c.noData}</p>
              )}
              <button
                type="button"
                onClick={() => setDetailId(pool.poolId)}
                aria-pressed={detailId === pool.poolId}
                className="mt-4 text-sm font-semibold text-emerald-200 hover:text-emerald-100"
              >
                {c.selectPool} →
              </button>
            </article>
          ))}
        </div>
        <ReportAnalysisPanel
          input={input}
          initialAnalysis={initialAnalysis}
          enabled={aiEnabled}
          autoAnalyze
        />
      </div>
      {detail && (
        <article className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                {c.detail}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{detail.poolName}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/50">{c.eco}</p>
              <p className="mt-1 font-semibold text-emerald-200">
                {number(detail.ecoScore)}
                {detail.ecoScore === null ? "" : `/100 · ${detail.ecoGrade}`}
              </p>
            </div>
          </div>
          <p className="text-xs text-white/50">{c.ecoNote}</p>
          <h3 className="text-sm font-semibold">{c.trends}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Trend measurements={detail.measurements} field="ph" lang={lang} />
            <Trend
              measurements={detail.measurements}
              field="chlorine"
              lang={lang}
            />
          </div>
          <p className="text-xs text-white/50">{c.reference}</p>
          {!detail.measurements.length ? (
            <p className="text-sm text-white/60">{c.noMeasurements}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-white/45">
                  <tr>
                    {[
                      c.date,
                      "pH",
                      `${c.chlorine} mg/L`,
                      `${c.temperature} °C`,
                      "ORP mV",
                      "TAC mg/L",
                      "TH mg/L",
                    ].map((title) => (
                      <th key={title} className="whitespace-nowrap p-3">
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.measurements.map((item) => (
                    <tr key={item.id} className="border-t border-white/10">
                      <td className="whitespace-nowrap p-3">
                        {new Date(item.measuredAt).toLocaleString(lang, {
                          timeZone: "UTC",
                        })}
                      </td>
                      {[
                        item.ph,
                        item.chlorine,
                        item.temperature,
                        item.orp,
                        item.alkalinity,
                        item.hardness,
                      ].map((value, index) => (
                        <td key={index} className="p-3 text-white/70">
                          {number(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      )}
    </section>
  );
}
