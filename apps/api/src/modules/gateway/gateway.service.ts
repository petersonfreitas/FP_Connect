import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import net from "node:net";
import tls from "node:tls";
import { RobotsService } from "../robots/robots.service";
import { SupabaseService } from "../../supabase/supabase.service";
import type {
  GatewayCompanyProviderConfigContract,
  GatewayCompanyProviderStatus,
  GatewayProviderAuthType,
  GatewayProviderCategory,
  GatewayProviderContract,
  GatewayProviderStatus,
  GatewayProviderValidationContract,
  GatewaySmtpPublicConfig,
  GatewayValidationStatus,
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
      finish("failed", `Falha ao conectar ao SMTP: ${error.message}`);
    });
    socket.on("timeout", () => {
      finish("failed", "Tempo limite ao conectar ao SMTP.");
    });

    setTimeout(() => {
      finish("failed", "Servidor SMTP nao respondeu dentro do tempo esperado.");
    }, 8000);
  });
}

function throwSupabaseError(error: { message?: string }): never {
  throw new BadRequestException(error.message ?? "Erro ao acessar dados do FP Gateway");
}
