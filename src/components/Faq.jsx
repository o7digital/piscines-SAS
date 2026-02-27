import React, { useState } from "react";

const faqs = [
  {
    q: "Does it prevent drowning?",
    a: "No. PoolGuardian supports monitoring, alerts, and documentation. It does not replace certified safety systems or supervision.",
  },
  {
    q: "Do we need sensors?",
    a: "No for MVP. Start with manual inputs + logs + reporting. Sensors and automation can be added in Phase 2.",
  },
  {
    q: "Who is it for?",
    a: "Luxury properties, property managers, boutique hotels, HOAs, and high-end residential operators.",
  },
  {
    q: "What makes it investor-ready?",
    a: "US-first positioning: risk mitigation + compliance logs + reporting — highly scalable SaaS without hardware at first.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="section">
      <div className="container">
        <h2 className="h2">FAQ</h2>
        <div className="grid" style={{ marginTop: 14 }}>
          {faqs.map((f, idx) => (
            <div key={f.q} className="card" style={{ padding: 16 }}>
              <button
                className="btn"
                style={{ width: "100%", justifyContent: "space-between" }}
                onClick={() => setOpen(open === idx ? -1 : idx)}
                type="button"
              >
                <span style={{ fontWeight: 700 }}>{f.q}</span>
                <span className="small">{open === idx ? "-" : "+"}</span>
              </button>
              {open === idx ? <div className="p" style={{ marginTop: 10 }}>{f.a}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
