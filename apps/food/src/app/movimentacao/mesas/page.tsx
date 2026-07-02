import type {
  FoodDiningTableContract,
  FoodDiningTableStatus,
  FoodTableSessionContract,
  FoodTableSessionStatus
} from "@fp/types";
import {
  openFoodTableSessionAction,
  saveFoodDiningTableAction,
  updateFoodTableSessionStatusAction
} from "@/app/actions";
import { CompanySwitcher } from "@/components/company-switcher";
import { FoodShell } from "@/components/food-shell";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { getFoodPageContext } from "@/lib/food-context";
import {
  getFoodAccess,
  listFoodDiningTables,
  listFoodTableSessions
} from "@/lib/internal-api";

type TablesPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    page?: string;
    sessionOpened?: string;
    sessionUpdated?: string;
    tableCreated?: string;
    tableUpdated?: string;
  }>;
};

export const dynamic = "force-dynamic";
const pageSize = 20;

const diningTableStatusLabels: Record<FoodDiningTableStatus, string> = {
  available: "Livre",
  awaiting_payment: "Aguardando pagamento",
  inactive: "Inativa",
  occupied: "Ocupada"
};

const tableSessionStatusLabels: Record<FoodTableSessionStatus, string> = {
  awaiting_payment: "Aguardando pagamento",
  cancelled: "Cancelada",
  closed: "Fechada",
  open: "Aberta"
};

const tableSessionActions: Partial<
  Record<FoodTableSessionStatus, Array<[FoodTableSessionStatus, string]>>
> = {
  awaiting_payment: [
    ["closed", "Fechar"],
    ["open", "Reabrir"],
    ["cancelled", "Cancelar"]
  ],
  open: [
    ["awaiting_payment", "Pagamento"],
    ["cancelled", "Cancelar"]
  ]
};

export default async function TablesPage({ searchParams }: TablesPageProps) {
  const params = await searchParams;
  const page = normalizePage(params?.page);
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const [tablesResult, openSessionsResult, paymentSessionsResult, recentSessionsResult] =
    selectedCompany && !foodAccessResult.error
      ? await Promise.all([
          listFoodDiningTables(selectedCompany.company.id),
          listFoodTableSessions(selectedCompany.company.id, {
            page: 1,
            pageSize: 100,
            status: "open"
          }),
          listFoodTableSessions(selectedCompany.company.id, {
            page: 1,
            pageSize: 100,
            status: "awaiting_payment"
          }),
          listFoodTableSessions(selectedCompany.company.id, { page, pageSize })
        ])
      : [
          { data: null, error: null },
          { data: null, error: null },
          { data: null, error: null },
          { data: null, error: null }
        ];
  const tables = tablesResult.data ?? [];
  const activeSessions = [
    ...(openSessionsResult.data?.items ?? []),
    ...(paymentSessionsResult.data?.items ?? [])
  ];
  const activeSessionByTableId = new Map(
    activeSessions.map((session) => [session.diningTableId, session])
  );
  const recentSessions = recentSessionsResult.data?.items ?? [];

  return (
    <FoodShell activePath="/movimentacao/mesas">
      <header className="topbar">
        <div>
          <div className="eyebrow">Movimentacao</div>
          <strong>Mesas e comandas</strong>
        </div>
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
      {tablesResult.error ? <Notice tone="danger" message={tablesResult.error} /> : null}
      {openSessionsResult.error ? <Notice tone="danger" message={openSessionsResult.error} /> : null}
      {paymentSessionsResult.error ? (
        <Notice tone="danger" message={paymentSessionsResult.error} />
      ) : null}
      {recentSessionsResult.error ? (
        <Notice tone="danger" message={recentSessionsResult.error} />
      ) : null}
      {params?.error ? <Notice tone="danger" message={params.error} /> : null}
      {params?.tableCreated ? <Notice tone="success" message="Mesa cadastrada." /> : null}
      {params?.tableUpdated ? <Notice tone="success" message="Mesa atualizada." /> : null}
      {params?.sessionOpened ? <Notice tone="success" message="Comanda aberta." /> : null}
      {params?.sessionUpdated ? <Notice tone="success" message="Comanda atualizada." /> : null}

      <CompanySwitcher
        basePath="/movimentacao/mesas"
        companies={context.foodCompanies}
        selectedCompanyId={selectedCompany?.company.id}
      />

      {!selectedCompany ? (
        <EmptyFoodAccess />
      ) : (
        <>
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Mapa operacional</div>
                <h1>Mesas</h1>
                <p>
                  Cadastre mesas, abra comandas e acompanhe quais estao livres, ocupadas ou em
                  pagamento.
                </p>
              </div>
              <div className="panel-heading-actions">
                <span>{tables.length} mesa(s)</span>
                <span>{activeSessions.length} comanda(s) ativa(s)</span>
              </div>
            </div>

            <form action={saveFoodDiningTableAction} className="table-create-form">
              <input name="companyId" type="hidden" value={selectedCompany.company.id} />
              <label>
                Nome da mesa
                <input maxLength={80} name="displayName" placeholder="Mesa 01" required />
              </label>
              <label>
                Ordem
                <input min={0} name="sortOrder" placeholder="100" type="number" />
              </label>
              <label>
                Status inicial
                <select name="status">
                  <option value="available">Livre</option>
                  <option value="inactive">Inativa</option>
                </select>
              </label>
              <PendingSubmitButton pendingLabel="Criando...">Criar mesa</PendingSubmitButton>
            </form>

            {tables.length > 0 ? (
              <div className="dining-table-grid">
                {tables.map((table) => {
                  const activeSession = activeSessionByTableId.get(table.id);
                  const status = getEffectiveTableStatus(table, activeSession);

                  return (
                    <article className="dining-table-card" key={table.id}>
                      <div className="dining-table-card-heading">
                        <div>
                          <span className="eyebrow">Mesa</span>
                          <strong>{table.displayName}</strong>
                          <small>Ordem {table.sortOrder}</small>
                        </div>
                        <span className={getDiningTableStatusClass(status)}>
                          {diningTableStatusLabels[status]}
                        </span>
                      </div>

                      {activeSession ? (
                        <div className="table-session-summary">
                          <span>{activeSession.sessionNumber}</span>
                          <strong>{tableSessionStatusLabels[activeSession.status]}</strong>
                          <small>
                            {activeSession.customerName ?? "Cliente nao informado"} -{" "}
                            {formatDateTime(activeSession.openedAt)}
                          </small>
                          {activeSession.customerNote ? (
                            <small>Obs.: {activeSession.customerNote}</small>
                          ) : null}
                        </div>
                      ) : (
                        <p className="muted-copy">Sem comanda ativa.</p>
                      )}

                      {activeSession ? (
                        <div className="table-action-list">
                          {(tableSessionActions[activeSession.status] ?? []).map(
                            ([nextStatus, label]) => (
                              <form action={updateFoodTableSessionStatusAction} key={nextStatus}>
                                <input
                                  name="companyId"
                                  type="hidden"
                                  value={selectedCompany.company.id}
                                />
                                <input name="sessionId" type="hidden" value={activeSession.id} />
                                <input name="status" type="hidden" value={nextStatus} />
                                <PendingSubmitButton
                                  className={
                                    nextStatus === "cancelled"
                                      ? "secondary-action compact-action danger-action"
                                      : "secondary-action compact-action"
                                  }
                                  pendingLabel="Salvando..."
                                >
                                  {label}
                                </PendingSubmitButton>
                              </form>
                            )
                          )}
                        </div>
                      ) : table.status !== "inactive" ? (
                        <details className="table-inline-details">
                          <summary>Abrir comanda</summary>
                          <form action={openFoodTableSessionAction} className="table-session-form">
                            <input
                              name="companyId"
                              type="hidden"
                              value={selectedCompany.company.id}
                            />
                            <input name="diningTableId" type="hidden" value={table.id} />
                            <label>
                              Cliente
                              <input maxLength={120} name="customerName" placeholder="Opcional" />
                            </label>
                            <label>
                              Telefone
                              <input maxLength={40} name="customerPhone" placeholder="Opcional" />
                            </label>
                            <label className="span-2">
                              Observacao
                              <textarea
                                maxLength={600}
                                name="customerNote"
                                placeholder="Ex.: aniversario, atendimento especial"
                              />
                            </label>
                            <PendingSubmitButton pendingLabel="Abrindo...">
                              Abrir comanda
                            </PendingSubmitButton>
                          </form>
                        </details>
                      ) : null}

                      <details className="table-inline-details">
                        <summary>Editar mesa</summary>
                        <form action={saveFoodDiningTableAction} className="table-session-form">
                          <input
                            name="companyId"
                            type="hidden"
                            value={selectedCompany.company.id}
                          />
                          <input name="tableId" type="hidden" value={table.id} />
                          <label>
                            Nome
                            <input
                              defaultValue={table.displayName}
                              maxLength={80}
                              name="displayName"
                              required
                            />
                          </label>
                          <label>
                            Ordem
                            <input
                              defaultValue={table.sortOrder}
                              min={0}
                              name="sortOrder"
                              type="number"
                            />
                          </label>
                          <label className="span-2">
                            Status
                            <select defaultValue={table.status} name="status">
                              <option value="available">Livre</option>
                              <option value="occupied">Ocupada</option>
                              <option value="awaiting_payment">Aguardando pagamento</option>
                              <option value="inactive">Inativa</option>
                            </select>
                          </label>
                          <PendingSubmitButton pendingLabel="Salvando...">
                            Salvar mesa
                          </PendingSubmitButton>
                        </form>
                      </details>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">Nenhuma mesa cadastrada ainda.</div>
            )}
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Comandas recentes</h1>
                <p>Historico operacional das sessoes abertas, fechadas ou canceladas.</p>
              </div>
              <span>{recentSessionsResult.data?.total ?? 0} registro(s)</span>
            </div>

            {recentSessions.length > 0 ? (
              <div className="data-table" role="table" aria-label="Comandas recentes">
                <div className="data-row table-sessions-row data-row-head" role="row">
                  <span>Comanda</span>
                  <span>Mesa</span>
                  <span>Status</span>
                  <span>Cliente</span>
                  <span>Abertura</span>
                  <span>Fechamento</span>
                </div>
                {recentSessions.map((session) => (
                  <div className="data-row table-sessions-row" role="row" key={session.id}>
                    <span>
                      <strong>{session.sessionNumber}</strong>
                      {session.customerNote ? <small>{session.customerNote}</small> : null}
                    </span>
                    <span>{session.diningTable?.displayName ?? "Mesa removida"}</span>
                    <span className={getTableSessionStatusClass(session.status)}>
                      {tableSessionStatusLabels[session.status]}
                    </span>
                    <span>{session.customerName ?? "Nao informado"}</span>
                    <span>{formatDateTime(session.openedAt)}</span>
                    <span>{session.closedAt ? formatDateTime(session.closedAt) : "-"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Nenhuma comanda registrada ainda.</div>
            )}

            {recentSessionsResult.data ? (
              <PaginationControls
                basePath="/movimentacao/mesas"
                page={recentSessionsResult.data.page}
                pageSize={recentSessionsResult.data.pageSize}
                params={{ companyId: selectedCompany.company.id }}
                total={recentSessionsResult.data.total}
                totalPages={recentSessionsResult.data.totalPages}
              />
            ) : null}
          </section>
        </>
      )}
    </FoodShell>
  );
}

function normalizePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getEffectiveTableStatus(
  table: FoodDiningTableContract,
  session: FoodTableSessionContract | undefined
): FoodDiningTableStatus {
  if (!session) {
    return table.status;
  }

  return session.status === "awaiting_payment" ? "awaiting_payment" : "occupied";
}

function getDiningTableStatusClass(status: FoodDiningTableStatus): string {
  return `status-chip table-status-${status.replace(/_/g, "-")}`;
}

function getTableSessionStatusClass(status: FoodTableSessionStatus): string {
  return `status-chip session-status-${status.replace(/_/g, "-")}`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
