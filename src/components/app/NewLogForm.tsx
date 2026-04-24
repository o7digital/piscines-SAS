import { useEffect, useState, type FormEvent } from "react";

import type { LogEntry, Pool, Property } from "../../data/mock";
import { addLog } from "../../lib/storage";

type NewLogFormProps = {
  properties: Property[];
  pools: Pool[];
};

type FormState = {
  propertyId: string;
  poolId: string;
  dateTime: string;
  tempC: string;
  ph: string;
  chlorine: string;
  notes: string;
  coverOpen: boolean;
  gateLocked: boolean;
  signageOk: boolean;
};

function getDefaultDateTime(): string {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function buildInitialState(properties: Property[], pools: Pool[]): FormState {
  const defaultPropertyId = properties[0]?.id ?? "";
  const defaultPoolId = pools.find((pool) => pool.propertyId === defaultPropertyId)?.id ?? "";

  return {
    propertyId: defaultPropertyId,
    poolId: defaultPoolId,
    dateTime: getDefaultDateTime(),
    tempC: "27.0",
    ph: "7.4",
    chlorine: "2.0",
    notes: "",
    coverOpen: false,
    gateLocked: true,
    signageOk: true,
  };
}

export default function NewLogForm({ properties, pools }: NewLogFormProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(properties, pools));
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const availablePools = pools.filter((pool) => pool.propertyId === form.propertyId);

  useEffect(() => {
    const nextPools = pools.filter((pool) => pool.propertyId === form.propertyId);

    if (!nextPools.some((pool) => pool.id === form.poolId)) {
      setForm((current) => ({
        ...current,
        poolId: nextPools[0]?.id ?? "",
      }));
    }
  }, [pools, form.propertyId, form.poolId]);

  function updateForm<Value extends keyof FormState>(key: Value, value: FormState[Value]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validate(): string {
    if (!form.propertyId) {
      return "Select a property.";
    }

    if (!form.poolId) {
      return "Select a pool.";
    }

    const tempC = Number(form.tempC);
    const ph = Number(form.ph);
    const chlorine = Number(form.chlorine);

    if (Number.isNaN(tempC) || tempC < 0 || tempC > 45) {
      return "Water temperature must be between 0 and 45 C.";
    }

    if (Number.isNaN(ph) || ph < 0 || ph > 14) {
      return "pH must be between 0 and 14.";
    }

    if (Number.isNaN(chlorine) || chlorine < 0 || chlorine > 10) {
      return "Chlorine must be between 0 and 10 ppm.";
    }

    return "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextError = validate();

    if (nextError) {
      setError(nextError);
      setStatus("");
      return;
    }

    setIsSaving(true);
    setError("");

    const nextLog: LogEntry = {
      id: globalThis.crypto?.randomUUID?.() ?? `log-${Date.now()}`,
      propertyId: form.propertyId,
      poolId: form.poolId,
      createdAt: new Date(form.dateTime).toISOString(),
      tempC: Number(form.tempC),
      ph: Number(form.ph),
      chlorine: Number(form.chlorine),
      notes: form.notes.trim(),
      coverOpen: form.coverOpen,
      gateLocked: form.gateLocked,
      signageOk: form.signageOk,
    };

    addLog(nextLog);
    setStatus("Saved. Redirecting to logs...");

    window.setTimeout(() => {
      window.location.assign("/app/logs");
    }, 350);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-white/80">Property</span>
          <select
            value={form.propertyId}
            onChange={(event) => updateForm("propertyId", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/40"
          >
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-white/80">Pool</span>
          <select
            value={form.poolId}
            onChange={(event) => updateForm("poolId", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/40"
          >
            {availablePools.map((pool) => (
              <option key={pool.id} value={pool.id}>
                {pool.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-white/80">Date / time</span>
          <input
            type="datetime-local"
            value={form.dateTime}
            onChange={(event) => updateForm("dateTime", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/40"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-white/80">Water temp (C)</span>
          <input
            type="number"
            min="0"
            max="45"
            step="0.1"
            value={form.tempC}
            onChange={(event) => updateForm("tempC", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/40"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-white/80">pH</span>
          <input
            type="number"
            min="0"
            max="14"
            step="0.1"
            value={form.ph}
            onChange={(event) => updateForm("ph", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/40"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-white/80">Chlorine (ppm)</span>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={form.chlorine}
            onChange={(event) => updateForm("chlorine", event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/40"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-white/80">Notes</span>
        <textarea
          value={form.notes}
          onChange={(event) => updateForm("notes", event.target.value)}
          rows={4}
          placeholder="Anything the next shift or manager should know."
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/40"
        />
      </label>

      <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
        <div className="text-sm font-medium text-white/80">Operational checks</div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            <input
              type="checkbox"
              checked={form.coverOpen}
              onChange={(event) => updateForm("coverOpen", event.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-transparent text-emerald-400 focus:ring-emerald-400/30"
            />
            Cover open
          </label>
          <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            <input
              type="checkbox"
              checked={form.gateLocked}
              onChange={(event) => updateForm("gateLocked", event.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-transparent text-emerald-400 focus:ring-emerald-400/30"
            />
            Gate locked
          </label>
          <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            <input
              type="checkbox"
              checked={form.signageOk}
              onChange={(event) => updateForm("signageOk", event.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-transparent text-emerald-400 focus:ring-emerald-400/30"
            />
            Signage OK
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {status ? (
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {status}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/55">Saved locally in this browser for demo purposes.</p>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : "Save daily check"}
        </button>
      </div>
    </form>
  );
}
