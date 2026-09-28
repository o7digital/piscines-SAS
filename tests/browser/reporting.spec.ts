import { test, expect } from "@playwright/test";
const analysis = {
  source: "huggingface",
  summary: "Le relevé montre un pH à surveiller.",
  highlights: ["pH élevé."],
  recommendations: ["Vérifier les nouvelles mesures avec le pisciniste."],
  generatedAt: "2026-09-28T20:00:00.000Z",
  model: "test/model",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/reports/summary", (route) =>
    route.fulfill({ json: { analysis } }),
  );
});

test("reporting filters, pool detail, AI result and CSV download", async ({
  page,
}) => {
  await page.goto("/app/reports");
  await expect(
    page.getByRole("heading", { name: "Rapports & analyses" }),
  ).toBeVisible();
  await expect(page.getByText(analysis.summary)).toBeVisible();
  await page
    .getByLabel("Piscine", { exact: true })
    .selectOption("pool-villa-azur");
  await page.getByRole("button", { name: "Afficher", exact: true }).click();
  await expect(page).toHaveURL(/pool=pool-villa-azur/);
  await expect(
    page.getByRole("heading", { name: "Bassin principal Villa Azur" }),
  ).toHaveCount(2);
  await expect(page.getByRole("img")).toHaveCount(2);
  const csv = await page.request.get(
    "/api/reports/export?month=2026-05&pool=pool-villa-azur",
  );
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain("Bassin principal Villa Azur");
  expect(await csv.text()).not.toContain("Bastide Luberon");
});

test("measurement buttons request the matching reading and all six parameters are displayed", async ({
  page,
}) => {
  await page.goto("/app/measurements");
  await expect(page.getByText(analysis.summary)).toBeVisible();
  const reading = page
    .locator("article")
    .filter({ hasText: "Bastide Luberon" })
    .first();
  const request = page.waitForRequest(
    (request) =>
      request.url().endsWith("/api/reports/summary") &&
      request.postDataJSON().pool === "pool-bastide-luberon",
  );
  await reading.getByRole("button", { name: /Analyser ce relevé/ }).click();
  expect((await request).postDataJSON().measurement).toBe("mea-9");
  await expect(reading.getByText("580", { exact: true })).toBeVisible();
  await expect(reading.getByText("142", { exact: true })).toBeVisible();
  await expect(reading.getByText("310", { exact: true })).toBeVisible();
});

test("new measurement is analyzed and demo export retains its unsaved observation", async ({
  page,
}) => {
  await page.route("**/api/measurements", async (route) => {
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      json: { ...body, id: "demo-new", analysis, persisted: false },
    });
  });
  await page.route("**/api/exports/monthly", async (route) => {
    expect(route.request().postDataJSON().observation.ph).toBe(7.8);
    expect(route.request().postDataJSON().measurement).toBe("demo-new");
    await route.fulfill({ body: "%PDF-1.7\n", contentType: "application/pdf" });
  });
  await page.goto("/app/measurements");
  await page
    .getByText("Nouvelle mesure · analyse Hugging Face incluse")
    .click();
  await page.locator('[name="measured_at"]').fill("2026-09-28T14:00");
  await page.locator('[name="ph"]').fill("7.8");
  await page.locator('[name="chlorine"]').fill("0.8");
  await page.locator('[name="temperature"]').fill("28");
  await page
    .getByRole("button", { name: "Enregistrer et analyser", exact: true })
    .click();
  await expect(
    page.getByText("Relevé analysé pour cette session", { exact: false }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exporter le PDF", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("bluu3-report-2026-09.pdf");
});

test("empty month remains unknown and reports are available in EN and ES", async ({
  page,
}) => {
  await page.goto("/app/reports?month=2026-09");
  await expect(page.getByText("Sans données", { exact: true })).toHaveCount(4);
  await page.goto("/en/app/reports");
  await expect(
    page.getByRole("heading", { name: "Reports & insights" }),
  ).toBeVisible();
  await page.goto("/es/app/reports");
  await expect(
    page.getByRole("heading", { name: "Informes y análisis" }),
  ).toBeVisible();
});

test("mobile viewport stays within the screen and failures preserve automatic summaries", async ({
  page,
}) => {
  await page.route("**/api/reports/summary", (route) =>
    route.fulfill({ status: 429, json: { error: "Too many requests" } }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/reports");
  await expect(page.getByRole("alert")).toContainText(
    "Réessayez dans une minute",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("main").getByText(/12 mesures et 8 contrôles/),
  ).toBeVisible();
});

test("API rejects invalid filters, invalid inputs, cross-origin requests and missing readings", async ({
  request,
}) => {
  const invalidMonth = await request.post("/api/reports/summary", {
    data: { month: "2026-13" },
  });
  expect(invalidMonth.status()).toBe(400);
  const wrongOrigin = await request.post("/api/reports/summary", {
    headers: { Origin: "https://untrusted.invalid" },
    data: { month: "2026-05" },
  });
  expect(wrongOrigin.status()).toBe(403);
  const missing = await request.get(
    "/api/exports/monthly?month=2026-05&pool=missing",
  );
  expect(missing.status()).toBe(404);
  const invalidMeasurement = await request.post("/api/measurements", {
    data: { pool_id: "pool-villa-azur", ph: 99, chlorine: 1, temperature: 27 },
  });
  expect(invalidMeasurement.status()).toBe(400);
  const pdf = await request.get(
    "/api/exports/monthly?month=2026-05&pool=pool-villa-azur",
  );
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
});
