export type Property = {
  id: string;
  name: string;
  city: string;
  country: string;
  status: "ok" | "attention";
};

export type Pool = {
  id: string;
  propertyId: string;
  name: string;
  type: "lap" | "family" | "spa" | "rooftop" | "indoor";
};

export type Alert = {
  id: string;
  propertyId: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  createdAt: string;
};

export type LogEntry = {
  id: string;
  propertyId: string;
  poolId: string;
  createdAt: string;
  tempC: number;
  ph: number;
  chlorine: number;
  notes: string;
  coverOpen: boolean;
  gateLocked: boolean;
  signageOk: boolean;
};

export const properties: Property[] = [
  { id: "prop-miami", name: "Ocean Crest Villa", city: "Miami", country: "USA", status: "attention" },
  { id: "prop-aspen", name: "Summit Ridge Lodge", city: "Aspen", country: "USA", status: "ok" },
  { id: "prop-nice", name: "Azur Boutique Hotel", city: "Nice", country: "France", status: "ok" },
  { id: "prop-cabo", name: "Casa del Mar Residences", city: "Los Cabos", country: "Mexico", status: "attention" },
  { id: "prop-lisbon", name: "Tagus Terrace Suites", city: "Lisbon", country: "Portugal", status: "ok" },
];

export const pools: Pool[] = [
  { id: "pool-miami-main", propertyId: "prop-miami", name: "Main Deck Pool", type: "family" },
  { id: "pool-miami-spa", propertyId: "prop-miami", name: "Courtyard Spa", type: "spa" },
  { id: "pool-aspen-indoor", propertyId: "prop-aspen", name: "Indoor Wellness Pool", type: "indoor" },
  { id: "pool-nice-rooftop", propertyId: "prop-nice", name: "Rooftop Pool", type: "rooftop" },
  { id: "pool-nice-lap", propertyId: "prop-nice", name: "Garden Lap Pool", type: "lap" },
  { id: "pool-cabo-main", propertyId: "prop-cabo", name: "Oceanfront Pool", type: "family" },
  { id: "pool-cabo-spa", propertyId: "prop-cabo", name: "Sunset Spa", type: "spa" },
  { id: "pool-lisbon-lap", propertyId: "prop-lisbon", name: "Terrace Lap Pool", type: "lap" },
];

export const alerts: Alert[] = [
  {
    id: "alert-1",
    propertyId: "prop-miami",
    severity: "critical",
    title: "Gate left unlocked after morning check",
    detail: "Main Deck Pool needs a follow-up safety walk before guest access is reopened.",
    createdAt: "2026-03-08T09:18:00.000Z",
  },
  {
    id: "alert-2",
    propertyId: "prop-cabo",
    severity: "warning",
    title: "Chlorine trending low",
    detail: "Oceanfront Pool measured below the operating threshold twice in the last 24 hours.",
    createdAt: "2026-03-08T08:12:00.000Z",
  },
  {
    id: "alert-3",
    propertyId: "prop-nice",
    severity: "info",
    title: "Monthly report package assembled",
    detail: "March water-quality bundle is ready for manager review.",
    createdAt: "2026-03-08T07:40:00.000Z",
  },
  {
    id: "alert-4",
    propertyId: "prop-miami",
    severity: "warning",
    title: "Cover remained open overnight",
    detail: "Courtyard Spa requires a supervisor sign-off after the evening closing routine.",
    createdAt: "2026-03-07T22:05:00.000Z",
  },
  {
    id: "alert-5",
    propertyId: "prop-lisbon",
    severity: "info",
    title: "Inspection checklist completed",
    detail: "All mandatory signage photos were uploaded for the terrace pool.",
    createdAt: "2026-03-07T17:50:00.000Z",
  },
];

export const logs: LogEntry[] = [
  {
    id: "log-101",
    propertyId: "prop-miami",
    poolId: "pool-miami-main",
    createdAt: "2026-03-08T09:12:00.000Z",
    tempC: 28.1,
    ph: 7.4,
    chlorine: 2.2,
    notes: "Water clarity excellent. Waiting for gate reset confirmation.",
    coverOpen: false,
    gateLocked: false,
    signageOk: true,
  },
  {
    id: "log-102",
    propertyId: "prop-miami",
    poolId: "pool-miami-spa",
    createdAt: "2026-03-08T08:35:00.000Z",
    tempC: 35.4,
    ph: 7.3,
    chlorine: 2.5,
    notes: "Spa cover was still open after treatment cycle.",
    coverOpen: true,
    gateLocked: true,
    signageOk: true,
  },
  {
    id: "log-103",
    propertyId: "prop-aspen",
    poolId: "pool-aspen-indoor",
    createdAt: "2026-03-08T07:55:00.000Z",
    tempC: 27.8,
    ph: 7.5,
    chlorine: 2.1,
    notes: "All checks within range.",
    coverOpen: false,
    gateLocked: true,
    signageOk: true,
  },
  {
    id: "log-104",
    propertyId: "prop-nice",
    poolId: "pool-nice-rooftop",
    createdAt: "2026-03-08T07:20:00.000Z",
    tempC: 26.9,
    ph: 7.2,
    chlorine: 1.9,
    notes: "Ready for opening shift.",
    coverOpen: false,
    gateLocked: true,
    signageOk: true,
  },
  {
    id: "log-105",
    propertyId: "prop-nice",
    poolId: "pool-nice-lap",
    createdAt: "2026-03-07T18:40:00.000Z",
    tempC: 25.7,
    ph: 7.6,
    chlorine: 2.3,
    notes: "Evening close completed.",
    coverOpen: false,
    gateLocked: true,
    signageOk: true,
  },
  {
    id: "log-106",
    propertyId: "prop-cabo",
    poolId: "pool-cabo-main",
    createdAt: "2026-03-08T06:50:00.000Z",
    tempC: 29.4,
    ph: 7.8,
    chlorine: 0.8,
    notes: "Dosed chlorine after reading. Re-test scheduled for midday.",
    coverOpen: false,
    gateLocked: true,
    signageOk: true,
  },
  {
    id: "log-107",
    propertyId: "prop-cabo",
    poolId: "pool-cabo-spa",
    createdAt: "2026-03-07T13:25:00.000Z",
    tempC: 34.8,
    ph: 7.4,
    chlorine: 2.0,
    notes: "Signage panel needs replacement.",
    coverOpen: false,
    gateLocked: true,
    signageOk: false,
  },
  {
    id: "log-108",
    propertyId: "prop-lisbon",
    poolId: "pool-lisbon-lap",
    createdAt: "2026-03-07T16:15:00.000Z",
    tempC: 24.9,
    ph: 7.3,
    chlorine: 2.2,
    notes: "Weekly maintenance booked for Monday.",
    coverOpen: false,
    gateLocked: true,
    signageOk: true,
  },
];
