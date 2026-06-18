import Link from "next/link";
import type {
  AdminCurrentUserAccessContract,
  GatewayCompanyProviderConfigContract,
  GatewayProviderContract,
  GatewaySmtpPublicConfig
} from "@fp/types";
import { AppShell } from "@/components/app-shell";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import {
  getCurrentAdminAccess,
  getModuleAccess,
  listGatewayProviderConfigs,
  listGatewayProviders
} from "@/lib/internal-api";
import { saveGatewaySmtpConfigAction, testGatewaySmtpConfigAction } from "./actions";

export const dynamic = "force-dynamic";

type GatewayPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    message?: string;
    smtpSaved?: string;
    smtpTest?: string;
  }>;
};

const gatewayEvents = [
  "gateway.provider.connected",
  "gateway.smtp.validated",
  "gateway.payment.created",
  "gateway.payment.approved",
  "gateway.payment.rejected",
  "gateway.webhook.received",
  "gateway.whatsapp.message.sent"
];

export default async function GatewayPage({ searchParams }: GatewayPageProps) {
  const query = searchParams ? await searchParams : {};
  const accessResult = await getCurrentAdminAccess();
  const access = accessResult.data;
  const selectedCompanyId = resolveSelectedCompanyId(query.companyId, access);

  if (!access || !selectedCompanyId) {
    return (
      <AppShell access={access ?? null} activePath="/gateway">
        <GatewayHeader badge="Shell V0" />

        {accessResult.error ? (
          <section className="data-alert" role="status">
            <strong>Nao foi possivel carregar seu acesso atual.</strong>
            <span>{accessResult.error}</span>
          </section>
        ) : null}

        <GatewayIntro />
        <CompanyPicker access={access} />
      </AppShell>
    );
  }

  const gatewayAccessResult = await getModuleAccess("gateway", selectedCompanyId);
  const [providersResult, configsResult] = gatewayAccessResult.data
    ? await Promise.all([
        listGatewayProviders(selectedCompanyId),
        listGatewayProviderConfigs(selectedCompanyId)
      ])
    : [
        { data: null, error: null },
        { data: null, error: null }
      ];
  const providers = providersResult.data ?? [];
  const configs = configsResult.data ?? [];
  const smtpConfig = configs.find((config) => config.providerKey === "smtp") ?? null;
  const selectedCompany = access.companies.find(
    (companyAccess) => companyAccess.company.id === selectedCompanyId
  );

  return (
    <AppShell access={access} activePath="/gateway">
      <GatewayHeader
        badge={selectedCompany?.company.tradeName ?? selectedCompany?.company.legalName ?? "Shell V0"}
      />

      {gatewayAccessResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel abrir o FP Gateway para esta empresa.</strong>
          <span>{gatewayAccessResult.error}</span>
        </section>
      ) : null}

      {providersResult.error || configsResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar provedores do FP Gateway.</strong>
          <span>{providersResult.error ?? configsResult.error}</span>
        </section>
      ) : null}

      {query.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel executar a acao solicitada.</strong>
          <span>{query.error}</span>
        </section>
      ) : null}

      {query.smtpSaved ? (
        <section className="form-alert neutral page-feedback" role="status">
          Configuracao SMTP salva com sucesso.
        </section>
      ) : null}

      {query.smtpTest ? (
        <section
          className={query.smtpTest === "succeeded" ? "form-alert neutral page-feedback" : "data-alert"}
          role="status"
        >
          <strong>
            {query.smtpTest === "succeeded" ? "SMTP validado com sucesso." : "Validacao SMTP falhou."}
          </strong>
          <span>{query.message ?? "Validacao concluida."}</span>
        </section>
      ) : null}

      <GatewayIntro />

      <section className="summary-strip" aria-label="Resumo inicial do FP Gateway">
        <div className="summary-item">
          <span>Status</span>
          <strong>{gatewayAccessResult.data ? "Liberado" : "Pendente"}</strong>
          <small>Valido pelo guard de modulo contratado e permissao.</small>
        </div>
        <div className="summary-item">
          <span>Primeiro consumidor</span>
          <strong>FP Food</strong>
          <small>Pagamento real/teste e retorno normalizado.</small>
        </div>
        <div className="summary-item">
          <span>Automacao</span>
          <strong>FP Robots</strong>
          <small>Eventos `gateway.*` entram no log operacional.</small>
        </div>
      </section>

      <section className="section-heading">
        <div>
          <div className="eyebrow">Catalogo V0</div>
          <h2>Provedores do Gateway</h2>
        </div>
        <span className="muted">{providers.length} provedor(es)</span>
      </section>

      <section className="module-grid" aria-label="Provedores iniciais do FP Gateway">
        {providers.length > 0 ? (
          providers.map((provider) => (
            <article className="module-card" key={provider.id}>
              <div className="module-card-top">
                <span>{getProviderCategoryLabel(provider.category)}</span>
                <small>{provider.status === "active" ? "Ativo" : "Inativo"}</small>
              </div>
              <h3>{provider.name}</h3>
              <p>{provider.description ?? "Descricao pendente no catalogo do Gateway."}</p>
              <div className="tag-list">
                <span className="tag">{getProviderAuthLabel(provider.authType)}</span>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            Nenhum provedor retornado. Aplique a migration do catalogo Gateway V0.
          </div>
        )}
      </section>

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>SMTP</h1>
            <p>Configuracao simples para validar servidor de e-mail antes de conectar ao Robots.</p>
          </div>
          {smtpConfig ? (
            <form action={testGatewaySmtpConfigAction}>
              <input name="companyId" type="hidden" value={selectedCompanyId} />
              <PendingSubmitButton className="secondary-action" pendingLabel="Validando...">
                Testar SMTP
              </PendingSubmitButton>
            </form>
          ) : (
            <span>Nao configurado</span>
          )}
        </div>

        <SmtpConfigForm companyId={selectedCompanyId} config={smtpConfig} />
      </section>

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>Configuracoes ativas</h1>
            <p>Credenciais sensiveis ficam server-side e nao retornam para a interface.</p>
          </div>
          <span>{configs.length} configuracao(oes)</span>
        </div>

        {configs.length > 0 ? (
          <div className="data-table" role="table" aria-label="Configuracoes do FP Gateway">
            <div className="data-row data-row-head" role="row">
              <span>Provedor</span>
              <span>Status</span>
              <span>Validacao</span>
            </div>
            {configs.map((config) => (
              <div className="data-row" role="row" key={config.id}>
                <span>
                  <strong>{config.providerName}</strong>
                  <small>{config.providerKey}</small>
                </span>
                <span>{getCompanyProviderStatusLabel(config.status)}</span>
                <span>
                  {config.lastValidationStatus
                    ? getValidationStatusLabel(config.lastValidationStatus)
                    : "Nao testado"}
                  {config.lastValidationMessage ? <small>{config.lastValidationMessage}</small> : null}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Nenhuma configuracao de provedor cadastrada ainda.</div>
        )}
      </section>

      <section className="module-grid" aria-label="Fronteiras operacionais do FP Gateway">
        {[
          {
            title: "Credenciais",
            description: "Tokens, senhas e OAuth ficam no Gateway, sem vazar para Food ou Robots."
          },
          {
            title: "Webhooks",
            description: "Retornos externos serao validados, normalizados e publicados como eventos."
          },
          {
            title: "Consumidores",
            description: "Food, Billing, Marketing e Robots chamarao contratos internos do Gateway."
          }
        ].map((stage) => (
          <article className="module-card" key={stage.title}>
            <div className="module-card-top">
              <span>Gateway</span>
              <small>Planejado</small>
            </div>
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
          </article>
        ))}
      </section>

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>Contratos do proximo bloco</h1>
            <p>O proximo passo tecnico e criar o contrato minimo para pagamento real/teste.</p>
          </div>
          <span>{gatewayEvents.length} evento(s)</span>
        </div>

        <div className="data-table" role="table" aria-label="Eventos planejados do FP Gateway">
          <div className="data-row data-row-head" role="row">
            <span>Evento</span>
            <span>Destino</span>
            <span>Status</span>
          </div>
          {gatewayEvents.map((eventCode) => (
            <div className="data-row" role="row" key={eventCode}>
              <span>
                <strong>{eventCode}</strong>
              </span>
              <span>FP Robots</span>
              <span>Catalogado</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function SmtpConfigForm({
  companyId,
  config
}: {
  companyId: string;
  config: GatewayCompanyProviderConfigContract | null;
}) {
  const smtp = readSmtpConfig(config);

  return (
    <form action={saveGatewaySmtpConfigAction} className="form-grid">
      <input name="companyId" type="hidden" value={companyId} />
      <label>
        Host SMTP
        <input
          defaultValue={smtp.host}
          maxLength={255}
          name="host"
          placeholder="smtp.seudominio.com.br"
          required
        />
      </label>
      <label>
        Porta
        <input defaultValue={smtp.port} max={65535} min={1} name="port" required type="number" />
      </label>
      <label>
        Usuario
        <input defaultValue={smtp.username ?? ""} maxLength={255} name="username" />
      </label>
      <label>
        Senha
        <input
          autoComplete="new-password"
          name="password"
          placeholder={config?.passwordConfigured ? "Senha ja configurada" : "Senha SMTP"}
          type="password"
        />
      </label>
      <label>
        E-mail remetente
        <input
          defaultValue={smtp.fromEmail}
          maxLength={255}
          name="fromEmail"
          placeholder="contato@seudominio.com.br"
          required
          type="email"
        />
      </label>
      <label>
        Nome remetente
        <input defaultValue={smtp.fromName ?? ""} maxLength={120} name="fromName" />
      </label>
      <label>
        Status
        <select defaultValue={config?.status === "active" ? "active" : "configured"} name="status">
          <option value="configured">Configurado</option>
          <option value="active">Ativo</option>
        </select>
      </label>
      <label className="checkbox-field">
        <input defaultChecked={smtp.secure} name="secure" type="checkbox" />
        Conexao TLS direta
      </label>
      <div className="form-actions">
        <PendingSubmitButton pendingLabel="Salvando SMTP...">Salvar SMTP</PendingSubmitButton>
      </div>
    </form>
  );
}

function GatewayHeader({ badge }: { badge: string }) {
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">Integracoes externas</div>
        <strong>FP Gateway</strong>
      </div>
      <span className="status-pill">{badge}</span>
    </header>
  );
}

function GatewayIntro() {
  return (
    <section className="hero contextual-hero">
      <div className="hero-copy">
        <div className="eyebrow">Executor de provedores</div>
        <h1>Credenciais, pagamentos e canais externos fora dos modulos de negocio.</h1>
        <p>
          O FP Gateway nasce para encapsular Mercado Pago, WhatsApp, Meta, webhooks e
          respostas externas. Food e outros modulos solicitam operacoes; Gateway executa e
          devolve respostas normalizadas.
        </p>
      </div>
      <div className="foundation-panel" aria-label="Contrato arquitetural do FP Gateway">
        <span>Fronteira aprovada</span>
        <div className="foundation-item">Gateway executa provedores externos</div>
        <div className="foundation-item">Robots orquestra automacoes</div>
        <div className="foundation-item">Food mantem regra comercial do pedido</div>
      </div>
    </section>
  );
}

function CompanyPicker({ access }: { access: AdminCurrentUserAccessContract | null }) {
  const gatewayCompanies =
    access?.companies.filter((companyAccess) =>
      companyAccess.modules.some((module) => module.applicationKey === "gateway")
    ) ?? [];

  return (
    <section className="content-panel">
      <div className="panel-heading">
        <div>
          <h1>Selecione uma empresa</h1>
          <p>O FP Gateway trabalha sempre com empresa, modulo contratado e permissao.</p>
        </div>
        <span>{gatewayCompanies.length} empresa(s)</span>
      </div>

      {gatewayCompanies.length > 0 ? (
        <div className="module-grid">
          {gatewayCompanies.map((companyAccess) => (
            <article className="module-card" key={companyAccess.membershipId}>
              <div className="module-card-top">
                <span>{companyAccess.modules.length} modulo(s)</span>
                <small>{companyAccess.membershipStatus}</small>
              </div>
              <h3>{companyAccess.company.tradeName ?? companyAccess.company.legalName}</h3>
              <p>{companyAccess.company.document ?? "Documento nao informado"}</p>
              <div className="tag-list">
                <Link className="tag" href={`/gateway?companyId=${companyAccess.company.id}`}>
                  Abrir Gateway
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          Nenhuma empresa com FP Gateway contratado e permissao disponivel para este usuario.
        </div>
      )}
    </section>
  );
}

function resolveSelectedCompanyId(
  queryCompanyId: string | undefined,
  access: AdminCurrentUserAccessContract | null
): string | null {
  if (!access) {
    return null;
  }

  if (
    queryCompanyId &&
    access.companies.some(
      (companyAccess) =>
        companyAccess.company.id === queryCompanyId &&
        companyAccess.modules.some((module) => module.applicationKey === "gateway")
    )
  ) {
    return queryCompanyId;
  }

  const firstGatewayCompany = access.companies.find((companyAccess) =>
    companyAccess.modules.some((module) => module.applicationKey === "gateway")
  );

  return firstGatewayCompany?.company.id ?? null;
}

function readSmtpConfig(
  config: GatewayCompanyProviderConfigContract | null
): GatewaySmtpPublicConfig {
  if (config?.providerKey === "smtp") {
    return config.publicConfig as GatewaySmtpPublicConfig;
  }

  return {
    fromEmail: "",
    fromName: null,
    host: "",
    port: 587,
    secure: false,
    username: null
  };
}

function getProviderCategoryLabel(category: GatewayProviderContract["category"]): string {
  const labels: Record<GatewayProviderContract["category"], string> = {
    ads: "Ads",
    email: "E-mail",
    messaging: "Mensagem",
    payment: "Pagamento",
    social: "Social"
  };

  return labels[category];
}

function getProviderAuthLabel(authType: GatewayProviderContract["authType"]): string {
  const labels: Record<GatewayProviderContract["authType"], string> = {
    api_key: "API key",
    manual: "Manual",
    oauth: "OAuth",
    smtp_credentials: "SMTP"
  };

  return labels[authType];
}

function getCompanyProviderStatusLabel(
  status: GatewayCompanyProviderConfigContract["status"]
): string {
  const labels: Record<GatewayCompanyProviderConfigContract["status"], string> = {
    active: "Ativo",
    configured: "Configurado",
    error: "Com erro",
    inactive: "Inativo",
    not_configured: "Nao configurado"
  };

  return labels[status];
}

function getValidationStatusLabel(
  status: GatewayCompanyProviderConfigContract["lastValidationStatus"]
): string {
  if (status === "succeeded") {
    return "Sucesso";
  }

  if (status === "failed") {
    return "Falhou";
  }

  return "Nao testado";
}
