import { CompanySwitcher } from "@/components/company-switcher";
import { formatMoney } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import {
  createInternalFoodOrderAction,
  updateFoodOrderStatusAction
} from "@/app/actions";
import { getFoodPageContext } from "@/lib/food-context";
import {
  getFoodAccess,
  listAllFoodProducts,
  listFoodOrders
} from "@/lib/internal-api";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type OrdersPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    orderCreated?: string;
    orderUpdated?: string;
    page?: string;
  }>;
};

export const dynamic = "force-dynamic";
const pageSize = 20;

const orderStatusLabels = {
  accepted: "Aceito",
  cancelled: "Cancelado",
  created: "Criado",
  preparing: "Em preparo",
  ready: "Pronto"
};

const orderStatusOptions = [
  ["created", "Criado"],
  ["accepted", "Aceito"],
  ["preparing", "Em preparo"],
  ["ready", "Pronto"],
  ["cancelled", "Cancelado"]
] as const;

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const page = normalizePage(params?.page);
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const [productsResult, ordersResult] =
    selectedCompany && !foodAccessResult.error
      ? await Promise.all([
          listAllFoodProducts(selectedCompany.company.id),
          listFoodOrders(selectedCompany.company.id, { page, pageSize })
        ])
      : [{ data: null, error: null }, { data: null, error: null }];
  const availableProducts = (productsResult.data ?? []).filter(
    (product) => product.status === "available"
  );
  const pagination = ordersResult.data;
  const orders = pagination?.items ?? [];

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
      {productsResult.error ? <Notice tone="danger" message={productsResult.error} /> : null}
      {ordersResult.error ? <Notice tone="danger" message={ordersResult.error} /> : null}
      {params?.error ? <Notice tone="danger" message={params.error} /> : null}
      {params?.orderCreated ? <Notice tone="success" message="Pedido interno criado com sucesso." /> : null}
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
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <h1>Novo pedido interno</h1>
                <p>Crie um pedido manual para validar produtos, eventos e status operacionais.</p>
              </div>
              <span>{availableProducts.length} produto(s) disponivel(is)</span>
            </div>

            <form action={createInternalFoodOrderAction} className="store-form">
              <input name="companyId" type="hidden" value={selectedCompany.company.id} />
              <div className="form-grid">
                <label>
                  Cliente
                  <input maxLength={120} name="customerName" placeholder="Cliente teste" />
                </label>
                <label>
                  Telefone
                  <input maxLength={40} name="customerPhone" placeholder="(00) 00000-0000" />
                </label>
              </div>
              <label>
                Observacao
                <textarea maxLength={600} name="customerNote" rows={3} />
              </label>

              {availableProducts.length > 0 ? (
                <div className="order-product-list">
                  {availableProducts.map((product) => (
                    <label className="order-product-row" key={product.id}>
                      <input name="productId" type="hidden" value={product.id} />
                      <span>
                        <strong>{product.name}</strong>
                        <small>{formatMoney(product.priceCents)}</small>
                      </span>
                      <input
                        min={0}
                        max={99}
                        name={`quantity:${product.id}`}
                        placeholder="0"
                        type="number"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Cadastre produtos disponiveis antes de criar pedidos.</div>
              )}

              <div className="form-footer">
                <span>Criar pedido emite food.order.created para o FP Robots.</span>
                <PendingSubmitButton disabled={availableProducts.length === 0} pendingLabel="Criando...">
                  Criar pedido
                </PendingSubmitButton>
              </div>
            </form>
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Pedidos criados</h1>
                <p>Lista paginada dos pedidos internos da empresa selecionada.</p>
              </div>
              <span>{pagination?.total ?? 0} registro(s)</span>
            </div>

            {orders.length > 0 ? (
              <div className="order-list">
                {orders.map((order) => (
                  <article className="order-card" key={order.id}>
                    <div className="order-card-heading">
                      <div>
                        <strong>{order.orderNumber}</strong>
                        <small>
                          {order.customerName ?? "Cliente nao informado"} -{" "}
                          {new Date(order.createdAt).toLocaleString("pt-BR")}
                        </small>
                      </div>
                      <span>{orderStatusLabels[order.status]}</span>
                    </div>

                    <div className="order-items">
                      {order.items.map((item) => (
                        <div className="order-item-row" key={item.id}>
                          <span>
                            {item.quantity}x {item.productName}
                          </span>
                          <strong>{formatMoney(item.totalPriceCents)}</strong>
                        </div>
                      ))}
                    </div>

                    <form action={updateFoodOrderStatusAction} className="order-status-form">
                      <input name="companyId" type="hidden" value={selectedCompany.company.id} />
                      <input name="orderId" type="hidden" value={order.id} />
                      <strong>Total: {formatMoney(order.totalCents)}</strong>
                      <select defaultValue={order.status} name="status">
                        {orderStatusOptions.map(([value, label]) => (
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
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">Nenhum pedido criado ainda.</div>
            )}

            {pagination ? (
              <PaginationControls
                basePath="/movimentacao/pedidos"
                page={pagination.page}
                pageSize={pagination.pageSize}
                params={{ companyId: selectedCompany.company.id }}
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
