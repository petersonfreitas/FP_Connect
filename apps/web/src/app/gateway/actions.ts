"use server";

import { redirect } from "next/navigation";
import {
  createGatewayPaymentRequest,
  sendGatewaySmtpTestEmail,
  startGatewayMercadoPagoOAuth,
  syncGatewayPaymentRequestStatus,
  testGatewaySmtpConfig,
  upsertGatewayMercadoPagoManualConfig,
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
    redirect(`/gateway?companyId=${companyId}&tab=smtp&error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/gateway?companyId=${companyId}&tab=smtp&smtpSaved=1`);
}

export async function testGatewaySmtpConfigAction(formData: FormData) {
  const companyId = readFormString(formData, "companyId");

  if (!companyId) {
    redirect("/gateway?error=company");
  }

  const result = await testGatewaySmtpConfig(companyId);

  if (result.error) {
    redirect(`/gateway?companyId=${companyId}&tab=smtp&error=${encodeURIComponent(result.error)}`);
  }

  const status = result.data?.status ?? "failed";
  const message = result.data?.message ?? "Validacao SMTP concluida.";

  redirect(
    `/gateway?companyId=${companyId}&tab=smtp&smtpTest=${status}&message=${encodeURIComponent(message)}`
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
    redirect(`/gateway?companyId=${companyId}&tab=smtp&error=${encodeURIComponent(result.error)}`);
  }

  const message = result.data?.message ?? "E-mail de teste enviado.";

  redirect(
    `/gateway?companyId=${companyId}&tab=smtp&smtpEmailSent=1&message=${encodeURIComponent(message)}`
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
    redirect(`/gateway?companyId=${companyId}&tab=payments&error=${encodeURIComponent(result.error)}`);
  }

  const status = result.data?.status ?? "requested";

  redirect(`/gateway?companyId=${companyId}&tab=payments&paymentCreated=${status}`);
}

export async function startGatewayMercadoPagoOAuthAction(formData: FormData) {
  const companyId = readFormString(formData, "companyId");

  if (!companyId) {
    redirect("/gateway?error=company");
  }

  const result = await startGatewayMercadoPagoOAuth(companyId);

  if (result.error || !result.data) {
    redirect(
      `/gateway?companyId=${companyId}&error=${encodeURIComponent(
        result.error ?? "Nao foi possivel iniciar OAuth Mercado Pago."
      )}&tab=payments`
    );
  }

  redirect(result.data.authorizationUrl);
}

export async function saveGatewayMercadoPagoManualConfigAction(formData: FormData) {
  const companyId = readFormString(formData, "companyId");

  if (!companyId) {
    redirect("/gateway?error=company");
  }

  const result = await upsertGatewayMercadoPagoManualConfig(companyId, {
    accessToken: readFormString(formData, "accessToken"),
    appId: readFormString(formData, "appId") || null,
    publicKey: readFormString(formData, "publicKey") || null,
    userId: readFormString(formData, "userId") || null
  });

  if (result.error) {
    redirect(`/gateway?companyId=${companyId}&tab=payments&error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/gateway?companyId=${companyId}&tab=payments&mpManualSaved=1`);
}

export async function syncGatewayPaymentRequestStatusAction(formData: FormData) {
  const companyId = readFormString(formData, "companyId");
  const paymentRequestId = readFormString(formData, "paymentRequestId");

  if (!companyId || !paymentRequestId) {
    redirect("/gateway?tab=payments&error=payment");
  }

  const result = await syncGatewayPaymentRequestStatus(companyId, paymentRequestId);

  if (result.error) {
    redirect(
      `/gateway?companyId=${companyId}&tab=payments&error=${encodeURIComponent(result.error)}`
    );
  }

  const status = result.data?.status ?? "requested";

  redirect(`/gateway?companyId=${companyId}&tab=payments&paymentSynced=${status}`);
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
