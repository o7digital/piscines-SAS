import React, { useMemo, useRef, useState } from "react";

const initialSteps = [
  {
    id: "start",
    time: "Maintenant",
    title: "Départ critique",
    note: "pH 6,8 · Cl 0,4",
    action: "Diagnostic capteur",
    result: "Hors cible",
    level: "critical",
    ph: 6.8,
    chlorine: 0.4,
    dose: "Aucun ajout",
    minute: 0,
  },
  {
    id: "ph",
    time: "+ 10 min",
    title: "Ajouter pH+",
    note: "300g directement",
    action: "pH+ 300g",
    result: "pH remonte",
    level: "watch",
    ph: 7.1,
    chlorine: 0.5,
    dose: "300g",
    minute: 10,
  },
  {
    id: "chlorine",
    time: "+ 20 min",
    title: "Chlore choc",
    note: "200g granulé 56%",
    action: "Chlore choc 200g",
    result: "Chlore remonte",
    level: "alert",
    ph: 7.18,
    chlorine: 1.1,
    dose: "200g",
    minute: 20,
  },
  {
    id: "stable",
    time: "+ 35 min",
    title: "Rétabli",
    note: "Algicide 100ml",
    action: "Algicide 100ml",
    result: "Zone saine",
    level: "ok",
    ph: 7.2,
    chlorine: 1.6,
    dose: "100ml",
    minute: 35,
  },
];

const levelStyles = {
  critical: {
    border: "border-red-400/60",
    bg: "bg-red-500/15",
    text: "text-red-100",
    stroke: "#f87171",
  },
  alert: {
    border: "border-red-300/50",
    bg: "bg-red-500/15",
    text: "text-red-100",
    stroke: "#fb7185",
  },
  watch: {
    border: "border-amber-300/60",
    bg: "bg-amber-400/15",
    text: "text-amber-100",
    stroke: "#fbbf24",
  },
  ok: {
    border: "border-emerald-300/60",
    bg: "bg-emerald-400/15",
    text: "text-emerald-100",
    stroke: "#34d399",
  },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundOne = (value) => Math.round(value * 10) / 10;

function buildPath(points, key) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point[key]}`)
    .join(" ");
}

export default function FerrariRecoveryCurve() {
  const [steps, setSteps] = useState(initialSteps);
  const [selectedId, setSelectedId] = useState("ph");
  const [isOpen, setIsOpen] = useState(false);
  const [dragging, setDragging] = useState(null);
  const mainSvgRef = useRef(null);
  const modalSvgRef = useRef(null);

  const selectedStep = steps.find((step) => step.id === selectedId) ?? steps[0];
  const totalMinutes = Math.max(...steps.map((step) => step.minute), 35);

  const points = useMemo(
    () =>
      steps.map((step) => {
        const x = 78 + (clamp(step.minute, 0, totalMinutes) / totalMinutes) * 508;
        const phY = 188 - ((clamp(step.ph, 6.6, 7.4) - 6.6) / 0.8) * 124;
        const chlorineY = 188 - (clamp(step.chlorine, 0, 2) / 2) * 124;

        return { ...step, x, phY, chlorineY };
      }),
    [steps, totalMinutes],
  );

  const updateSelected = (field, value) => {
    setSteps((current) =>
      current.map((step) =>
        step.id === selectedId
          ? {
              ...step,
              [field]: ["ph", "chlorine", "minute"].includes(field) ? Number(value) : value,
            }
          : step,
      ),
    );
  };

  const updateStepFromPointer = (stepId, series, event, svgElement) => {
    if (!svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * 680;
    const viewY = ((event.clientY - rect.top) / rect.height) * 230;
    const minute = Math.round(((clamp(viewX, 78, 586) - 78) / 508) * totalMinutes);

    setSteps((current) =>
      current.map((step) => {
        if (step.id !== stepId) return step;

        const next = {
          ...step,
          minute,
          time: minute === 0 ? "Maintenant" : `+ ${minute} min`,
        };

        if (series === "ph") {
          next.ph = roundOne(6.6 + ((188 - clamp(viewY, 64, 188)) / 124) * 0.8);
        } else {
          next.chlorine = roundOne(((188 - clamp(viewY, 64, 188)) / 124) * 2);
        }

        return next;
      }),
    );
  };

  const startDrag = (stepId, series, source, event) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(stepId);
    setDragging({ stepId, series, source });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateStepFromPointer(stepId, series, event, source === "modal" ? modalSvgRef.current : mainSvgRef.current);
  };

  const moveDrag = (source, event) => {
    if (!dragging || dragging.source !== source) return;
    event.preventDefault();
    updateStepFromPointer(dragging.stepId, dragging.series, event, source === "modal" ? modalSvgRef.current : mainSvgRef.current);
  };

  const stopDrag = () => {
    setDragging(null);
  };

  const resetScenario = () => {
    setSteps(initialSteps);
    setSelectedId("ph");
  };

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Courbe de rétablissement</div>
          <div className="mt-1 text-xs text-white/50">M. Ferrari · correction éditable en popup sur la trajectoire</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
            Objectif {totalMinutes} min
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-emerald-300"
          >
            Ouvrir / éditer
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="relative min-w-[620px] rounded-2xl bg-slate-950/45 p-4">
          <svg
            ref={mainSvgRef}
            className="h-56 w-full touch-none select-none"
            viewBox="0 0 680 230"
            role="img"
            aria-label="Courbe éditable de correction pH et chlore pour M. Ferrari"
            onPointerMove={(event) => moveDrag("main", event)}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
          >
            <defs>
              <filter id="providerGlowEditable" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect x="72" y="34" width="512" height="116" rx="18" fill="#34d399" opacity="0.08" />
            <text x="590" y="76" fill="#a7f3d0" fontSize="12" fontWeight="700">Zone saine</text>
            <text x="590" y="96" fill="#94a3b8" fontSize="11">pH 7,2 · chlore 1,6</text>
            <path d="M72 188 H620" stroke="#ffffff" strokeOpacity="0.14" />
            <path d="M72 150 H620" stroke="#ffffff" strokeOpacity="0.08" />
            <path d="M72 112 H620" stroke="#ffffff" strokeOpacity="0.08" />
            <path d="M72 74 H620" stroke="#ffffff" strokeOpacity="0.08" />
            <path d="M72 36 V188" stroke="#ffffff" strokeOpacity="0.14" />
            <path d={buildPath(points, "phY")} fill="none" stroke="#34d399" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" filter="url(#providerGlowEditable)" />
            <path d={buildPath(points, "chlorineY")} fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point) => (
              <g key={point.id}>
                <circle
                  cx={point.x}
                  cy={point.phY}
                  r={selectedId === point.id ? 14 : 11}
                  fill="#020617"
                  stroke="#34d399"
                  strokeWidth="4"
                  className="cursor-grab active:cursor-grabbing"
                  onPointerDown={(event) => startDrag(point.id, "ph", "main", event)}
                />
                <circle
                  cx={point.x}
                  cy={point.chlorineY}
                  r={selectedId === point.id ? 11 : 9}
                  fill="#020617"
                  stroke="#fbbf24"
                  strokeWidth="4"
                  className="cursor-grab active:cursor-grabbing"
                  onPointerDown={(event) => startDrag(point.id, "chlorine", "main", event)}
                />
              </g>
            ))}
            <g fill="#94a3b8" fontSize="11">
              <text x="62" y="207">0</text>
              <text x="230" y="207">10 min</text>
              <text x="392" y="207">20 min</text>
              <text x="566" y="207">{totalMinutes} min</text>
            </g>
            <g fill="#cbd5e1" fontSize="11">
              <text x="20" y="174">bas</text>
              <text x="18" y="78">cible</text>
            </g>
          </svg>

          {points.map((point, index) => {
            const left = clamp(point.x - 70, 18, 500);
            const top = clamp(point.phY - 30, 14, 150);
            return (
              <button
                key={point.id}
                type="button"
                onClick={() => {
                  setSelectedId(point.id);
                  setIsOpen(true);
                }}
                className={`absolute w-36 rounded-xl border p-2 text-left text-xs shadow-xl shadow-slate-950/30 ${levelStyles[point.level].border} ${levelStyles[point.level].bg}`}
                style={{ left, top }}
              >
                <div className={`font-semibold ${levelStyles[point.level].text}`}>{point.title}</div>
                <div className="text-white/65">{point.note}</div>
                {index > 0 && <div className="mt-1 text-white/45">Glisser ou modifier</div>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => {
              setSelectedId(step.id);
              setIsOpen(true);
            }}
            className={`rounded-2xl border p-3 text-left text-xs ${levelStyles[step.level].border} ${levelStyles[step.level].bg}`}
          >
            <div className="font-semibold text-white">{step.time}</div>
            <div className="mt-1 text-white/80">{step.action}</div>
            <div className="text-white/50">{step.note}</div>
            <div className="mt-2 font-semibold text-emerald-100">{step.result}</div>
          </button>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Edition de la courbe Ferrari">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-5 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">B002 · M. Ferrari</div>
                <h3 className="mt-2 text-2xl font-semibold text-white">Editer la courbe de rétablissement</h3>
                <p className="mt-1 text-sm text-white/55">Glisse les points verts pour le pH, les points jaunes pour le chlore, ou ajuste les valeurs dans la table.</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                Fermer
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Edition graphique directe</div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1 text-emerald-100">Point vert : pH</span>
                  <span className="rounded-full border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-amber-100">Point jaune : chlore</span>
                </div>
              </div>
              <div className="mt-3 overflow-x-auto">
                <svg
                  ref={modalSvgRef}
                  className="h-72 min-w-[680px] w-full touch-none select-none rounded-2xl bg-slate-950/70"
                  viewBox="0 0 680 230"
                  role="img"
                  aria-label="Edition tactile de la courbe Ferrari"
                  onPointerMove={(event) => moveDrag("modal", event)}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                >
                  <rect x="72" y="34" width="512" height="116" rx="18" fill="#34d399" opacity="0.08" />
                  <text x="590" y="76" fill="#a7f3d0" fontSize="12" fontWeight="700">Zone saine</text>
                  <text x="590" y="96" fill="#94a3b8" fontSize="11">pH 7,2 · chlore 1,6</text>
                  <path d="M72 188 H620" stroke="#ffffff" strokeOpacity="0.14" />
                  <path d="M72 150 H620" stroke="#ffffff" strokeOpacity="0.08" />
                  <path d="M72 112 H620" stroke="#ffffff" strokeOpacity="0.08" />
                  <path d="M72 74 H620" stroke="#ffffff" strokeOpacity="0.08" />
                  <path d="M72 36 V188" stroke="#ffffff" strokeOpacity="0.14" />
                  <path d={buildPath(points, "phY")} fill="none" stroke="#34d399" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={buildPath(points, "chlorineY")} fill="none" stroke="#fbbf24" strokeWidth="4" strokeDasharray="8 8" strokeLinecap="round" strokeLinejoin="round" />
                  {points.map((point) => (
                    <g key={point.id}>
                      <line x1={point.x} y1="36" x2={point.x} y2="188" stroke="#ffffff" strokeOpacity={selectedId === point.id ? "0.18" : "0.06"} />
                      <circle
                        cx={point.x}
                        cy={point.phY}
                        r={selectedId === point.id ? 16 : 13}
                        fill="#020617"
                        stroke="#34d399"
                        strokeWidth="5"
                        className="cursor-grab active:cursor-grabbing"
                        onPointerDown={(event) => startDrag(point.id, "ph", "modal", event)}
                      />
                      <circle
                        cx={point.x}
                        cy={point.chlorineY}
                        r={selectedId === point.id ? 14 : 11}
                        fill="#020617"
                        stroke="#fbbf24"
                        strokeWidth="5"
                        className="cursor-grab active:cursor-grabbing"
                        onPointerDown={(event) => startDrag(point.id, "chlorine", "modal", event)}
                      />
                      <text x={point.x - 24} y="207" fill="#94a3b8" fontSize="11">{point.minute} min</text>
                    </g>
                  ))}
                  <g fill="#cbd5e1" fontSize="11">
                    <text x="20" y="174">bas</text>
                    <text x="18" y="78">cible</text>
                  </g>
                </svg>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-2">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setSelectedId(step.id)}
                    className={`w-full rounded-2xl border p-3 text-left text-sm ${selectedId === step.id ? "border-emerald-300/80 bg-emerald-400/15" : "border-white/10 bg-white/5"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">{step.time}</span>
                      <span className="text-xs text-white/45">pH {step.ph.toFixed(1)} · Cl {step.chlorine.toFixed(1)}</span>
                    </div>
                    <div className="mt-1 text-white/60">{step.action}</div>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-white/70">
                    Heure
                    <input value={selectedStep.time} onChange={(event) => updateSelected("time", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
                  </label>
                  <label className="text-sm text-white/70">
                    Minute sur la courbe
                    <input type="number" min="0" max="60" value={selectedStep.minute} onChange={(event) => updateSelected("minute", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
                  </label>
                  <label className="text-sm text-white/70">
                    Action
                    <input value={selectedStep.action} onChange={(event) => updateSelected("action", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
                  </label>
                  <label className="text-sm text-white/70">
                    Dose
                    <input value={selectedStep.dose} onChange={(event) => updateSelected("dose", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
                  </label>
                  <label className="text-sm text-white/70">
                    pH cible
                    <input type="number" step="0.1" min="6.6" max="7.4" value={selectedStep.ph} onChange={(event) => updateSelected("ph", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
                  </label>
                  <label className="text-sm text-white/70">
                    Chlore cible
                    <input type="number" step="0.1" min="0" max="2" value={selectedStep.chlorine} onChange={(event) => updateSelected("chlorine", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
                  </label>
                  <label className="text-sm text-white/70 sm:col-span-2">
                    Résultat attendu
                    <input value={selectedStep.result} onChange={(event) => updateSelected("result", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none focus:border-emerald-300/60" />
                  </label>
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-white/75">
                  Plan Ferrari actuel : {steps.map((step) => `${step.time} ${step.action}`).join(" -> ")}.
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={resetScenario} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                    Réinitialiser Ferrari
                  </button>
                  <button type="button" onClick={() => setIsOpen(false)} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
                    Appliquer à la courbe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
