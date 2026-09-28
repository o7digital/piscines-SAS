import type { APIRoute } from "astro";
import { loadRequestedReport } from "../../../lib/reportApi";
import { reportCsv } from "../../../lib/reporting";

export const GET: APIRoute = async ({ url }) => {
  const input = await loadRequestedReport(Object.fromEntries(url.searchParams));
  if (input.error) return input.error;
  return new Response(reportCsv(input.report), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bluu3-report-${input.report.month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
};
