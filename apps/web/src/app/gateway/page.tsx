import Link from "next/link";
import type {
  AdminCurrentUserAccessContract,
  GatewayCompanyProviderConfigContract,
  GatewayPaymentRequestContract,
  GatewayProviderContract,
  GatewaySmtpPublicConfig
} from "@fp/types";
import { AppShell } from "@/components/app-shell";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import {
  getCurrentAdminAccess,
  getModuleAccess,
  listGatewayPaymentRequests,
  listGatewayProviderConfigs,
  listGatewayProviders
} from "@/lib/internal-api";
import {
  createGatewayPaymentRequestAction,
  saveGatewayMercadoPagoManualConfigAction,
  saveGatewaySmtpConfigAction,
  sendGatewaySmtpTestEmailAction,
  startGatewayMercadoPagoOAuthAction,
  syncGatewayPaymentRequestStatusAction,
  testGatewaySmtpConfigAction
} from "./actions";

export const dynamic = "force-dynamic";

type GatewayPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    message?: string;
    mpManualSaved?: string;
    mpOAuth?: string;
  paymentCreated?: string;
  paymentSynced?: string;
    smtpEmailSent?: string;
    smtpSaved?: string;
    smtpTest?: string;
    tab?: string;
  }>;
};

type GatewayTab = "events" | "overview" | "payments" | "providers" | "smtp";

const gatewayTabs: Array<{
  description: string;
  key: GatewayTab;
  label: string;
}> = [
  {
    description: "Status, fronteiras e contratos do modulo.",
    key: "overview",
    label: "Visao geral"
  },
  {
    description: "Mercado Pago, PIX e solicitacoes internas.",
    key: "payments",
    label: "Pagamentos V0"
  },
  {
    description: "Servidor de e-mail e envio de teste.",
    key: "smtp",
    label: "SMTP"
  },
  {
    description: "Catalogo e configuracoes por empresa.",
    key: "providers",
    label: "Provedores"
  },
  {
    description: "Eventos publicados para o FP Robots.",
    key: "events",
    label: "Eventos"
  }
];

const gatewayEvents = [
  "gateway.provider.connected",
  "gateway.smtp.validated",
  "gateway.payment.requested",
  "gateway.payment.requires_provider_config",
  "gateway.payment.failed",
  "gateway.payment.paid",
  "gateway.webhook.received",
  "gateway.whatsapp.message.sent"
];

export default async function GatewayPage({ searchParams }: GatewayPageProps) {
  const query = searchParams ? await searchParams : {};
  const accessResult = await getCurrentAdminAccess();
  const access = accessResult.data;
  const selectedCompanyId = resolveSelectedCompanyId(query.companyId, access);
  const selectedTab = resolveGatewayTab(query.tab);

  if (!access || !selectedCompanyId) {
    return (
      <AppShell access={access ?? null} accessError={accessResult.error} activePath="/gateway">
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
  const [providersResult, configsResult, paymentRequestsResult] = gatewayAccessResult.data
    ? await Promise.all([
        listGatewayProviders(selectedCompanyId),
        listGatewayProviderConfigs(selectedCompanyId),
        listGatewayPaymentRequests(selectedCompanyId)
      ])
    : [
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: null }
      ];
  const providers = providersResult.data ?? [];
  const configs = configsResult.data ?? [];
  const paymentRequests = paymentRequestsResult.data ?? [];
  const mercadoPagoConfig =
    configs.find((config) => config.providerKey === "mercado_pago") ?? null;
  const smtpConfig = configs.find((config) => config.providerKey === "smtp") ?? null;
  const paymentProviders = providers.filter(
    (provider) => provider.category === "payment" && provider.status === "active"
  );
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

      {providersResult.error || configsResult.error || paymentRequestsResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar provedores do FP Gateway.</strong>
          <span>
            {providersResult.error ?? configsResult.error ?? paymentRequestsResult.error}
          </span>
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

      {query.smtpEmailSent ? (
        <section className="form-alert neutral page-feedback" role="status">
          <strong>E-mail de teste enviado.</strong>
          <span>{query.message ?? "Mensagem enviada pelo FP Gateway."}</span>
        </section>
      ) : null}

      {query.paymentCreated || query.paymentSynced ? (
        <section className="form-alert neutral page-feedback" role="status">
          <strong>
            {query.paymentSynced
              ? "Status de pagamento sincronizado."
              : "Solicitacao de pagamento registrada."}
          </strong>
          <span>{getPaymentRequestStatusLabel(query.paymentSynced ?? query.paymentCreated ?? "")}</span>
        </section>
      ) : null}

      {query.mpOAuth === "connected" ? (
        <section className="form-alert neutral page-feedback" role="status">
          <strong>Mercado Pago conectado.</strong>
          <span>OAuth concluido e credenciais salvas no FP Gateway.</span>
        </section>
      ) : null}

      {query.mpManualSaved ? (
        <section className="form-alert neutral page-feedback" role="status">
          <strong>Mercado Pago sandbox salvo.</strong>
          <span>Credencial de teste configurada para gerar pagamentos PIX.</span>
        </section>
      ) : null}

      <GatewayIntro />

      <GatewaySubnav companyId={selectedCompanyId} selectedTab={selectedTab} />

      {selectedTab === "overview" ? (
        <GatewayOverview gatewayAccessGranted={Boolean(gatewayAccessResult.data)} />
      ) : null}

      {selectedTab === "payments" ? (
        <GatewayPaymentsPanel
          companyId={selectedCompanyId}
          mercadoPagoConfig={mercadoPagoConfig}
          paymentProviders={paymentProviders}
          paymentRequests={paymentRequests}
        />
      ) : null}

      {selectedTab === "smtp" ? (
        <GatewaySmtpPanel companyId={selectedCompanyId} smtpConfig={smtpConfig} />
      ) : null}

      {selectedTab === "providers" ? (
        <GatewayProvidersPanel configs={configs} providers={providers} />
      ) : null}

      {selectedTab === "events" ? <GatewayEventsPanel /> : null}
    </AppShell>
  );
}

function GatewaySubnav({
  companyId,
  selectedTab
}: {
  companyId: string;
  selectedTab: GatewayTab;
}) {
  return (
    <nav className="module-subnav" aria-label="Areas do FP Gateway">
      {gatewayTabs.map((tab) => (
        <Link
          aria-current={selectedTab === tab.key ? "page" : undefined}
          className={selectedTab === tab.key ? "active" : undefined}
          href={`/gateway?companyId=${companyId}&tab=${tab.key}`}
          key={tab.key}
        >
          <strong>{tab.label}</strong>
          <span>{tab.description}</span>
        </Link>
      ))}
    </nav>
  );
}

function GatewayOverview({ gatewayAccessGranted }: { gatewayAccessGranted: boolean }) {
  return (
    <>
      <section className="summary-strip" aria-label="Resumo inicial do FP Gateway">
        <div className="summary-item">
          <span>Status</span>
          <strong>{gatewayAccessGranted ? "Liberado" : "Pendente"}</strong>
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
    </>
  );
}

function GatewayPaymentsPanel({
  companyId,
  mercadoPagoConfig,
  paymentProviders,
  paymentRequests
}: {
  companyId: string;
  mercadoPagoConfig: GatewayCompanyProviderConfigContract | null;
  paymentProviders: GatewayProviderContract[];
  paymentRequests: GatewayPaymentRequestContract[];
}) {
  return (
    <section className="content-panel">
      <div className="panel-heading">
        <div>
          <h1>Pagamentos V0</h1>
          <p>Contrato interno para o Food solicitar pagamento sem falar direto com o provedor.</p>
        </div>
        <span>{paymentRequests.length} solicitacao(oes)</span>
      </div>

      <PaymentRequestForm
        companyId={companyId}
        mercadoPagoConfig={mercadoPagoConfig}
        paymentProviders={paymentProviders}
      />
      <PaymentRequestsTable companyId={companyId} paymentRequests={paymentRequests} />
    </section>
  );
}

function GatewaySmtpPanel({
  companyId,
  smtpConfig
}: {
  companyId: string;
  smtpConfig: GatewayCompanyProviderConfigContract | null;
}) {
  return (
    <>
      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>SMTP</h1>
            <p>Configuracao simples para validar servidor de e-mail antes de conectar ao Robots.</p>
          </div>
          {smtpConfig ? (
            <form action={testGatewaySmtpConfigAction}>
              <input name="companyId" type="hidden" value={companyId} />
              <PendingSubmitButton className="secondary-action" pendingLabel="Validando...">
                Testar SMTP
              </PendingSubmitButton>
            </form>
          ) : (
            <span>Nao configurado</span>
          )}
        </div>

        <div className="form-alert neutral inline-alert" role="status">
          Resend: host `smtp.resend.com`, usuario `resend`, senha com API key. Use porta 587 ou
          2587 sem TLS direta, ou 465/2465 com TLS direta. Outlook/Office 365 costuma exigir SMTP
          AUTH habilitado e pode precisar de app password.
        </div>

        <SmtpConfigForm companyId={companyId} config={smtpConfig} />
      </section>

      {smtpConfig ? (
        <section className="content-panel stack-panel">
          <div className="panel-heading">
            <div>
              <h1>E-mail de teste</h1>
              <p>Envia uma mensagem real usando a configuracao SMTP salva para esta empresa.</p>
            </div>
            <span>{smtpConfig.status === "active" ? "SMTP ativo" : "SMTP configurado"}</span>
          </div>

          <SmtpTestEmailForm companyId={companyId} />
        </section>
      ) : null}
    </>
  );
}

function GatewayProvidersPanel({
  configs,
  providers
}: {
  configs: GatewayCompanyProviderConfigContract[];
  providers: GatewayProviderContract[];
}) {
  return (
    <>
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
    </>
  );
}

function GatewayEventsPanel() {
  return (
    <section className="content-panel">
      <div className="panel-heading">
        <div>
          <h1>Contratos do proximo bloco</h1>
          <p>Eventos catalogados para o FP Robots consumir o rastro operacional do Gateway.</p>
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
  );
}

function PaymentRequestForm({
  companyId,
  mercadoPagoConfig,
  paymentProviders
}: {
  companyId: string;
  mercadoPagoConfig: GatewayCompanyProviderConfigContract | null;
  paymentProviders: GatewayProviderContract[];
}) {
  const mercadoPagoStatus =
    mercadoPagoConfig?.status === "active" ? "Conectado via OAuth" : "Nao conectado";
  const mercadoPagoPublicConfig = mercadoPagoConfig?.publicConfig as
    | { mode?: string | null; userId?: number | string | null }
    | undefined;
  const mercadoPagoMode =
    mercadoPagoPublicConfig?.mode === "manual_sandbox" ? "Sandbox manual" : mercadoPagoStatus;

  return (
    <>
      <div className="form-alert neutral inline-alert" role="status">
        Mercado Pago: {mercadoPagoMode}
        {mercadoPagoPublicConfig?.userId ? ` / Conta ${mercadoPagoPublicConfig.userId}` : ""}
      </div>
      <div className="form-alert neutral inline-alert" role="status">
        Para teste local, use credenciais de teste ou credenciais de producao de uma conta de
        teste do Mercado Pago. Para PIX, informe um e-mail valido de pagador diferente da conta
        vendedora usada no Access Token. No sandbox manual, o Gateway usa o nome APRO no payload
        enviado ao Mercado Pago e exige e-mail com dominio @testuser.com, conforme o roteiro
        oficial de teste de Pix. Para cartao, informe apenas o token gerado pelo MercadoPago.js ou
        Card Payment Brick; nunca informe numero/CVV no FP Console.
      </div>

      <form action={startGatewayMercadoPagoOAuthAction} className="form-actions">
        <input name="companyId" type="hidden" value={companyId} />
        <PendingSubmitButton className="secondary-action" pendingLabel="Abrindo OAuth...">
          Conectar Mercado Pago
        </PendingSubmitButton>
      </form>

      <form action={saveGatewayMercadoPagoManualConfigAction} className="form-grid">
        <input name="companyId" type="hidden" value={companyId} />
        <label>
          Access Token de teste ou conta de teste
          <input
            autoComplete="new-password"
            maxLength={255}
            name="accessToken"
            placeholder="TEST-... ou APP_USR-... de conta de teste"
            required
            type="password"
          />
        </label>
        <label>
          Public Key
          <input maxLength={255} name="publicKey" placeholder="TEST-..." />
        </label>
        <label>
          N. da aplicacao
          <input maxLength={80} name="appId" />
        </label>
        <label>
          User ID
          <input maxLength={80} name="userId" />
        </label>
        <div className="form-actions">
          <PendingSubmitButton className="secondary-action" pendingLabel="Salvando sandbox...">
            Salvar sandbox manual
          </PendingSubmitButton>
        </div>
      </form>

      <form action={createGatewayPaymentRequestAction} className="form-grid">
        <input name="companyId" type="hidden" value={companyId} />
        <input name="sourceApplicationKey" type="hidden" value="food" />
        <input name="sourceReferenceType" type="hidden" value="order" />
        <label>
          Provedor
          <select defaultValue={paymentProviders[0]?.key ?? "mercado_pago"} name="providerKey">
            {paymentProviders.length > 0 ? (
              paymentProviders.map((provider) => (
                <option key={provider.id} value={provider.key}>
                  {provider.name}
                </option>
              ))
            ) : (
              <option value="mercado_pago">Mercado Pago</option>
            )}
          </select>
        </label>
        <label>
          Meio de pagamento
          <select defaultValue="pix" name="paymentMethodType">
            <option value="pix">Pix</option>
            <option value="credit_card">Cartao de credito</option>
            <option value="debit_card">Cartao de debito</option>
          </select>
        </label>
        <label>
          Valor
          <input defaultValue="200,00" inputMode="decimal" maxLength={14} name="amount" required />
        </label>
        <label>
          Referencia do pedido
          <input maxLength={160} name="sourceReferenceId" placeholder="ex: FOOD-0001" />
        </label>
        <label>
          Cliente
          <input
            defaultValue="APRO"
            maxLength={160}
            name="customerName"
            placeholder="Nome do cliente"
          />
        </label>
        <label>
          E-mail do pagador
          <input
            maxLength={255}
            name="customerEmail"
            placeholder="test_user_br@testuser.com"
            required
            type="email"
          />
        </label>
        <label>
          Telefone
          <input maxLength={40} name="customerPhone" placeholder="(00) 00000-0000" />
        </label>
        <label>
          Bandeira do cartao
          <input maxLength={40} name="paymentMethodId" placeholder="master, visa, elo" />
        </label>
        <label>
          Parcelas
          <input defaultValue="1" max={24} min={1} name="installments" type="number" />
        </label>
        <label className="form-full">
          Token do cartao
          <input
            autoComplete="off"
            maxLength={255}
            name="cardToken"
            placeholder="Token criado pelo MercadoPago.js/Card Payment Brick"
            type="password"
          />
        </label>
        <label className="form-full">
          Descricao
          <input
            defaultValue="Pedido de teste FP Food"
            maxLength={255}
            name="description"
            required
          />
        </label>
        <div className="form-actions">
          <PendingSubmitButton pendingLabel="Registrando pagamento...">
            Criar solicitacao V0
          </PendingSubmitButton>
        </div>
      </form>
    </>
  );
}

function PaymentRequestsTable({
  companyId,
  paymentRequests
}: {
  companyId: string;
  paymentRequests: GatewayPaymentRequestContract[];
}) {
  if (paymentRequests.length === 0) {
    return <div className="empty-state">Nenhuma solicitacao de pagamento registrada ainda.</div>;
  }

  return (
    <div className="data-table" role="table" aria-label="Solicitacoes de pagamento">
      <div className="data-row data-row-head payment-request-row" role="row">
        <span>Origem</span>
        <span>Valor</span>
        <span>Status</span>
        <span>Acao</span>
      </div>
      {paymentRequests.map((paymentRequest) => (
        <div className="data-row payment-request-row" role="row" key={paymentRequest.id}>
          <span>
            <strong>{paymentRequest.description}</strong>
            <small>
              {paymentRequest.sourceApplicationKey}.{paymentRequest.sourceReferenceType} /{" "}
              {paymentRequest.sourceReferenceId}
            </small>
          </span>
          <span>
            {formatCurrency(paymentRequest.amountCents, paymentRequest.currency)}
            <small>{paymentRequest.providerName}</small>
          </span>
          <span>
            {getPaymentRequestStatusLabel(paymentRequest.status)}
            {paymentRequest.errorMessage ? <small>{paymentRequest.errorMessage}</small> : null}
            {paymentRequest.paymentUrl ? (
              <small>
                <a href={paymentRequest.paymentUrl} rel="noreferrer" target="_blank">
                  Abrir pagamento
                </a>
              </small>
            ) : null}
          </span>
          <span>
            {paymentRequest.providerReference ? (
              <form action={syncGatewayPaymentRequestStatusAction} className="inline-form">
                <input name="companyId" type="hidden" value={companyId} />
                <input name="paymentRequestId" type="hidden" value={paymentRequest.id} />
                <PendingSubmitButton className="secondary-action" pendingLabel="Consultando...">
                  Consultar status
                </PendingSubmitButton>
              </form>
            ) : (
              <small>Aguardando provedor</small>
            )}
          </span>
        </div>
      ))}
    </div>
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

function SmtpTestEmailForm({ companyId }: { companyId: string }) {
  return (
    <form action={sendGatewaySmtpTestEmailAction} className="form-grid">
      <input name="companyId" type="hidden" value={companyId} />
      <label>
        Destinatario
        <input
          maxLength={255}
          name="toEmail"
          placeholder="destino@seudominio.com.br"
          required
          type="email"
        />
      </label>
      <label>
        Assunto
        <input
          defaultValue="Teste SMTP - FP Gateway"
          maxLength={160}
          name="subject"
          required
        />
      </label>
      <label className="form-full">
        Mensagem
        <textarea
          defaultValue="Este e um e-mail de teste enviado pelo FP Gateway para validar o envio SMTP."
          maxLength={4000}
          name="body"
          rows={5}
        />
      </label>
      <div className="form-actions">
        <PendingSubmitButton pendingLabel="Enviando e-mail...">
          Enviar e-mail de teste
        </PendingSubmitButton>
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

function resolveGatewayTab(value: string | undefined): GatewayTab {
  const tab = gatewayTabs.find((item) => item.key === value);

  return tab?.key ?? "overview";
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

function getPaymentRequestStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    cancelled: "Cancelado",
    expired: "Expirado",
    failed: "Falhou",
    paid: "Pago",
    requested: "Solicitado",
    requires_provider_config: "Aguardando configuracao do provedor"
  };

  return labels[status] ?? status;
}

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    currency,
    style: "currency"
  }).format(amountCents / 100);
}
