import Link from "next/link";
import type {
  FoodOrderContract,
  FoodOrderFulfillmentMethod,
  FoodOrderStatus,
  FoodPaymentStatus
} from "@fp/types";
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
import {
  canAdvanceFoodOrderOperationally,
  getFoodOrderOrigin,
  isInternalManualFoodOrder,
  type FoodOrderOrigin
} from "@/lib/food-order-rules";

type OrdersPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    orderUpdated?: string;
    page?: string;
    scope?: string;
    status?: string;
  }>;
};

export const dynamic = "force-dynamic";
const pageSize = 20;
type OrderScope = "collectable";
type OrderFilterOption = {
  key: string;
  label: string;
  scope?: OrderScope;
  status?: FoodOrderStatus;
};

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

const fulfillmentLabels: Record<FoodOrderFulfillmentMethod, string> = {
  delivery: "Entrega",
  dine_in: "Local",
  pickup: "Retirada"
};

const orderFilterOptions: OrderFilterOption[] = [
  { key: "active", label: "Ativos" },
  { key: "collectable", label: "A cobrar", scope: "collectable" },
  { key: "created", label: "Criado", status: "created" },
  { key: "accepted", label: "Aceito", status: "accepted" },
  { key: "preparing", label: "Em preparo", status: "preparing" },
  { key: "ready", label: "Pronto", status: "ready" },
  { key: "out_for_delivery", label: "Saiu para entrega", status: "out_for_delivery" },
  { key: "delivered", label: "Entregue", status: "delivered" },
  { key: "cancelled", label: "Cancelado", status: "cancelled" }
];

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
  const orderScope = normalizeOrderScope(params?.scope);
  const statusFilter = orderScope ? undefined : normalizeOrderStatusFilter(params?.status);
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const ordersResult =
    selectedCompany && !foodAccessResult.error
      ? await listFoodOrders(selectedCompany.company.id, {
          activeOnly: !statusFilter && !orderScope,
          collectableOnly: orderScope === "collectable",
          page,
          pageSize,
          status: statusFilter
        })
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
              {orderFilterOptions.map((option) => (
                <Link
                  className={
                    isOrderFilterActive(option, statusFilter, orderScope)
                      ? "status-filter active"
                      : "status-filter"
                  }
                  href={getStatusFilterHref(selectedCompany.company.id, option)}
                  key={option.key}
                >
                  {option.label}
                </Link>
              ))}
            </nav>

            {orders.length > 0 ? (
              <div className="order-list">
                {orders.map((order) => {
                  const quickActions = getQuickStatusOptions(order);
                  const paymentCleared = isOrderPaymentCleared(order);
                  const origin = getFoodOrderOrigin(order);
                  const collectable = isCounterOrderPendingPayment(order);

                  return (
                    <article className="order-card" key={order.id}>
                      <div className="order-card-heading">
                        <div>
                          <strong>{order.orderNumber}</strong>
                          <small>
                            {order.customerName ?? "Cliente nao informado"} -{" "}
                            {new Date(order.createdAt).toLocaleString("pt-BR")}
                          </small>
                          {!paymentCleared ? (
                            <small>Fluxo operacional bloqueado ate confirmacao do pagamento.</small>
                          ) : null}
                        </div>
                        <div className="order-card-badges" aria-label="Resumo do pedido">
                          <span className={getOriginBadgeClass(origin)}>
                            {origin === "counter" ? "Balcao" : "Online"}
                          </span>
                          <span className={getFulfillmentBadgeClass(order.fulfillmentMethod)}>
                            {fulfillmentLabels[order.fulfillmentMethod]}
                          </span>
                          <span className={getStatusBadgeClass(order.status)}>
                            {orderStatusLabels[order.status]}
                          </span>
                          <span className={getPaymentBadgeClass(order.paymentStatus)}>
                            {paymentStatusLabels[order.paymentStatus]}
                          </span>
                        </div>
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

                      <div className="order-card-total">
                        <strong>Total: {formatMoney(order.totalCents)}</strong>
                      </div>

                      {quickActions.length > 0 || collectable ? (
                        <div className="quick-status-actions">
                          {collectable ? (
                            <Link
                              className="primary-action compact-action"
                              href={`/movimentacao/pedidos/${order.id}?companyId=${selectedCompany.company.id}&collect=1`}
                            >
                              Cobrar
                            </Link>
                          ) : null}
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
                params={{
                  companyId: selectedCompany.company.id,
                  scope: orderScope,
                  status: statusFilter
                }}
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

function getQuickStatusOptions(order: FoodOrderContract): Array<[FoodOrderStatus, string]> {
  if (isOrderPaymentCleared(order)) {
    const options = quickStatusOptions[order.status];
    const filteredOptions = isCounterOrderPendingPayment(order)
      ? options.filter(([status]) => status !== "delivered")
      : options;

    if (order.fulfillmentMethod !== "delivery") {
      return filteredOptions
        .filter(([status]) => status !== "out_for_delivery")
        .map(([status, label]) => [status, status === "delivered" ? "Finalizar" : label]);
    }

    return filteredOptions;
  }

  return order.status === "cancelled" ? [] : [["cancelled", "Cancelar"]];
}

function isCounterOrderPendingPayment(order: FoodOrderContract): boolean {
  return (
    isInternalManualFoodOrder(order) &&
    order.paymentStatus === "pending" &&
    (order.status === "ready" || order.status === "out_for_delivery")
  );
}

function getOriginBadgeClass(origin: FoodOrderOrigin): string {
  return `status-chip origin-${origin}`;
}

function getPaymentBadgeClass(status: FoodPaymentStatus): string {
  return `status-chip payment-${status}`;
}

function getFulfillmentBadgeClass(method: FoodOrderFulfillmentMethod): string {
  return `status-chip fulfillment-${method.replaceAll("_", "-")}`;
}

function getStatusBadgeClass(status: FoodOrderStatus): string {
  return `status-chip order-status-${status.replaceAll("_", "-")}`;
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

function normalizeOrderScope(value: string | undefined): OrderScope | undefined {
  return value === "collectable" ? value : undefined;
}

function isOrderFilterActive(
  option: OrderFilterOption,
  statusFilter: FoodOrderStatus | undefined,
  orderScope: OrderScope | undefined
): boolean {
  if (option.scope) {
    return option.scope === orderScope;
  }

  if (option.status) {
    return option.status === statusFilter && !orderScope;
  }

  return !statusFilter && !orderScope;
}

function getStatusFilterHref(companyId: string, option: OrderFilterOption): string {
  const params = new URLSearchParams({
    companyId
  });

  if (option.status) {
    params.set("status", option.status);
  }

  if (option.scope) {
    params.set("scope", option.scope);
  }

  return `/movimentacao/pedidos?${params.toString()}`;
}
