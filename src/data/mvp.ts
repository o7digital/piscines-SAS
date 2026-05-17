import { calculateEcoScore } from "../lib/ecoScore";

export type Role = "owner" | "provider" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
};

export type PropertyRecord = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  owner_id: string;
  provider_id: string;
  status: "active" | "attention";
  created_at: string;
};

export type PoolRecord = {
  id: string;
  property_id: string;
  name: string;
  location: string;
  owner_id: string;
  provider_id: string;
  volume: number;
  treatment_type: string;
  status: "ok" | "attention" | "critical";
  created_at: string;
};

export type Measurement = {
  id: string;
  pool_id: string;
  ph: number;
  chlorine: number;
  temperature: number;
  orp: number;
  alkalinity: number;
  hardness: number;
  notes: string;
  measured_at: string;
};

export type OperationalCheck = {
  id: string;
  pool_id: string;
  provider_id: string;
  cover_ok: boolean;
  filtration_ok: boolean;
  safety_ok: boolean;
  cleanliness_ok: boolean;
  status: "ok" | "attention" | "critical";
  notes: string;
  checked_at: string;
};

export type Intervention = {
  id: string;
  pool_id: string;
  provider_id: string;
  type: string;
  status: "scheduled" | "done" | "urgent";
  scheduled_at: string;
  notes: string;
  report_url: string | null;
  created_at: string;
};

export const users: User[] = [
  { id: "usr-admin", email: "admin@bluu3.com", name: "Admin Bluu3", role: "admin", created_at: "2026-05-01T08:00:00.000Z" },
  { id: "usr-provider", email: "provider@bluu3.com", name: "Azur Piscines Pro", role: "provider", created_at: "2026-05-01T08:10:00.000Z" },
  { id: "usr-owner-1", email: "owner1@bluu3.com", name: "Claire Martin", role: "owner", created_at: "2026-05-01T08:20:00.000Z" },
  { id: "usr-owner-2", email: "owner2@bluu3.com", name: "Julien Moreau", role: "owner", created_at: "2026-05-01T08:30:00.000Z" },
];

export const properties: PropertyRecord[] = [
  { id: "prop-villa-azur", name: "Villa Azur", address: "12 chemin des Pins", city: "Nice", country: "France", owner_id: "usr-owner-1", provider_id: "usr-provider", status: "active", created_at: "2026-05-02T08:00:00.000Z" },
  { id: "prop-mas-olivier", name: "Mas Olivier", address: "88 route de la Treille", city: "Aix-en-Provence", country: "France", owner_id: "usr-owner-1", provider_id: "usr-provider", status: "active", created_at: "2026-05-02T08:20:00.000Z" },
  { id: "prop-domaine-luberon", name: "Domaine Luberon", address: "4 traverse des Lavandes", city: "Gordes", country: "France", owner_id: "usr-owner-2", provider_id: "usr-provider", status: "attention", created_at: "2026-05-02T08:40:00.000Z" },
];

export const pools: PoolRecord[] = [
  { id: "pool-villa-azur", property_id: "prop-villa-azur", name: "Bassin principal Villa Azur", location: "Nice", owner_id: "usr-owner-1", provider_id: "usr-provider", volume: 54, treatment_type: "salt", status: "ok", created_at: "2026-05-02T09:00:00.000Z" },
  { id: "pool-mas-olivier", property_id: "prop-mas-olivier", name: "Piscine Mas Olivier", location: "Aix-en-Provence", owner_id: "usr-owner-1", provider_id: "usr-provider", volume: 72, treatment_type: "chlorine", status: "attention", created_at: "2026-05-02T09:30:00.000Z" },
  { id: "pool-rooftop-cannes", property_id: "prop-villa-azur", name: "Rooftop Cannes", location: "Cannes", owner_id: "usr-owner-2", provider_id: "usr-provider", volume: 38, treatment_type: "salt", status: "ok", created_at: "2026-05-02T10:00:00.000Z" },
  { id: "pool-bastide-luberon", property_id: "prop-domaine-luberon", name: "Bastide Luberon", location: "Gordes", owner_id: "usr-owner-2", provider_id: "usr-provider", volume: 92, treatment_type: "chlorine", status: "critical", created_at: "2026-05-02T10:30:00.000Z" },
];

export const measurements: Measurement[] = [
  { id: "mea-1", pool_id: "pool-villa-azur", ph: 7.4, chlorine: 2.1, temperature: 27.2, orp: 710, alkalinity: 92, hardness: 210, notes: "Eau claire.", measured_at: "2026-05-17T07:40:00.000Z" },
  { id: "mea-2", pool_id: "pool-villa-azur", ph: 7.3, chlorine: 2.0, temperature: 26.8, orp: 705, alkalinity: 95, hardness: 208, notes: "RAS.", measured_at: "2026-05-15T08:10:00.000Z" },
  { id: "mea-3", pool_id: "pool-villa-azur", ph: 7.4, chlorine: 2.2, temperature: 27.0, orp: 715, alkalinity: 93, hardness: 211, notes: "Contrôle régulier.", measured_at: "2026-05-12T07:45:00.000Z" },
  { id: "mea-4", pool_id: "pool-mas-olivier", ph: 7.8, chlorine: 1.1, temperature: 28.6, orp: 620, alkalinity: 130, hardness: 260, notes: "Chlore bas, correction prévue.", measured_at: "2026-05-17T08:05:00.000Z" },
  { id: "mea-5", pool_id: "pool-mas-olivier", ph: 7.7, chlorine: 1.3, temperature: 28.2, orp: 640, alkalinity: 126, hardness: 255, notes: "Surveillance.", measured_at: "2026-05-14T08:05:00.000Z" },
  { id: "mea-6", pool_id: "pool-mas-olivier", ph: 7.5, chlorine: 1.7, temperature: 27.8, orp: 680, alkalinity: 108, hardness: 240, notes: "Après traitement.", measured_at: "2026-05-11T08:25:00.000Z" },
  { id: "mea-7", pool_id: "pool-rooftop-cannes", ph: 7.2, chlorine: 2.5, temperature: 29.1, orp: 735, alkalinity: 88, hardness: 205, notes: "Bonne stabilité.", measured_at: "2026-05-17T09:00:00.000Z" },
  { id: "mea-8", pool_id: "pool-rooftop-cannes", ph: 7.3, chlorine: 2.3, temperature: 28.7, orp: 728, alkalinity: 90, hardness: 203, notes: "Filtration OK.", measured_at: "2026-05-13T09:20:00.000Z" },
  { id: "mea-9", pool_id: "pool-bastide-luberon", ph: 8.0, chlorine: 0.7, temperature: 31.4, orp: 580, alkalinity: 142, hardness: 310, notes: "Valeurs critiques.", measured_at: "2026-05-17T06:55:00.000Z" },
  { id: "mea-10", pool_id: "pool-bastide-luberon", ph: 7.9, chlorine: 0.9, temperature: 30.8, orp: 600, alkalinity: 138, hardness: 300, notes: "Intervention urgente.", measured_at: "2026-05-16T07:30:00.000Z" },
  { id: "mea-11", pool_id: "pool-bastide-luberon", ph: 7.7, chlorine: 1.2, temperature: 29.8, orp: 625, alkalinity: 130, hardness: 292, notes: "Amélioration après traitement.", measured_at: "2026-05-15T07:15:00.000Z" },
  { id: "mea-12", pool_id: "pool-rooftop-cannes", ph: 7.2, chlorine: 2.4, temperature: 28.9, orp: 732, alkalinity: 89, hardness: 204, notes: "Contrôle pré-weekend.", measured_at: "2026-05-11T09:10:00.000Z" },
];

export const operationalChecks: OperationalCheck[] = [
  { id: "chk-1", pool_id: "pool-villa-azur", provider_id: "usr-provider", cover_ok: true, filtration_ok: true, safety_ok: true, cleanliness_ok: true, status: "ok", notes: "Ouverture validée.", checked_at: "2026-05-17T07:45:00.000Z" },
  { id: "chk-2", pool_id: "pool-villa-azur", provider_id: "usr-provider", cover_ok: true, filtration_ok: true, safety_ok: true, cleanliness_ok: true, status: "ok", notes: "Fermeture complète.", checked_at: "2026-05-16T18:20:00.000Z" },
  { id: "chk-3", pool_id: "pool-mas-olivier", provider_id: "usr-provider", cover_ok: true, filtration_ok: true, safety_ok: true, cleanliness_ok: false, status: "attention", notes: "Margelles à nettoyer.", checked_at: "2026-05-17T08:15:00.000Z" },
  { id: "chk-4", pool_id: "pool-mas-olivier", provider_id: "usr-provider", cover_ok: true, filtration_ok: true, safety_ok: true, cleanliness_ok: true, status: "ok", notes: "Après nettoyage.", checked_at: "2026-05-15T11:10:00.000Z" },
  { id: "chk-5", pool_id: "pool-rooftop-cannes", provider_id: "usr-provider", cover_ok: true, filtration_ok: true, safety_ok: true, cleanliness_ok: true, status: "ok", notes: "RAS rooftop.", checked_at: "2026-05-17T09:05:00.000Z" },
  { id: "chk-6", pool_id: "pool-rooftop-cannes", provider_id: "usr-provider", cover_ok: true, filtration_ok: true, safety_ok: true, cleanliness_ok: true, status: "ok", notes: "Contrôle filtration OK.", checked_at: "2026-05-13T09:30:00.000Z" },
  { id: "chk-7", pool_id: "pool-bastide-luberon", provider_id: "usr-provider", cover_ok: false, filtration_ok: false, safety_ok: true, cleanliness_ok: false, status: "critical", notes: "Filtration et couverture à reprendre.", checked_at: "2026-05-17T07:05:00.000Z" },
  { id: "chk-8", pool_id: "pool-bastide-luberon", provider_id: "usr-provider", cover_ok: true, filtration_ok: false, safety_ok: true, cleanliness_ok: true, status: "attention", notes: "Pompe à surveiller.", checked_at: "2026-05-16T07:45:00.000Z" },
];

export const interventions: Intervention[] = [
  { id: "int-1", pool_id: "pool-villa-azur", provider_id: "usr-provider", type: "maintenance", status: "done", scheduled_at: "2026-05-16T10:00:00.000Z", notes: "Nettoyage ligne d'eau.", report_url: null, created_at: "2026-05-10T08:00:00.000Z" },
  { id: "int-2", pool_id: "pool-mas-olivier", provider_id: "usr-provider", type: "corrective chemistry", status: "scheduled", scheduled_at: "2026-05-17T14:00:00.000Z", notes: "Correction pH et chlore.", report_url: null, created_at: "2026-05-16T09:00:00.000Z" },
  { id: "int-3", pool_id: "pool-rooftop-cannes", provider_id: "usr-provider", type: "maintenance", status: "scheduled", scheduled_at: "2026-05-18T09:30:00.000Z", notes: "Contrôle filtration.", report_url: null, created_at: "2026-05-15T12:00:00.000Z" },
  { id: "int-4", pool_id: "pool-bastide-luberon", provider_id: "usr-provider", type: "corrective urgent", status: "urgent", scheduled_at: "2026-05-17T11:30:00.000Z", notes: "Traitement choc et diagnostic pompe.", report_url: null, created_at: "2026-05-17T07:15:00.000Z" },
  { id: "int-5", pool_id: "pool-bastide-luberon", provider_id: "usr-provider", type: "corrective follow-up", status: "scheduled", scheduled_at: "2026-05-18T11:00:00.000Z", notes: "Re-mesure après traitement.", report_url: null, created_at: "2026-05-17T08:00:00.000Z" },
];

export const ecoScores = pools.map((pool) => ({
  id: `eco-${pool.id}`,
  pool_id: pool.id,
  ...calculateEcoScore(
    pool,
    measurements.filter((item) => item.pool_id === pool.id),
    interventions.filter((item) => item.pool_id === pool.id),
  ),
  created_at: "2026-05-17T09:30:00.000Z",
}));

export const poolPassports = pools.map((pool) => ({
  id: `pass-${pool.id}`,
  pool_id: pool.id,
  qr_code_url: `/app/passport?pool=${pool.id}`,
  equipment_summary: `${pool.treatment_type} treatment, ${pool.volume} m3, filtration standard MVP.`,
  history_summary: "Historique MVP des mesures, checks et interventions disponible dans Bluu3.",
  created_at: "2026-05-17T09:35:00.000Z",
}));

export const reports = [
  { id: "rep-1", pool_id: "pool-villa-azur", type: "monthly", title: "Rapport mensuel Villa Azur", period_start: "2026-05-01", period_end: "2026-05-31", pdf_url: "/api/exports/monthly?pool=pool-villa-azur", status: "ready", created_at: "2026-05-17T10:00:00.000Z" },
  { id: "rep-2", pool_id: "pool-mas-olivier", type: "monthly", title: "Rapport mensuel Mas Olivier", period_start: "2026-05-01", period_end: "2026-05-31", pdf_url: "/api/exports/monthly?pool=pool-mas-olivier", status: "draft", created_at: "2026-05-17T10:10:00.000Z" },
  { id: "rep-3", pool_id: "pool-bastide-luberon", type: "intervention", title: "Rapport intervention Bastide Luberon", period_start: "2026-05-17", period_end: "2026-05-17", pdf_url: "/api/exports/intervention?pool=pool-bastide-luberon", status: "ready", created_at: "2026-05-17T10:20:00.000Z" },
];

export const mvpData = { users, properties, pools, measurements, operationalChecks, interventions, ecoScores, poolPassports, reports };
