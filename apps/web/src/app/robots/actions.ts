"use server";

import { redirect } from "next/navigation";
import { reprocessRobotsExecution } from "@/lib/internal-api";

export async function reprocessRobotsExecutionAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "").trim();
  const executionId = String(formData.get("executionId") ?? "").trim();

  if (!companyId || !executionId) {
    redirect("/robots?error=execution");
  }

  const result = await reprocessRobotsExecution(companyId, executionId);

  if (result.error) {
    redirect(buildRobotsUrl({ companyId, error: result.error }));
  }

  redirect(`/robots?companyId=${companyId}&reprocessed=1`);
}

function buildRobotsUrl(params: Record<string, string>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    search.set(key, truncateQueryValue(value));
  }

  return `/robots?${search.toString()}`;
}

function truncateQueryValue(value: string): string {
  return value.length > 500 ? `${value.slice(0, 497)}...` : value;
}
