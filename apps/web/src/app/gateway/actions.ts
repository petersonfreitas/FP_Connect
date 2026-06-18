"use server";

import { redirect } from "next/navigation";
import {
  createGatewayPaymentRequest,
  sendGatewaySmtpTestEmail,
  testGatewaySmtpConfig,
  upsertGatewaySmtpConfig
} from "@/lib/internal-api";

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

export async function sendGatewaySmtpTestEmailAction(formData: FormData) {
  const companyId = readFormString(formData, "companyId");

  if (!companyId) {
    redirect("/gateway?error=company");
  }

  const result = await sendGatewaySmtpTestEmail(companyId, {
    body: readFormString(formData, "body") || null,
    subject: readFormString(formData, "subject") || null,
    toEmail: readFormString(formData, "toEmail")
  });

  if (result.error) {
    redirect(`/gateway?companyId=${companyId}&error=${encodeURIComponent(result.error)}`);
  }

  const message = result.data?.message ?? "E-mail de teste enviado.";

  redirect(
    `/gateway?companyId=${companyId}&smtpEmailSent=1&message=${encodeURIComponent(message)}`
  );
}

export async function createGatewayPaymentRequestAction(formData: FormData) {
  const companyId = readFormString(formData, "companyId");

  if (!companyId) {
    redirect("/gateway?error=company");
  }

  const sourceReferenceId =
    readFormString(formData, "sourceReferenceId") || `manual-${Date.now()}`;
  const result = await createGatewayPaymentRequest(companyId, {
    amountCents: parseMoneyToCents(readFormString(formData, "amount")),
    customerEmail: readFormString(formData, "customerEmail") || null,
    customerName: readFormString(formData, "customerName") || null,
    customerPhone: readFormString(formData, "customerPhone") || null,
    description: readFormString(formData, "description"),
    idempotencyKey: `gateway-payment-v0:${companyId}:${sourceReferenceId}`,
    providerKey: readFormString(formData, "providerKey") || "mercado_pago",
    sourceApplicationKey: readFormString(formData, "sourceApplicationKey") || "food",
    sourceReferenceId,
    sourceReferenceType: readFormString(formData, "sourceReferenceType") || "order"
  });

  if (result.error) {
    redirect(`/gateway?companyId=${companyId}&error=${encodeURIComponent(result.error)}`);
  }

  const status = result.data?.status ?? "requested";

  redirect(`/gateway?companyId=${companyId}&paymentCreated=${status}`);
}

function readFormString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseMoneyToCents(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(amount * 100);
}
