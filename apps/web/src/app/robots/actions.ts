"use server";

import { redirect } from "next/navigation";
import {
  createRobotsTestEvent,
  createRobotsTestFailure,
  reprocessRobotsExecution
} from "@/lib/internal-api";

export async function createRobotsTestEventAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "").trim();

  if (!companyId) {
    redirect("/robots?error=company");
  }

  const result = await createRobotsTestEvent(companyId);

  if (result.error) {
    redirect(`/robots?companyId=${companyId}&error=${encodeURIComponent(result.error)}`);
  }

  const data = result.data;

  if (!data) {
    redirect(`/robots?companyId=${companyId}&error=${encodeURIComponent("Resposta vazia da API")}`);
  }

  redirect(`/robots?companyId=${companyId}&eventCreated=1&executions=${data.executionsCreated}`);
}

export async function createRobotsTestFailureAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "").trim();

  if (!companyId) {
    redirect("/robots?error=company");
  }

  const result = await createRobotsTestFailure(companyId);

  if (result.error) {
    redirect(`/robots?companyId=${companyId}&error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/robots?companyId=${companyId}&failureCreated=1`);
}

export async function reprocessRobotsExecutionAction(formData: FormData) {
  const companyId = String(formData.get("companyId") ?? "").trim();
  const executionId = String(formData.get("executionId") ?? "").trim();

  if (!companyId || !executionId) {
    redirect("/robots?error=execution");
  }

  const result = await reprocessRobotsExecution(companyId, executionId);

  if (result.error) {
    redirect(`/robots?companyId=${companyId}&error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/robots?companyId=${companyId}&reprocessed=1`);
}
