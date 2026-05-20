import React, { useState } from "react";

const messages = [
  {
    client: "Famille BARTOLI",
    text: "Bonjour Sophie, c'est Jean-Marc. La température de votre bassin a atteint 14°C - il est temps de préparer l'hivernage ! Je vous propose le mercredi 22 octobre à 10h00. Votre Eco-Score cette saison : B+ - très bien ! Confirmez-vous ce RDV ? Jean-Marc Marinelli",
  },
  {
    client: "M. FERRARI",
    text: "Bonjour Monsieur Ferrari, c'est Jean-Marc. Votre bassin est à 13,2°C - hivernage à prévoir rapidement. Je vous propose le jeudi 23 octobre à 9h00. Note : pensez à vérifier le pH avant mon passage. Jean-Marc Marinelli · Marinelli Piscines",
  },
  {
    client: "Villa ROSSIGNOL",
    text: "Bonjour, votre bassin est stable à 14,8°C. Je vous propose un hivernage préventif le jeudi 23 octobre à 14h30. Votre Eco-Score A confirme une excellente saison.",
  },
  {
    client: "Résidence MORETTI",
    text: "Bonjour, la température de l'eau baisse durablement. Je vous propose vendredi 24 octobre à 8h45 pour sécuriser filtration, niveau d'eau et couverture avant l'hiver.",
  },
  {
    client: "Mme LEONETTI",
    text: "Bonjour Madame Leonetti, votre pH mérite une vérification avant hivernage. Je vous propose vendredi 24 octobre à 11h00 avec correction légère si besoin.",
  },
  {
    client: "M. ACQUAVIVA",
    text: "Bonjour Monsieur Acquaviva, votre bassin est prêt pour l'hivernage. Passage proposé lundi 27 octobre à 9h30. Intervention estimée : 35 minutes.",
  },
];

const copyByLang = {
  fr: {
    generate: "Générer tous les messages hivernage",
    sendAll: "Envoyer tous",
    generated: "6 messages générés en 4 secondes. Projection : 80 messages en 30 secondes.",
    sent: "Messages envoyés.",
    label: "Message",
  },
  en: {
    generate: "Generate all winterization messages",
    sendAll: "Send all",
    generated: "6 messages generated in 4 seconds. Projection: 80 messages in 30 seconds.",
    sent: "Messages sent.",
    label: "Message",
  },
  es: {
    generate: "Generar todos los mensajes de invernaje",
    sendAll: "Enviar todos",
    generated: "6 mensajes generados en 4 segundos. Proyección: 80 mensajes en 30 segundos.",
    sent: "Mensajes enviados.",
    label: "Mensaje",
  },
};

export default function WinterMessages({ lang = "fr" }) {
  const copy = copyByLang[lang] ?? copyByLang.fr;
  const [generated, setGenerated] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setGenerated(true);
            setSent(false);
          }}
          className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
        >
          {copy.generate}
        </button>
        <button
          type="button"
          disabled={!generated}
          onClick={() => setSent(true)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copy.sendAll}
        </button>
      </div>

      {generated && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          {copy.generated}
          {sent && <span className="ml-2 font-semibold">{copy.sent}</span>}
        </div>
      )}

      {generated && (
        <div className="grid gap-3">
          {messages.map((message, index) => (
            <article key={message.client} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <div className="text-sm font-semibold text-white">{copy.label} {index + 1} - {message.client}</div>
              <p className="mt-2 text-sm leading-6 text-white/72">{message.text}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
