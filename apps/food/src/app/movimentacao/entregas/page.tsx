import type { FoodOrderContract, FoodOrderStatus } from "@fp/types";
import { CompanySwitcher } from "@/components/company-switcher";
import { formatMoney } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { OrderAutoRefresh } from "@/components/order-auto-refresh";
import { OrderStatusActions } from "@/components/order-status-actions";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { getFoodPageContext } from "@/lib/food-context";
import { canAdvanceFoodOrderOperationally } from "@/lib/food-order-rules";
import { getFoodAccess, listFoodOrders } from "@/lib/internal-api";

type DeliveryPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    orderUpdated?: string;
  }>;
};

export const dynamic = "force-dynamic";
const pageSize = 50;

export default async function DeliveryPage({ searchParams }: DeliveryPageProps) {
  const params = await searchParams;
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const [readyResult, outForDeliveryResult] =
    selectedCompany && !foodAccessResult.error
      ? await Promise.all([
          listFoodOrders(selectedCompany.company.id, {
            page: 1,
            pageSize,
            status: "ready"
          }),
          listFoodOrders(selectedCompany.company.id, {
            page: 1,
            pageSize,
            status: "out_for_delivery"
          })
        ])
      : [{ data: null, error: null }, { data: null, error: null }];
  const readyOrders = (readyResult.data?.items ?? []).filter(isPaidOrder);
  const outForDeliveryOrders = (outForDeliveryResult.data?.items ?? []).filter(isPaidOrder);

  return (
    <FoodShell activePath="/movimentacao/entregas">
      <header className="topbar">
        <div>
          <div className="eyebrow">Movimentacao</div>
          <strong>Entregas</strong>
        </div>
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
      {readyResult.error ? <Notice tone="danger" message={readyResult.error} /> : null}
      {outForDeliveryResult.error ? <Notice tone="danger" message={outForDeliveryResult.error} /> : null}
      {params?.error ? <Notice tone="danger" message={params.error} /> : null}
      {params?.orderUpdated ? <Notice tone="success" message="Status do pedido atualizado." /> : null}

      <CompanySwitcher
        basePath="/movimentacao/entregas"
        companies={context.foodCompanies}
        selectedCompanyId={selectedCompany?.company.id}
      />

      {!selectedCompany ? (
        <EmptyFoodAccess />
      ) : (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>Painel de entregas</h1>
              <p>Pedidos prontos podem sair para entrega e depois serem marcados como entregues.</p>
            </div>
            <div className="panel-heading-actions">
              <OrderAutoRefresh intervalSeconds={30} refreshOnFocus refreshOnMount />
              <span>
                {readyOrders.length + outForDeliveryOrders.length} pedido(s) em entrega
              </span>
            </div>
          </div>

          <div className="kitchen-board">
            <DeliveryColumn
              companyId={selectedCompany.company.id}
              emptyMessage="Nenhum pedido pronto aguardando entrega."
              orders={readyOrders}
              title="Prontos"
              actions={[
                ["out_for_delivery", "Saiu para entrega"],
                ["delivered", "Entregue"],
                ["cancelled", "Cancelar"]
              ]}
            />
            <DeliveryColumn
              companyId={selectedCompany.company.id}
              emptyMessage="Nenhum pedido em rota de entrega."
              orders={outForDeliveryOrders}
              title="Em entrega"
              actions={[
                ["delivered", "Marcar entregue"],
                ["cancelled", "Cancelar"]
              ]}
            />
          </div>
        </section>
      )}
    </FoodShell>
  );
}

function isPaidOrder(order: FoodOrderContract): boolean {
  return canAdvanceFoodOrderOperationally(order);
}

function DeliveryColumn({
  actions,
  companyId,
  emptyMessage,
  orders,
  title
}: {
  actions: Array<[FoodOrderStatus, string]>;
  companyId: string;
  emptyMessage: string;
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
          {orders.map((order) => (
            <article className="order-card kitchen-order-card" key={order.id}>
              <div className="order-card-heading">
                <div>
                  <strong>{order.orderNumber}</strong>
                  <small>
                    {order.customerName ?? "Cliente nao informado"} -{" "}
                    {new Date(order.createdAt).toLocaleTimeString("pt-BR")}
                  </small>
                </div>
                <span>{formatMoney(order.totalCents)}</span>
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

              <OrderStatusActions actions={actions} companyId={companyId} orderId={order.id} />
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state kitchen-empty">{emptyMessage}</div>
      )}
    </div>
  );
}
