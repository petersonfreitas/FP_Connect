"use server";

import { redirect } from "next/navigation";
import { testGatewaySmtpConfig, upsertGatewaySmtpConfig } from "@/lib/internal-api";

export async function saveGatewaySmtpConfigAction(formData: FormData) {
  const companyId = readFormString(formData, "companyId");

  if (!companyId) {
    redirect("/gateway?error=company");
  }

  const port = Number(readFormString(formData, "port"));
  const result = await upsertGatewaySmtpConfig(companyId, {
    fromEmail: readFormString(formData, "fromEmail"),
    fromName: readFormString(formData, "fromName") || null,
    host: readFormString(formData, "host"),
    password: readFormString(formData, "password") || null,
    port,
    secure: formData.get("secure") === "on",
    status: readFormString(formData, "status") === "active" ? "active" : "configured",
    username: readFormString(formData, "username") || null
  });

  if (result.error) {
    redirect(`/gateway?companyId=${companyId}&error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/gateway?companyId=${companyId}&smtpSaved=1`);
}

export async function testGatewaySmtpConfigAction(formData: FormData) {
  const companyId = readFormString(formData, "companyId");

  if (!companyId) {
    redirect("/gateway?error=company");
  }

  const result = await testGatewaySmtpConfig(companyId);

  if (result.error) {
    redirect(`/gateway?companyId=${companyId}&error=${encodeURIComponent(result.error)}`);
  }

  const status = result.data?.status ?? "failed";
  const message = result.data?.message ?? "Validacao SMTP concluida.";

  redirect(
    `/gateway?companyId=${companyId}&smtpTest=${status}&message=${encodeURIComponent(message)}`
  );
}

function readFormString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
