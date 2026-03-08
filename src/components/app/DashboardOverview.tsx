import { useEffect, useState } from "react";

import type { Alert, LogEntry, Pool, Property } from "../../data/mock";
import {
  formatDateTime,
  getDashboardStats,
  getSafetyFlags,
  isLogAttention,
  sortLogsDesc,
} from "../../lib/monitoring";
import { loadLogs } from "../../lib/storage";

type DashboardOverviewProps = {
  properties: Property[];
  pools: Pool[];
  alerts: Alert[];
  initialLogs: LogEntry[];
};

const severityClasses: Record<Alert["severity"], string> = {
  info: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  critical: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

export default function DashboardOverview({
  properties,
  pools,
  alerts,
  initialLogs,
}: DashboardOverviewProps) {
  const [logs, setLogs] = useState(initialLogs);

  useEffect(() => {
    setLogs(loadLogs());
  }, []);

  const propertyNames = new Map(properties.map((property) => [property.id, property.name]));
  const poolNames = new Map(pools.map((pool) => [pool.id, pool.name]));
  const recentLogs = sortLogsDesc(logs).slice(0, 10);
  const stats = getDashboardStats(pools, logs);

  function getStatusLabel(log: LogEntry) {
    const safetyFlags = getSafetyFlags(log);
    return safetyFlags[0] === "All checks passed" && isLogAttention(log)
      ? "Chemistry alert"
      : safetyFlags.join(", ");
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-white/60">Pools OK</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{stats.poolsOk}</div>
          <p className="mt-2 text-sm text-white/65">Latest chemistry and safety checks are within target.</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-white/60">Needs attention</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{stats.needsAttention}</div>
          <p className="mt-2 text-sm text-white/65">Out-of-range chemistry or unresolved safety actions.</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-white/60">Overdue checks</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{stats.overdueChecks}</div>
          <p className="mt-2 text-sm text-white/65">Pools missing a completed check in the current cycle.</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-white/60">Reports ready</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{stats.reportsReady}</div>
          <p className="mt-2 text-sm text-white/65">Properties with March activity ready for monthly review.</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Active alerts</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Watch list</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              {alerts.length} open
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${severityClasses[alert.severity]}`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-sm text-white/55">{propertyNames.get(alert.propertyId)}</span>
                </div>
                <div className="mt-3 text-base font-semibold text-white">{alert.title}</div>
                <p className="mt-2 text-sm leading-6 text-white/65">{alert.detail}</p>
                <div className="mt-3 text-xs text-white/45">{formatDateTime(alert.createdAt)}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Recent activity</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Last 10 checks</h2>
            </div>
            <a
              href="/app/logs"
              className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
            >
              View all logs
            </a>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-white/45">
                  <th className="border-b border-white/10 pb-3 pr-4 font-medium">Date/Time</th>
                  <th className="border-b border-white/10 pb-3 pr-4 font-medium">Property</th>
                  <th className="border-b border-white/10 pb-3 pr-4 font-medium">Pool</th>
                  <th className="border-b border-white/10 pb-3 pr-4 font-medium">Chemistry</th>
                  <th className="border-b border-white/10 pb-3 font-medium">Safety</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    className={index % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"}
                  >
                    <td className="border-b border-white/5 py-4 pr-4 text-white/75">{formatDateTime(log.createdAt)}</td>
                    <td className="border-b border-white/5 py-4 pr-4 text-white">
                      {propertyNames.get(log.propertyId)}
                    </td>
                    <td className="border-b border-white/5 py-4 pr-4 text-white/75">{poolNames.get(log.poolId)}</td>
                    <td className="border-b border-white/5 py-4 pr-4 text-white/75">
                      {log.tempC.toFixed(1)} C / pH {log.ph.toFixed(1)} / Cl {log.chlorine.toFixed(1)}
                    </td>
                    <td className="border-b border-white/5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          isLogAttention(log)
                            ? "bg-amber-400/10 text-amber-200"
                            : "bg-emerald-400/10 text-emerald-200"
                        }`}
                      >
                        {getStatusLabel(log)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
