import React from "react";

const items = ["Luxe Villas", "Boutique Hotels", "HOA Ops", "PM Groups"];

export default function Logos() {
  return (
    <section className="section">
      <div className="container">
        <div className="small">Designed for teams like:</div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 10 }}>
          {items.map((item) => (
            <div key={item} className="card" style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
