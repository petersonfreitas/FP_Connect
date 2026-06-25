import Link from "next/link";
import type {
  FoodOrderContract,
  FoodOrderStatus,
  FoodPaymentMethod,
  FoodPaymentStatus
} from "@fp/types";
import { updateFoodOrderPaymentAction, updateFoodOrderStatusAction } from "@/app/actions";
import { CompanySwitcher } from "@/components/company-switcher";
import { formatMoney } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { getFoodPageContext } from "@/lib/food-context";
import { getFoodAccess, getFoodOrderDetail } from "@/lib/internal-api";

type OrderDetailPageProps = {
  params: Promise<{
    orderId: string;
  }>;
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    orderUpdated?: string;
    paymentUpdated?: string;
  }>;
};

export const dynamic = "force-dynamic";

const orderStatusLabels: Record<FoodOrderStatus, string> = {
  accepted: "Aceito",
  cancelled: "Cancelado",
  created: "Criado",
  delivered: "Entregue",
  out_for_delivery: "Saiu para entrega",
  preparing: "Em preparo",
  ready: "Pronto"
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

const paymentStatusLabels: Record<FoodPaymentStatus, string> = {
  cancelled: "Cancelado",
  paid: "Pago",
  pending: "Pendente"
};

const paymentMethodLabels: Record<FoodPaymentMethod, string> = {
  card: "Cartao",
  cash: "Dinheiro",
  other: "Outro",
  pix: "Pix"
};

const paymentStatusOptions = [
  ["pending", "Pendente"],
  ["paid", "Pago"],
  ["cancelled", "Cancelado"]
] as const;

const paymentMethodOptions = [
  ["", "Selecione"],
  ["cash", "Dinheiro"],
  ["pix", "Pix"],
  ["card", "Cartao"],
  ["other", "Outro"]
] as const;

export default async function OrderDetailPage({
  params,
  searchParams
}: OrderDetailPageProps) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const context = await getFoodPageContext(query?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const orderResult =
    selectedCompany && !foodAccessResult.error
      ? await getFoodOrderDetail(selectedCompany.company.id, orderId)
      : { data: null, error: null };
  const order = orderResult.data;
  const detailPath = `/movimentacao/pedidos/${orderId}`;
  const ordersHref = selectedCompany
    ? `/movimentacao/pedidos?companyId=${selectedCompany.company.id}`
    : "/movimentacao/pedidos";
  const paymentCleared = order ? isOrderPaymentCleared(order) : false;
  const statusOptions = order ? getOrderStatusOptions(order) : orderStatusOptions;

  return (
    <FoodShell activePath="/movimentacao/pedidos">
      <header className="topbar">
        <div>
          <div className="eyebrow">Movimentacao</div>
          <strong>Detalhe do pedido</strong>
        </div>
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
      {orderResult.error ? <Notice tone="danger" message={orderResult.error} /> : null}
      {query?.error ? <Notice tone="danger" message={query.error} /> : null}
      {query?.orderUpdated ? <Notice tone="success" message="Status do pedido atualizado." /> : null}
      {query?.paymentUpdated ? <Notice tone="success" message="Pagamento do pedido atualizado." /> : null}

      <CompanySwitcher
        basePath={detailPath}
        companies={context.foodCompanies}
        selectedCompanyId={selectedCompany?.company.id}
      />

      {!selectedCompany ? (
        <EmptyFoodAccess />
      ) : !order ? (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>Pedido nao encontrado</h1>
              <p>Selecione outro pedido ou confirme se a empresa atual possui acesso a ele.</p>
            </div>
            <Link className="secondary-action" href={ordersHref}>
              Voltar
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Pedido</div>
                <h1>{order.orderNumber}</h1>
                <p>
                  {order.customerName ?? "Cliente nao informado"} - criado em{" "}
                  {new Date(order.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="panel-heading-actions">
                <span className="status-chip">{orderStatusLabels[order.status]}</span>
                <span className="status-chip">{paymentStatusLabels[order.paymentStatus]}</span>
                <Link className="secondary-action compact-action" href={ordersHref}>
                  Voltar para pedidos
                </Link>
              </div>
            </div>

            <div className="order-detail-grid">
              <div className="order-detail-block">
                <div className="eyebrow">Cliente</div>
                <strong>{order.customerName ?? "Nao informado"}</strong>
                {order.customerPhone ? <span>{order.customerPhone}</span> : null}
                {order.customerNote ? <span>Obs.: {order.customerNote}</span> : null}
              </div>
              <div className="order-detail-block">
                <div className="eyebrow">Valores</div>
                <strong>{formatMoney(order.totalCents)}</strong>
                <span>Subtotal: {formatMoney(order.subtotalCents)}</span>
              </div>
              <div className="order-detail-block">
                <div className="eyebrow">Pagamento</div>
                <strong>{paymentStatusLabels[order.paymentStatus]}</strong>
                <span>
                  Forma:{" "}
                  {order.paymentMethod ? paymentMethodLabels[order.paymentMethod] : "Nao informada"}
                </span>
                {order.paidAt ? (
                  <span>Pago em: {new Date(order.paidAt).toLocaleString("pt-BR")}</span>
                ) : null}
              </div>
              <div className="order-detail-block">
                <div className="eyebrow">Atualizacao</div>
                <strong>{new Date(order.updatedAt).toLocaleString("pt-BR")}</strong>
                <span>ID: {order.id}</span>
              </div>
            </div>

            <form action={updateFoodOrderStatusAction} className="order-detail-status-form">
              <input name="companyId" type="hidden" value={selectedCompany.company.id} />
              <input name="orderId" type="hidden" value={order.id} />
              <input name="returnTo" type="hidden" value={detailPath} />
              <strong>Alterar status</strong>
              {!paymentCleared ? (
                <span>Fluxo operacional bloqueado ate confirmacao do pagamento.</span>
              ) : null}
              <select defaultValue={order.status} name="status">
                {statusOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <PendingSubmitButton className="secondary-action compact-action" pendingLabel="Salvando...">
                Atualizar
              </PendingSubmitButton>
            </form>
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Pagamento manual</h1>
                <p>Registre a confirmacao manual do pagamento sem integrar Gateway neste MVP.</p>
              </div>
              <span>{paymentStatusLabels[order.paymentStatus]}</span>
            </div>

            <form action={updateFoodOrderPaymentAction} className="store-form">
              <input name="companyId" type="hidden" value={selectedCompany.company.id} />
              <input name="orderId" type="hidden" value={order.id} />
              <input name="returnTo" type="hidden" value={detailPath} />
              <div className="form-grid">
                <label>
                  Status do pagamento
                  <select defaultValue={order.paymentStatus} name="paymentStatus">
                    {paymentStatusOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Forma de pagamento
                  <select defaultValue={order.paymentMethod ?? ""} name="paymentMethod">
                    {paymentMethodOptions.map(([value, label]) => (
                      <option key={value || "empty"} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Observacao do pagamento
                <textarea
                  defaultValue={order.paymentNote ?? ""}
                  maxLength={600}
                  name="paymentNote"
                  rows={3}
                />
              </label>
              <div className="form-footer">
                <span>Marcar como pago emite food.payment.marked_as_paid para o FP Robots.</span>
                <PendingSubmitButton pendingLabel="Salvando...">
                  Salvar pagamento
                </PendingSubmitButton>
              </div>
            </form>
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Itens do pedido</h1>
                <p>{order.items.length} item(ns) registrados no pedido.</p>
              </div>
              <span>{formatMoney(order.totalCents)}</span>
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
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Historico de status</h1>
                <p>Timeline operacional gravada no FP Food para auditoria simples do pedido.</p>
              </div>
              <span>{order.statusHistory.length} evento(s)</span>
            </div>

            {order.statusHistory.length > 0 ? (
              <div className="order-timeline">
                {order.statusHistory.map((entry) => (
                  <div className="order-timeline-item" key={entry.id}>
                    <span />
                    <div>
                      <strong>{orderStatusLabels[entry.status]}</strong>
                      <small>
                        {entry.previousStatus
                          ? `${orderStatusLabels[entry.previousStatus]} -> ${orderStatusLabels[entry.status]}`
                          : `Status inicial: ${orderStatusLabels[entry.status]}`}
                      </small>
                      <small>{new Date(entry.changedAt).toLocaleString("pt-BR")}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state kitchen-empty">
                Historico ainda nao registrado para este pedido.
              </div>
            )}
          </section>
        </>
      )}
    </FoodShell>
  );
}

function isOrderPaymentCleared(order: FoodOrderContract): boolean {
  return order.paymentStatus === "paid";
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
