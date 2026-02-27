import React from "react";

const plans = [
  {
    name: "Starter",
    price: "$79",
    unit: "/month / pool",
    highlight: false,
    items: [
      "1 pool",
      "Manual water tests logging",
      "Basic alerts",
      "Maintenance logs",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$129",
    unit: "/month / pool",
    highlight: true,
    items: [
      "Multi-user (owner/staff/vendor)",
      "Portfolio dashboard",
      "Safety checklist + status",
      "Monthly PDF reports",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    unit: "",
    highlight: false,
    items: [
      "Multi-sites / HOA / hotels",
      "Advanced reporting & retention",
      "SLA + onboarding",
      "API access (phase 2)",
      "Custom branding",
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="section">
      <div className="container">
        <h2 className="h2">Pricing</h2>
        <p className="p">
          US-first pricing. France/Canada localized pricing can be set later (same tiers).
        </p>

        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 16, marginTop: 16 }}>
          <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 16 }}>
            <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 16 }}>
              <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 16 }} />
            </div>
          </div>
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "1fr",
            gap: 16,
            marginTop: 16,
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: "1fr",
              gap: 16,
            }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: "1fr",
                gap: 16,
              }}
            />
          </div>
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "1fr",
            gap: 16,
            marginTop: 16,
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(1, 1fr)",
              gap: 16,
            }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(1, 1fr)",
                gap: 16,
              }}
            />
          </div>
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "1fr",
            gap: 16,
            marginTop: 16,
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(1, 1fr)",
              gap: 16,
            }}
          />
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(1, 1fr)",
            gap: 16,
            marginTop: 16,
          }}
        >
          {plans.map((p) => (
            <div key={p.name} className={p.highlight ? "card2" : "card"} style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{p.name}</div>
                {p.highlight ? <div className="badge">Most popular</div> : null}
              </div>

              <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 34 }}>{p.price}</div>
                <div className="small">{p.unit}</div>
              </div>

              <ul className="p" style={{ margin: "12px 0 0 18px" }}>
                {p.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>

              <div style={{ marginTop: 14 }}>
                <a className={"btn " + (p.highlight ? "btnPrimary" : "")} href="#demo">
                  Request a demo
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="small" style={{ marginTop: 12 }}>
          Note: pricing shown in USD for investor demo. We can localize EUR/CAD at launch.
        </div>
      </div>
    </section>
  );
}
