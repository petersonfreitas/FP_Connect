import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import net from "node:net";
import readline from "node:readline";
import tls from "node:tls";
import { RobotsService } from "../robots/robots.service";
import { SupabaseService } from "../../supabase/supabase.service";
import type {
  CreateGatewayPaymentRequestInput,
  GatewayCompanyProviderConfigContract,
  GatewayCompanyProviderStatus,
  GatewayPaymentRequestContract,
  GatewayPaymentRequestStatus,
  GatewayProviderAuthType,
  GatewayProviderCategory,
  GatewayProviderContract,
  GatewayProviderStatus,
  GatewayProviderValidationContract,
  GatewaySmtpPublicConfig,
  GatewaySmtpTestEmailContract,
  GatewayValidationStatus,
  SendGatewaySmtpTestEmailInput,
  UpsertGatewaySmtpConfigInput
} from "./gateway.contracts";

type ProviderRow = {
  auth_type: GatewayProviderAuthType;
  category: GatewayProviderCategory;
  description: string | null;
  id: string;
  key: string;
  name: string;
  sort_order: number;
  status: GatewayProviderStatus;
};

type CompanyProviderConfigRow = {
  company_id: string;
  id: string;
  last_validated_at: string | null;
  last_validation_message: string | null;
  last_validation_status: GatewayValidationStatus | null;
  provider_id: string;
  public_config: Record<string, unknown>;
  secret_config: Record<string, unknown>;
  status: GatewayCompanyProviderStatus;
  updated_at: string;
};

type PaymentRequestRow = {
  amount_cents: number;
  company_id: string;
  created_at: string;
  currency: string;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  description: string;
  error_message: string | null;
  id: string;
  payment_url: string | null;
  provider_id: string;
  provider_reference: string | null;
  source_application_key: string;
  source_reference_id: string;
  source_reference_type: string;
  status: GatewayPaymentRequestStatus;
  updated_at: string;
};

type SmtpCredentials = GatewaySmtpPublicConfig & {
  password: string | null;
};

type SmtpResponse = {
  code: number;
  lines: string[];
  text: string;
};

const providerSelect = [
  "id",
  "key",
  "name",
  "description",
  "category",
  "auth_type",
  "status",
  "sort_order"
].join(",");

const configSelect = [
  "id",
  "company_id",
  "provider_id",
  "status",
  "public_config",
  "secret_config",
  "last_validation_status",
  "last_validation_message",
  "last_validated_at",
  "updated_at"
].join(",");

const paymentRequestSelect = [
  "id",
  "company_id",
  "provider_id",
  "source_application_key",
  "source_reference_type",
  "source_reference_id",
  "amount_cents",
  "currency",
  "description",
  "customer_name",
  "customer_email",
  "customer_phone",
  "status",
  "payment_url",
  "provider_reference",
  "error_message",
  "created_at",
  "updated_at"
].join(",");

@Injectable()
export class GatewayService {
  constructor(
    private readonly robotsService: RobotsService,
    private readonly supabase: SupabaseService
  ) {}

  async listProviders(): Promise<GatewayProviderContract[]> {
    const { data, error } = await this.supabase.gateway
      .from("provider_catalog")
      .select(providerSelect)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as unknown as ProviderRow[]).map(mapProvider);
  }

  async listCompanyProviderConfigs(
    companyId: string
  ): Promise<GatewayCompanyProviderConfigContract[]> {
    const [providers, configs] = await Promise.all([
      this.listProviders(),
      this.listConfigRows(companyId)
    ]);
    const providerById = new Map(providers.map((provider) => [provider.id, provider]));

    return configs
      .map((config) => {
        const provider = providerById.get(config.provider_id);
        return provider ? mapCompanyProviderConfig(config, provider) : null;
      })
      .filter((config): config is GatewayCompanyProviderConfigContract => Boolean(config));
  }

  async listPaymentRequests(companyId: string): Promise<GatewayPaymentRequestContract[]> {
    const [providers, paymentRequests] = await Promise.all([
      this.listProviders(),
      this.listPaymentRequestRows(companyId)
    ]);
    const providerById = new Map(providers.map((provider) => [provider.id, provider]));

    return paymentRequests
      .map((paymentRequest) => {
        const provider = providerById.get(paymentRequest.provider_id);
        return provider ? mapPaymentRequest(paymentRequest, provider) : null;
      })
      .filter((paymentRequest): paymentRequest is GatewayPaymentRequestContract =>
        Boolean(paymentRequest)
      );
  }

  async createPaymentRequest(
    companyId: string,
    actorUserId: string,
    input: CreateGatewayPaymentRequestInput
  ): Promise<GatewayPaymentRequestContract> {
    const normalized = normalizePaymentRequestInput(input);
    const provider = await this.getProviderByKey(normalized.providerKey ?? "mercado_pago");

    if (provider.category !== "payment") {
      throw new BadRequestException("Provedor informado nao pertence a categoria de pagamento");
    }

    if (normalized.idempotencyKey) {
      const existing = await this.getPaymentRequestByIdempotencyKey(
        companyId,
        normalized.idempotencyKey
      );

      if (existing) {
        return mapPaymentRequest(existing, provider);
      }
    }

    const providerConfig = await this.getConfigRow(companyId, provider.id);
    const hasActiveProviderConfig =
      providerConfig?.status === "active" || providerConfig?.status === "configured";
    const status: GatewayPaymentRequestStatus = hasActiveProviderConfig
      ? "requested"
      : "requires_provider_config";
    const errorMessage = hasActiveProviderConfig
      ? null
      : "Provedor de pagamento ainda nao configurado para esta empresa.";

    const { data, error } = await this.supabase.gateway
      .from("payment_requests")
      .insert({
        amount_cents: normalized.amountCents,
        company_id: companyId,
        created_by: actorUserId,
        currency: normalized.currency,
        customer_email: normalized.customerEmail,
        customer_name: normalized.customerName,
        customer_phone: normalized.customerPhone,
        description: normalized.description,
        error_message: errorMessage,
        idempotency_key: normalized.idempotencyKey,
        provider_id: provider.id,
        request_payload: {
          sourceApplicationKey: normalized.sourceApplicationKey,
          sourceReferenceId: normalized.sourceReferenceId,
          sourceReferenceType: normalized.sourceReferenceType
        },
        source_application_key: normalized.sourceApplicationKey,
        source_reference_id: normalized.sourceReferenceId,
        source_reference_type: normalized.sourceReferenceType,
        status,
        updated_by: actorUserId
      })
      .select(paymentRequestSelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const paymentRequest = mapPaymentRequest(data as unknown as PaymentRequestRow, provider);
    const eventCode =
      status === "requires_provider_config"
        ? "gateway.payment.requires_provider_config"
        : "gateway.payment.requested";

    await this.safeCreateGatewayEvent(companyId, actorUserId, {
      eventCode,
      payload: {
        amountCents: paymentRequest.amountCents,
        currency: paymentRequest.currency,
        providerKey: paymentRequest.providerKey,
        sourceApplicationKey: paymentRequest.sourceApplicationKey,
        sourceReferenceId: paymentRequest.sourceReferenceId,
        sourceReferenceType: paymentRequest.sourceReferenceType,
        status: paymentRequest.status
      },
      providerKey: provider.key,
      sourceEventId: paymentRequest.id
    });

    return paymentRequest;
  }

  async upsertSmtpConfig(
    companyId: string,
    actorUserId: string,
    input: UpsertGatewaySmtpConfigInput
  ): Promise<GatewayCompanyProviderConfigContract> {
    const provider = await this.getProviderByKey("smtp");
    const existing = await this.getConfigRow(companyId, provider.id);
    const normalized = normalizeSmtpInput(input);
    const secretConfig = {
      ...(existing?.secret_config ?? {}),
      ...(normalized.password ? { password: normalized.password } : {})
    };
    const publicConfig = {
      fromEmail: normalized.fromEmail,
      fromName: normalized.fromName,
      host: normalized.host,
      port: normalized.port,
      secure: normalized.secure,
      username: normalized.username
    };

    const payload = {
      company_id: companyId,
      provider_id: provider.id,
      public_config: publicConfig,
      secret_config: secretConfig,
      status: normalized.status,
      updated_by: actorUserId
    };

    const { data, error } = existing
      ? await this.supabase.gateway
          .from("company_provider_configs")
          .update(payload)
          .eq("id", existing.id)
          .select(configSelect)
          .single()
      : await this.supabase.gateway
          .from("company_provider_configs")
          .insert({ ...payload, created_by: actorUserId })
          .select(configSelect)
          .single();

    if (error) {
      throwSupabaseError(error);
    }

    return mapCompanyProviderConfig(data as unknown as CompanyProviderConfigRow, provider);
  }

  async validateSmtpConfig(
    companyId: string,
    actorUserId: string
  ): Promise<GatewayProviderValidationContract> {
    const provider = await this.getProviderByKey("smtp");
    const config = await this.getConfigRow(companyId, provider.id);

    if (!config) {
      throw new NotFoundException("Configuracao SMTP nao encontrada");
    }

    const smtpConfig = parseSmtpPublicConfig(config.public_config);
    const validation = await testSmtpConnection(smtpConfig);
    const { data, error } = await this.supabase.gateway
      .from("company_provider_configs")
      .update({
        last_validated_at: new Date().toISOString(),
        last_validation_message: validation.message,
        last_validation_status: validation.status,
        status: validation.status === "succeeded" ? "active" : "error",
        updated_by: actorUserId
      })
      .eq("id", config.id)
      .select(configSelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const mappedConfig = mapCompanyProviderConfig(data as unknown as CompanyProviderConfigRow, provider);

    if (validation.status === "succeeded") {
      await this.robotsService.createEvent(companyId, actorUserId, {
        eventCode: "gateway.smtp.validated",
        idempotencyKey: `gateway:smtp:${companyId}:${Date.now()}`,
        occurredAt: new Date().toISOString(),
        originMetadata: {
          module: "gateway",
          provider: "smtp"
        },
        payload: {
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure
        },
        sourceApplicationKey: "gateway",
        sourceEventId: mappedConfig.id
      });
    }

    return {
      config: mappedConfig,
      message: validation.message,
      status: validation.status
    };
  }

  async sendSmtpTestEmail(
    companyId: string,
    actorUserId: string,
    input: SendGatewaySmtpTestEmailInput
  ): Promise<GatewaySmtpTestEmailContract> {
    const provider = await this.getProviderByKey("smtp");
    const config = await this.getConfigRow(companyId, provider.id);

    if (!config) {
      throw new NotFoundException("Configuracao SMTP nao encontrada");
    }

    const smtpConfig = parseSmtpPublicConfig(config.public_config);
    const password = typeof config.secret_config.password === "string" ? config.secret_config.password : null;
    const normalized = normalizeSmtpTestEmailInput(input);

    if (config.status === "inactive") {
      throw new BadRequestException("Configuracao SMTP esta inativa");
    }

    const testMessage = {
      body:
        normalized.body ??
        "Este e um e-mail de teste enviado pelo FP Gateway para validar a configuracao SMTP.",
      subject: normalized.subject ?? "Teste SMTP - FP Gateway",
      toEmail: normalized.toEmail
    };

    try {
      await sendSmtpEmail(
        {
          ...smtpConfig,
          password
        },
        testMessage
      );
    } catch (error) {
      const message = normalizeSmtpSendError(error);

      await this.safeCreateGatewayEvent(companyId, actorUserId, {
        eventCode: "gateway.smtp.test_email_failed",
        payload: {
          error: message,
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          toEmail: normalized.toEmail
        },
        sourceEventId: config.id
      });

      throw new BadRequestException(message);
    }

    await this.safeCreateGatewayEvent(companyId, actorUserId, {
      eventCode: "gateway.smtp.test_email_sent",
      payload: {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        toEmail: normalized.toEmail
      },
      sourceEventId: config.id
    });

    return {
      message: "E-mail de teste enviado com sucesso.",
      sent: true,
      toEmail: normalized.toEmail
    };
  }

  private async getProviderByKey(key: string): Promise<GatewayProviderContract> {
    const { data, error } = await this.supabase.gateway
      .from("provider_catalog")
      .select(providerSelect)
      .eq("key", key)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("Provedor do FP Gateway nao encontrado");
    }

    return mapProvider(data as unknown as ProviderRow);
  }

  private async getConfigRow(
    companyId: string,
    providerId: string
  ): Promise<CompanyProviderConfigRow | null> {
    const { data, error } = await this.supabase.gateway
      .from("company_provider_configs")
      .select(configSelect)
      .eq("company_id", companyId)
      .eq("provider_id", providerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    return (data as CompanyProviderConfigRow | null) ?? null;
  }

  private async listConfigRows(companyId: string): Promise<CompanyProviderConfigRow[]> {
    const { data, error } = await this.supabase.gateway
      .from("company_provider_configs")
      .select(configSelect)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as unknown as CompanyProviderConfigRow[];
  }

  private async listPaymentRequestRows(companyId: string): Promise<PaymentRequestRow[]> {
    const { data, error } = await this.supabase.gateway
      .from("payment_requests")
      .select(paymentRequestSelect)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as unknown as PaymentRequestRow[];
  }

  private async getPaymentRequestByIdempotencyKey(
    companyId: string,
    idempotencyKey: string
  ): Promise<PaymentRequestRow | null> {
    const { data, error } = await this.supabase.gateway
      .from("payment_requests")
      .select(paymentRequestSelect)
      .eq("company_id", companyId)
      .eq("idempotency_key", idempotencyKey)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    return (data as PaymentRequestRow | null) ?? null;
  }

  private async safeCreateGatewayEvent(
    companyId: string,
    actorUserId: string,
    input: {
      eventCode: string;
      payload: Record<string, unknown>;
      providerKey?: string;
      sourceEventId: string;
    }
  ): Promise<void> {
    await this.robotsService
      .createEvent(companyId, actorUserId, {
        eventCode: input.eventCode,
        idempotencyKey: `${input.eventCode}:${companyId}:${Date.now()}`,
        occurredAt: new Date().toISOString(),
        originMetadata: {
          module: "gateway",
          provider: input.providerKey ?? "smtp"
        },
        payload: input.payload,
        sourceApplicationKey: "gateway",
        sourceEventId: input.sourceEventId
      })
      .catch(() => undefined);
  }
}

function mapProvider(row: ProviderRow): GatewayProviderContract {
  return {
    authType: row.auth_type,
    category: row.category,
    description: row.description,
    id: row.id,
    key: row.key,
    name: row.name,
    sortOrder: row.sort_order,
    status: row.status
  };
}

function mapCompanyProviderConfig(
  row: CompanyProviderConfigRow,
  provider: GatewayProviderContract
): GatewayCompanyProviderConfigContract {
  return {
    companyId: row.company_id,
    id: row.id,
    lastValidatedAt: row.last_validated_at,
    lastValidationMessage: row.last_validation_message,
    lastValidationStatus: row.last_validation_status,
    passwordConfigured: typeof row.secret_config.password === "string",
    providerAuthType: provider.authType,
    providerCategory: provider.category,
    providerKey: provider.key,
    providerName: provider.name,
    publicConfig: provider.key === "smtp" ? parseSmtpPublicConfig(row.public_config) : row.public_config,
    status: row.status,
    updatedAt: row.updated_at
  };
}

function mapPaymentRequest(
  row: PaymentRequestRow,
  provider: GatewayProviderContract
): GatewayPaymentRequestContract {
  return {
    amountCents: row.amount_cents,
    companyId: row.company_id,
    createdAt: row.created_at,
    currency: row.currency,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    description: row.description,
    errorMessage: row.error_message,
    id: row.id,
    paymentUrl: row.payment_url,
    providerKey: provider.key,
    providerName: provider.name,
    providerReference: row.provider_reference,
    sourceApplicationKey: row.source_application_key,
    sourceReferenceId: row.source_reference_id,
    sourceReferenceType: row.source_reference_type,
    status: row.status,
    updatedAt: row.updated_at
  };
}

function normalizeSmtpInput(input: UpsertGatewaySmtpConfigInput): UpsertGatewaySmtpConfigInput {
  const host = input.host.trim().toLowerCase();
  const fromEmail = input.fromEmail.trim().toLowerCase();
  const username = input.username?.trim() || null;
  const fromName = input.fromName?.trim() || null;
  const password = input.password?.trim() || null;

  if (!host || host.length > 255) {
    throw new BadRequestException("Host SMTP invalido");
  }

  if (!fromEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    throw new BadRequestException("E-mail remetente invalido");
  }

  if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) {
    throw new BadRequestException("Porta SMTP invalida");
  }

  if (!["active", "configured", "inactive"].includes(input.status)) {
    throw new BadRequestException("Status SMTP invalido");
  }

  return {
    fromEmail,
    fromName,
    host,
    password,
    port: input.port,
    secure: Boolean(input.secure),
    status: input.status,
    username
  };
}

function normalizePaymentRequestInput(
  input: CreateGatewayPaymentRequestInput
): Required<CreateGatewayPaymentRequestInput> {
  const amountCents = Number(input.amountCents);
  const currency = (input.currency?.trim().toUpperCase() || "BRL").slice(0, 3);
  const customerEmail = input.customerEmail?.trim().toLowerCase() || null;
  const customerName = input.customerName?.trim() || null;
  const customerPhone = input.customerPhone?.trim() || null;
  const description = input.description.trim();
  const idempotencyKey = input.idempotencyKey?.trim() || null;
  const providerKey = input.providerKey?.trim().toLowerCase() || "mercado_pago";
  const sourceApplicationKey = input.sourceApplicationKey.trim().toLowerCase();
  const sourceReferenceId = input.sourceReferenceId.trim();
  const sourceReferenceType = input.sourceReferenceType.trim().toLowerCase();

  if (!Number.isInteger(amountCents) || amountCents <= 0 || amountCents > 100_000_000) {
    throw new BadRequestException("Valor do pagamento invalido");
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new BadRequestException("Moeda do pagamento invalida");
  }

  if (!description || description.length > 255) {
    throw new BadRequestException("Descricao do pagamento invalida");
  }

  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new BadRequestException("E-mail do cliente invalido");
  }

  if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(providerKey)) {
    throw new BadRequestException("Provedor de pagamento invalido");
  }

  if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(sourceApplicationKey)) {
    throw new BadRequestException("Aplicacao de origem invalida");
  }

  if (!sourceReferenceType || sourceReferenceType.length > 80) {
    throw new BadRequestException("Tipo de referencia de origem invalido");
  }

  if (!sourceReferenceId || sourceReferenceId.length > 160) {
    throw new BadRequestException("Referencia de origem invalida");
  }

  return {
    amountCents,
    currency,
    customerEmail,
    customerName,
    customerPhone,
    description,
    idempotencyKey,
    providerKey,
    sourceApplicationKey,
    sourceReferenceId,
    sourceReferenceType
  };
}

function normalizeSmtpTestEmailInput(
  input: SendGatewaySmtpTestEmailInput
): SendGatewaySmtpTestEmailInput {
  const toEmail = input.toEmail.trim().toLowerCase();
  const subject = input.subject?.trim() || null;
  const body = input.body?.trim() || null;

  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    throw new BadRequestException("E-mail de destino invalido");
  }

  if (subject && subject.length > 160) {
    throw new BadRequestException("Assunto deve ter no maximo 160 caracteres");
  }

  if (body && body.length > 4000) {
    throw new BadRequestException("Mensagem deve ter no maximo 4000 caracteres");
  }

  return {
    body,
    subject,
    toEmail
  };
}

function parseSmtpPublicConfig(value: Record<string, unknown>): GatewaySmtpPublicConfig {
  return {
    fromEmail: typeof value.fromEmail === "string" ? value.fromEmail : "",
    fromName: typeof value.fromName === "string" ? value.fromName : null,
    host: typeof value.host === "string" ? value.host : "",
    port: typeof value.port === "number" ? value.port : 587,
    secure: value.secure === true,
    username: typeof value.username === "string" ? value.username : null
  };
}

async function testSmtpConnection(
  config: GatewaySmtpPublicConfig
): Promise<{ message: string; status: "failed" | "succeeded" }> {
  if (!config.host || !config.port) {
    return {
      message: "Informe host e porta antes de validar o SMTP.",
      status: "failed"
    };
  }

  const portHint = getSmtpSecurityHint(config);

  if (portHint) {
    return {
      message: portHint,
      status: "failed"
    };
  }

  return new Promise((resolve) => {
    const socket = config.secure
      ? tls.connect({
          host: config.host,
          port: config.port,
          servername: config.host,
          timeout: 7000
        })
      : net.connect({
          host: config.host,
          port: config.port,
          timeout: 7000
        });
    let settled = false;

    const finish = (status: "failed" | "succeeded", message: string) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve({ message, status });
    };

    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      const text = chunk.toString();

      if (text.startsWith("220")) {
        socket.write(`EHLO fp-gateway.local\r\n`);
        socket.write("QUIT\r\n");
        finish("succeeded", "Servidor SMTP respondeu com sucesso.");
      }
    });
    socket.on("connect", () => {
      if (config.secure) {
        return;
      }

      socket.write("NOOP\r\n");
    });
    socket.on("secureConnect", () => {
      socket.write("NOOP\r\n");
    });
    socket.on("error", (error: Error) => {
      finish("failed", buildSmtpConnectionFailureMessage(config, error.message));
    });
    socket.on("timeout", () => {
      finish("failed", buildSmtpConnectionFailureMessage(config, "tempo limite"));
    });

    setTimeout(() => {
      finish(
        "failed",
        buildSmtpConnectionFailureMessage(config, "servidor nao respondeu dentro do tempo esperado")
      );
    }, 8000);
  });
}

async function sendSmtpEmail(
  config: SmtpCredentials,
  message: { body: string; subject: string; toEmail: string }
): Promise<void> {
  if (!config.host || !config.port || !config.fromEmail) {
    throw new BadRequestException("Configuracao SMTP incompleta");
  }

  if (config.username && !config.password) {
    throw new BadRequestException("Senha SMTP obrigatoria para usuario configurado");
  }

  const session = await SmtpSession.connect(config);

  try {
    let ehlo = await session.command("EHLO fp-gateway.local", [250]);

    if (!config.secure && responseSupports(ehlo, "STARTTLS")) {
      await session.command("STARTTLS", [220]);
      await session.upgradeToTls(config.host);
      ehlo = await session.command("EHLO fp-gateway.local", [250]);
    }

    if (config.username) {
      if (responseSupports(ehlo, "AUTH PLAIN")) {
        const credential = Buffer.from(`\0${config.username}\0${config.password ?? ""}`).toString(
          "base64"
        );
        await session.command(`AUTH PLAIN ${credential}`, [235]);
      } else {
        await session.command("AUTH LOGIN", [334]);
        await session.command(Buffer.from(config.username).toString("base64"), [334]);
        await session.command(Buffer.from(config.password ?? "").toString("base64"), [235]);
      }
    }

    await session.command(`MAIL FROM:<${config.fromEmail}>`, [250]);
    await session.command(`RCPT TO:<${message.toEmail}>`, [250, 251]);
    await session.command("DATA", [354]);
    await session.writeData(buildEmailData(config, message));
    await session.quit();
  } finally {
    session.close();
  }
}

function buildEmailData(
  config: SmtpCredentials,
  message: { body: string; subject: string; toEmail: string }
): string {
  const fromName = config.fromName ? `${escapeAddressName(config.fromName)} ` : "";
  const headers = [
    `From: ${fromName}<${config.fromEmail}>`,
    `To: <${message.toEmail}>`,
    `Subject: ${encodeMimeHeader(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${Date.now()}.${Math.random().toString(16).slice(2)}@fp-gateway.local>`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit"
  ];
  const safeBody = message.body
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");

  return `${headers.join("\r\n")}\r\n\r\n${safeBody}\r\n.`;
}

function encodeMimeHeader(value: string): string {
  const sanitized = value.replace(/[\r\n]/g, " ").trim();

  if (/^[\x20-\x7e]*$/.test(sanitized)) {
    return sanitized;
  }

  return `=?UTF-8?B?${Buffer.from(sanitized, "utf8").toString("base64")}?=`;
}

function escapeAddressName(value: string): string {
  return `"${value.replace(/["\r\n]/g, "")}"`;
}

function responseSupports(response: SmtpResponse, capability: string): boolean {
  return response.lines.some((line) => line.toUpperCase().includes(capability.toUpperCase()));
}

class SmtpSession {
  private currentLines: string[] = [];
  private pendingResponses: SmtpResponse[] = [];
  private reader: readline.Interface | null = null;
  private responseReject: ((error: Error) => void) | null = null;
  private responseResolve: ((response: SmtpResponse) => void) | null = null;
  private socket: net.Socket | tls.TLSSocket;

  private constructor(socket: net.Socket | tls.TLSSocket) {
    this.socket = socket;
    this.bind(socket);
  }

  static async connect(config: SmtpCredentials): Promise<SmtpSession> {
    const socket = config.secure
      ? tls.connect({
          host: config.host,
          port: config.port,
          servername: config.host,
          timeout: 10000
        })
      : net.connect({
          host: config.host,
          port: config.port,
          timeout: 10000
        });
    const session = new SmtpSession(socket);

    await session.waitConnected(config.secure);
    await session.expect([220]);

    return session;
  }

  async command(command: string, expectedCodes: number[]): Promise<SmtpResponse> {
    this.socket.write(`${command}\r\n`);
    return this.expect(expectedCodes);
  }

  async writeData(data: string): Promise<SmtpResponse> {
    this.socket.write(`${data}\r\n`);
    return this.expect([250]);
  }

  async upgradeToTls(host: string): Promise<void> {
    this.unbind();
    const secureSocket = tls.connect({
      socket: this.socket,
      servername: host,
      timeout: 10000
    });
    this.socket = secureSocket;
    this.bind(secureSocket);
    await this.waitConnected(true);
  }

  async quit(): Promise<void> {
    try {
      await this.command("QUIT", [221]);
    } catch {
      return;
    }
  }

  close(): void {
    this.unbind();
    this.socket.destroy();
  }

  private bind(socket: net.Socket | tls.TLSSocket): void {
    socket.setEncoding("utf8");
    socket.on("error", this.handleError);
    socket.on("timeout", this.handleTimeout);
    this.reader = readline.createInterface({ input: socket });
    this.reader.on("line", this.handleLine);
  }

  private unbind(): void {
    if (this.reader) {
      this.reader.off("line", this.handleLine);
      this.reader.close();
      this.reader = null;
    }

    this.socket.off("error", this.handleError);
    this.socket.off("timeout", this.handleTimeout);
  }

  private expect(expectedCodes: number[]): Promise<SmtpResponse> {
    const queued = this.pendingResponses.shift();

    if (queued) {
      assertExpectedResponse(queued, expectedCodes);
      return Promise.resolve(queued);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseReject = null;
        this.responseResolve = null;
        reject(new BadRequestException("Tempo limite na comunicacao SMTP"));
      }, 12000);

      this.responseResolve = (response) => {
        clearTimeout(timeout);
        this.responseReject = null;
        this.responseResolve = null;

        try {
          assertExpectedResponse(response, expectedCodes);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      };
      this.responseReject = (error) => {
        clearTimeout(timeout);
        this.responseReject = null;
        this.responseResolve = null;
        reject(error);
      };
    });
  }

  private handleLine = (line: string): void => {
    this.currentLines.push(line);

    if (!/^\d{3} /.test(line)) {
      return;
    }

    const response = parseSmtpResponse(this.currentLines);
    this.currentLines = [];

    if (this.responseResolve) {
      this.responseResolve(response);
      return;
    }

    this.pendingResponses.push(response);
  };

  private handleError = (error: Error): void => {
    if (this.responseReject) {
      this.responseReject(new BadRequestException(`Erro SMTP: ${error.message}`));
    }
  };

  private handleTimeout = (): void => {
    if (this.responseReject) {
      this.responseReject(new BadRequestException("Tempo limite na conexao SMTP"));
    }
  };

  private waitConnected(secure: boolean): Promise<void> {
    const eventName = secure ? "secureConnect" : "connect";

    if (!secure && this.socket.readyState === "open") {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const onConnected = () => {
        cleanup();
        resolve();
      };
      const onError = (error: Error) => {
        cleanup();
        reject(new BadRequestException(`Falha ao conectar ao SMTP: ${error.message}`));
      };
      const cleanup = () => {
        this.socket.off(eventName, onConnected);
        this.socket.off("error", onError);
      };

      this.socket.once(eventName, onConnected);
      this.socket.once("error", onError);
    });
  }
}

function parseSmtpResponse(lines: string[]): SmtpResponse {
  const finalLine = lines[lines.length - 1] ?? "";
  const code = Number(finalLine.slice(0, 3));

  return {
    code,
    lines,
    text: lines.map((line) => line.slice(4)).join("\n")
  };
}

function assertExpectedResponse(response: SmtpResponse, expectedCodes: number[]): void {
  if (!expectedCodes.includes(response.code)) {
    throw new BadRequestException(`SMTP respondeu ${response.code}: ${response.text}`);
  }
}

function normalizeSmtpSendError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("535")) {
    return [
      "SMTP respondeu 535: autenticacao recusada pelo provedor.",
      "Confirme usuario completo, senha/app password e se o SMTP AUTH esta habilitado para a caixa/tenant."
    ].join(" ");
  }

  return message || "Falha ao enviar e-mail SMTP de teste";
}

function getSmtpSecurityHint(config: Pick<GatewaySmtpPublicConfig, "port" | "secure">): string | null {
  if ([465, 2465].includes(config.port) && !config.secure) {
    return "Portas 465/2465 usam TLS direta. Marque 'Conexao TLS direta' para este provedor.";
  }

  if ([587, 2587, 25].includes(config.port) && config.secure) {
    return "Portas 25/587/2587 usam STARTTLS. Desmarque 'Conexao TLS direta' para este provedor.";
  }

  return null;
}

function buildSmtpConnectionFailureMessage(
  config: GatewaySmtpPublicConfig,
  reason: string
): string {
  const hint = getSmtpSecurityHint(config);

  return [
    `Falha ao conectar ao SMTP: ${reason}.`,
    hint,
    "Para Resend use smtp.resend.com com usuario 'resend' e a API key como senha; porta 587/2587 sem TLS direta ou 465/2465 com TLS direta.",
    "Se ainda houver timeout, verifique bloqueio de rede/firewall para portas SMTP."
  ]
    .filter(Boolean)
    .join(" ");
}

function throwSupabaseError(error: { message?: string }): never {
  throw new BadRequestException(error.message ?? "Erro ao acessar dados do FP Gateway");
}
