import type { APIRoute } from "astro";
import { json } from "../../../lib/api";
import { generateReportAnalysis } from "../../../lib/reportAI";
import {
  loadRequestedReport,
  readAnalysisRequest,
} from "../../../lib/reportApi";

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const input = await readAnalysisRequest(request, clientAddress);
  if (input.error) return input.error;
  const result = await loadRequestedReport(input.body);
  if (result.error) return result.error;
  const analysis = await generateReportAnalysis(result.report, result.lang);
  const response = json({ analysis });
  response.headers.set("Cache-Control", "no-store");
  return response;
};
