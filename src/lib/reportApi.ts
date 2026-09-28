import { json } from "./api";
import { getReportDataset } from "./reportData";
import { hasDatabase } from "./db";
import { buildMonthlyReport, reportRequest } from "./reporting";

export async function loadRequestedReport(input: unknown) {
  const parsed = reportRequest.safeParse(input);
  if (!parsed.success)
    return {
      error: json(
        {
          error:
            "Invalid report filters. Expected month YYYY-MM, optional pool, and lang fr/en/es.",
        },
        400,
      ),
    };
  const { month, pool, measurement, observation, lang } = parsed.data;
  const data = await getReportDataset(month, pool);
  if (pool && !data.pools.some((item) => item.id === pool))
    return { error: json({ error: "Pool not found" }, 404) };
  if (observation) {
    if (
      hasDatabase() ||
      !pool ||
      observation.pool_id !== pool ||
      observation.id !== measurement ||
      !observation.measured_at
    )
      return { error: json({ error: "Invalid demo observation" }, 400) };
    data.measurements = [
      ...data.measurements.filter((item) => item.id !== observation.id),
      { ...observation },
    ];
  }
  const report = buildMonthlyReport(data, month, pool);
  if (measurement) {
    const selected = report.pools
      .flatMap((item) => item.measurements)
      .find((item) => item.id === measurement);
    if (!selected)
      return {
        error: json({ error: "Measurement not found in this period" }, 404),
      };
    report.focusedMeasurement = selected;
  }
  return { report, lang };
}

const requests = new Map<string, { count: number; expires: number }>();
export async function readAnalysisRequest(
  request: Request,
  clientAddress: string,
  schema: {
    safeParse: (input: unknown) => { success: boolean };
  } = reportRequest,
) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return { error: json({ error: "Invalid origin" }, 403) };
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return { error: json({ error: "JSON required" }, 415) };
  let body;
  try {
    body = await request.json();
  } catch {
    return { error: json({ error: "Invalid JSON" }, 400) };
  }
  if (!schema.safeParse(body).success)
    return { error: json({ error: "Invalid request data" }, 400) };
  const now = Date.now();
  // Bounded per-instance throttle; persistent enforcement belongs at the hosting edge.
  if (requests.size >= 2000) {
    for (const [key, value] of requests)
      if (value.expires <= now) requests.delete(key);
    if (requests.size >= 2000)
      return { error: json({ error: "Too many requests" }, 429) };
  }
  const previous = requests.get(clientAddress);
  const limit =
    previous && previous.expires > now
      ? previous
      : { count: 0, expires: now + 60000 };
  limit.count += 1;
  requests.set(clientAddress, limit);
  if (limit.count > 5)
    return {
      error: new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      }),
    };
  return { body };
}
