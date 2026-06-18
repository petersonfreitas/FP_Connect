import Link from "next/link";
import type { AdminCurrentUserAccessContract } from "@fp/types";
import { AppShell } from "@/components/app-shell";
import { getCurrentAdminAccess, getModuleAccess } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

type GatewayPageProps = {
  searchParams?: Promise<{
    companyId?: string;
  }>;
};

const gatewayStages = [
  {
    title: "Provedores",
    description: "Catalogo inicial para Mercado Pago, WhatsApp, Meta e futuros provedores."
  },
  {
    title: "Credenciais",
    description: "Tokens e OAuth ficarao no Gateway, nunca dentro dos modulos consumidores."
  },
  {
    title: "Webhooks",
    description: "Retornos externos serao validados, normalizados e publicados como eventos."
  },
  {
    title: "Consumidores",
    description: "Food, Billing, Marketing e Robots chamarao contratos internos do Gateway."
  }
];

const gatewayEvents = [
  "gateway.provider.connected",
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
          <div className="eyebrow">Shell V0</div>
          <h2>Fronteiras do modulo</h2>
        </div>
        <span className="muted">Sem credenciais reais no V0</span>
      </section>

      <section className="module-grid" aria-label="Areas iniciais do FP Gateway">
        {gatewayStages.map((stage) => (
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
