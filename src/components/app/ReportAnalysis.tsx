import { useEffect, useState } from "react";
import { reportCopy } from "../../lib/reportCopy";
import type {
  MeasurementInput,
  ReportAnalysis,
  ReportLanguage,
} from "../../lib/reporting";

export type AnalysisInput = {
  month: string;
  pool?: string;
  measurement?: string;
  lang: ReportLanguage;
  observation?: MeasurementInput;
};

export async function downloadReport(input: AnalysisInput) {
  const response = await fetch("/api/exports/monthly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok)
    throw new Error(response.status === 429 ? "rate_limited" : "failed");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bluu3-report-${input.month}.pdf`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type Props = {
  input: AnalysisInput;
  initialAnalysis?: ReportAnalysis;
  enabled: boolean;
  autoAnalyze?: boolean;
  showExport?: boolean;
};

export default function ReportAnalysisPanel({
  input,
  initialAnalysis,
  enabled,
  autoAnalyze = false,
  showExport = false,
}: Props) {
  const c = reportCopy[input.lang];
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const inputKey = JSON.stringify(input);

  async function generate(signal?: AbortSignal) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/reports/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: inputKey,
        signal,
      });
      if (!response.ok)
        throw new Error(response.status === 429 ? c.rateLimited : c.error);
      const result = await response.json();
      if (!signal?.aborted) setAnalysis(result.analysis);
    } catch (error) {
      if (!signal?.aborted)
        setError(error instanceof Error ? error.message : c.error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    setAnalysis(initialAnalysis);
    setError("");
    if (!autoAnalyze || !enabled) return;
    const controller = new AbortController();
    void generate(controller.signal);
    return () => controller.abort();
  }, [inputKey, enabled, autoAnalyze]);

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
    <article
      className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5 sm:p-6"
      aria-busy={loading}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">
            Hugging Face
          </p>
          <h2 className="mt-2 text-xl font-semibold">{c.assistant}</h2>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/65">
          {analysis?.source === "huggingface" ? c.ai : c.automatic}
        </span>
      </div>
      <p className="mt-3 text-sm text-white/60">{c.assistantIntro}</p>
      {!enabled && (
        <p className="mt-4 text-sm text-amber-100">{c.notConfigured}</p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void generate()}
          disabled={!enabled || loading}
          className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
        >
          {loading
            ? c.generating
            : analysis?.source === "huggingface"
              ? c.regenerate
              : c.generate}
        </button>
        {showExport && (
          <button
            type="button"
            onClick={() => void exportPdf()}
            disabled={exporting || loading}
            className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-50"
          >
            {exporting ? c.exporting : c.pdf}
          </button>
        )}
      </div>
      <div aria-live="polite" className="mt-5 space-y-5">
        {error && (
          <p role="alert" className="text-sm text-amber-100">
            {error}
          </p>
        )}
        {analysis?.reason && (
          <p className="text-sm text-amber-100">
            {analysis.reason === "not_configured"
              ? c.notConfigured
              : c.fallback}
          </p>
        )}
        {analysis && (
          <>
            <p className="text-sm leading-7 text-white/85">
              {analysis.summary}
            </p>
            <div>
              <h3 className="text-sm font-semibold text-white/90">
                {c.highlights}
              </h3>
              <ul className="mt-3 space-y-2">
                {analysis.highlights.map((line, index) => (
                  <li
                    key={index}
                    className="rounded-xl bg-slate-950/35 px-4 py-3 text-sm leading-6 text-white/70"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-200">
                {c.recommendations}
              </h3>
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-6 text-white/75">
                {analysis.recommendations.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ol>
            </div>
            <p className="text-xs text-white/45">
              {c.generated}{" "}
              {new Date(analysis.generatedAt).toLocaleString(input.lang, {
                timeZone: "UTC",
              })}{" "}
              UTC
            </p>
          </>
        )}
      </div>
      <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/50">
        {c.reviewNote}
      </p>
    </article>
  );
}
