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
  getCurrentAdminAccess,
  listRobotsEventCatalog,
  listRobotsEvents,
  listRobotsExecutions,
  listRobotsRules
} from "@/lib/internal-api";
import {
  createRobotsTestEventAction,
  createRobotsTestFailureAction,
  reprocessRobotsExecutionAction
} from "./actions";

export const dynamic = "force-dynamic";

type RobotsPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    eventCreated?: string;
    executions?: string;
    failureCreated?: string;
    reprocessed?: string;
  }>;
};

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

  if (!access || !selectedCompanyId) {
    return (
      <AppShell access={access ?? null} accessError={accessResult.error} activePath="/robots">
        <RobotsHeader badge="V0" />

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

  return (
    <AppShell access={access} activePath="/robots">
      <RobotsHeader badge={selectedCompany?.company.tradeName ?? selectedCompany?.company.legalName ?? "V0"} />

      {query.eventCreated ? (
        <section className="form-alert neutral page-feedback" role="status">
          Evento de teste registrado. Execucoes criadas: {query.executions ?? "0"}.
        </section>
      ) : null}

      {query.failureCreated ? (
        <section className="form-alert neutral page-feedback" role="status">
          Falha de teste registrada. Use a tabela de execucoes para reprocessar.
        </section>
      ) : null}

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

      <RobotsIntro />

      <section className="summary-strip" aria-label="Resumo inicial do FP Robots">
        <div className="summary-item">
          <span>Eventos recebidos</span>
          <strong>{events.length}</strong>
          <small>Ultimos 50 registros da empresa selecionada.</small>
        </div>
        <div className="summary-item">
          <span>Catalogo ativo</span>
          <strong>{catalog.filter((event) => event.status === "active").length}</strong>
          <small>Eventos permitidos no V0.</small>
        </div>
        <div className="summary-item">
          <span>Regras ativas</span>
          <strong>{rules.filter((rule) => rule.status === "active").length}</strong>
          <small>Evento para acao no V0.</small>
        </div>
        <div className="summary-item">
          <span>Execucoes</span>
          <strong>{executions.length}</strong>
          <small>Ultimas 50 tentativas registradas.</small>
        </div>
      </section>

      <section className="robots-workspace" aria-label="Areas do FP Robots V0">
        <RobotsCatalogCard catalog={catalog} />
        <RobotsRulesCard rules={rules} selectedCompanyId={selectedCompanyId} />
      </section>

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>Teste controlado</h1>
            <p>Cria uma regra `food.order.created {"->"} internal_log` e publica um evento de teste.</p>
          </div>
          <form action={createRobotsTestEventAction}>
            <input name="companyId" type="hidden" value={selectedCompanyId} />
            <PendingSubmitButton pendingLabel="Gerando evento...">Gerar evento de teste</PendingSubmitButton>
          </form>
          <form action={createRobotsTestFailureAction}>
            <input name="companyId" type="hidden" value={selectedCompanyId} />
            <PendingSubmitButton className="secondary-action" pendingLabel="Gerando falha...">
              Gerar falha de teste
            </PendingSubmitButton>
          </form>
        </div>
      </section>

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
            Nenhuma execucao registrada ainda. Gere um evento de teste para validar a cadeia
            evento, regra e acao interna.
          </div>
        )}
      </section>
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
      <p>Catalogo inicial ja padronizado em `food.*`, `tracking.*` e `gateway.*`.</p>
      <ul>
        {Object.entries(bySource).map(([source, total]) => (
          <li key={source}>
            {source}: {total} evento(s)
          </li>
        ))}
      </ul>
      {catalog.length > 0 ? (
        <small>{catalogStatusLabels[catalog[0].status]} como status padrao inicial.</small>
      ) : null}
    </article>
  );
}

function RobotsRulesCard({
  rules,
  selectedCompanyId
}: {
  rules: RobotsRuleContract[];
  selectedCompanyId: string;
}) {
  return (
    <article className="robots-section-card">
      <div className="module-card-top">
        <span>Regras</span>
        <small>{rules.length} regra(s)</small>
      </div>
      <h2>Evento para acao</h2>
      <p>O V0 executa `internal_log` para validar a cadeia sem chamar provedores externos.</p>
      {rules.length > 0 ? (
        <ul>
          {rules.slice(0, 4).map((rule) => (
            <li key={rule.id}>
              {rule.eventCode}: {rule.actions.length} acao(oes)
            </li>
          ))}
        </ul>
      ) : (
        <form action={createRobotsTestEventAction}>
          <input name="companyId" type="hidden" value={selectedCompanyId} />
          <PendingSubmitButton className="secondary-action" pendingLabel="Criando...">
            Criar regra de teste
          </PendingSubmitButton>
        </form>
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
          <span>{eventStatusLabels[event.status]}</span>
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
          <span>{executionStatusLabels[execution.status]}</span>
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}
