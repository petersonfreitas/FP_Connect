import Link from "next/link";
import type { ReactNode } from "react";
import type {
  FoodOrderFulfillmentMethod,
  FoodOrderStatus,
  FoodPaymentStatus
} from "@fp/types";
import { Notice } from "@/components/page-feedback";
import { PublicCustomerMenu } from "@/components/public-customer-menu";
import { PublicOrderPaymentRetry } from "@/components/public-order-payment-retry";
import { getCurrentPublicStoreUser } from "@/lib/auth";
import {
  ensurePublicFoodCustomerStoreAccess,
  getPublicFoodCheckout,
  getPublicFoodOrder
} from "@/lib/internal-api";
import {
  createFallbackPublicStoreContext,
  storeOrdersUrl,
  storeUrl
} from "@/lib/public-store-urls";

type PublicOrderPageProps = {
  params: Promise<{
    orderNumber: string;
    slug: string;
  }>;
  searchParams?: Promise<{
    created?: string;
    payment?: "failed" | "paid" | "pending";
    retry?: string;
  }>;
};

const orderStatusLabels = {
  accepted: "Aceito pela loja",
  cancelled: "Cancelado",
  created: "Enviado para a loja",
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

const fulfillmentLabels: Record<FoodOrderFulfillmentMethod, string> = {
  delivery: "Entrega",
  dine_in: "Consumo no local",
  pickup: "Retirada em balcao"
};

const statusSteps = [
  ["created", "Enviado"],
  ["accepted", "Aceito"],
  ["preparing", "Preparo"],
  ["ready", "Pronto"],
  ["out_for_delivery", "Saiu para entrega"],
  ["delivered", "Entregue"]
] as const;
type StatusStep = (typeof statusSteps)[number];

export const dynamic = "force-dynamic";

export default async function PublicOrderPage({
  params,
  searchParams
}: PublicOrderPageProps) {
  const [{ orderNumber, slug }, query] = await Promise.all([params, searchParams]);
  const storeContext = createFallbackPublicStoreContext(slug);
  const [orderResult, checkoutResult, currentUser] = await Promise.all([
    getPublicFoodOrder(storeContext.publicSlug, orderNumber),
    getPublicFoodCheckout(storeContext.publicSlug),
    getCurrentPublicStoreUser(storeContext.publicSlug)
  ]);

  if (orderResult.error || !orderResult.data) {
    return (
      <main className="public-store public-store-message">
        <section className="public-hero">
          <div>
            <div className="eyebrow">FP Food</div>
            <h1>Pedido nao encontrado</h1>
            <p>{orderResult.error ?? "Nao foi possivel carregar este pedido."}</p>
          </div>
          <Link className="secondary-action" href={storeUrl(storeContext)}>
            Voltar para loja
          </Link>
        </section>
      </main>
    );
  }

  const order = orderResult.data;
  const ordersHref = storeOrdersUrl(storeContext);
  const orderDate = formatDateTime(order.createdAt);
  const visibleStatusSteps = getVisibleStatusSteps(order.fulfillmentMethod);
  const customerSessionResult = currentUser
    ? await ensurePublicFoodCustomerStoreAccess(storeContext.publicSlug, {
        authUserId: currentUser.id,
        email: currentUser.email
      })
    : null;

  return (
    <main className="public-store">
      <PublicCustomerMenu
        active="order"
        customerEmail={currentUser?.email}
        isAuthenticated={Boolean(currentUser)}
        storeContext={storeContext}
      />

      {query?.created ? (
        <Notice tone="success" message={`Pedido ${order.orderNumber} enviado para a loja.`} />
      ) : null}
      {query?.retry && query.payment === "paid" ? (
        <Notice tone="success" message="Pagamento aprovado na nova tentativa." />
      ) : null}
      {query?.payment === "failed" ? (
        <Notice
          tone="danger"
          message="Pagamento recusado. Uma nova tentativa via Gateway sera disponibilizada."
        />
      ) : null}
      {query?.payment === "pending" ? (
        <Notice
          tone="warning"
          message="Pagamento pendente. Aguarde a confirmacao do Gateway."
        />
      ) : null}
      {customerSessionResult?.error ? (
        <Notice
          tone="danger"
          message={`Nao foi possivel preparar seu cadastro nesta loja: ${customerSessionResult.error}`}
        />
      ) : null}

      <section className="public-order-header compact-public-hero">
        <div>
          <div className="eyebrow">Acompanhamento</div>
          <h1>{order.orderNumber}</h1>
          <p>{getOrderProgressMessage(order.status, order.paymentStatus)}</p>
          <div className="public-order-header-meta">
            <span>Criado em {orderDate}</span>
            <span>{order.items.length} item(ns)</span>
          </div>
          <div className="public-order-card-statuses">
            <StatusChip tone={getOrderStatusTone(order.status)}>
              {orderStatusLabels[order.status]}
            </StatusChip>
            <StatusChip tone={getPaymentStatusTone(order.paymentStatus)}>
              {paymentStatusLabels[order.paymentStatus]}
            </StatusChip>
          </div>
        </div>
        <div className="public-order-header-actions">
          <strong>{formatMoney(order.totalCents)}</strong>
          <Link className="secondary-action compact-action" href={ordersHref}>
            Meus pedidos
          </Link>
          <Link className="secondary-action compact-action" href={storeUrl(storeContext)}>
            Cardapio
          </Link>
        </div>
      </section>

      <PublicOrderPaymentRetry
        checkout={checkoutResult.data}
        isAuthenticated={Boolean(currentUser)}
        isCustomerCompleteForCheckout={
          customerSessionResult?.data?.isCompleteForCheckout ?? false
        }
        order={order}
        storeContext={storeContext}
      />

      <section className="public-order-status">
        <div className="public-section-heading plain-section-heading">
          <div>
            <div className="eyebrow">Status</div>
            <h2>Linha do pedido</h2>
            <p>O pedido so avanca para cozinha e entrega quando o pagamento estiver confirmado.</p>
          </div>
        </div>
        <div className="public-status-steps">
          {visibleStatusSteps.map(([status, label]) => (
            <div
              className={isStepActive(order.status, status) ? "status-step active" : "status-step"}
              key={status}
            >
              <span />
              <strong>{label}</strong>
            </div>
          ))}
          {order.status === "cancelled" ? (
            <div className="status-step cancelled active">
              <span />
              <strong>Cancelado</strong>
            </div>
          ) : null}
        </div>
      </section>

      <section className="public-order-detail">
        <div className="public-order-detail-grid">
          <article className="public-order-info-card">
            <div className="eyebrow">Cliente</div>
            <h2>{order.customerName ?? "Cliente nao informado"}</h2>
            {order.customerPhone ? <p>{order.customerPhone}</p> : null}
            {order.customerNote ? <p>Obs.: {order.customerNote}</p> : null}
          </article>
          <article className="public-order-info-card">
            <div className="eyebrow">Recebimento</div>
            <h2>{fulfillmentLabels[order.fulfillmentMethod]}</h2>
            <p>{getFulfillmentDescription(order.fulfillmentMethod)}</p>
            {order.deliveryAddress ? (
              <p>
                {order.deliveryAddress.street}, {order.deliveryAddress.number} -{" "}
                {order.deliveryAddress.city}/{order.deliveryAddress.state}
              </p>
            ) : null}
          </article>
          <article className="public-order-info-card">
            <div className="eyebrow">Pagamento</div>
            <h2>{paymentStatusLabels[order.paymentStatus]}</h2>
            <p>
              {order.paymentStatus === "paid"
                ? "Pagamento confirmado pelo Gateway."
                : order.paymentStatus === "pending"
                  ? "Aguardando confirmacao ou nova tentativa."
                  : "Pagamento cancelado ou recusado."}
            </p>
          </article>
          <article className="public-order-info-card public-order-total-card">
            <div className="eyebrow">Total</div>
            <strong>{formatMoney(order.totalCents)}</strong>
            <p>Subtotal: {formatMoney(order.subtotalCents)}</p>
          </article>
        </div>

        <div className="public-order-items-panel">
          <div className="public-section-heading plain-section-heading">
            <div>
              <div className="eyebrow">Itens</div>
              <h2>Resumo do pedido</h2>
            </div>
            <span>{order.items.length} item(ns)</span>
          </div>
          <div className="public-order-items">
            {order.items.map((item) => (
              <div className="public-order-item" key={item.id}>
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
        </div>
      </section>
    </main>
  );
}

function getVisibleStatusSteps(fulfillmentMethod: FoodOrderFulfillmentMethod): StatusStep[] {
  if (fulfillmentMethod === "delivery") {
    return [...statusSteps];
  }

  return statusSteps.filter(([status]) => status !== "out_for_delivery");
}

function isStepActive(currentStatus: keyof typeof orderStatusLabels, step: string): boolean {
  if (currentStatus === "cancelled") {
    return false;
  }

  const order = ["created", "accepted", "preparing", "ready", "out_for_delivery", "delivered"];
  return order.indexOf(step) <= order.indexOf(currentStatus);
}

function getFulfillmentDescription(fulfillmentMethod: FoodOrderFulfillmentMethod): string {
  if (fulfillmentMethod === "delivery") {
    return "Entrega no endereco selecionado.";
  }

  if (fulfillmentMethod === "pickup") {
    return "A loja avisara quando estiver pronto para retirada.";
  }

  return "Pedido para consumo no local.";
}

function StatusChip({
  children,
  tone
}: {
  children: ReactNode;
  tone: "danger" | "neutral" | "success" | "warning";
}) {
  return <span className={`public-status-chip ${tone}`}>{children}</span>;
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

function getOrderProgressMessage(
  status: FoodOrderStatus,
  paymentStatus: FoodPaymentStatus
): string {
  if (paymentStatus === "pending") {
    return "Pagamento pendente. O pedido fica reservado, mas nao avanca para operacao ate a confirmacao.";
  }

  if (paymentStatus === "cancelled" || status === "cancelled") {
    return "Pedido cancelado ou pagamento nao aprovado.";
  }

  if (status === "delivered") {
    return "Pedido entregue. Obrigado por comprar nesta loja.";
  }

  return "Pedido em acompanhamento pela loja.";
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
