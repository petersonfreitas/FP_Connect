import Link from "next/link";
import type {
  AdminCurrentUserAccessContract,
  RobotsEventCatalogContract,
  RobotsEventContract,
  RobotsExecutionContract,
  RobotsRuleContract
} from "@fp/types";
import { AppShell } from "@/components/app-shell";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import {
  ContextSummary,
  getCompanyContextName,
  getCompanyContextPlanLabel,
  getCompanyContextStatusLabel,
  getModuleContextAccessLabel
} from "@/components/context-summary";
import {
  getCurrentAdminAccess,
  listRobotsEventCatalog,
  listRobotsEvents,
  listRobotsExecutions,
  listRobotsRules
} from "@/lib/internal-api";
import { reprocessRobotsExecutionAction } from "./actions";

export const dynamic = "force-dynamic";

type RobotsPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    reprocessed?: string;
    tab?: string;
  }>;
};

type RobotsTab = "catalog" | "events" | "executions" | "overview" | "rules";

const robotsTabs: Array<{
  description: string;
  key: RobotsTab;
  label: string;
}> = [
  {
    description: "Indicadores e leitura do modulo.",
    key: "overview",
    label: "Visao geral"
  },
  {
    description: "Fatos recebidos pelos modulos.",
    key: "events",
    label: "Eventos"
  },
  {
    description: "Tentativas, falhas e reprocessos.",
    key: "executions",
    label: "Execucoes"
  },
  {
    description: "Regras ativas de automacao.",
    key: "rules",
    label: "Regras"
  },
  {
    description: "Eventos permitidos no ecossistema.",
    key: "catalog",
    label: "Catalogo"
  }
];

const eventStatusLabels = {
  failed: "Falhou",
  ignored_duplicate: "Duplicado ignorado",
  received: "Recebido"
};

const executionStatusLabels = {
  cancelled: "Cancelada",
  failed: "Falhou",
  pending: "Pendente",
  running: "Executando",
  succeeded: "Concluida"
};

const catalogStatusLabels = {
  active: "Ativo",
  inactive: "Inativo"
};

export default async function RobotsPage({ searchParams }: RobotsPageProps) {
  const query = searchParams ? await searchParams : {};
  const accessResult = await getCurrentAdminAccess();
  const access = accessResult.data;
  const selectedCompanyId = resolveSelectedCompanyId(query.companyId, access);
  const selectedTab = resolveRobotsTab(query.tab);

  if (!access || !selectedCompanyId) {
    return (
      <AppShell access={access ?? null} accessError={accessResult.error} activePath="/robots">
        <RobotsHeader badge="Sem empresa" />

        {accessResult.error ? (
          <section className="data-alert" role="status">
            <strong>Nao foi possivel carregar seu acesso atual.</strong>
            <span>{accessResult.error}</span>
          </section>
        ) : null}

        <RobotsIntro />

        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>Selecione uma empresa</h1>
              <p>O FP Robots trabalha sempre com contexto empresarial e modulo contratado.</p>
            </div>
            <span>{access?.companies.length ?? 0} empresa(s)</span>
          </div>

          {access?.companies.length ? (
            <div className="module-grid">
              {access.companies.map((companyAccess) => (
                <article className="module-card" key={companyAccess.membershipId}>
                  <div className="module-card-top">
                    <span>{companyAccess.modules.length} modulo(s)</span>
                    <small>{companyAccess.membershipStatus}</small>
                  </div>
                  <h3>{companyAccess.company.tradeName ?? companyAccess.company.legalName}</h3>
                  <p>{companyAccess.company.document ?? "Documento nao informado"}</p>
                  <div className="tag-list">
                    <Link className="tag" href={`/robots?companyId=${companyAccess.company.id}`}>
                      Abrir Robots
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              Nenhuma empresa com contexto disponivel para abrir o FP Robots.
            </div>
          )}
        </section>
      </AppShell>
    );
  }

  const [catalogResult, eventsResult, rulesResult, executionsResult] = await Promise.all([
    listRobotsEventCatalog(selectedCompanyId),
    listRobotsEvents(selectedCompanyId),
    listRobotsRules(selectedCompanyId),
    listRobotsExecutions(selectedCompanyId)
  ]);
  const catalog = catalogResult.data ?? [];
  const events = eventsResult.data ?? [];
  const rules = rulesResult.data ?? [];
  const executions = executionsResult.data ?? [];
  const selectedCompany = access.companies.find(
    (companyAccess) => companyAccess.company.id === selectedCompanyId
  );
  const robotsModule = selectedCompany?.modules.find(
    (moduleAccess) => moduleAccess.applicationKey === "robots"
  );

  return (
    <AppShell access={access} activePath="/robots">
      <RobotsHeader
        badge={selectedCompany?.company.tradeName ?? selectedCompany?.company.legalName ?? "Operacao"}
      />

      {query.reprocessed ? (
        <section className="form-alert neutral page-feedback" role="status">
          Execucao reprocessada com sucesso.
        </section>
      ) : null}

      {query.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel executar a acao solicitada.</strong>
          <span>{query.error}</span>
        </section>
      ) : null}

      {catalogResult.error || eventsResult.error || rulesResult.error || executionsResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar dados do FP Robots.</strong>
          <span>
            {catalogResult.error ?? eventsResult.error ?? rulesResult.error ?? executionsResult.error}
          </span>
        </section>
      ) : null}

      <ContextSummary
        items={[
          {
            label: "Empresa atual",
            tone: "strong",
            value: getCompanyContextName(selectedCompany)
          },
          {
            label: "Modulo",
            value: robotsModule?.applicationName ?? "FP Robots"
          },
          {
            label: "Status",
            value: getCompanyContextStatusLabel(selectedCompany?.company.status)
          },
          {
            label: "Plano",
            value: getCompanyContextPlanLabel(selectedCompany)
          },
          {
            label: "Acesso",
            value: getModuleContextAccessLabel(robotsModule)
          }
        ]}
      />

      <RobotsIntro />

      <RobotsSubnav companyId={selectedCompanyId} selectedTab={selectedTab} />

      {selectedTab === "overview" ? (
        <RobotsOverview
          catalog={catalog}
          events={events}
          executions={executions}
          rules={rules}
        />
      ) : null}

      {selectedTab === "events" ? (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>Eventos recebidos</h1>
              <p>Fatos aceitos pelo catalogo do Robots, sempre com empresa e origem identificadas.</p>
            </div>
            <span>{events.length} registro(s)</span>
          </div>

          {events.length > 0 ? (
            <RobotsEventsTable events={events} selectedCompanyId={selectedCompanyId} />
          ) : (
            <div className="empty-state">
              Nenhum evento recebido ainda. O endpoint interno ja esta preparado para Food, Tracking
              e Gateway publicarem eventos padronizados.
            </div>
          )}
        </section>
      ) : null}

      {selectedTab === "executions" ? (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>Execucoes</h1>
              <p>Acoes criadas a partir das regras ativas do Robots.</p>
            </div>
            <span>{executions.length} registro(s)</span>
          </div>

          {executions.length > 0 ? (
            <RobotsExecutionsTable executions={executions} selectedCompanyId={selectedCompanyId} />
          ) : (
            <div className="empty-state">
              Nenhuma execucao registrada ainda. As execucoes aparecerao quando eventos reais
              encontrarem regras ativas para esta empresa.
            </div>
          )}
        </section>
      ) : null}

      {selectedTab === "rules" ? (
        <section className="robots-workspace" aria-label="Regras do FP Robots">
          <RobotsRulesCard rules={rules} />
        </section>
      ) : null}

      {selectedTab === "catalog" ? (
        <section className="robots-workspace" aria-label="Catalogo do FP Robots">
          <RobotsCatalogCard catalog={catalog} />
        </section>
      ) : null}
    </AppShell>
  );
}

function RobotsHeader({ badge }: { badge: string }) {
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">Sistema operacional</div>
        <strong>FP Robots</strong>
      </div>
      <span className="status-pill">{badge}</span>
    </header>
  );
}

function RobotsIntro() {
  return (
    <section className="robots-hero">
      <div>
        <div className="eyebrow">Orquestrador de automacoes</div>
        <h1>Eventos primeiro, automacoes depois.</h1>
        <p>
          O FP Robots registra fatos do ecossistema, valida catalogo e prepara a base para regras,
          execucoes, retry e reprocessamento sem assumir a regra de negocio dos modulos.
        </p>
      </div>
      <aside className="robots-hero-panel" aria-label="Fronteira arquitetural">
        <span>Separacao preparada</span>
        <strong>Robots decide. Gateway executa provedores externos.</strong>
        <p>
          WhatsApp, Meta, Ads e pagamentos externos ficam reservados para o FP Gateway. O Robots
          nasce pronto para solicitar a acao, mas sem guardar credenciais.
        </p>
      </aside>
    </section>
  );
}

function RobotsSubnav({
  companyId,
  selectedTab
}: {
  companyId: string;
  selectedTab: RobotsTab;
}) {
  return (
    <nav className="module-subnav" aria-label="Areas do FP Robots">
      {robotsTabs.map((tab) => (
        <Link
          aria-current={selectedTab === tab.key ? "page" : undefined}
          className={selectedTab === tab.key ? "active" : undefined}
          href={`/robots?companyId=${companyId}&tab=${tab.key}`}
          key={tab.key}
        >
          <strong>{tab.label}</strong>
          <span>{tab.description}</span>
        </Link>
      ))}
    </nav>
  );
}

function RobotsOverview({
  catalog,
  events,
  executions,
  rules
}: {
  catalog: RobotsEventCatalogContract[];
  events: RobotsEventContract[];
  executions: RobotsExecutionContract[];
  rules: RobotsRuleContract[];
}) {
  const failedEvents = events.filter((event) => event.status === "failed").length;
  const pendingExecutions = executions.filter(
    (execution) => execution.status === "pending" || execution.status === "running"
  ).length;
  const failedExecutions = executions.filter((execution) => execution.status === "failed").length;
  const activeRules = rules.filter((rule) => rule.status === "active").length;

  return (
    <>
      <section className="summary-strip" aria-label="Resumo operacional do FP Robots">
        <div className="summary-item">
          <span>Eventos recebidos</span>
          <strong>{events.length}</strong>
          <small>Ultimos registros da empresa selecionada.</small>
        </div>
        <div className="summary-item">
          <span>Falhas em eventos</span>
          <strong>{failedEvents}</strong>
          <small>Eventos recusados ou com falha de catalogo.</small>
        </div>
        <div className="summary-item">
          <span>Execucoes pendentes</span>
          <strong>{pendingExecutions}</strong>
          <small>Acoes aguardando processamento ou em andamento.</small>
        </div>
        <div className="summary-item">
          <span>Execucoes com falha</span>
          <strong>{failedExecutions}</strong>
          <small>Podem exigir reprocessamento operacional.</small>
        </div>
      </section>

      <section className="module-grid" aria-label="Resumo das areas do FP Robots">
        <article className="module-card">
          <div className="module-card-top">
            <span>Catalogo</span>
            <small>{catalog.length} evento(s)</small>
          </div>
          <h3>Eventos permitidos</h3>
          <p>Base de eventos reconhecidos para Food, Gateway, Tracking e futuros modulos.</p>
        </article>

        <article className="module-card">
          <div className="module-card-top">
            <span>Regras</span>
            <small>{activeRules} ativa(s)</small>
          </div>
          <h3>Automacoes configuradas</h3>
          <p>Regras conectam eventos do catalogo a acoes internas ou integracoes futuras.</p>
        </article>

        <article className="module-card">
          <div className="module-card-top">
            <span>Operacao</span>
            <small>{executions.length} execucao(oes)</small>
          </div>
          <h3>Reprocessamento</h3>
          <p>Falhas operacionais permanecem auditaveis e podem ser reprocessadas quando permitido.</p>
        </article>
      </section>
    </>
  );
}

function RobotsCatalogCard({ catalog }: { catalog: RobotsEventCatalogContract[] }) {
  const bySource = catalog.reduce<Record<string, number>>((accumulator, event) => {
    accumulator[event.sourceApplicationKey] = (accumulator[event.sourceApplicationKey] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <article className="robots-section-card">
      <div className="module-card-top">
        <span>Catalogo</span>
        <small>{catalog.length} evento(s)</small>
      </div>
      <h2>Eventos permitidos</h2>
      <p>Catalogo padronizado para eventos `food.*`, `tracking.*` e `gateway.*`.</p>
      {catalog.length > 0 ? (
        <ul>
          {Object.entries(bySource).map(([source, total]) => (
            <li key={source}>
              {source}: {total} evento(s)
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">Nenhum evento cadastrado no catalogo do Robots.</div>
      )}
      {catalog.length > 0 ? (
        <small>{catalogStatusLabels[catalog[0].status]} como status padrao inicial.</small>
      ) : null}
    </article>
  );
}

function RobotsRulesCard({ rules }: { rules: RobotsRuleContract[] }) {
  return (
    <article className="robots-section-card">
      <div className="module-card-top">
        <span>Regras</span>
        <small>{rules.length} regra(s)</small>
      </div>
      <h2>Evento para acao</h2>
      <p>Regras conectam eventos catalogados a acoes internas ou solicitacoes para outros modulos.</p>
      {rules.length > 0 ? (
        <ul>
          {rules.map((rule) => (
            <li key={rule.id}>
              {rule.eventCode}: {rule.actions.length} acao(oes)
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          Nenhuma regra configurada ainda. As regras serao criadas pelos proximos fluxos
          operacionais do Robots.
        </div>
      )}
    </article>
  );
}

function RobotsEventsTable({
  events,
  selectedCompanyId
}: {
  events: RobotsEventContract[];
  selectedCompanyId: string;
}) {
  return (
    <div className="data-table" role="table" aria-label="Eventos recebidos pelo FP Robots">
      <div className="data-row data-row-head robots-events-row" role="row">
        <span>Evento</span>
        <span>Origem</span>
        <span>Status</span>
        <span>Recebido</span>
        <span />
      </div>
      {events.map((event) => (
        <div className="data-row robots-events-row" role="row" key={event.id}>
          <span>
            <strong>{event.eventCode}</strong>
            <small>{event.idempotencyKey ?? event.id}</small>
          </span>
          <span>{event.sourceApplicationKey}</span>
          <span className={`table-status table-status-${event.status}`}>
            {eventStatusLabels[event.status]}
          </span>
          <span>{formatDate(event.createdAt)}</span>
          <Link href={`/robots/eventos/${event.id}?companyId=${selectedCompanyId}`}>Detalhar</Link>
        </div>
      ))}
    </div>
  );
}

function RobotsExecutionsTable({
  executions,
  selectedCompanyId
}: {
  executions: RobotsExecutionContract[];
  selectedCompanyId: string;
}) {
  return (
    <div className="data-table" role="table" aria-label="Execucoes do FP Robots">
      <div className="data-row data-row-head robots-executions-row" role="row">
        <span>Acao</span>
        <span>Status</span>
        <span>Tentativas</span>
        <span>Evento</span>
        <span />
      </div>
      {executions.map((execution) => (
        <div className="data-row robots-executions-row" role="row" key={execution.id}>
          <span>
            <strong>{execution.actionType}</strong>
            <small>{execution.ruleActionId ?? execution.id}</small>
          </span>
          <span className={`table-status table-status-${execution.status}`}>
            {executionStatusLabels[execution.status]}
          </span>
          <span>
            {execution.attemptCount}/{execution.maxAttempts}
          </span>
          <span>{execution.eventId}</span>
          {execution.status === "failed" ? (
            <form action={reprocessRobotsExecutionAction}>
              <input name="companyId" type="hidden" value={selectedCompanyId} />
              <input name="executionId" type="hidden" value={execution.id} />
              <PendingSubmitButton className="secondary-action compact-action" pendingLabel="...">
                Reprocessar
              </PendingSubmitButton>
            </form>
          ) : (
            <span>-</span>
          )}
        </div>
      ))}
    </div>
  );
}

function resolveSelectedCompanyId(
  queryCompanyId: string | undefined,
  access: AdminCurrentUserAccessContract | null
): string | null {
  if (!access) {
    return null;
  }

  if (queryCompanyId && access.companies.some((item) => item.company.id === queryCompanyId)) {
    return queryCompanyId;
  }

  const firstRobotsCompany = access.companies.find((companyAccess) =>
    companyAccess.modules.some((module) => module.applicationKey === "robots")
  );

  return firstRobotsCompany?.company.id ?? null;
}

function resolveRobotsTab(value: string | undefined): RobotsTab {
  const tab = robotsTabs.find((item) => item.key === value);

  return tab?.key ?? "overview";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}
