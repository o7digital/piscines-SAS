import { useState, type FormEvent } from "react";
import ReportAnalysisPanel from "./ReportAnalysis";
import type {
  MeasurementInput,
  ReportAnalysis,
  ReportMeasurement,
} from "../../lib/reporting";

type Measurement = ReportMeasurement & {
  poolId: string;
  poolName: string;
  notes: string;
};
type Props = {
  measurements: Measurement[];
  pools: { id: string; name: string }[];
  aiEnabled: boolean;
  demo: boolean;
};
const fieldStyle =
  "w-full rounded-xl border border-white/15 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-emerald-300";

export default function MeasurementsReview({
  measurements: initialMeasurements,
  pools,
  aiEnabled,
  demo,
}: Props) {
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const [selectedId, setSelectedId] = useState(initialMeasurements[0]?.id);
  const [poolFilter, setPoolFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAnalysis, setSavedAnalysis] = useState<ReportAnalysis>();
  const [demoNotice, setDemoNotice] = useState(false);
  const [demoObservations, setDemoObservations] = useState<
    Record<string, MeasurementInput>
  >({});
  const selected = measurements.find((item) => item.id === selectedId);
  const filtered = measurements.filter(
    (item) => !poolFilter || item.poolId === poolFilter,
  );
  const format = (value: number | null) =>
    value === null ? "—" : value.toLocaleString("fr");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {
      pool_id: form.get("pool_id"),
      lang: "fr",
    };
    for (const name of [
      "ph",
      "chlorine",
      "temperature",
      "orp",
      "alkalinity",
      "hardness",
    ]) {
      const value = form.get(name);
      body[name] = value === "" || value == null ? null : Number(value);
    }
    body.notes = form.get("notes");
    body.measured_at = new Date(String(form.get("measured_at"))).toISOString();
    try {
      const response = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? "Trop de demandes. Réessayez dans une minute."
            : "La mesure n’a pas pu être traitée. Vérifiez les valeurs et réessayez.",
        );
      const result = await response.json();
      const measurement: Measurement = {
        id: result.id,
        poolId: result.pool_id,
        poolName: pools.find((pool) => pool.id === result.pool_id)?.name ?? "",
        measuredAt: result.measured_at,
        ph: result.ph,
        chlorine: result.chlorine,
        temperature: result.temperature,
        orp: result.orp,
        alkalinity: result.alkalinity,
        hardness: result.hardness,
        notes: result.notes ?? "",
      };
      setMeasurements((current) => [measurement, ...current]);
      setSelectedId(result.id);
      setPoolFilter("");
      setSavedAnalysis(result.analysis);
      setDemoNotice(!result.persisted);
      if (!result.persisted)
        setDemoObservations((current) => ({ ...current, [result.id]: result }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur de connexion.");
    } finally {
      setSaving(false);
    }
  }

  function choose(id: string) {
    setSelectedId(id);
    setSavedAnalysis(undefined);
    setDemoNotice(false);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
            Suivi & analyse IA
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Mesures piscine</h1>
          <p className="mt-3 max-w-2xl text-white/65">
            Chaque relevé peut être analysé par Hugging Face pour identifier les
            écarts et recommander les prochaines actions.
          </p>
        </div>
        <a
          href="/app/reports"
          className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/5"
        >
          Voir les rapports IA →
        </a>
      </div>
      {demo && (
        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-amber-100">
          Mode démonstration : données d’exemple. Les nouvelles saisies sont
          analysées, mais leur sauvegarde durable nécessite la connexion de la
          base de données.
        </p>
      )}
      <details className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <summary className="cursor-pointer font-semibold text-emerald-200">
          Nouvelle mesure · analyse Hugging Face incluse
        </summary>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-white/65">Piscine</span>
              <select name="pool_id" required className={fieldStyle}>
                {pools.map((pool) => (
                  <option key={pool.id} value={pool.id}>
                    {pool.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/65">Date et heure</span>
              <input
                type="datetime-local"
                name="measured_at"
                required
                className={fieldStyle}
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                name: "ph",
                label: "pH",
                min: 0,
                max: 14,
                step: 0.1,
                required: true,
              },
              {
                name: "chlorine",
                label: "Chlore · mg/L",
                min: 0,
                max: 50,
                step: 0.1,
                required: true,
              },
              {
                name: "temperature",
                label: "Température · °C",
                min: 0,
                max: 60,
                step: 0.1,
                required: true,
              },
              {
                name: "orp",
                label: "ORP · mV",
                min: -1000,
                max: 1500,
                step: 1,
                required: false,
              },
              {
                name: "alkalinity",
                label: "Alcalinité (TAC) · mg/L",
                min: 0,
                max: 1000,
                step: 1,
                required: false,
              },
              {
                name: "hardness",
                label: "Dureté (TH) · mg/L",
                min: 0,
                max: 2000,
                step: 1,
                required: false,
              },
            ].map((field) => (
              <label key={field.name} className="space-y-2">
                <span className="text-sm text-white/65">
                  {field.label}
                  {field.required ? " *" : ""}
                </span>
                <input
                  type="number"
                  name={field.name}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  required={field.required}
                  className={fieldStyle}
                />
              </label>
            ))}
          </div>
          <label className="block space-y-2">
            <span className="text-sm text-white/65">Notes</span>
            <textarea name="notes" maxLength={2000} className={fieldStyle} />
          </label>
          {error && (
            <p role="alert" className="text-sm text-amber-100">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving || !pools.length}
            className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {saving ? "Analyse en cours…" : "Enregistrer et analyser"}
          </button>
        </form>
      </details>
      <div className="grid items-start gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-white/65">Filtrer les relevés</span>
            <select
              value={poolFilter}
              onChange={(event) => {
                const value = event.target.value;
                setPoolFilter(value);
                const next = measurements.find(
                  (item) => !value || item.poolId === value,
                );
                if (next) choose(next.id);
              }}
              className={fieldStyle}
            >
              <option value="">Toutes les piscines</option>
              {pools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.name}
                </option>
              ))}
            </select>
          </label>
          {!filtered.length && (
            <p className="text-white/65">Aucun relevé disponible.</p>
          )}
          {filtered.map((item) => (
            <article
              key={item.id}
              className={`rounded-2xl border p-5 ${item.id === selectedId ? "border-emerald-400/35 bg-emerald-400/5" : "border-white/10 bg-white/5"}`}
            >
              <h2 className="font-semibold">{item.poolName}</h2>
              <p className="mt-1 text-xs text-white/50">
                {new Date(item.measuredAt).toLocaleString("fr-FR", {
                  timeZone: "UTC",
                })}{" "}
                UTC
              </p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                {[
                  ["pH", item.ph],
                  ["Chlore mg/L", item.chlorine],
                  ["Temp. °C", item.temperature],
                  ["ORP mV", item.orp],
                  ["TAC mg/L", item.alkalinity],
                  ["TH mg/L", item.hardness],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <dt className="text-xs text-white/45">{label}</dt>
                    <dd className="mt-1 font-semibold">
                      {format(value as number | null)}
                    </dd>
                  </div>
                ))}
              </dl>
              {item.notes && (
                <p className="mt-3 text-sm text-white/55">{item.notes}</p>
              )}
              <button
                type="button"
                aria-pressed={item.id === selectedId}
                onClick={() => choose(item.id)}
                className="mt-4 text-sm font-semibold text-emerald-200"
              >
                Analyser ce relevé avec Hugging Face →
              </button>
            </article>
          ))}
        </div>
        <div className="space-y-3 xl:sticky xl:top-28">
          {selected && (
            <>
              <p className="text-sm text-white/65">
                Analyse du relevé :{" "}
                <span className="font-medium text-white">
                  {selected.poolName}
                </span>{" "}
                ·{" "}
                {new Date(selected.measuredAt).toLocaleDateString("fr-FR", {
                  timeZone: "UTC",
                })}
              </p>
              {demoNotice && (
                <p className="text-sm text-amber-100">
                  Relevé analysé pour cette session ; aucune sauvegarde durable
                  en mode démonstration.
                </p>
              )}
              <ReportAnalysisPanel
                key={selected.id}
                input={{
                  month: selected.measuredAt.slice(0, 7),
                  pool: selected.poolId,
                  measurement: selected.id,
                  lang: "fr",
                  ...(demoObservations[selected.id]
                    ? { observation: demoObservations[selected.id] }
                    : {}),
                }}
                enabled={aiEnabled}
                initialAnalysis={savedAnalysis}
                autoAnalyze={!savedAnalysis}
                showExport
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
