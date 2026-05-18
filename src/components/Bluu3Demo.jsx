import React, { useMemo, useState } from "react";

const ownerMetrics = [
  { label: "pH", value: "7,2", note: "Idéal 7,0 - 7,4", status: "ok" },
  { label: "Chlore libre", value: "0,8 mg/L", note: "Bas depuis 18h", status: "warn" },
  { label: "Température", value: "26,4 °C", note: "Confort baignade", status: "ok" },
  { label: "ORP", value: "685 mV", note: "Désinfection stable", status: "ok" },
];

const providerPools = [
  ["B002", "M. Ferrari", "Ajaccio Centre", "45 m3", "6,8", "0,4 mg/L", "52", "D", "pH + Chlore critiques", "critical"],
  ["B001", "Famille Bartoli", "Porticcio", "60 m3", "7,2", "0,8 mg/L", "74", "B+", "Alerte chlore", "critical"],
  ["B005", "Mme Leonetti", "Sarrola-Carcopino", "50 m3", "7,5", "1,9 mg/L", "83", "B", "Surveillance pH", "watch"],
  ["B003", "Villa Rossignol", "Bastelicaccia", "80 m3", "7,3", "2,1 mg/L", "91", "A", "Tout va bien", "ok"],
  ["B004", "Résidence Moretti", "Prunelli", "35 m3", "7,1", "1,4 mg/L", "88", "B+", "Tout va bien", "ok"],
  ["B006", "M. Acquaviva", "Ajaccio Sud", "70 m3", "7,2", "1,6 mg/L", "86", "B+", "Tout va bien", "ok"],
];

const winterMessages = [
  "Bonjour Sophie, c'est Jean-Marc. La température de votre bassin a atteint 14°C - il est temps de préparer l'hivernage ! Je vous propose le mercredi 22 octobre à 10h00. Votre Eco-Score cette saison : B+ - très bien ! Confirmez-vous ce RDV ? Jean-Marc Marinelli",
  "Bonjour Monsieur Ferrari, c'est Jean-Marc. Votre bassin est à 13,2°C - hivernage à prévoir rapidement. Je vous propose le jeudi 23 octobre à 9h00. Note : pensez à vérifier le pH avant mon passage. Jean-Marc Marinelli · Marinelli Piscines",
  "Bonjour Villa Rossignol, votre eau est stable à 14,8°C. Je vous propose un hivernage préventif le jeudi 23 octobre à 14h30. Eco-Score A cette saison, excellent suivi.",
  "Bonjour Résidence Moretti, la température baisse durablement. Créneau recommandé : vendredi 24 octobre à 8h45 pour sécuriser filtration et couverture.",
  "Bonjour Madame Leonetti, votre pH mérite une vérification avant hivernage. Je vous propose vendredi 24 octobre à 11h00 avec correction légère si besoin.",
  "Bonjour Monsieur Acquaviva, votre bassin est prêt pour l'hivernage. Passage proposé lundi 27 octobre à 9h30. Intervention estimée : 35 minutes.",
];

function StatusPill({ status, children }) {
  return <span className={`pill ${status}`}>{children}</span>;
}

function Header({ screen, setScreen, role }) {
  return (
    <header className="demo-header">
      <button className="brand" onClick={() => setScreen("start")} type="button">
        <span className="brand-mark" /> Bluu3
      </button>
      <div className="header-actions">
        {screen !== "start" && <button className="icon-btn" onClick={() => setScreen(role === "provider" ? "c1" : "p1")} type="button">Accueil</button>}
        {screen !== "start" && <button className="icon-btn" onClick={() => setScreen("start")} type="button">Changer profil</button>}
      </div>
    </header>
  );
}

function Start({ setScreen }) {
  return (
    <main className="start-screen">
      <section className="login-panel">
        <div className="brand large"><span className="brand-mark" /> Bluu3</div>
        <h1>Prototype démo CAPI</h1>
        <p>Application navigable avec données fictives pré-remplies. Login de démonstration pour Railway, sans collecte réelle.</p>
        <form className="login-box" onSubmit={(event) => event.preventDefault()}>
          <label>Email démo</label>
          <input defaultValue="sophie.bartoli@demo.bluu3.io" />
          <label>Mot de passe</label>
          <input defaultValue="demo-railway" type="password" />
          <button type="button" onClick={() => setScreen("p1")}>Entrer comme propriétaire</button>
        </form>
      </section>
      <section className="profile-grid">
        <button className="profile-card" onClick={() => setScreen("p1")} type="button">
          <span>Propriétaire</span>
          <strong>Sophie Bartoli</strong>
          <small>Villa Les Pins · Porticcio · capteur iopool connecté</small>
        </button>
        <button className="profile-card teal" onClick={() => setScreen("c1")} type="button">
          <span>Pisciniste</span>
          <strong>Jean-Marc Marinelli</strong>
          <small>Marinelli Piscines · Ajaccio · cockpit de 6 bassins</small>
        </button>
      </section>
    </main>
  );
}

function OwnerDashboard({ setScreen, treated }) {
  return (
    <Screen title="Bonjour Sophie" subtitle="Villa Les Pins · Porticcio · Aujourd'hui 14:32">
      <div className="hero-status">
        <button onClick={() => setScreen("p2")} className="score-card" type="button"><span>Score santé</span><strong>{treated ? "88" : "74"}/100</strong><StatusPill status={treated ? "ok" : "warn"}>{treated ? "Stable" : "Action requise"}</StatusPill></button>
        <button onClick={() => setScreen("p3")} className="score-card eco" type="button"><span>Eco-Score</span><strong>B+</strong><StatusPill status="ok">78/100</StatusPill></button>
      </div>
      <div className="metric-grid">{ownerMetrics.map((m) => <article className="metric" key={m.label}><StatusPill status={m.status}>{m.status === "ok" ? "OK" : "Bas"}</StatusPill><strong>{m.value}</strong><span>{m.label}</span><small>{m.note}</small></article>)}</div>
      <button className="alert-banner" onClick={() => setScreen("p4")} type="button">{treated ? "Action traitée - score prévu demain : 88/100" : "Attention : ajoutez du chlore - taux bas depuis 18h"}</button>
      <nav className="bottom-nav">
        <button onClick={() => setScreen("p5")} type="button">Mode Vacances</button>
        <button onClick={() => setScreen("p6")} type="button">Historique</button>
        <button onClick={() => setScreen("p7")} type="button">Assistant IA</button>
      </nav>
    </Screen>
  );
}

function OwnerDetail({ type, setScreen, setTreated }) {
  const content = {
    p2: ["Détail Score de Santé", "pH 20/20 · Chlore 14/20 · Température 18/20 · Filtration 16/20", "Bluu3 AI recommande : ajoutez 150g de chlore choc ce soir après 20h. Attendez 4h avant baignade. Score prévu demain : 88/100."],
    p3: ["Eco-Score environnemental", "Eau A · Energie B · Chimie B+ · Déplacements A · CO2 C+", "Ce mois : 1 200 litres d'eau économisés, 18% de produits chimiques en moins, 1 déplacement évité. Pool Passport 12 mois : B certifiable."],
    p5: ["Mode Vacances", "Départ mercredi 22 mai 2026 · Retour mercredi 4 juin · canicule 33-36°C", "Plan IA : chlore choc ce soir, stabilisant mardi, visite Marinelli le 28 mai, vérification finale veille départ. Prévision retour : 82/100."],
  }[type];
  return (
    <Screen title={content[0]} subtitle={content[1]} back={() => setScreen("p1")}>
      <article className="detail-card"><p>{content[2]}</p></article>
      {type === "p2" && <button className="primary" onClick={() => alert("Message simulé envoyé à J.-M. Marinelli.")} type="button">Prévenir mon pisciniste</button>}
      {type === "p3" && <a className="primary" href="/api/exports/passport?pool=B001">Télécharger mon Pool Passport PDF</a>}
      {type === "p5" && <button className="primary" onClick={() => alert("RDV pisciniste confirmé.")} type="button">Confirmer le RDV pisciniste</button>}
      {type === "p4" && <button className="primary" onClick={() => setTreated(true)} type="button">Je l'ai fait</button>}
    </Screen>
  );
}

function AlertScreen({ setScreen, setTreated }) {
  return (
    <Screen title="Alerte chlore" subtitle="Priorité modérée · détectée aujourd'hui à 08:14" back={() => setScreen("p1")} tone="orange">
      <article className="detail-card"><p>Chlore libre : 0,8 mg/L, en baisse depuis 18h. Canicule prévue demain 35°C : sans action, risque algues dès demain matin.</p><p><strong>Action recommandée :</strong> ajoutez 150g de chlore choc ce soir après 20h00. Pisciniste référent : J.-M. Marinelli.</p></article>
      <button className="primary" onClick={() => { setTreated(true); setScreen("p1"); }} type="button">Marquer comme traité</button>
      <button className="secondary" onClick={() => alert("Message simulé envoyé.")} type="button">Prévenir J.-M. Marinelli</button>
    </Screen>
  );
}

function History({ setScreen }) {
  return (
    <Screen title="Historique 30 jours" subtitle="19 avril -> 19 mai 2026" back={() => setScreen("p1")}>
      <div className="chart"><svg viewBox="0 0 520 220" role="img"><polyline className="line ph" points="10,60 70,78 130,115 190,128 250,96 310,78 370,60 450,96 510,96" /><polyline className="line cl" points="10,45 70,68 130,115 160,145 190,68 270,40 340,82 420,118 510,150" /><polyline className="line temp" points="10,170 120,158 230,138 340,108 510,70" /></svg></div>
      <div className="timeline"><p>28 avr - Traitement chlore + pH - 35 min</p><p>10 mai - Nettoyage filtre + traitement - 45 min</p><p>19 mai - Alerte chlore en cours</p></div>
    </Screen>
  );
}

function Chat({ setScreen }) {
  return (
    <Screen title="Assistant Bluu3 AI" subtitle="Conversation contextuelle statique" back={() => setScreen("p1")}>
      <div className="chat"><p className="me">Puis-je me baigner ce soir avec ma fille ?</p><p>Je déconseille la baignade ce soir, Sophie. Votre chlore est à 0,8 mg/L. Si vous ajoutez du chlore choc maintenant, baignade possible demain matin après 8h.</p><p className="me">Combien de chlore ?</p><p>Pour 60 m3, ajoutez 150g de chlore granulé 56% ce soir après 20h. Filtration 2h. Score prévu demain : 88/100.</p></div>
      <input className="chat-input" placeholder="Posez votre question..." readOnly />
    </Screen>
  );
}

function ProviderDashboard({ setScreen }) {
  return (
    <Screen title="Cockpit pisciniste" subtitle="Jean-Marc Marinelli · Lundi 19 mai 2026">
      <div className="summary"><StatusPill status="critical">2 alertes critiques</StatusPill><StatusPill status="watch">1 surveillance</StatusPill><StatusPill status="ok">3 sains</StatusPill></div>
      <div className="pool-list">{providerPools.map((pool) => <button key={pool[0]} onClick={() => setScreen("c2")} className={`pool-row ${pool[9]}`} type="button"><strong>{pool[0]} · {pool[1]}</strong><span>{pool[2]} · Score {pool[6]} · Eco {pool[7]}</span><small>{pool[8]}</small></button>)}</div>
      <nav className="bottom-nav"><button onClick={() => setScreen("c3")} type="button">Tournée du jour</button><button onClick={() => setScreen("c4")} type="button">Générer messages</button><button onClick={() => setScreen("c5")} type="button">Prévisions consommables</button></nav>
    </Screen>
  );
}

function ProviderDetail({ type, setScreen }) {
  if (type === "c2") return <Screen title="M. Ferrari" subtitle="Diagnostic pré-intervention · Ajaccio Centre" back={() => setScreen("c1")}><article className="detail-card"><p>pH 6,8 trop bas, chlore 0,4 mg/L critique, température 27,1°C. Dernier traitement : 15 mai.</p><p><strong>À apporter :</strong> 300g pH+, 200g chlore choc 56%, 100ml algicide. Durée estimée : 35 minutes. Priorité haute avant mercredi 21 mai.</p><p>Note : clé du portail dans la boîte à gauche.</p></article><a className="primary" href="https://www.google.com/maps/search/Ajaccio+Centre" target="_blank">Naviguer vers le bassin</a><button className="secondary" onClick={() => alert("Message client simulé généré.")}>Envoyer message au client</button></Screen>;
  if (type === "c3") return <Screen title="Tournée optimisée" subtitle="2h30 · 48 km · -4,2 kg CO2" back={() => setScreen("c1")}><div className="timeline"><p>08h30 - B002 M. Ferrari - urgent - 35 min</p><p>09h30 - B001 Famille Bartoli - chlore - 25 min</p><p>11h00 - B005 Mme Leonetti - surveillance - 20 min</p><p>Reste du parc : aucune visite requise cette semaine.</p></div><button className="primary" onClick={() => alert("Tournée commencée.")}>Commencer la tournée</button></Screen>;
  if (type === "c5") return <Screen title="Prévision consommables" subtitle="19 mai -> 19 juin 2026 · canicule simulée" back={() => setScreen("c1")}><div className="stock-grid"><p>Chlore granulé 56% <strong>2,8 kg</strong></p><p>pH+ <strong>1,2 kg</strong></p><p>pH- <strong>0,4 kg</strong></p><p>Algicide préventif <strong>600 ml</strong></p><p>Stabilisant <strong>0,8 kg</strong></p></div><article className="detail-card">Commander avant le 21 mai. Economies estimées : -18% de gaspillage, -32 euros.</article><a className="primary" href="/api/exports/consumables">Exporter PDF</a></Screen>;
}

function Messages({ setScreen }) {
  const [generated, setGenerated] = useState(false);
  const visibleMessages = useMemo(() => (generated ? winterMessages : []), [generated]);
  return (
    <Screen title="Messages hivernage" subtitle="Signature Bluu3 AI · 6 messages demo, 80 en production" back={() => setScreen("c1")}>
      <button className="primary" onClick={() => setGenerated(true)} type="button">Générer tous les messages hivernage</button>
      <div className="messages">{visibleMessages.map((message, index) => <article key={message}><strong>Message {index + 1}</strong><p>{message}</p></article>)}</div>
      {generated && <button className="secondary" onClick={() => alert("Messages envoyés.")} type="button">Envoyer tous</button>}
    </Screen>
  );
}

function Screen({ title, subtitle, children, back, tone = "" }) {
  return (
    <main className={`screen ${tone}`}>
      {back && <button className="back" onClick={back} type="button">Retour</button>}
      <section className="screen-title"><h1>{title}</h1><p>{subtitle}</p></section>
      {children}
    </main>
  );
}

export default function Bluu3Demo() {
  const [screen, setScreen] = useState("start");
  const [treated, setTreated] = useState(false);
  const role = screen.startsWith("c") ? "provider" : "owner";
  return (
    <div className="demo-app">
      <Header screen={screen} setScreen={setScreen} role={role} />
      {screen === "start" && <Start setScreen={setScreen} />}
      {screen === "p1" && <OwnerDashboard setScreen={setScreen} treated={treated} />}
      {["p2", "p3", "p5"].includes(screen) && <OwnerDetail type={screen} setScreen={setScreen} setTreated={setTreated} />}
      {screen === "p4" && <AlertScreen setScreen={setScreen} setTreated={setTreated} />}
      {screen === "p6" && <History setScreen={setScreen} />}
      {screen === "p7" && <Chat setScreen={setScreen} />}
      {screen === "c1" && <ProviderDashboard setScreen={setScreen} />}
      {["c2", "c3", "c5"].includes(screen) && <ProviderDetail type={screen} setScreen={setScreen} />}
      {screen === "c4" && <Messages setScreen={setScreen} />}
    </div>
  );
}
