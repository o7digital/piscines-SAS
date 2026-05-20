import React, { useMemo, useRef, useState } from "react";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundOne = (value) => Math.round(value * 10) / 10;

const poolScenarios = [
  {
    id: "B002",
    client: "M. Ferrari",
    location: "Ajaccio Centre",
    level: "critical",
    startPh: 6.8,
    startChlorine: 0.4,
    phAction: "pH+ 300g",
    phDose: "300g",
    chlorineAction: "Chlore choc 200g",
    chlorineDose: "200g",
    stabilizerAction: "Algicide 100ml",
    stabilizerDose: "100ml",
    duration: 35,
  },
  {
    id: "B001",
    client: "Famille Bartoli",
    location: "Porticcio",
    level: "alert",
    startPh: 7.2,
    startChlorine: 0.8,
    phAction: "Contrôle pH",
    phDose: "Aucun ajout",
    chlorineAction: "Chlore lent 150g",
    chlorineDose: "150g",
    stabilizerAction: "Filtration 2h",
    stabilizerDose: "2h",
    duration: 25,
  },
  {
    id: "B005",
    client: "Mme Leonetti",
    location: "Sarrola-Carcopino",
    level: "watch",
    startPh: 7.5,
    startChlorine: 1.9,
    phAction: "pH- 120g",
    phDose: "120g",
    chlorineAction: "Contrôle chlore",
    chlorineDose: "Aucun ajout",
    stabilizerAction: "Brossage ligne d'eau",
    stabilizerDose: "10 min",
    duration: 20,
  },
  {
    id: "B003",
    client: "Villa Rossignol",
    location: "Bastelicaccia",
    level: "ok",
    startPh: 7.3,
    startChlorine: 2.1,
    phAction: "Contrôle pH",
    phDose: "OK",
    chlorineAction: "Aération 30 min",
    chlorineDose: "30 min",
    stabilizerAction: "Surveillance",
    stabilizerDose: "Aucun ajout",
    duration: 18,
  },
  {
    id: "B004",
    client: "Résidence Moretti",
    location: "Prunelli",
    level: "ok",
    startPh: 7.1,
    startChlorine: 1.4,
    phAction: "Contrôle pH",
    phDose: "OK",
    chlorineAction: "Chlore lent 80g",
    chlorineDose: "80g",
    stabilizerAction: "Rinçage filtre",
    stabilizerDose: "5 min",
    duration: 22,
  },
  {
    id: "B006",
    client: "M. Acquaviva",
    location: "Ajaccio Sud",
    level: "ok",
    startPh: 7.2,
    startChlorine: 1.6,
    phAction: "Contrôle pH",
    phDose: "OK",
    chlorineAction: "Contrôle chlore",
    chlorineDose: "OK",
    stabilizerAction: "Validation visite",
    stabilizerDose: "Aucun ajout",
    duration: 15,
  },
];

function buildInitialSteps(pool) {
  const targetPh = pool.startPh > 7.4 ? 7.25 : Math.max(7.2, pool.startPh + 0.3);
  const targetChlorine = pool.startChlorine < 1.5 ? 1.6 : Math.min(1.8, pool.startChlorine);

  return [
    {
      id: "start",
      time: "Maintenant",
      title: pool.level === "ok" ? "Départ stable" : "Départ à corriger",
      note: `pH ${pool.startPh.toFixed(1).replace(".", ",")} · Cl ${pool.startChlorine.toFixed(1).replace(".", ",")}`,
      action: "Diagnostic capteur",
      result: pool.level === "ok" ? "Sous contrôle" : "Hors cible",
      level: pool.level,
      ph: pool.startPh,
      chlorine: pool.startChlorine,
      dose: "Aucun ajout",
      minute: 0,
    },
    {
      id: "ph",
      time: "+ 10 min",
      title: pool.phAction,
      note: pool.phDose,
      action: pool.phAction,
      result: pool.phDose === "OK" || pool.phDose === "Aucun ajout" ? "pH stable" : "pH corrigé",
      level: pool.level === "critical" ? "watch" : pool.level,
      ph: roundOne(targetPh),
      chlorine: pool.startChlorine,
      dose: pool.phDose,
      minute: 10,
    },
    {
      id: "chlorine",
      time: "+ 20 min",
      title: pool.chlorineAction,
      note: pool.chlorineDose,
      action: pool.chlorineAction,
      result: pool.chlorineDose === "OK" || pool.chlorineDose === "Aucun ajout" ? "Chlore stable" : "Chlore corrigé",
      level: pool.level === "ok" ? "ok" : "alert",
      ph: roundOne(targetPh),
      chlorine: roundOne(targetChlorine),
      dose: pool.chlorineDose,
      minute: Math.min(20, pool.duration),
    },
    {
      id: "stable",
      time: `+ ${pool.duration} min`,
      title: "Rétabli",
      note: pool.stabilizerAction,
      action: pool.stabilizerAction,
      result: "Zone saine",
      level: "ok",
      ph: roundOne(targetPh),
      chlorine: roundOne(targetChlorine),
      dose: pool.stabilizerDose,
      minute: pool.duration,
    },
  ];
}

const initialStepsByPool = Object.fromEntries(poolScenarios.map((pool) => [pool.id, buildInitialSteps(pool)]));

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

function buildPath(points, key) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point[key]}`)
    .join(" ");
}

function buildClientMessage(pool, steps) {
  const finalStep = steps[steps.length - 1];
  const actions = steps
    .filter((step) => step.id !== "start")
    .map((step) => `${step.time} : ${step.action}`)
    .join(", ");

  return `Bonjour, ici Jean-Marc Marinelli. J'ai validé la courbe de rétablissement de votre piscine ${pool.id} à ${pool.location}. Plan prévu : ${actions}. Objectif : eau rétablie en ${finalStep.minute} minutes, pH ${finalStep.ph.toFixed(1)} et chlore ${finalStep.chlorine.toFixed(1)}. Vous recevez aussi la courbe de suivi Bluu3.`;
}

export default function FerrariRecoveryCurve() {
  const [selectedPoolId, setSelectedPoolId] = useState("B002");
  const [stepsByPool, setStepsByPool] = useState(initialStepsByPool);
  const [selectedId, setSelectedId] = useState("ph");
  const [isOpen, setIsOpen] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [sentCurves, setSentCurves] = useState({});
  const [sendNotice, setSendNotice] = useState("");
  const mainSvgRef = useRef(null);
  const modalSvgRef = useRef(null);

  const selectedPool = poolScenarios.find((pool) => pool.id === selectedPoolId) ?? poolScenarios[0];
  const steps = stepsByPool[selectedPoolId] ?? buildInitialSteps(selectedPool);
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
    setStepsByPool((current) => ({
      ...current,
      [selectedPoolId]: steps.map((step) =>
        step.id === selectedId
          ? {
              ...step,
              [field]: ["ph", "chlorine", "minute"].includes(field) ? Number(value) : value,
            }
          : step,
      ),
    }));
  };

  const updateStepFromPointer = (stepId, series, event, svgElement) => {
    if (!svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * 680;
    const viewY = ((event.clientY - rect.top) / rect.height) * 230;
    const minute = Math.round(((clamp(viewX, 78, 586) - 78) / 508) * totalMinutes);

    setStepsByPool((current) => ({
      ...current,
      [selectedPoolId]: (current[selectedPoolId] ?? steps).map((step) => {
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
    }));
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
    setStepsByPool((current) => ({
      ...current,
      [selectedPoolId]: buildInitialSteps(selectedPool),
    }));
    setSelectedId("ph");
  };

  const changePool = (poolId) => {
    setSelectedPoolId(poolId);
    setSelectedId("ph");
    setDragging(null);
  };

  const validateAndSendSelected = () => {
    const message = buildClientMessage(selectedPool, steps);

    setSentCurves((current) => ({
      ...current,
      [selectedPoolId]: {
        sentAt: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        message,
      },
    }));
    setSendNotice(`Courbe validée et message envoyé à ${selectedPool.client}.`);
    setIsOpen(false);
  };

  const sendAllCurves = () => {
    const nextSentCurves = {};
    poolScenarios.forEach((pool) => {
      const poolSteps = stepsByPool[pool.id] ?? buildInitialSteps(pool);
      nextSentCurves[pool.id] = {
        sentAt: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        message: buildClientMessage(pool, poolSteps),
      };
    });
    setSentCurves(nextSentCurves);
    setSendNotice("Courbes validées et messages envoyés aux 6 piscines.");
  };

  const selectedSend = sentCurves[selectedPoolId];
  const sentCount = Object.keys(sentCurves).length;

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Courbe de rétablissement</div>
          <div className="mt-1 text-xs text-white/50">{selectedPool.client} · correction éditable au doigt ou à la souris</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedPoolId}
            onChange={(event) => changePool(event.target.value)}
            className="rounded-full border border-white/10 bg-slate-950 px-3 py-1 text-xs font-semibold text-white outline-none focus:border-emerald-300/60"
            aria-label="Choisir une piscine"
          >
            {poolScenarios.map((pool) => (
              <option key={pool.id} value={pool.id}>{pool.id} · {pool.client}</option>
            ))}
          </select>
          <span className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
            Objectif {selectedPool.duration} min
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-emerald-300"
          >
            Ouvrir / éditer
          </button>
          <button
            type="button"
            onClick={sendAllCurves}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
          >
            Envoyer au parc
          </button>
        </div>
      </div>

      <div className="mt-4 max-w-full overflow-x-auto overscroll-x-contain">
        <div className="relative w-full max-w-full rounded-2xl bg-slate-950/45 p-3 sm:min-w-[620px] sm:p-4">
          <svg
            ref={mainSvgRef}
            className="h-56 w-full touch-none select-none"
            viewBox="0 0 680 230"
            role="img"
            aria-label={`Courbe éditable de correction pH et chlore pour ${selectedPool.client}`}
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

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-emerald-100">
              {selectedSend ? `Courbe envoyée à ${selectedPool.client}` : `Courbe prête pour ${selectedPool.client}`}
            </div>
            <div className="mt-1 text-xs text-white/55">
              {selectedSend ? `Dernier envoi démo à ${selectedSend.sentAt}.` : sentCount > 0 ? `${sentCount} courbe${sentCount > 1 ? "s" : ""} envoyée${sentCount > 1 ? "s" : ""} en démo.` : "Valide la courbe pour générer le message client et simuler l'envoi."}
            </div>
          </div>
          <button
            type="button"
            onClick={validateAndSendSelected}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${selectedSend ? "border border-emerald-300/40 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25" : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"}`}
          >
            {selectedSend ? "Renvoyer la courbe" : "Valider + envoyer"}
          </button>
        </div>
        {sendNotice && (
          <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-300/15 px-3 py-2 text-sm font-semibold text-emerald-100">
            {sendNotice}
          </div>
        )}
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm leading-6 text-white/75">
          {selectedSend?.message ?? buildClientMessage(selectedPool, steps)}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-2 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Edition de la courbe ${selectedPool.client}`}>
          <div className="max-h-[96dvh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-4 shadow-2xl sm:max-h-[92vh] sm:rounded-3xl sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">{selectedPool.id} · {selectedPool.client} · {selectedPool.location}</div>
                <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Editer la courbe de rétablissement</h3>
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
              <div className="mt-3 max-w-full overflow-x-auto overscroll-x-contain">
                <svg
                  ref={modalSvgRef}
                  className="h-64 min-w-[560px] w-full touch-none select-none rounded-2xl bg-slate-950/70 sm:h-72 sm:min-w-[680px]"
                  viewBox="0 0 680 230"
                  role="img"
                  aria-label={`Edition tactile de la courbe ${selectedPool.client}`}
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
                  Plan {selectedPool.client} actuel : {steps.map((step) => `${step.time} ${step.action}`).join(" -> ")}.
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={resetScenario} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                    Réinitialiser {selectedPool.client}
                  </button>
                  <button type="button" onClick={validateAndSendSelected} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
                    Valider + envoyer le message
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm leading-6 text-white/75">
                  Message envoyé en démo : {buildClientMessage(selectedPool, steps)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
