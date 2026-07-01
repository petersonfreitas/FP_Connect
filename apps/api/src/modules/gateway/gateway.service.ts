import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import net from "node:net";
import readline from "node:readline";
import tls from "node:tls";
import { Customer, CustomerCard, MercadoPagoConfig, Order } from "mercadopago";
import { RobotsService } from "../robots/robots.service";
import { AppConfigService } from "../../config/app-config.service";
import { SupabaseService } from "../../supabase/supabase.service";
import type {
  CompleteGatewayMercadoPagoOAuthInput,
  CreateGatewayPaymentRequestInput,
  GatewayCompanyProviderConfigContract,
  GatewayCompanyProviderStatus,
  GatewayMercadoPagoOAuthContract,
  GatewayMercadoPagoOAuthStartContract,
  GatewayMercadoPagoPublicConfig,
  GatewayPaymentMethodType,
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
  PaginatedContract,
  SendGatewaySmtpTestEmailInput,
  UpsertGatewayMercadoPagoManualConfigInput,
  UpsertGatewaySmtpConfigInput
} from "./gateway.contracts";

type GatewayPaymentRequestListOptions = {
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  pageSize?: string;
  paymentMethodType?: string;
  providerKey?: string;
  q?: string;
  status?: string;
};

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
  request_payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  source_application_key: string;
  source_reference_id: string;
  source_reference_type: string;
  status: GatewayPaymentRequestStatus;
  updated_at: string;
};

type GatewayMercadoPagoWebhookInput = {
  body: Record<string, unknown>;
  dataId: string | null;
  signature: string | null;
  type: string | null;
  xRequestId: string | null;
};

type SmtpCredentials = GatewaySmtpPublicConfig & {
  password: string | null;
};

type SmtpResponse = {
  code: number;
  lines: string[];
  text: string;
};

type MercadoPagoOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

type MercadoPagoOAuthState = {
  actorUserId: string;
  companyId: string;
  exp: number;
  nonce: string;
};

type MercadoPagoOAuthTokenResponse = {
  access_token?: string;
  expires_in?: number;
  live_mode?: boolean;
  public_key?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  user_id?: number | string;
};

type MercadoPagoOrderResponse = {
  id?: string;
  fp_gateway?: {
    saved_card?: MercadoPagoSavedCard;
  };
  payer?: {
    customer_id?: string;
  };
  status?: string;
  status_detail?: string;
  transactions?: {
    payments?: Array<{
      id?: string;
      payment_method?: {
        id?: string;
        type?: string;
        ticket_url?: string;
        qr_code?: string;
        qr_code_base64?: string;
      };
      status?: string;
      status_detail?: string;
    }>;
  };
  type_response?: {
    payment_method?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

type MercadoPagoSavedCard = {
  customer_id?: string;
  id?: string;
  last_four_digits?: string;
  payment_method?: {
    id?: string;
    name?: string;
    payment_type_id?: string;
  };
};

type MercadoPagoPixOrderOptions = {
  useManualSandbox: boolean;
};

type NormalizedPaymentRequestInput = Required<
  Omit<CreateGatewayPaymentRequestInput, "cardToken" | "paymentMethodId" | "paymentMethodType">
> & {
  cardToken: string | null;
  installments: number | null;
  paymentMethodId: string | null;
  paymentMethodType: GatewayPaymentMethodType;
  providerCardId: string | null;
  providerCustomerId: string | null;
  saveCardForFuture: boolean;
};

const defaultPage = 1;
const defaultPageSize = 20;
const maxPageSize = 100;
const gatewayPaymentRequestStatuses: GatewayPaymentRequestStatus[] = [
  "cancelled",
  "expired",
  "failed",
  "paid",
  "requested",
  "requires_provider_config"
];
const gatewayPaymentMethodTypes: GatewayPaymentMethodType[] = [
  "credit_card",
  "debit_card",
  "pix"
];

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
  "request_payload",
  "response_payload",
  "created_at",
  "updated_at"
].join(",");

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(
    private readonly config: AppConfigService,
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

  async listPaymentRequests(
    companyId: string,
    options: GatewayPaymentRequestListOptions = {}
  ): Promise<PaginatedContract<GatewayPaymentRequestContract>> {
    const providers = await this.listProviders();
    const providerById = new Map(providers.map((provider) => [provider.id, provider]));
    const providerByKey = new Map(providers.map((provider) => [provider.key, provider]));
    const pagination = normalizePagination(options);
    const range = getPaginationRange(pagination);
    const status = normalizePaymentRequestStatus(options.status);
    const paymentMethodType = normalizePaymentMethodTypeFilter(options.paymentMethodType);
    const providerKey = normalizeProviderKeyFilter(options.providerKey);
    const provider = providerKey ? providerByKey.get(providerKey) : null;
    const dateFrom = normalizeDateFilter(options.dateFrom, "start");
    const dateTo = normalizeDateFilter(options.dateTo, "end");
    const search = normalizeSearchTerm(options.q);
    let query = this.supabase.gateway
      .from("payment_requests")
      .select(paymentRequestSelect, { count: "exact" })
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (paymentMethodType) {
      query = query.eq("request_payload->>paymentMethodType", paymentMethodType);
    }

    if (provider) {
      query = query.eq("provider_id", provider.id);
    }

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }

    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    if (search) {
      const escaped = escapePostgrestOrValue(search);
      query = query.or(
        `description.ilike.%${escaped}%,source_reference_id.ilike.%${escaped}%,customer_email.ilike.%${escaped}%`
      );
    }

    const { data, error, count } = await query.range(range.from, range.to);

    if (error) {
      throwSupabaseError(error);
    }

    const items = ((data ?? []) as unknown as PaymentRequestRow[])
      .map((paymentRequest) => {
        const paymentProvider = providerById.get(paymentRequest.provider_id);
        return paymentProvider ? mapPaymentRequest(paymentRequest, paymentProvider) : null;
      })
      .filter((paymentRequest): paymentRequest is GatewayPaymentRequestContract =>
        Boolean(paymentRequest)
      );

    return toPaginated(items, pagination, count ?? 0);
  }

  async createPaymentRequest(
    companyId: string,
    actorUserId: string | null,
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
          installments: normalized.installments,
          paymentMethodId: normalized.paymentMethodId,
          paymentMethodType: normalized.paymentMethodType,
          providerCardId: normalized.providerCardId,
          providerCustomerId: normalized.providerCustomerId,
          saveCardForFuture: normalized.saveCardForFuture,
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

    if (status === "requested" && provider.key === "mercado_pago" && providerConfig) {
      return this.createMercadoPagoPaymentForPaymentRequest(
        companyId,
        actorUserId,
        normalized,
        paymentRequest,
        provider,
        providerConfig
      );
    }

    await this.safeCreateGatewayEvent(companyId, actorUserId, {
      eventCode,
      idempotencyKey: buildGatewayEventIdempotencyKey(eventCode, paymentRequest.id, "created"),
      payload: buildGatewayPaymentEventPayload(paymentRequest),
      providerKey: provider.key,
      sourceEventId: paymentRequest.id
    });

    return paymentRequest;
  }

  async syncPaymentRequestStatus(
    companyId: string,
    actorUserId: string,
    paymentRequestId: string
  ): Promise<GatewayPaymentRequestContract> {
    const paymentRequestRow = await this.getPaymentRequestRowById(companyId, paymentRequestId);

    if (!paymentRequestRow) {
      throw new NotFoundException("Solicitacao de pagamento nao encontrada");
    }

    const provider = await this.getProviderById(paymentRequestRow.provider_id);

    if (provider.key !== "mercado_pago") {
      throw new BadRequestException("Consulta de status disponivel apenas para Mercado Pago");
    }

    if (!paymentRequestRow.provider_reference) {
      throw new BadRequestException("Solicitacao ainda nao possui referencia no Mercado Pago");
    }

    const providerConfig = await this.getConfigRow(companyId, provider.id);
    const accessToken =
      typeof providerConfig?.secret_config.accessToken === "string"
        ? providerConfig.secret_config.accessToken
        : null;

    if (!accessToken) {
      throw new BadRequestException("Access Token Mercado Pago nao configurado.");
    }

    return this.reconcileMercadoPagoPaymentRequest({
      accessToken,
      actorUserId,
      paymentRequestRow,
      provider,
      reconciliationSource: "manual_sync"
    });
  }

  async handleMercadoPagoWebhook(input: GatewayMercadoPagoWebhookInput): Promise<{
    ignored: boolean;
    paymentRequestId: string | null;
    received: true;
    status: GatewayPaymentRequestStatus | null;
  }> {
    this.validateMercadoPagoWebhookSignature(input);

    const resourceId = normalizeMercadoPagoWebhookResourceId(input);
    const notificationType = normalizeMercadoPagoWebhookType(input);

    if (!resourceId || notificationType !== "order") {
      return {
        ignored: true,
        paymentRequestId: null,
        received: true,
        status: null
      };
    }

    const paymentRequestRow = await this.getPaymentRequestRowByProviderReference(resourceId);

    if (!paymentRequestRow) {
      return {
        ignored: true,
        paymentRequestId: null,
        received: true,
        status: null
      };
    }

    const provider = await this.getProviderById(paymentRequestRow.provider_id);

    if (provider.key !== "mercado_pago") {
      return {
        ignored: true,
        paymentRequestId: paymentRequestRow.id,
        received: true,
        status: paymentRequestRow.status
      };
    }

    const providerConfig = await this.getConfigRow(paymentRequestRow.company_id, provider.id);
    const accessToken =
      typeof providerConfig?.secret_config.accessToken === "string"
        ? providerConfig.secret_config.accessToken
        : null;

    if (!accessToken) {
      throw new BadRequestException("Access Token Mercado Pago nao configurado.");
    }

    const paymentRequest = await this.reconcileMercadoPagoPaymentRequest({
      accessToken,
      actorUserId: null,
      paymentRequestRow,
      provider,
      reconciliationSource: "webhook"
    });

    return {
      ignored: false,
      paymentRequestId: paymentRequest.id,
      received: true,
      status: paymentRequest.status
    };
  }

  async upsertMercadoPagoManualConfig(
    companyId: string,
    actorUserId: string,
    input: UpsertGatewayMercadoPagoManualConfigInput
  ): Promise<GatewayCompanyProviderConfigContract> {
    const provider = await this.getProviderByKey("mercado_pago");
    const existing = await this.getConfigRow(companyId, provider.id);
    const normalized = normalizeMercadoPagoManualConfigInput(input);
    const now = new Date().toISOString();
    const publicConfig: GatewayMercadoPagoPublicConfig = {
      appId: normalized.appId,
      authorizedAt: now,
      expiresAt: null,
      liveMode: false,
      mode: "manual_sandbox",
      publicKeyConfigured: Boolean(normalized.publicKey),
      scope: "manual_sandbox",
      tokenType: "Bearer",
      userId: normalized.userId
    };
    const secretConfig = {
      ...(existing?.secret_config ?? {}),
      accessToken: normalized.accessToken,
      publicKey: normalized.publicKey
    };
    const payload = {
      company_id: companyId,
      last_validated_at: now,
      last_validation_message: "Mercado Pago sandbox configurado manualmente.",
      last_validation_status: "succeeded",
      provider_id: provider.id,
      public_config: publicConfig,
      secret_config: secretConfig,
      status: "active",
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

  async startMercadoPagoOAuth(
    companyId: string,
    actorUserId: string
  ): Promise<GatewayMercadoPagoOAuthStartContract> {
    const oauthConfig = this.getMercadoPagoOAuthConfig();
    const state = signMercadoPagoOAuthState(
      {
        actorUserId,
        companyId,
        exp: Math.floor(Date.now() / 1000) + 15 * 60,
        nonce: randomBytes(16).toString("hex")
      },
      this.config.internalApiToken
    );
    const authorizationUrl = new URL("https://auth.mercadopago.com.br/authorization");

    authorizationUrl.searchParams.set("client_id", oauthConfig.clientId);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("platform_id", "mp");
    authorizationUrl.searchParams.set("redirect_uri", oauthConfig.redirectUri);
    authorizationUrl.searchParams.set("state", state);

    return {
      authorizationUrl: authorizationUrl.toString(),
      redirectUri: oauthConfig.redirectUri,
      state
    };
  }

  async completeMercadoPagoOAuth(
    companyId: string,
    actorUserId: string,
    input: CompleteGatewayMercadoPagoOAuthInput
  ): Promise<GatewayMercadoPagoOAuthContract> {
    const code = input.code.trim();

    if (!code) {
      throw new BadRequestException("Codigo OAuth do Mercado Pago nao informado");
    }

    const state = verifyMercadoPagoOAuthState(input.state, this.config.internalApiToken);

    if (state.companyId !== companyId || state.actorUserId !== actorUserId) {
      throw new BadRequestException("Estado OAuth do Mercado Pago nao pertence a sessao atual");
    }

    if (state.exp < Math.floor(Date.now() / 1000)) {
      throw new BadRequestException("Estado OAuth do Mercado Pago expirou");
    }

    const provider = await this.getProviderByKey("mercado_pago");
    const oauthConfig = this.getMercadoPagoOAuthConfig();
    const token = await exchangeMercadoPagoOAuthCode(oauthConfig, code);
    const existing = await this.getConfigRow(companyId, provider.id);
    const now = new Date();
    const expiresAt =
      typeof token.expires_in === "number"
        ? new Date(now.getTime() + token.expires_in * 1000).toISOString()
        : null;
    const publicConfig: GatewayMercadoPagoPublicConfig = {
      appId: null,
      authorizedAt: now.toISOString(),
      expiresAt,
      liveMode: typeof token.live_mode === "boolean" ? token.live_mode : null,
      mode: "oauth",
      publicKeyConfigured: typeof token.public_key === "string" && token.public_key.length > 0,
      scope: typeof token.scope === "string" ? token.scope : null,
      tokenType: typeof token.token_type === "string" ? token.token_type : null,
      userId:
        typeof token.user_id === "number" || typeof token.user_id === "string"
          ? token.user_id
          : null
    };
    const secretConfig = {
      ...(existing?.secret_config ?? {}),
      accessToken: token.access_token,
      publicKey: token.public_key ?? null,
      refreshToken: token.refresh_token ?? null
    };
    const payload = {
      company_id: companyId,
      last_validated_at: now.toISOString(),
      last_validation_message: "Mercado Pago autorizado via OAuth.",
      last_validation_status: "succeeded",
      provider_id: provider.id,
      public_config: publicConfig,
      secret_config: secretConfig,
      status: "active",
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

    const mappedConfig = mapCompanyProviderConfig(
      data as unknown as CompanyProviderConfigRow,
      provider
    );

    await this.safeCreateGatewayEvent(companyId, actorUserId, {
      eventCode: "gateway.mercado_pago.oauth_connected",
      payload: {
        liveMode: publicConfig.liveMode,
        providerKey: provider.key,
        scope: publicConfig.scope,
        userId: publicConfig.userId
      },
      providerKey: provider.key,
      sourceEventId: mappedConfig.id
    });

    return {
      config: mappedConfig,
      message: "Mercado Pago conectado com sucesso."
    };
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
        idempotencyKey: buildGatewayEventIdempotencyKey(
          "gateway.smtp.validated",
          mappedConfig.id,
          "succeeded"
        ),
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
      const message = normalizeSmtpSendError(error, smtpConfig);

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

  private async getProviderById(providerId: string): Promise<GatewayProviderContract> {
    const { data, error } = await this.supabase.gateway
      .from("provider_catalog")
      .select(providerSelect)
      .eq("id", providerId)
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

  private async getPaymentRequestRowById(
    companyId: string,
    paymentRequestId: string
  ): Promise<PaymentRequestRow | null> {
    const { data, error } = await this.supabase.gateway
      .from("payment_requests")
      .select(paymentRequestSelect)
      .eq("company_id", companyId)
      .eq("id", paymentRequestId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    return (data as PaymentRequestRow | null) ?? null;
  }

  private async getPaymentRequestRowByProviderReference(
    providerReference: string
  ): Promise<PaymentRequestRow | null> {
    const providerReferenceVariants = Array.from(
      new Set([
        providerReference,
        providerReference.toUpperCase(),
        providerReference.toLowerCase()
      ])
    );
    const { data, error } = await this.supabase.gateway
      .from("payment_requests")
      .select(paymentRequestSelect)
      .in("provider_reference", providerReferenceVariants)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    return (data as PaymentRequestRow | null) ?? null;
  }

  private async reconcileMercadoPagoPaymentRequest({
    accessToken,
    actorUserId,
    paymentRequestRow,
    provider,
    reconciliationSource
  }: {
    accessToken: string;
    actorUserId: string | null;
    paymentRequestRow: PaymentRequestRow;
    provider: GatewayProviderContract;
    reconciliationSource: "manual_sync" | "webhook";
  }): Promise<GatewayPaymentRequestContract> {
    if (!paymentRequestRow.provider_reference) {
      throw new BadRequestException("Solicitacao ainda nao possui referencia no Mercado Pago");
    }

    const order = await getMercadoPagoOrder(accessToken, paymentRequestRow.provider_reference);
    const responsePayload = preserveMercadoPagoGatewayMetadata(
      paymentRequestRow.response_payload,
      order
    );
    const nextStatus = mapMercadoPagoOrderStatus(order);
    const pixPaymentMethod = getMercadoPagoPixPaymentMethod(order);
    const paymentUrl = pixPaymentMethod?.ticket_url ?? paymentRequestRow.payment_url;
    const errorMessage =
      nextStatus === "failed"
        ? buildMercadoPagoOrderFailureMessage(order)
        : null;

    const { data, error } = await this.supabase.gateway
      .from("payment_requests")
      .update({
        error_message: errorMessage,
        payment_url: paymentUrl,
        response_payload: responsePayload,
        status: nextStatus,
        updated_by: actorUserId
      })
      .eq("id", paymentRequestRow.id)
      .eq("company_id", paymentRequestRow.company_id)
      .select(paymentRequestSelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const mappedPaymentRequest = mapPaymentRequest(data as unknown as PaymentRequestRow, provider);

    await this.safeCreateGatewayPaymentTransitionEvent(
      paymentRequestRow.company_id,
      actorUserId,
      mappedPaymentRequest,
      provider.key,
      paymentRequestRow.status,
      { reconciliationSource }
    );

    if (mappedPaymentRequest.status === "paid") {
      await this.markFoodOrderPaidFromGateway(mappedPaymentRequest);
    }

    return mappedPaymentRequest;
  }

  private async markFoodOrderPaidFromGateway(
    paymentRequest: GatewayPaymentRequestContract
  ): Promise<void> {
    if (
      paymentRequest.sourceApplicationKey !== "food" ||
      paymentRequest.sourceReferenceType !== "food_order"
    ) {
      return;
    }

    const { data: current, error: currentError } = await this.supabase.food
      .from("orders")
      .select("id,order_number,payment_status,total_cents,paid_at")
      .eq("id", paymentRequest.sourceReferenceId)
      .eq("company_id", paymentRequest.companyId)
      .is("deleted_at", null)
      .maybeSingle();

    if (currentError) {
      throwSupabaseError(currentError);
    }

    if (!current || (current as { payment_status?: string }).payment_status === "paid") {
      return;
    }

    const paidAt = new Date().toISOString();
    const paymentMethod = paymentRequest.paymentMethodType === "pix" ? "pix" : "card";
    const { error } = await this.supabase.food
      .from("orders")
      .update({
        paid_at: paidAt,
        paid_by: null,
        payment_method: paymentMethod,
        payment_note: "Pagamento confirmado pelo FP Gateway/Mercado Pago.",
        payment_status: "paid",
        updated_by: null
      })
      .eq("id", paymentRequest.sourceReferenceId)
      .eq("company_id", paymentRequest.companyId)
      .is("deleted_at", null);

    if (error) {
      throwSupabaseError(error);
    }

    const order = current as {
      id: string;
      order_number: string;
      total_cents: number;
    };

    await this.robotsService
      .createEvent(paymentRequest.companyId, null, {
        eventCode: "food.payment.marked_as_paid",
        idempotencyKey: `food-payment-paid:${order.id}:${paymentRequest.id}`,
        originMetadata: {
          generatedBy: "fp-gateway",
          provider: paymentRequest.providerKey,
          source: "gateway-reconciliation"
        },
        payload: {
          gatewayPaymentRequestId: paymentRequest.id,
          orderId: order.id,
          orderNumber: order.order_number,
          paymentMethod,
          paymentMethodType: paymentRequest.paymentMethodType,
          paymentStatus: "paid",
          paymentTypeId: paymentRequest.paymentTypeId,
          totalCents: order.total_cents
        },
        sourceApplicationKey: "food",
        sourceEventId: order.id
      })
      .catch(() => undefined);
  }

  private async createMercadoPagoPaymentForPaymentRequest(
    companyId: string,
    actorUserId: string | null,
    input: NormalizedPaymentRequestInput,
    paymentRequest: GatewayPaymentRequestContract,
    provider: GatewayProviderContract,
    providerConfig: CompanyProviderConfigRow
  ): Promise<GatewayPaymentRequestContract> {
    const accessToken =
      typeof providerConfig.secret_config.accessToken === "string"
        ? providerConfig.secret_config.accessToken
        : null;

    if (!accessToken) {
      return this.markPaymentRequestAsFailed(companyId, actorUserId, paymentRequest, provider, {
        errorMessage: "Access Token Mercado Pago nao configurado.",
        responsePayload: {}
      });
    }

    try {
      const order = await createMercadoPagoOrder(accessToken, paymentRequest, input, {
        useManualSandbox: providerConfig.public_config.mode === "manual_sandbox"
      });
      const pixPaymentMethod = getMercadoPagoPixPaymentMethod(order);
      const paymentUrl = pixPaymentMethod?.ticket_url ?? null;
      const initialStatus = mapMercadoPagoOrderStatus(order);

      if (!order.id) {
        return this.markPaymentRequestAsFailed(companyId, actorUserId, paymentRequest, provider, {
          errorMessage: "Mercado Pago nao retornou identificador da order.",
          responsePayload: order as Record<string, unknown>
        });
      }

      const { data, error } = await this.supabase.gateway
        .from("payment_requests")
        .update({
          payment_url: paymentUrl,
          provider_reference: order.id,
          response_payload: order,
          status: initialStatus,
          updated_by: actorUserId
        })
        .eq("id", paymentRequest.id)
        .select(paymentRequestSelect)
        .single();

      if (error) {
        throwSupabaseError(error);
      }

      const mappedPaymentRequest = mapPaymentRequest(
        data as unknown as PaymentRequestRow,
        provider
      );

      await this.safeCreateGatewayEvent(companyId, actorUserId, {
        eventCode: "gateway.payment.requested",
        idempotencyKey: buildGatewayEventIdempotencyKey(
          "gateway.payment.requested",
          mappedPaymentRequest.id,
          "created"
        ),
        payload: buildGatewayPaymentEventPayload(paymentRequest),
        providerKey: provider.key,
        sourceEventId: mappedPaymentRequest.id
      });

      await this.safeCreateGatewayPaymentTransitionEvent(
        companyId,
        actorUserId,
        mappedPaymentRequest,
        provider.key,
        paymentRequest.status
      );

      return mappedPaymentRequest;
    } catch (error) {
      return this.markPaymentRequestAsFailed(companyId, actorUserId, paymentRequest, provider, {
        errorMessage: normalizeMercadoPagoError(error),
        responsePayload: serializeMercadoPagoError(error)
      });
    }
  }

  private async markPaymentRequestAsFailed(
    companyId: string,
    actorUserId: string | null,
    paymentRequest: GatewayPaymentRequestContract,
    provider: GatewayProviderContract,
    failure: {
      errorMessage: string;
      responsePayload: Record<string, unknown>;
    }
  ): Promise<GatewayPaymentRequestContract> {
    const { data, error } = await this.supabase.gateway
      .from("payment_requests")
      .update({
        error_message: failure.errorMessage,
        response_payload: failure.responsePayload,
        status: "failed",
        updated_by: actorUserId
      })
      .eq("id", paymentRequest.id)
      .select(paymentRequestSelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const mappedPaymentRequest = mapPaymentRequest(data as unknown as PaymentRequestRow, provider);

    await this.safeCreateGatewayPaymentTransitionEvent(
      companyId,
      actorUserId,
      mappedPaymentRequest,
      provider.key,
      paymentRequest.status,
      { error: mappedPaymentRequest.errorMessage }
    );

    return mappedPaymentRequest;
  }

  private async safeCreateGatewayPaymentTransitionEvent(
    companyId: string,
    actorUserId: string | null,
    paymentRequest: GatewayPaymentRequestContract,
    providerKey: string,
    previousStatus: GatewayPaymentRequestStatus,
    extra: Record<string, unknown> = {}
  ): Promise<void> {
    if (previousStatus === paymentRequest.status) {
      return;
    }

    const eventCode = getGatewayPaymentEventCode(paymentRequest.status);

    await this.safeCreateGatewayEvent(companyId, actorUserId, {
      eventCode,
      idempotencyKey: buildGatewayEventIdempotencyKey(
        eventCode,
        paymentRequest.id,
        `${previousStatus}->${paymentRequest.status}`
      ),
      payload: buildGatewayPaymentEventPayload(paymentRequest, {
        previousStatus,
        ...extra
      }),
      providerKey,
      sourceEventId: paymentRequest.id
    });
  }

  private async safeCreateGatewayEvent(
    companyId: string,
    actorUserId: string | null,
    input: {
      eventCode: string;
      idempotencyKey?: string;
      payload: Record<string, unknown>;
      providerKey?: string;
      sourceEventId: string;
    }
  ): Promise<void> {
    await this.robotsService
      .createEvent(companyId, actorUserId, {
        eventCode: input.eventCode,
        idempotencyKey:
          input.idempotencyKey ??
          buildGatewayEventIdempotencyKey(input.eventCode, input.sourceEventId),
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

  private validateMercadoPagoWebhookSignature(input: GatewayMercadoPagoWebhookInput): void {
    const secret = this.config.mercadoPagoWebhookSecret;

    if (!secret) {
      if (this.config.nodeEnv === "production") {
        this.logger.warn(
          JSON.stringify({
            event: "gateway.webhook.secret_missing",
            action: parseOptionalString(input.body.action),
            hasDataId: Boolean(normalizeMercadoPagoWebhookResourceId(input)),
            hasRequestId: Boolean(parseOptionalString(input.xRequestId)),
            hasSignatureHeader: Boolean(parseOptionalString(input.signature)),
            notificationType: normalizeMercadoPagoWebhookType(input)
          })
        );
        throw new UnauthorizedException("MERCADO_PAGO_WEBHOOK_SECRET nao configurado.");
      }

      return;
    }

    const signature = parseMercadoPagoSignature(input.signature);

    if (!signature.ts || !signature.v1) {
      this.logger.warn(
        JSON.stringify({
          event: "gateway.webhook.signature_missing",
          action: parseOptionalString(input.body.action),
          hasDataId: Boolean(normalizeMercadoPagoWebhookResourceId(input)),
          hasRequestId: Boolean(parseOptionalString(input.xRequestId)),
          hasSignatureHeader: Boolean(parseOptionalString(input.signature)),
          notificationType: normalizeMercadoPagoWebhookType(input)
        })
      );
      throw new UnauthorizedException("Assinatura Mercado Pago ausente ou invalida.");
    }

    const dataIdCandidates = getMercadoPagoWebhookSignatureDataIdCandidates(input);
    const requestIdCandidates = getMercadoPagoWebhookSignatureRequestIdCandidates(input);
    const signatureHash = signature.v1.toLowerCase();
    const isValidSignature = dataIdCandidates.some((dataId) =>
      requestIdCandidates.some((xRequestId) => {
        const manifest = buildMercadoPagoWebhookSignatureManifest({
          dataId,
          timestamp: signature.ts as string,
          xRequestId
        });
        const expected = createHmac("sha256", secret).update(manifest).digest("hex");

        return safeEqual(expected, signatureHash);
      })
    );

    if (!isValidSignature) {
      this.logger.warn(
        JSON.stringify({
          event: "gateway.webhook.signature_invalid",
          action: parseOptionalString(input.body.action),
          dataIdCandidateCount: dataIdCandidates.length,
          hasDataId: Boolean(normalizeMercadoPagoWebhookResourceId(input)),
          hasRequestId: Boolean(parseOptionalString(input.xRequestId)),
          notificationType: normalizeMercadoPagoWebhookType(input),
          requestIdCandidateCount: requestIdCandidates.length
        })
      );
      throw new UnauthorizedException("Assinatura Mercado Pago invalida.");
    }
  }

  private getMercadoPagoOAuthConfig(): MercadoPagoOAuthConfig {
    const clientId = this.config.mercadoPagoClientId;
    const clientSecret = this.config.mercadoPagoClientSecret;

    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        "Configure MERCADO_PAGO_CLIENT_ID e MERCADO_PAGO_CLIENT_SECRET na API antes de conectar."
      );
    }

    return {
      clientId,
      clientSecret,
      redirectUri: `${this.config.webUrl}/gateway/mercado-pago/callback`
    };
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
  const paymentMethodType = parsePaymentMethodType(row.request_payload?.paymentMethodType);
  const paymentMethodId = parseOptionalString(row.request_payload?.paymentMethodId);
  const savedCard = parseSavedCardMetadata(row.response_payload);
  const providerCustomerId =
    savedCard?.customerId ??
    parseOptionalString(row.request_payload?.providerCustomerId) ??
    getMercadoPagoPayerCustomerId(row.response_payload);
  const providerCardId =
    savedCard?.cardId ??
    parseOptionalString(row.request_payload?.providerCardId) ??
    getMercadoPagoPaymentMethodCardId(row.response_payload);

  return {
    amountCents: row.amount_cents,
    cardBrand: savedCard?.cardBrand ?? paymentMethodId,
    cardLast4: savedCard?.cardLast4 ?? null,
    companyId: row.company_id,
    createdAt: row.created_at,
    currency: row.currency,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    description: row.description,
    errorMessage: row.error_message,
    id: row.id,
    paymentMethodId,
    paymentMethodType,
    paymentTypeId: paymentMethodType,
    paymentUrl: row.payment_url,
    providerKey: provider.key,
    providerName: provider.name,
    providerCardId,
    providerCustomerId,
    providerReference: row.provider_reference,
    sourceApplicationKey: row.source_application_key,
    sourceReferenceId: row.source_reference_id,
    sourceReferenceType: row.source_reference_type,
    status: row.status,
    updatedAt: row.updated_at
  };
}

function normalizePagination(options: GatewayPaymentRequestListOptions): {
  page: number;
  pageSize: number;
} {
  const page = normalizePositiveInteger(options.page, defaultPage);
  const pageSize = normalizePositiveInteger(options.pageSize, defaultPageSize);

  return {
    page,
    pageSize: Math.min(pageSize, maxPageSize)
  };
}

function normalizePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function normalizePaymentRequestStatus(
  value: string | undefined
): GatewayPaymentRequestStatus | null {
  return gatewayPaymentRequestStatuses.includes(value as GatewayPaymentRequestStatus)
    ? (value as GatewayPaymentRequestStatus)
    : null;
}

function normalizePaymentMethodTypeFilter(
  value: string | undefined
): GatewayPaymentMethodType | null {
  return gatewayPaymentMethodTypes.includes(value as GatewayPaymentMethodType)
    ? (value as GatewayPaymentMethodType)
    : null;
}

function normalizeProviderKeyFilter(value: string | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function normalizeSearchTerm(value: string | undefined): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";

  if (normalized.length < 2) {
    return null;
  }

  return normalized.slice(0, 80);
}

function normalizeDateFilter(value: string | undefined, boundary: "end" | "start"): string | null {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  const date =
    /^\d{4}-\d{2}-\d{2}$/.test(normalized) && boundary === "start"
      ? new Date(`${normalized}T00:00:00.000Z`)
      : /^\d{4}-\d{2}-\d{2}$/.test(normalized)
        ? new Date(`${normalized}T23:59:59.999Z`)
        : new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException("Filtro de data invalido");
  }

  return date.toISOString();
}

function escapePostgrestOrValue(value: string): string {
  return value.replace(/[,%]/g, " ").replace(/\s+/g, " ").trim();
}

function getPaginationRange(pagination: { page: number; pageSize: number }): {
  from: number;
  to: number;
} {
  const from = (pagination.page - 1) * pagination.pageSize;

  return {
    from,
    to: from + pagination.pageSize - 1
  };
}

function toPaginated<T>(
  items: T[],
  pagination: { page: number; pageSize: number },
  total: number
): PaginatedContract<T> {
  return {
    items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize))
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
): NormalizedPaymentRequestInput {
  const amountCents = Number(input.amountCents);
  const cardToken = input.cardToken?.trim() || null;
  const currency = (input.currency?.trim().toUpperCase() || "BRL").slice(0, 3);
  const customerEmail = input.customerEmail?.trim().toLowerCase() || null;
  const customerName = input.customerName?.trim() || null;
  const customerPhone = input.customerPhone?.trim() || null;
  const description = input.description.trim();
  const idempotencyKey = input.idempotencyKey?.trim() || null;
  const installments = input.installments == null ? null : Number(input.installments);
  const paymentMethodId = input.paymentMethodId?.trim().toLowerCase() || null;
  const paymentMethodType = input.paymentMethodType ?? "pix";
  const providerCardId = input.providerCardId?.trim() || null;
  const providerCustomerId = input.providerCustomerId?.trim() || null;
  const providerKey = input.providerKey?.trim().toLowerCase() || "mercado_pago";
  const saveCardForFuture = input.saveCardForFuture === true;
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

  if (!["credit_card", "debit_card", "pix"].includes(paymentMethodType)) {
    throw new BadRequestException("Metodo de pagamento invalido");
  }

  if (
    paymentMethodType === "pix" &&
    (cardToken || paymentMethodId || installments || providerCardId || providerCustomerId || saveCardForFuture)
  ) {
    throw new BadRequestException("Dados de cartao nao devem ser enviados para PIX");
  }

  if (paymentMethodType !== "pix") {
    const usesSavedCard = Boolean(providerCardId && providerCustomerId);

    if (!usesSavedCard && (!cardToken || cardToken.length > 255)) {
      throw new BadRequestException("Token do cartao invalido");
    }

    if (cardToken && cardToken.length > 255) {
      throw new BadRequestException("Token do cartao invalido");
    }

    if (!paymentMethodId || !/^[a-z0-9_-]{2,40}$/.test(paymentMethodId)) {
      throw new BadRequestException("Bandeira do cartao invalida");
    }

    if (installments === null || installments < 1 || installments > 24) {
      throw new BadRequestException("Numero de parcelas invalido");
    }

    if ((providerCardId && !providerCustomerId) || (!providerCardId && providerCustomerId)) {
      throw new BadRequestException("Referencia de cartao salvo incompleta");
    }

    if (providerCardId && providerCardId.length > 120) {
      throw new BadRequestException("Referencia de cartao salva invalida");
    }

    if (providerCustomerId && providerCustomerId.length > 120) {
      throw new BadRequestException("Referencia de cliente salva invalida");
    }

    if (saveCardForFuture && (!cardToken || !customerEmail)) {
      throw new BadRequestException("Salvar cartao exige token e e-mail do cliente");
    }
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
    cardToken,
    currency,
    customerEmail,
    customerName,
    customerPhone,
    description,
    idempotencyKey,
    installments,
    paymentMethodId,
    paymentMethodType,
    providerCardId,
    providerCustomerId,
    providerKey,
    saveCardForFuture,
    sourceApplicationKey,
    sourceReferenceId,
    sourceReferenceType
  };
}

function buildGatewayPaymentEventPayload(
  paymentRequest: GatewayPaymentRequestContract,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    amountCents: paymentRequest.amountCents,
    currency: paymentRequest.currency,
    paymentMethodId: paymentRequest.paymentMethodId,
    paymentMethodType: paymentRequest.paymentMethodType,
    paymentTypeId: paymentRequest.paymentTypeId,
    paymentUrl: paymentRequest.paymentUrl,
    providerKey: paymentRequest.providerKey,
    providerReference: paymentRequest.providerReference,
    sourceApplicationKey: paymentRequest.sourceApplicationKey,
    sourceReferenceId: paymentRequest.sourceReferenceId,
    sourceReferenceType: paymentRequest.sourceReferenceType,
    status: paymentRequest.status,
    ...extra
  };
}

function buildGatewayEventIdempotencyKey(
  eventCode: string,
  sourceEventId: string,
  scope = "event"
): string {
  return `${eventCode}:${sourceEventId}:${scope}`;
}

function getGatewayPaymentEventCode(status: GatewayPaymentRequestStatus): string {
  if (status === "paid") {
    return "gateway.payment.paid";
  }

  if (status === "failed" || status === "cancelled" || status === "expired") {
    return "gateway.payment.failed";
  }

  if (status === "requires_provider_config") {
    return "gateway.payment.requires_provider_config";
  }

  return "gateway.payment.requested";
}

function parsePaymentMethodType(value: unknown): GatewayPaymentMethodType {
  return value === "credit_card" || value === "debit_card" || value === "pix" ? value : "pix";
}

function parseOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseSavedCardMetadata(payload: Record<string, unknown>): {
  cardBrand: string | null;
  cardId: string | null;
  cardLast4: string | null;
  customerId: string | null;
} | null {
  const metadata = payload.fp_gateway;

  if (!isRecord(metadata)) {
    return null;
  }

  const savedCard = metadata.saved_card;

  if (!isRecord(savedCard)) {
    return null;
  }

  const paymentMethod = isRecord(savedCard.payment_method)
    ? savedCard.payment_method
    : null;

  return {
    cardBrand: parseOptionalString(paymentMethod?.id) ?? parseOptionalString(paymentMethod?.name),
    cardId: parseOptionalString(savedCard.id),
    cardLast4: parseOptionalString(savedCard.last_four_digits),
    customerId: parseOptionalString(savedCard.customer_id)
  };
}

function getMercadoPagoPaymentMethodCardId(payload: Record<string, unknown>): string | null {
  const transactions = payload.transactions;

  if (!isRecord(transactions) || !Array.isArray(transactions.payments)) {
    return null;
  }

  const payment = transactions.payments[0];

  if (!isRecord(payment) || !isRecord(payment.payment_method)) {
    return null;
  }

  return parseOptionalString(payment.payment_method.card_id);
}

function getMercadoPagoPayerCustomerId(payload: Record<string, unknown>): string | null {
  return isRecord(payload.payer) ? parseOptionalString(payload.payer.customer_id) : null;
}

function preserveMercadoPagoGatewayMetadata(
  previousPayload: Record<string, unknown>,
  nextPayload: MercadoPagoOrderResponse
): MercadoPagoOrderResponse {
  const metadata = previousPayload.fp_gateway;

  if (!isRecord(metadata)) {
    return nextPayload;
  }

  return {
    ...nextPayload,
    fp_gateway: metadata as MercadoPagoOrderResponse["fp_gateway"]
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildMercadoPagoOrderFailureMessage(order: MercadoPagoOrderResponse): string {
  return (
    [
      order.status,
      order.status_detail,
      order.transactions?.payments?.[0]?.status,
      order.transactions?.payments?.[0]?.status_detail
    ]
      .filter(Boolean)
      .join(" / ") || "Pagamento rejeitado pelo Mercado Pago"
  );
}

function normalizeMercadoPagoWebhookResourceId(
  input: GatewayMercadoPagoWebhookInput
): string | null {
  const queryDataId = parseOptionalString(input.dataId);

  if (queryDataId) {
    return queryDataId;
  }

  const bodyData = input.body.data;

  if (typeof bodyData === "object" && bodyData && "id" in bodyData) {
    return parseOptionalString((bodyData as { id?: unknown }).id);
  }

  return null;
}

function getMercadoPagoWebhookSignatureDataIdCandidates(
  input: GatewayMercadoPagoWebhookInput
): Array<string | null> {
  const candidates = [
    parseOptionalString(input.dataId),
    normalizeMercadoPagoWebhookResourceId(input),
    null
  ];

  return candidates.filter(
    (candidate, index) => candidates.findIndex((item) => item === candidate) === index
  );
}

function getMercadoPagoWebhookSignatureRequestIdCandidates(
  input: GatewayMercadoPagoWebhookInput
): Array<string | null> {
  const candidates = [
    parseOptionalString(input.xRequestId),
    null
  ];

  return candidates.filter(
    (candidate, index) => candidates.findIndex((item) => item === candidate) === index
  );
}

function normalizeMercadoPagoWebhookType(input: GatewayMercadoPagoWebhookInput): string | null {
  const queryType = parseOptionalString(input.type);

  if (queryType) {
    return queryType.toLowerCase();
  }

  return parseOptionalString(input.body.type)?.toLowerCase() ?? null;
}

function parseMercadoPagoSignature(signature: string | null): {
  ts: string | null;
  v1: string | null;
} {
  const parsed = {
    ts: null as string | null,
    v1: null as string | null
  };

  if (!signature) {
    return parsed;
  }

  for (const part of signature.split(",")) {
    const [key, value] = part.split("=", 2);

    if (key?.trim() === "ts") {
      parsed.ts = value?.trim() || null;
    }

    if (key?.trim() === "v1") {
      parsed.v1 = value?.trim() || null;
    }
  }

  return parsed;
}

function buildMercadoPagoWebhookSignatureManifest({
  dataId,
  timestamp,
  xRequestId
}: {
  dataId: string | null;
  timestamp: string;
  xRequestId: string | null;
}): string {
  const parts: string[] = [];
  const normalizedDataId = parseOptionalString(dataId)?.toLowerCase();
  const normalizedRequestId = parseOptionalString(xRequestId);

  if (normalizedDataId) {
    parts.push(`id:${normalizedDataId}`);
  }

  if (normalizedRequestId) {
    parts.push(`request-id:${normalizedRequestId}`);
  }

  parts.push(`ts:${timestamp}`);

  return `${parts.join(";")};`;
}

function normalizeMercadoPagoManualConfigInput(
  input: UpsertGatewayMercadoPagoManualConfigInput
): Required<UpsertGatewayMercadoPagoManualConfigInput> {
  const accessToken = input.accessToken.trim();
  const appId = input.appId?.trim() || null;
  const publicKey = input.publicKey?.trim() || null;
  const userId = input.userId?.trim() || null;

  if (!accessToken || accessToken.length < 20) {
    throw new BadRequestException("Access Token Mercado Pago invalido");
  }

  if (publicKey && publicKey.length < 10) {
    throw new BadRequestException("Public Key Mercado Pago invalida");
  }

  return {
    accessToken,
    appId,
    publicKey,
    userId
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

  const securityHint = getSmtpSecurityHint(config);

  if (securityHint) {
    throw new BadRequestException(securityHint);
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
    this.reader.on("error", this.handleError);
  }

  private unbind(): void {
    if (this.reader) {
      this.reader.off("line", this.handleLine);
      this.reader.off("error", this.handleError);
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
      return;
    }

    this.pendingResponses = [];
    this.currentLines = [];
  };

  private handleTimeout = (): void => {
    if (this.responseReject) {
      this.responseReject(new BadRequestException("Tempo limite na conexao SMTP"));
      return;
    }

    this.pendingResponses = [];
    this.currentLines = [];
  };

  private waitConnected(secure: boolean): Promise<void> {
    const eventName = secure ? "secureConnect" : "connect";

    if (!secure && this.socket.readyState === "open") {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        this.socket.destroy();
        reject(new BadRequestException("Tempo limite na conexao SMTP"));
      }, 12000);
      const onConnected = () => {
        cleanup();
        resolve();
      };
      const onError = (error: Error) => {
        cleanup();
        reject(new BadRequestException(`Falha ao conectar ao SMTP: ${error.message}`));
      };
      const onTimeout = () => {
        cleanup();
        this.socket.destroy();
        reject(new BadRequestException("Tempo limite na conexao SMTP"));
      };
      const cleanup = () => {
        clearTimeout(timeout);
        this.socket.off(eventName, onConnected);
        this.socket.off("error", onError);
        this.socket.off("timeout", onTimeout);
      };

      this.socket.once(eventName, onConnected);
      this.socket.once("error", onError);
      this.socket.once("timeout", onTimeout);
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

function normalizeSmtpSendError(
  error: unknown,
  config?: Pick<GatewaySmtpPublicConfig, "port" | "secure">
): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("535")) {
    return [
      "SMTP respondeu 535: autenticacao recusada pelo provedor.",
      "Confirme usuario completo, senha/app password e se o SMTP AUTH esta habilitado para a caixa/tenant."
    ].join(" ");
  }

  if (message.includes("wrong version number") || message.includes("ERR_SSL_WRONG_VERSION_NUMBER")) {
    return [
      "Falha TLS/SMTP: a porta configurada nao combina com o modo de seguranca.",
      config ? getSmtpSecurityHint(config) : null,
      "Use 587/2587/25 com STARTTLS (TLS direta desmarcada) ou 465/2465 com TLS direta marcada."
    ]
      .filter(Boolean)
      .join(" ");
  }

  return message || "Falha ao enviar e-mail SMTP de teste";
}

async function createMercadoPagoOrder(
  accessToken: string,
  paymentRequest: GatewayPaymentRequestContract,
  input: NormalizedPaymentRequestInput,
  options: MercadoPagoPixOrderOptions
): Promise<MercadoPagoOrderResponse> {
  const client = new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 10000
    }
  });
  const order = new Order(client);
  const amount = formatMercadoPagoAmount(paymentRequest.amountCents);
  const savedCard =
    input.paymentMethodType !== "pix" && input.saveCardForFuture
      ? await saveMercadoPagoCustomerCard(client, paymentRequest, input)
      : null;
  const providerCustomerId =
    savedCard?.customer_id ?? input.providerCustomerId ?? undefined;

  if (!paymentRequest.customerEmail) {
    throw new BadRequestException(
      "Informe um e-mail de pagador para criar PIX no Mercado Pago."
    );
  }

  if (options.useManualSandbox && !paymentRequest.customerEmail.endsWith("@testuser.com")) {
    throw new BadRequestException(
      "No sandbox Mercado Pago, use um e-mail de pagador com dominio @testuser.com."
    );
  }

  const paymentMethod =
    input.paymentMethodType === "pix"
      ? {
          id: "pix",
          type: "bank_transfer"
        }
      : buildMercadoPagoCardPaymentMethod(input, savedCard);
  const payment = {
    amount,
    payment_method: paymentMethod,
    ...(input.paymentMethodType !== "pix" && (savedCard || input.providerCardId)
      ? {
          stored_credential: {
            first_payment: Boolean(savedCard),
            payment_initiator: "cardholder",
            reason: "unscheduled",
            store_payment_method: Boolean(savedCard)
          }
        }
      : {})
  };

  const mercadoPagoOrder = (await order.create({
    body: {
      description: paymentRequest.description,
      external_reference: paymentRequest.id,
      payer: {
        email: paymentRequest.customerEmail,
        first_name: options.useManualSandbox
          ? "APRO"
          : paymentRequest.customerName ?? undefined,
        customer_id: providerCustomerId
      },
      processing_mode: "automatic",
      total_amount: amount,
      transactions: {
        payments: [payment]
      },
      type: "online"
    },
    requestOptions: {
      idempotencyKey: `gateway-payment:${paymentRequest.companyId}:${paymentRequest.id}`
    }
  })) as MercadoPagoOrderResponse;

  return savedCard
    ? {
        ...mercadoPagoOrder,
        fp_gateway: {
          saved_card: savedCard
        }
      }
    : mercadoPagoOrder;
}

function buildMercadoPagoCardPaymentMethod(
  input: NormalizedPaymentRequestInput,
  savedCard: MercadoPagoSavedCard | null = null
): {
  card_id?: string;
  id: string;
  installments: number;
  token?: string;
  type: "credit_card" | "debit_card";
} {
  if (
    input.paymentMethodType === "pix" ||
    !input.paymentMethodId ||
    !input.installments
  ) {
    throw new BadRequestException("Dados de cartao incompletos");
  }

  const cardId = savedCard?.id ?? input.providerCardId;

  if (cardId) {
    return {
      card_id: cardId,
      id: input.paymentMethodId,
      installments: input.installments,
      type: input.paymentMethodType
    };
  }

  if (!input.cardToken) {
    throw new BadRequestException("Token do cartao invalido");
  }

  return {
    id: input.paymentMethodId,
    installments: input.installments,
    token: input.cardToken,
    type: input.paymentMethodType
  };
}

async function saveMercadoPagoCustomerCard(
  client: MercadoPagoConfig,
  paymentRequest: GatewayPaymentRequestContract,
  input: NormalizedPaymentRequestInput
): Promise<MercadoPagoSavedCard> {
  if (!paymentRequest.customerEmail || !input.cardToken) {
    throw new BadRequestException("Salvar cartao exige e-mail e token do pagador");
  }

  const customerId = await findOrCreateMercadoPagoCustomer(client, paymentRequest);
  const customerCard = new CustomerCard(client);
  const savedCard = (await customerCard.create({
    body: {
      token: input.cardToken
    },
    customerId,
    requestOptions: {
      idempotencyKey: `gateway-card:${paymentRequest.companyId}:${paymentRequest.id}`
    }
  })) as MercadoPagoSavedCard;

  if (!savedCard.id) {
    throw new BadRequestException("Mercado Pago nao retornou identificador do cartao salvo");
  }

  return {
    ...savedCard,
    customer_id: savedCard.customer_id ?? customerId
  };
}

async function findOrCreateMercadoPagoCustomer(
  client: MercadoPagoConfig,
  paymentRequest: GatewayPaymentRequestContract
): Promise<string> {
  if (!paymentRequest.customerEmail) {
    throw new BadRequestException("Informe um e-mail de pagador para salvar cartao");
  }

  const customer = new Customer(client);
  const searchResult = await customer.search({
    options: {
      email: paymentRequest.customerEmail,
      limit: 1
    }
  });
  const existingCustomerId = searchResult.results?.find((item) => item.id)?.id;

  if (existingCustomerId) {
    return existingCustomerId;
  }

  const created = await customer.create({
    body: {
      description: `FP Gateway customer ${paymentRequest.companyId}`,
      email: paymentRequest.customerEmail,
      first_name: paymentRequest.customerName ?? undefined
    },
    requestOptions: {
      idempotencyKey: `gateway-customer:${paymentRequest.companyId}:${paymentRequest.customerEmail}`
    }
  });

  if (!created.id) {
    throw new BadRequestException("Mercado Pago nao retornou identificador do cliente");
  }

  return created.id;
}

async function getMercadoPagoOrder(
  accessToken: string,
  orderId: string
): Promise<MercadoPagoOrderResponse> {
  const client = new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 10000
    }
  });
  const order = new Order(client);

  return (await order.get({ id: orderId })) as MercadoPagoOrderResponse;
}

function mapMercadoPagoOrderStatus(order: MercadoPagoOrderResponse): GatewayPaymentRequestStatus {
  const orderStatus = normalizeStatusText(order.status);
  const orderStatusDetail = normalizeStatusText(order.status_detail);
  const payment = order.transactions?.payments?.[0];
  const paymentStatus = normalizeStatusText(payment?.status);
  const paymentStatusDetail = normalizeStatusText(payment?.status_detail);
  const statusValues = [orderStatus, orderStatusDetail, paymentStatus, paymentStatusDetail];

  if (statusValues.some((status) => ["accredited", "approved", "paid", "processed"].includes(status))) {
    return "paid";
  }

  if (statusValues.some((status) => ["cancelled", "canceled"].includes(status))) {
    return "cancelled";
  }

  if (statusValues.includes("expired")) {
    return "expired";
  }

  if (statusValues.some((status) => ["failed", "rejected"].includes(status))) {
    return "failed";
  }

  return "requested";
}

function normalizeStatusText(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function formatMercadoPagoAmount(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

function getMercadoPagoPixPaymentMethod(order: MercadoPagoOrderResponse):
  | {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    }
  | null {
  const transactionPaymentMethod = order.transactions?.payments?.[0]?.payment_method;

  if (transactionPaymentMethod) {
    return {
      qr_code: transactionPaymentMethod.qr_code,
      qr_code_base64: transactionPaymentMethod.qr_code_base64,
      ticket_url: transactionPaymentMethod.ticket_url
    };
  }

  return order.type_response?.payment_method ?? null;
}

function normalizeMercadoPagoError(error: unknown): string {
  if (error instanceof BadRequestException) {
    const response = error.getResponse();

    if (typeof response === "string") {
      return response;
    }

    if (typeof response === "object" && response && "message" in response) {
      const message = (response as { message?: unknown }).message;
      return Array.isArray(message) ? message.join(" ") : String(message);
    }
  }

  if (error instanceof Error) {
    const serialized = serializeMercadoPagoError(error);
    const detailedMessage = buildMercadoPagoErrorMessage(serialized);

    return (
      detailedMessage ||
      error.message ||
      "Falha ao criar pagamento PIX Mercado Pago"
    );
  }

  if (typeof error === "object" && error) {
    const serialized = serializeMercadoPagoError(error);

    return (
      buildMercadoPagoErrorMessage(serialized) ||
      "Falha ao criar pagamento PIX Mercado Pago"
    );
  }

  return "Falha ao criar pagamento PIX Mercado Pago";
}

function serializeMercadoPagoError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const serialized: Record<string, unknown> = {
      message: error.message,
      name: error.name
    };
    const detailedError = error as Error & Record<string, unknown>;

    for (const key of Object.getOwnPropertyNames(error)) {
      if (key === "stack") {
        continue;
      }

      serialized[key] = detailedError[key];
    }

    if (detailedError.cause instanceof Error) {
      serialized.cause = {
        message: detailedError.cause.message,
        name: detailedError.cause.name
      };
    }

    return serialized;
  }

  if (typeof error === "object" && error) {
    return error as Record<string, unknown>;
  }

  return {
    message: String(error)
  };
}

function buildMercadoPagoErrorMessage(serialized: Record<string, unknown>): string {
  const status = readErrorString(serialized.status);
  const message = readErrorString(serialized.message);
  const apiError = readErrorString(serialized.error);
  const apiResponse = extractMercadoPagoApiResponseMessage(serialized.api_response);
  const cause = extractMercadoPagoCauseMessage(serialized.cause);
  const errors = extractMercadoPagoErrorsMessage(serialized.errors);

  return [status ? `HTTP ${status}` : "", apiError, message, apiResponse, cause, errors]
    .filter(Boolean)
    .join(" - ");
}

function extractMercadoPagoApiResponseMessage(value: unknown): string {
  if (typeof value !== "object" || !value) {
    return "";
  }

  const record = value as Record<string, unknown>;
  const content = typeof record.content === "object" && record.content
    ? (record.content as Record<string, unknown>)
    : record;

  return [
    readErrorString(content.error),
    readErrorString(content.message),
    extractMercadoPagoCauseMessage(content.cause)
  ]
    .filter(Boolean)
    .join(" - ");
}

function extractMercadoPagoCauseMessage(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "object" && item) {
          const description = readErrorString((item as Record<string, unknown>).description);
          const code = readErrorString((item as Record<string, unknown>).code);
          return [code, description].filter(Boolean).join(": ");
        }

        return String(item);
      })
      .filter(Boolean)
      .join(" | ");
  }

  if (typeof value === "object" && value) {
    const record = value as Record<string, unknown>;
    return [readErrorString(record.name), readErrorString(record.message)]
      .filter(Boolean)
      .join(": ");
  }

  return readErrorString(value);
}

function extractMercadoPagoErrorsMessage(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || !item) {
        return String(item);
      }

      const record = item as Record<string, unknown>;
      const details = Array.isArray(record.details)
        ? record.details.map(String).join(" | ")
        : readErrorString(record.details);

      return [readErrorString(record.code), readErrorString(record.message), details]
        .filter(Boolean)
        .join(": ");
    })
    .filter(Boolean)
    .join(" | ");
}

function readErrorString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
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

function signMercadoPagoOAuthState(
  payload: MercadoPagoOAuthState,
  secret: string
): string {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function verifyMercadoPagoOAuthState(
  state: string,
  secret: string
): MercadoPagoOAuthState {
  const [encodedPayload, signature] = state.split(".");

  if (!encodedPayload || !signature) {
    throw new BadRequestException("Estado OAuth do Mercado Pago invalido");
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");

  if (!safeEqual(signature, expectedSignature)) {
    throw new BadRequestException("Assinatura OAuth do Mercado Pago invalida");
  }

  const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as
    | Partial<MercadoPagoOAuthState>
    | undefined;

  if (
    !parsed ||
    typeof parsed.actorUserId !== "string" ||
    typeof parsed.companyId !== "string" ||
    typeof parsed.exp !== "number" ||
    typeof parsed.nonce !== "string"
  ) {
    throw new BadRequestException("Payload OAuth do Mercado Pago invalido");
  }

  return {
    actorUserId: parsed.actorUserId,
    companyId: parsed.companyId,
    exp: parsed.exp,
    nonce: parsed.nonce
  };
}

async function exchangeMercadoPagoOAuthCode(
  config: MercadoPagoOAuthConfig,
  code: string
): Promise<Required<Pick<MercadoPagoOAuthTokenResponse, "access_token">> & MercadoPagoOAuthTokenResponse> {
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri
    }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    method: "POST"
  }).catch((error: Error): Error => error);

  if (response instanceof Error) {
    throw new BadRequestException(`Falha ao conectar ao Mercado Pago OAuth: ${response.message}`);
  }

  const body = (await response.json().catch(() => ({}))) as
    | (MercadoPagoOAuthTokenResponse & { error?: string; message?: string })
    | undefined;

  if (!response.ok) {
    throw new BadRequestException(
      body?.message ?? body?.error ?? "Mercado Pago recusou a autorizacao OAuth"
    );
  }

  if (!body?.access_token) {
    throw new BadRequestException("Mercado Pago nao retornou access_token no OAuth");
  }

  return {
    ...body,
    access_token: body.access_token
  };
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function throwSupabaseError(error: { message?: string }): never {
  throw new BadRequestException(error.message ?? "Erro ao acessar dados do FP Gateway");
}
