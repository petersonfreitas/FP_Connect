import Link from "next/link";
import type { FoodOrderContract, FoodOrderStatus, FoodPaymentStatus } from "@fp/types";
import { CompanySwitcher } from "@/components/company-switcher";
import { formatMoney } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { OrderAutoRefresh } from "@/components/order-auto-refresh";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { updateFoodOrderStatusAction } from "@/app/actions";
import { getFoodPageContext } from "@/lib/food-context";
import { getFoodAccess, listFoodOrders } from "@/lib/internal-api";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { canAdvanceFoodOrderOperationally } from "@/lib/food-order-rules";

type OrdersPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    orderUpdated?: string;
    page?: string;
    status?: string;
  }>;
};

export const dynamic = "force-dynamic";
const pageSize = 20;

const orderStatusLabels = {
  accepted: "Aceito",
  cancelled: "Cancelado",
  created: "Criado",
  delivered: "Entregue",
  out_for_delivery: "Saiu para entrega",
  preparing: "Em preparo",
  ready: "Pronto"
};

const paymentStatusLabels: Record<FoodPaymentStatus, string> = {
  cancelled: "Pagamento cancelado",
  paid: "Pago",
  pending: "Pagamento pendente"
};

const orderStatusOptions = [
  ["created", "Criado"],
  ["accepted", "Aceito"],
  ["preparing", "Em preparo"],
  ["ready", "Pronto"],
  ["out_for_delivery", "Saiu para entrega"],
  ["delivered", "Entregue"],
  ["cancelled", "Cancelado"]
] as const;

const orderFilterOptions = [
  ["", "Todos"],
  ["created", "Criado"],
  ["accepted", "Aceito"],
  ["preparing", "Em preparo"],
  ["ready", "Pronto"],
  ["out_for_delivery", "Saiu para entrega"],
  ["delivered", "Entregue"],
  ["cancelled", "Cancelado"]
] as const;

const quickStatusOptions: Record<FoodOrderStatus, Array<[FoodOrderStatus, string]>> = {
  accepted: [
    ["preparing", "Preparar"],
    ["ready", "Pronto"],
    ["cancelled", "Cancelar"]
  ],
  cancelled: [],
  created: [
    ["accepted", "Aceitar"],
    ["preparing", "Preparar"],
    ["cancelled", "Cancelar"]
  ],
  delivered: [],
  out_for_delivery: [
    ["delivered", "Entregue"],
    ["cancelled", "Cancelar"]
  ],
  preparing: [
    ["ready", "Pronto"],
    ["cancelled", "Cancelar"]
  ],
  ready: [
    ["out_for_delivery", "Saiu para entrega"],
    ["delivered", "Entregue"],
    ["cancelled", "Cancelar"]
  ]
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const page = normalizePage(params?.page);
  const statusFilter = normalizeOrderStatusFilter(params?.status);
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const ordersResult =
    selectedCompany && !foodAccessResult.error
      ? await listFoodOrders(selectedCompany.company.id, { page, pageSize, status: statusFilter })
      : { data: null, error: null };
  const pagination = ordersResult.data;
  const orders = pagination?.items ?? [];
  const serviceHref = selectedCompany
    ? `/movimentacao/atendimento?companyId=${selectedCompany.company.id}`
    : "/movimentacao/atendimento";

  return (
    <FoodShell activePath="/movimentacao/pedidos">
      <header className="topbar">
        <div>
          <div className="eyebrow">Movimentacao</div>
          <strong>Pedidos internos</strong>
        </div>
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
      {ordersResult.error ? <Notice tone="danger" message={ordersResult.error} /> : null}
      {params?.error ? <Notice tone="danger" message={params.error} /> : null}
      {params?.orderUpdated ? <Notice tone="success" message="Status do pedido atualizado." /> : null}

      <CompanySwitcher
        basePath="/movimentacao/pedidos"
        companies={context.foodCompanies}
        selectedCompanyId={selectedCompany?.company.id}
      />

      {!selectedCompany ? (
        <EmptyFoodAccess />
      ) : (
        <>
          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Pedidos criados</h1>
                <p>Acompanhe pedidos existentes, filtre por status e avance o fluxo operacional.</p>
              </div>
              <div className="panel-heading-actions">
                <OrderAutoRefresh intervalSeconds={30} />
                <span>{pagination?.total ?? 0} registro(s)</span>
                <Link className="primary-action compact-action" href={serviceHref}>
                  Novo atendimento
                </Link>
              </div>
            </div>

            <nav className="status-filter-bar" aria-label="Filtro de status dos pedidos">
              {orderFilterOptions.map(([value, label]) => (
                <Link
                  className={value === (statusFilter ?? "") ? "status-filter active" : "status-filter"}
                  href={getStatusFilterHref(selectedCompany.company.id, value)}
                  key={value || "all"}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {orders.length > 0 ? (
              <div className="order-list">
                {orders.map((order) => {
                  const statusOptions = getOrderStatusOptions(order);
                  const quickActions = getQuickStatusOptions(order);
                  const paymentCleared = isOrderPaymentCleared(order);

                  return (
                    <article className="order-card" key={order.id}>
                      <div className="order-card-heading">
                        <div>
                          <strong>{order.orderNumber}</strong>
                          <small>
                            {order.customerName ?? "Cliente nao informado"} -{" "}
                            {new Date(order.createdAt).toLocaleString("pt-BR")}
                          </small>
                          <small>{paymentStatusLabels[order.paymentStatus]}</small>
                          {!paymentCleared ? (
                            <small>Fluxo operacional bloqueado ate confirmacao do pagamento.</small>
                          ) : null}
                        </div>
                        <span>{orderStatusLabels[order.status]}</span>
                      </div>

                      <div className="order-items">
                        {order.items.map((item) => (
                          <div className="order-item-row" key={item.id}>
                            <span>
                              {item.quantity}x {item.productName}
                              {item.itemNote ? (
                                <small className="public-item-note">Obs.: {item.itemNote}</small>
                              ) : null}
                            </span>
                            <strong>{formatMoney(item.totalPriceCents)}</strong>
                          </div>
                        ))}
                      </div>

                      <form action={updateFoodOrderStatusAction} className="order-status-form">
                        <input name="companyId" type="hidden" value={selectedCompany.company.id} />
                        <input name="orderId" type="hidden" value={order.id} />
                        <input name="statusFilter" type="hidden" value={statusFilter ?? ""} />
                        <strong>Total: {formatMoney(order.totalCents)}</strong>
                        <select defaultValue={order.status} name="status">
                          {statusOptions.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <PendingSubmitButton
                          className="secondary-action compact-action"
                          pendingLabel="Salvando..."
                        >
                          Atualizar
                        </PendingSubmitButton>
                      </form>

                      {quickActions.length > 0 ? (
                        <div className="quick-status-actions">
                          {quickActions.map(([status, label]) => (
                            <form action={updateFoodOrderStatusAction} key={status}>
                              <input name="companyId" type="hidden" value={selectedCompany.company.id} />
                              <input name="orderId" type="hidden" value={order.id} />
                              <input name="status" type="hidden" value={status} />
                              <input name="statusFilter" type="hidden" value={statusFilter ?? ""} />
                              <PendingSubmitButton
                                className={
                                  status === "cancelled"
                                    ? "secondary-action compact-action danger-action"
                                    : "secondary-action compact-action"
                                }
                                pendingLabel="Salvando..."
                              >
                                {label}
                              </PendingSubmitButton>
                            </form>
                          ))}
                        </div>
                      ) : null}

                      <div className="order-card-footer">
                        <Link
                          className="secondary-action compact-action"
                          href={`/movimentacao/pedidos/${order.id}?companyId=${selectedCompany.company.id}`}
                        >
                          Ver detalhes
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">Nenhum pedido encontrado para este filtro.</div>
            )}

            {pagination ? (
              <PaginationControls
                basePath="/movimentacao/pedidos"
                page={pagination.page}
                pageSize={pagination.pageSize}
                params={{ companyId: selectedCompany.company.id, status: statusFilter }}
                total={pagination.total}
                totalPages={pagination.totalPages}
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

function isOrderPaymentCleared(order: FoodOrderContract): boolean {
  return canAdvanceFoodOrderOperationally(order);
}

function getOrderStatusOptions(
  order: FoodOrderContract
): ReadonlyArray<readonly [FoodOrderStatus, string]> {
  if (isOrderPaymentCleared(order)) {
    return orderStatusOptions;
  }

  return orderStatusOptions.filter(
    ([status]) => status === order.status || status === "created" || status === "cancelled"
  );
}

function getQuickStatusOptions(order: FoodOrderContract): Array<[FoodOrderStatus, string]> {
  if (isOrderPaymentCleared(order)) {
    return quickStatusOptions[order.status];
  }

  return order.status === "cancelled" ? [] : [["cancelled", "Cancelar"]];
}

function normalizeOrderStatusFilter(value: string | undefined): FoodOrderStatus | undefined {
  if (
    value === "accepted" ||
    value === "cancelled" ||
    value === "created" ||
    value === "delivered" ||
    value === "out_for_delivery" ||
    value === "preparing" ||
    value === "ready"
  ) {
    return value;
  }

  return undefined;
}

function getStatusFilterHref(companyId: string, status: string): string {
  const params = new URLSearchParams({
    companyId
  });

  if (status) {
    params.set("status", status);
  }

  return `/movimentacao/pedidos?${params.toString()}`;
}
