import React, { useMemo, useState } from "react";

/**
 * MVP: form works as a "mailto:" fallback (no backend required).
 * Phase 1.1: replace with Supabase insert or a simple API route.
 */
export default function DemoForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    country: "USA",
    portfolio: "1-5 pools",
    message: "",
  });

  const mailtoHref = useMemo(() => {
    const to = "demo@yourdomain.com";
    const subject = encodeURIComponent("PoolGuardian - Demo request");
    const body = encodeURIComponent(
      [
        `Name: ${form.name}`,
        `Email: ${form.email}`,
        `Company: ${form.company}`,
        `Country: ${form.country}`,
        `Portfolio: ${form.portfolio}`,
        "",
        `Message: ${form.message}`,
      ].join("\n")
    );
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }, [form]);

  function onChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  const isValid = form.name && form.email;

  return (
    <section id="demo" className="section">
      <div className="container">
        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 16 }}>
          <div className="card2" style={{ padding: 18 }}>
            <h2 className="h2">Request a demo</h2>
            <p className="p">
              Investor demo today: this form uses a mailto fallback. We can plug Supabase in the next iteration.
            </p>

            <div className="row" style={{ marginTop: 10 }}>
              <div>
                <label className="label">Full name *</label>
                <input className="input" name="name" value={form.name} onChange={onChange} placeholder="Olivier..." />
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" name="email" value={form.email} onChange={onChange} placeholder="name@company.com" />
              </div>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div>
                <label className="label">Company / Organization</label>
                <input className="input" name="company" value={form.company} onChange={onChange} placeholder="Property Management LLC" />
              </div>
              <div>
                <label className="label">Country</label>
                <select className="input" name="country" value={form.country} onChange={onChange}>
                  <option>USA</option>
                  <option>Canada</option>
                  <option>France</option>
                </select>
              </div>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <div>
                <label className="label">Portfolio size</label>
                <select className="input" name="portfolio" value={form.portfolio} onChange={onChange}>
                  <option>1-5 pools</option>
                  <option>6-20 pools</option>
                  <option>21-100 pools</option>
                  <option>100+ pools</option>
                </select>
              </div>
              <div>
                <label className="label">Message</label>
                <input className="input" name="message" value={form.message} onChange={onChange} placeholder="What do you need most?" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
              <a
                className={"btn " + (isValid ? "btnPrimary" : "")}
                href={isValid ? mailtoHref : "#demo"}
                onClick={(e) => {
                  if (!isValid) e.preventDefault();
                }}
              >
                Send demo request
              </a>
              <a className="btn" href="#pricing">View pricing</a>
            </div>

            <div className="small" style={{ marginTop: 10 }}>
              By submitting, you agree to be contacted about the product. We don't sell personal data.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
