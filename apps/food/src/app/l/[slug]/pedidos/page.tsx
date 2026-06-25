import Link from "next/link";
import type { ReactNode } from "react";
import type {
  FoodOrderContract,
  FoodOrderFulfillmentMethod,
  FoodOrderStatus,
  FoodPaymentStatus
} from "@fp/types";
import { trackPublicFoodOrderAction } from "@/app/actions";
import { Notice } from "@/components/page-feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PublicCustomerMenu } from "@/components/public-customer-menu";
import { getCurrentPublicStoreUser } from "@/lib/auth";
import {
  getPublicFoodMenu,
  listPublicFoodCustomerOrders
} from "@/lib/internal-api";
import {
  createFallbackPublicStoreContext,
  type PublicStoreUrlContext,
  storeLoginUrl,
  storeOrderUrl,
  storeUrl
} from "@/lib/public-store-urls";

type PublicOrdersPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    status?: string;
  }>;
};

type PublicOrderFilter = "active" | "all" | "cancelled" | "finished" | "payment_pending";

const fulfillmentLabels: Record<FoodOrderFulfillmentMethod, string> = {
  delivery: "Entrega",
  pickup: "Retirada em balcao"
};

const orderStatusLabels: Record<FoodOrderStatus, string> = {
  accepted: "Aceito",
  cancelled: "Cancelado",
  created: "Enviado",
  delivered: "Entregue",
  out_for_delivery: "Saiu para entrega",
  preparing: "Em preparo",
  ready: "Pronto"
};

const paymentStatusLabels: Record<FoodPaymentStatus, string> = {
  cancelled: "Pagamento cancelado",
  paid: "Pagamento confirmado",
  pending: "Pagamento pendente"
};

export const dynamic = "force-dynamic";

export default async function PublicOrdersPage({
  params,
  searchParams
}: PublicOrdersPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const storeContext = createFallbackPublicStoreContext(slug);
  const ordersPath = storeUrl(storeContext, "/pedidos");
  const currentUser = await getCurrentPublicStoreUser(storeContext.publicSlug);
  const activeFilter = normalizePublicOrderFilter(query?.status);

  if (!currentUser) {
    const loginHref = storeLoginUrl(storeContext, ordersPath);

    return (
      <main className="public-store public-store-message">
        <section className="public-hero">
          <div>
            <div className="eyebrow">Meus pedidos</div>
            <h1>Entre para ver seus pedidos</h1>
            <p>O historico fica protegido pelo seu login nesta loja.</p>
          </div>
          <Link className="primary-action" href={loginHref}>
            Entrar
          </Link>
        </section>
      </main>
    );
  }

  const [menuResult, ordersResult] = await Promise.all([
    getPublicFoodMenu(storeContext.publicSlug),
    listPublicFoodCustomerOrders(storeContext.publicSlug, {
      authUserId: currentUser.id,
      email: currentUser.email
    })
  ]);
  const orders = ordersResult.data?.items ?? [];
  const filteredOrders = orders.filter((order) => matchesPublicOrderFilter(order, activeFilter));

  return (
    <main className="public-store">
      <PublicCustomerMenu
        active="orders"
        contactPhone={menuResult.data?.store.contactPhone}
        isAuthenticated
        storeContext={storeContext}
      />

      {ordersResult.error ? <Notice tone="danger" message={ordersResult.error} /> : null}

      <section className="public-hero compact-public-hero">
        <div>
          <div className="eyebrow">Historico</div>
          <h1>Meus pedidos</h1>
          <p>Acompanhe pedidos feitos com seu login nesta loja e pesquise pelo numero do pedido.</p>
        </div>
        <Link className="secondary-action" href={storeUrl(storeContext)}>
          Voltar ao cardapio
        </Link>
      </section>

      <section className="public-order-lookup compact-public-order-lookup" id="acompanhar-pedido">
        <div>
          <div className="eyebrow">Acompanhamento</div>
          <h2>Pesquisar pedido</h2>
          <p>Informe o numero do pedido para abrir o detalhe e tentar pagamento novamente se necessario.</p>
        </div>
        <form action={trackPublicFoodOrderAction}>
          <input name="publicSlug" type="hidden" value={storeContext.publicSlug} />
          <input
            maxLength={40}
            name="orderNumber"
            placeholder="PED-20260616-123456"
            required
          />
          <PendingSubmitButton className="secondary-action" pendingLabel="Buscando...">
            Buscar
          </PendingSubmitButton>
        </form>
      </section>

      <section className="public-orders-panel">
        <div className="public-section-heading">
          <div>
            <div className="eyebrow">Historico</div>
            <h2>Pedidos recentes</h2>
            <p>Use os filtros para encontrar pedidos em andamento ou com pagamento pendente.</p>
          </div>
          <span>{filteredOrders.length} pedido(s)</span>
        </div>

        <nav className="status-filter-bar public-orders-filter" aria-label="Filtro dos meus pedidos">
          {publicOrderFilterOptions.map(([value, label]) => (
            <Link
              aria-current={activeFilter === value ? "page" : undefined}
              className={activeFilter === value ? "status-filter active" : "status-filter"}
              href={getPublicOrderFilterHref(storeContext, value)}
              key={value}
            >
              {label}
            </Link>
          ))}
        </nav>

        {filteredOrders.length > 0 ? (
          <>
            <div className="data-table public-orders-table" role="table" aria-label="Meus pedidos">
              <div className="data-row public-orders-row data-row-head" role="row">
                <span>Pedido</span>
                <span>Data</span>
                <span>Recebimento</span>
                <span>Total</span>
                <span>Pagamento</span>
                <span>Status</span>
                <span>Acao</span>
              </div>
              {filteredOrders.map((order) => (
                <div className="data-row public-orders-row" role="row" key={order.id}>
                  <span>
                    <strong>{order.orderNumber}</strong>
                  </span>
                  <span>{formatDateTime(order.createdAt)}</span>
                  <span>{fulfillmentLabels[order.fulfillmentMethod]}</span>
                  <span>{formatMoney(order.totalCents)}</span>
                  <span>
                    <StatusChip tone={getPaymentStatusTone(order.paymentStatus)}>
                      {paymentStatusLabels[order.paymentStatus]}
                    </StatusChip>
                  </span>
                  <span>
                    <StatusChip tone={getOrderStatusTone(order.status)}>
                      {orderStatusLabels[order.status]}
                    </StatusChip>
                  </span>
                  <span>
                    <Link
                      className="secondary-action compact-action"
                      href={storeOrderUrl(storeContext, order.orderNumber)}
                    >
                      Ver detalhe
                    </Link>
                  </span>
                </div>
              ))}
            </div>

            <div className="public-orders-mobile">
              {filteredOrders.map((order) => (
                <Link
                  className="public-order-card"
                  href={storeOrderUrl(storeContext, order.orderNumber)}
                  key={order.id}
                >
                  <div>
                    <span className="eyebrow">{formatDateTime(order.createdAt)}</span>
                    <h2>{order.orderNumber}</h2>
                    <p>{fulfillmentLabels[order.fulfillmentMethod]}</p>
                    <div className="public-order-card-statuses">
                      <StatusChip tone={getPaymentStatusTone(order.paymentStatus)}>
                        {paymentStatusLabels[order.paymentStatus]}
                      </StatusChip>
                      <StatusChip tone={getOrderStatusTone(order.status)}>
                        {orderStatusLabels[order.status]}
                      </StatusChip>
                    </div>
                  </div>
                  <strong>{formatMoney(order.totalCents)}</strong>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state public-empty-cart">
            {orders.length > 0
              ? "Nenhum pedido encontrado neste filtro."
              : "Voce ainda nao tem pedidos nesta loja."}
            <Link className="primary-action" href={storeUrl(storeContext)}>
              Ver cardapio
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

const publicOrderFilterOptions: Array<[PublicOrderFilter, string]> = [
  ["all", "Todos"],
  ["payment_pending", "Aguardando pagamento"],
  ["active", "Em andamento"],
  ["finished", "Finalizados"],
  ["cancelled", "Cancelados"]
];

function StatusChip({
  children,
  tone
}: {
  children: ReactNode;
  tone: "danger" | "neutral" | "success" | "warning";
}) {
  return <span className={`public-status-chip ${tone}`}>{children}</span>;
}

function normalizePublicOrderFilter(value: string | undefined): PublicOrderFilter {
  if (
    value === "active" ||
    value === "cancelled" ||
    value === "finished" ||
    value === "payment_pending"
  ) {
    return value;
  }

  return "all";
}

function matchesPublicOrderFilter(
  order: FoodOrderContract,
  filter: PublicOrderFilter
): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "payment_pending") {
    return order.paymentStatus === "pending";
  }

  if (filter === "cancelled") {
    return order.status === "cancelled" || order.paymentStatus === "cancelled";
  }

  if (filter === "finished") {
    return order.status === "delivered";
  }

  return (
    order.status !== "cancelled" &&
    order.status !== "delivered" &&
    order.paymentStatus !== "cancelled"
  );
}

function getPublicOrderFilterHref(
  storeContext: PublicStoreUrlContext,
  filter: PublicOrderFilter
): string {
  const path = storeUrl(storeContext, "/pedidos");

  if (filter === "all") {
    return path;
  }

  return `${path}?status=${filter}`;
}

function getPaymentStatusTone(status: FoodPaymentStatus): "danger" | "success" | "warning" {
  if (status === "paid") {
    return "success";
  }

  return status === "cancelled" ? "danger" : "warning";
}

function getOrderStatusTone(status: FoodOrderStatus): "danger" | "neutral" | "success" | "warning" {
  if (status === "cancelled") {
    return "danger";
  }

  if (status === "delivered") {
    return "success";
  }

  return status === "created" ? "warning" : "neutral";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(value / 100);
}
