import { useEffect, useState } from "react";

import type { LogEntry, Pool, Property } from "../../data/mock";
import { formatDateTime, getOperationalFlags, isLogAttention, sortLogsDesc } from "../../lib/monitoring";
import { loadLogs } from "../../lib/storage";

type LogsTableProps = {
  properties: Property[];
  pools: Pool[];
  initialLogs: LogEntry[];
  variant?: "recent" | "full";
};

export default function LogsTable({
  properties,
  pools,
  initialLogs,
  variant = "full",
}: LogsTableProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [attentionOnly, setAttentionOnly] = useState(false);

  useEffect(() => {
    setLogs(loadLogs());
  }, []);

  const propertyNames = new Map(properties.map((property) => [property.id, property.name]));
  const poolNames = new Map(pools.map((pool) => [pool.id, pool.name]));

  let visibleLogs = sortLogsDesc(logs);

  if (variant === "full" && selectedProperty !== "all") {
    visibleLogs = visibleLogs.filter((log) => log.propertyId === selectedProperty);
  }

  if (variant === "full" && attentionOnly) {
    visibleLogs = visibleLogs.filter((log) => isLogAttention(log));
  }

  if (variant === "recent") {
    visibleLogs = visibleLogs.slice(0, 10);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      {variant === "full" ? (
        <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Filters</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Daily checks</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="min-w-[220px]">
              <span className="sr-only">Filter by property</span>
              <select
                value={selectedProperty}
                onChange={(event) => setSelectedProperty(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/40"
              >
                <option value="all">All properties</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white/75">
              <input
                type="checkbox"
                checked={attentionOnly}
                onChange={(event) => setAttentionOnly(event.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-transparent text-emerald-400 focus:ring-emerald-400/30"
              />
              Only attention
            </label>
          </div>
        </div>
      ) : null}

      {visibleLogs.length === 0 ? (
        <div className="py-12 text-center">
          <h3 className="text-xl font-semibold text-white">No logs yet. Create your first daily check.</h3>
          <p className="mt-2 text-sm text-white/65">
            Use the quick action below to seed the activity feed for this property.
          </p>
          <a
            href="/app/logs/new"
            className="mt-5 inline-flex items-center rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
          >
            Create daily check
          </a>
        </div>
      ) : (
        <div className={`${variant === "full" ? "mt-6" : ""} overflow-x-auto`}>
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-white/45">
                <th className="border-b border-white/10 pb-3 pr-4 font-medium">Date/Time</th>
                <th className="border-b border-white/10 pb-3 pr-4 font-medium">Property</th>
                <th className="border-b border-white/10 pb-3 pr-4 font-medium">Pool</th>
                <th className="border-b border-white/10 pb-3 pr-4 font-medium">Temp</th>
                <th className="border-b border-white/10 pb-3 pr-4 font-medium">pH</th>
                <th className="border-b border-white/10 pb-3 pr-4 font-medium">Chlorine</th>
                <th className="border-b border-white/10 pb-3 pr-4 font-medium">Operational flags</th>
                <th className="border-b border-white/10 pb-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.map((log, index) => (
                <tr
                  key={log.id}
                  className={index % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"}
                >
                  <td className="border-b border-white/5 py-4 pr-4 text-white/75">{formatDateTime(log.createdAt)}</td>
                  <td className="border-b border-white/5 py-4 pr-4 text-white">
                    {propertyNames.get(log.propertyId)}
                  </td>
                  <td className="border-b border-white/5 py-4 pr-4 text-white/75">{poolNames.get(log.poolId)}</td>
                  <td className="border-b border-white/5 py-4 pr-4 text-white/75">{log.tempC.toFixed(1)} C</td>
                  <td className="border-b border-white/5 py-4 pr-4 text-white/75">{log.ph.toFixed(1)}</td>
                  <td className="border-b border-white/5 py-4 pr-4 text-white/75">{log.chlorine.toFixed(1)} ppm</td>
                  <td className="border-b border-white/5 py-4 pr-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        isLogAttention(log)
                          ? "bg-amber-400/10 text-amber-200"
                          : "bg-emerald-400/10 text-emerald-200"
                      }`}
                    >
                      {getOperationalFlags(log).join(", ")}
                    </span>
                  </td>
                  <td className="border-b border-white/5 py-4 text-white/65">
                    <span className="block max-w-sm truncate">{log.notes || "-"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
