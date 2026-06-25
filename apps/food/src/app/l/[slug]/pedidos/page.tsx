import Link from "next/link";
import type { FoodOrderFulfillmentMethod, FoodOrderStatus, FoodPaymentStatus } from "@fp/types";
import { Notice } from "@/components/page-feedback";
import { PublicCustomerMenu } from "@/components/public-customer-menu";
import { getCurrentPublicStoreUser } from "@/lib/auth";
import {
  getPublicFoodMenu,
  listPublicFoodCustomerOrders
} from "@/lib/internal-api";
import {
  createFallbackPublicStoreContext,
  storeLoginUrl,
  storeOrderUrl,
  storeUrl
} from "@/lib/public-store-urls";

type PublicOrdersPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

export default async function PublicOrdersPage({ params }: PublicOrdersPageProps) {
  const { slug } = await params;
  const storeContext = createFallbackPublicStoreContext(slug);
  const ordersPath = storeUrl(storeContext, "/pedidos");
  const currentUser = await getCurrentPublicStoreUser(storeContext.publicSlug);

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
          <p>Acompanhe pedidos feitos com seu login nesta loja.</p>
        </div>
        <Link className="secondary-action" href={storeUrl(storeContext)}>
          Voltar ao cardapio
        </Link>
      </section>

      <section className="public-orders-panel">
        {orders.length > 0 ? (
          <div className="public-orders-list">
            {orders.map((order) => (
              <Link
                className="public-order-card"
                href={storeOrderUrl(storeContext, order.orderNumber)}
                key={order.id}
              >
                <div>
                  <span className="eyebrow">{formatDateTime(order.createdAt)}</span>
                  <h2>{order.orderNumber}</h2>
                  <p>
                    {orderStatusLabels[order.status]} -{" "}
                    {paymentStatusLabels[order.paymentStatus]}
                  </p>
                  <small>{fulfillmentLabels[order.fulfillmentMethod]}</small>
                </div>
                <strong>{formatMoney(order.totalCents)}</strong>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state public-empty-cart">
            Voce ainda nao tem pedidos nesta loja.
            <Link className="primary-action" href={storeUrl(storeContext)}>
              Ver cardapio
            </Link>
          </div>
        )}
      </section>
    </main>
  );
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
