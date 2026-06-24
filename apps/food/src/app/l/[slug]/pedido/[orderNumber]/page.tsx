import Link from "next/link";
import type { FoodPaymentStatus } from "@fp/types";
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

const statusSteps = [
  ["created", "Enviado"],
  ["accepted", "Aceito"],
  ["preparing", "Preparo"],
  ["ready", "Pronto"],
  ["out_for_delivery", "Saiu para entrega"],
  ["delivered", "Entregue"]
] as const;

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
        isAuthenticated={Boolean(currentUser)}
        orderNumber={order.orderNumber}
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
          message="Pagamento recusado. Voce pode tentar novamente com outro cartao."
        />
      ) : null}
      {query?.payment === "pending" ? (
        <Notice
          tone="warning"
          message="Pagamento pendente. Aguarde a confirmacao ou tente novamente com outro cartao."
        />
      ) : null}
      {customerSessionResult?.error ? (
        <Notice
          tone="danger"
          message={`Nao foi possivel preparar seu cadastro nesta loja: ${customerSessionResult.error}`}
        />
      ) : null}

      <section className="public-hero">
        <div>
          <div className="eyebrow">Acompanhamento</div>
          <h1>{order.orderNumber}</h1>
          <p>
            Status atual: {orderStatusLabels[order.status]} -{" "}
            {paymentStatusLabels[order.paymentStatus]}
          </p>
        </div>
        <Link className="secondary-action" href={storeUrl(storeContext)}>
          Voltar ao cardapio
        </Link>
      </section>

      <section className="public-order-status">
        <div className="public-status-steps">
          {statusSteps.map(([status, label]) => (
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
        <div className="public-order-summary">
          <div>
            <div className="eyebrow">Cliente</div>
            <h2>{order.customerName ?? "Cliente nao informado"}</h2>
            {order.customerPhone ? <p>{order.customerPhone}</p> : null}
            {order.customerNote ? <p>Obs.: {order.customerNote}</p> : null}
          </div>
          <div>
            <div className="eyebrow">Total</div>
            <strong>{formatMoney(order.totalCents)}</strong>
          </div>
        </div>

        <div className="public-order-items">
          {order.items.map((item) => (
            <div className="public-order-item" key={item.id}>
              <span>
                {item.quantity}x {item.productName}
              </span>
              <strong>{formatMoney(item.totalPriceCents)}</strong>
            </div>
          ))}
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
    </main>
  );
}

function isStepActive(currentStatus: keyof typeof orderStatusLabels, step: string): boolean {
  if (currentStatus === "cancelled") {
    return false;
  }

  const order = ["created", "accepted", "preparing", "ready", "out_for_delivery", "delivered"];
  return order.indexOf(step) <= order.indexOf(currentStatus);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(value / 100);
}
