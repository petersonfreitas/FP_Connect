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
    redirect(buildGatewayUrl({ companyId, error: result.error, tab: "smtp" }));
  }

  redirect(buildGatewayUrl({ companyId, smtpSaved: "1", tab: "smtp" }));
}

export async function testGatewaySmtpConfigAction(formData: FormData) {
  const companyId = readFormString(formData, "companyId");

  if (!companyId) {
    redirect("/gateway?error=company");
  }

  const result = await testGatewaySmtpConfig(companyId);

  if (result.error) {
    redirect(buildGatewayUrl({ companyId, error: result.error, tab: "smtp" }));
  }

  const status = result.data?.status ?? "failed";
  const message = result.data?.message ?? "Validacao SMTP concluida.";

  redirect(buildGatewayUrl({ companyId, message, smtpTest: status, tab: "smtp" }));
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
    redirect(buildGatewayUrl({ companyId, error: result.error, tab: "smtp" }));
  }

  const message = result.data?.message ?? "E-mail de teste enviado.";

  redirect(buildGatewayUrl({ companyId, message, smtpEmailSent: "1", tab: "smtp" }));
}

export async function createGatewayPaymentRequestAction(formData: FormData) {
  const companyId = readFormString(formData, "companyId");

  if (!companyId) {
    redirect("/gateway?error=company");
  }

  const sourceReferenceId =
    readFormString(formData, "sourceReferenceId") || `manual-${Date.now()}`;
  const paymentMethodType = readFormString(formData, "paymentMethodType") || "pix";
  const result = await createGatewayPaymentRequest(companyId, {
    amountCents: parseMoneyToCents(readFormString(formData, "amount")),
    cardToken: readFormString(formData, "cardToken") || null,
    customerEmail: readFormString(formData, "customerEmail") || null,
    customerName: readFormString(formData, "customerName") || null,
    customerPhone: readFormString(formData, "customerPhone") || null,
    description: readFormString(formData, "description"),
    idempotencyKey: `gateway-payment-v0:${companyId}:${sourceReferenceId}:${paymentMethodType}`,
    installments: parseOptionalInteger(readFormString(formData, "installments")),
    paymentMethodId: readFormString(formData, "paymentMethodId") || null,
    paymentMethodType:
      paymentMethodType === "credit_card" || paymentMethodType === "debit_card"
        ? paymentMethodType
        : "pix",
    providerKey: readFormString(formData, "providerKey") || "mercado_pago",
    sourceApplicationKey: readFormString(formData, "sourceApplicationKey") || "food",
    sourceReferenceId,
    sourceReferenceType: readFormString(formData, "sourceReferenceType") || "order"
  });

  if (result.error) {
    redirect(buildGatewayUrl({ companyId, error: result.error, tab: "payments" }));
  }

  const status = result.data?.status ?? "requested";

  redirect(buildGatewayUrl({ companyId, paymentCreated: status, tab: "payments" }));
}

export async function startGatewayMercadoPagoOAuthAction(formData: FormData) {
  const companyId = readFormString(formData, "companyId");

  if (!companyId) {
    redirect("/gateway?error=company");
  }

  const result = await startGatewayMercadoPagoOAuth(companyId);

  if (result.error || !result.data) {
    redirect(
      buildGatewayUrl({
        companyId,
        error: result.error ?? "Nao foi possivel iniciar OAuth Mercado Pago.",
        tab: "payments"
      })
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
    redirect(buildGatewayUrl({ companyId, error: result.error, tab: "payments" }));
  }

  redirect(buildGatewayUrl({ companyId, mpManualSaved: "1", tab: "payments" }));
}

export async function syncGatewayPaymentRequestStatusAction(formData: FormData) {
  const companyId = readFormString(formData, "companyId");
  const paymentRequestId = readFormString(formData, "paymentRequestId");

  if (!companyId || !paymentRequestId) {
    redirect("/gateway?tab=payments&error=payment");
  }

  const result = await syncGatewayPaymentRequestStatus(companyId, paymentRequestId);

  if (result.error) {
    redirect(buildGatewayUrl({ companyId, error: result.error, tab: "payments" }));
  }

  const status = result.data?.status ?? "requested";

  redirect(buildGatewayUrl({ companyId, paymentSynced: status, tab: "payments" }));
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

function parseOptionalInteger(value: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function buildGatewayUrl(params: Record<string, string>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    search.set(key, truncateQueryValue(value));
  }

  return `/gateway?${search.toString()}`;
}

function truncateQueryValue(value: string): string {
  return value.length > 500 ? `${value.slice(0, 497)}...` : value;
}
