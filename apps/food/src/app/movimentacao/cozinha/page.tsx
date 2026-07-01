import type {
  FoodOrderContract,
  FoodOrderItemContract,
  FoodOrderItemStatus,
  FoodOrderStatus
} from "@fp/types";
import Link from "next/link";
import { CompanySwitcher } from "@/components/company-switcher";
import { formatMoney } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { OrderStatusActions } from "@/components/order-status-actions";
import { OrderAutoRefresh } from "@/components/order-auto-refresh";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { getFoodPageContext } from "@/lib/food-context";
import { canAdvanceFoodOrderOperationally } from "@/lib/food-order-rules";
import { getFoodAccess, listFoodOrders } from "@/lib/internal-api";

type KitchenPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    orderUpdated?: string;
  }>;
};

export const dynamic = "force-dynamic";
const pageSize = 50;

export default async function KitchenPage({ searchParams }: KitchenPageProps) {
  const params = await searchParams;
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const [acceptedResult, preparingResult] =
    selectedCompany && !foodAccessResult.error
      ? await Promise.all([
          listFoodOrders(selectedCompany.company.id, {
            page: 1,
            pageSize,
            status: "accepted"
          }),
          listFoodOrders(selectedCompany.company.id, {
            page: 1,
            pageSize,
            status: "preparing"
          })
        ])
      : [{ data: null, error: null }, { data: null, error: null }];
  const acceptedOrders = (acceptedResult.data?.items ?? []).filter((order) =>
    isKitchenOrderVisible(order, "pending")
  );
  const preparingOrders = (preparingResult.data?.items ?? []).filter((order) =>
    isKitchenOrderVisible(order, "preparing")
  );

  return (
    <FoodShell activePath="/movimentacao/cozinha">
      <header className="topbar">
        <div>
          <div className="eyebrow">Movimentacao</div>
          <strong>Cozinha</strong>
        </div>
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
      {acceptedResult.error ? <Notice tone="danger" message={acceptedResult.error} /> : null}
      {preparingResult.error ? <Notice tone="danger" message={preparingResult.error} /> : null}
      {params?.error ? <Notice tone="danger" message={params.error} /> : null}
      {params?.orderUpdated ? <Notice tone="success" message="Status do pedido atualizado." /> : null}

      <CompanySwitcher
        basePath="/movimentacao/cozinha"
        companies={context.foodCompanies}
        selectedCompanyId={selectedCompany?.company.id}
      />

      {!selectedCompany ? (
        <EmptyFoodAccess />
      ) : (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>Painel de preparo</h1>
              <p>Pedidos aceitos entram na fila da cozinha e podem ser marcados como em preparo ou prontos.</p>
            </div>
            <div className="panel-heading-actions">
              <OrderAutoRefresh intervalSeconds={30} refreshOnFocus refreshOnMount />
              <span>
                {acceptedOrders.length + preparingOrders.length} pedido(s) em producao
              </span>
            </div>
          </div>

          <div className="kitchen-board">
            <KitchenColumn
              companyId={selectedCompany.company.id}
              emptyMessage="Nenhum pedido aceito aguardando preparo."
              orders={acceptedOrders}
              title="Aceitos"
              actions={[
                ["preparing", "Iniciar preparo"],
                ["cancelled", "Cancelar"]
              ]}
              itemStatus="pending"
            />
            <KitchenColumn
              companyId={selectedCompany.company.id}
              emptyMessage="Nenhum pedido em preparo."
              orders={preparingOrders}
              title="Em preparo"
              actions={[
                ["ready", "Marcar pronto"],
                ["cancelled", "Cancelar"]
              ]}
              itemStatus="preparing"
            />
          </div>
        </section>
      )}
    </FoodShell>
  );
}

function isKitchenOrderVisible(
  order: FoodOrderContract,
  itemStatus: FoodOrderItemStatus
): boolean {
  return canAdvanceFoodOrderOperationally(order) && getKitchenItems(order, itemStatus).length > 0;
}

function KitchenColumn({
  actions,
  companyId,
  emptyMessage,
  itemStatus,
  orders,
  title
}: {
  actions: Array<[FoodOrderStatus, string]>;
  companyId: string;
  emptyMessage: string;
  itemStatus: FoodOrderItemStatus;
  orders: FoodOrderContract[];
  title: string;
}) {
  return (
    <div className="kitchen-column">
      <div className="kitchen-column-heading">
        <h2>{title}</h2>
        <span>{orders.length}</span>
      </div>

      {orders.length > 0 ? (
        <div className="kitchen-order-list">
          {orders.map((order) => {
            const kitchenItems = getKitchenItems(order, itemStatus);

            return (
              <article className="order-card kitchen-order-card" key={order.id}>
                <div className="order-card-heading">
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <small>
                      {order.customerName ?? "Cliente nao informado"} -{" "}
                      {new Date(order.createdAt).toLocaleTimeString("pt-BR")}
                    </small>
                    <small>{kitchenItems.length} item(ns) para preparo</small>
                  </div>
                  <span>{formatMoney(order.totalCents)}</span>
                </div>

                <div className="order-items">
                  {kitchenItems.map((item) => (
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

                <div className="kitchen-card-actions">
                  <Link
                    className="secondary-action compact-action"
                    href={`/movimentacao/pedidos/${order.id}/imprimir?companyId=${companyId}&mode=kitchen&itemStatus=${itemStatus}`}
                    target="_blank"
                  >
                    Imprimir cozinha
                  </Link>
                  <OrderStatusActions actions={actions} companyId={companyId} orderId={order.id} />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state kitchen-empty">{emptyMessage}</div>
      )}
    </div>
  );
}

function getKitchenItems(
  order: FoodOrderContract,
  itemStatus: FoodOrderItemStatus
): FoodOrderItemContract[] {
  return order.items.filter(
    (item) => item.kitchenRequired && item.itemStatus === itemStatus
  );
}
