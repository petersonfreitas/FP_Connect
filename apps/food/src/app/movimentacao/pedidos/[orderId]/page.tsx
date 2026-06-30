import Link from "next/link";
import type {
  FoodOrderContract,
  FoodOrderFulfillmentMethod,
  FoodOrderStatus,
  FoodPaymentMethod,
  FoodPaymentStatus
} from "@fp/types";
import {
  finalizeCounterFoodOrderPaymentAction,
  updateInternalFoodOrderItemsAction
} from "@/app/actions";
import { CompanySwitcher } from "@/components/company-switcher";
import { CounterServiceOrderForm } from "@/components/counter-service-order-form";
import { formatMoney } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { getFoodPageContext } from "@/lib/food-context";
import { isInternalManualFoodOrder } from "@/lib/food-order-rules";
import {
  getFoodAccess,
  getFoodOrderDetail,
  listAllFoodProducts
} from "@/lib/internal-api";

type OrderDetailPageProps = {
  params: Promise<{
    orderId: string;
  }>;
  searchParams?: Promise<{
    companyId?: string;
    collect?: string;
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

const paymentStatusLabels: Record<FoodPaymentStatus, string> = {
  cancelled: "Cancelado",
  paid: "Pago",
  pending: "Pendente"
};

const fulfillmentLabels: Record<FoodOrderFulfillmentMethod, string> = {
  delivery: "Entrega",
  dine_in: "Local",
  pickup: "Retirada"
};

const paymentMethodLabels: Record<FoodPaymentMethod, string> = {
  card: "Cartao",
  cash: "Dinheiro",
  other: "Outro",
  pix: "Pix"
};

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
  const canEditCounterOrder = order ? isCounterOrderEditable(order) : false;
  const productsResult =
    selectedCompany && canEditCounterOrder
      ? await listAllFoodProducts(selectedCompany.company.id)
      : { data: null, error: null };
  const counterReadyToCollect = order ? isCounterOrderReadyToCollect(order) : false;
  const counterCollectText = getCounterCollectText(order?.fulfillmentMethod ?? "dine_in");

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
      {productsResult.error ? <Notice tone="danger" message={productsResult.error} /> : null}
      {query?.error ? <Notice tone="danger" message={query.error} /> : null}
      {query?.orderUpdated ? <Notice tone="success" message="Pedido atualizado." /> : null}
      {query?.paymentUpdated ? <Notice tone="success" message="Pagamento do pedido atualizado." /> : null}
      {query?.collect && counterReadyToCollect ? (
        <Notice
          tone="info"
          message={`Confirme a forma de pagamento para marcar o pedido como pago e ${counterCollectText.verb}.`}
        />
      ) : null}

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
                <span className="status-chip">{fulfillmentLabels[order.fulfillmentMethod]}</span>
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
                <div className="eyebrow">Atendimento</div>
                <strong>{fulfillmentLabels[order.fulfillmentMethod]}</strong>
                <span>{getFulfillmentDescription(order.fulfillmentMethod)}</span>
              </div>
              <div className="order-detail-block">
                <div className="eyebrow">Atualizacao</div>
                <strong>{new Date(order.updatedAt).toLocaleString("pt-BR")}</strong>
                <span>ID: {order.id}</span>
              </div>
            </div>
          </section>

          {canEditCounterOrder && productsResult.data ? (
            <section className="content-panel stack-panel">
              <div className="panel-heading">
                <div>
                  <h1>Editar pedido antes do pagamento</h1>
                  <p>
                    Corrija itens, quantidades, observacoes e tipo de atendimento antes de
                    registrar a cobranca.
                  </p>
                </div>
                <span>{productsResult.data?.length ?? 0} produto(s)</span>
              </div>

              <CounterServiceOrderForm
                action={updateInternalFoodOrderItemsAction}
                companyId={selectedCompany.company.id}
                customerName={order.customerName}
                customerNote={order.customerNote}
                customerPhone={order.customerPhone}
                fulfillmentMethod={order.fulfillmentMethod}
                initialItems={order.items
                  .filter((item) => item.productId)
                  .map((item) => ({
                    itemNote: item.itemNote,
                    lineId: item.id,
                    orderItemId: item.id,
                    productId: item.productId ?? "",
                    quantity: item.quantity
                  }))}
                orderId={order.id}
                pendingLabel="Salvando..."
                products={productsResult.data ?? []}
                returnTo={detailPath}
                submitLabel="Salvar correcoes"
                title="Correcoes do pedido"
              />
            </section>
          ) : null}

          {counterReadyToCollect ? (
            <section className="content-panel stack-panel">
              <div className="panel-heading">
                <div>
                  <h1>Cobranca do balcao</h1>
                  <p>{counterCollectText.description}</p>
                </div>
                <span>{paymentStatusLabels[order.paymentStatus]}</span>
              </div>

              <form action={finalizeCounterFoodOrderPaymentAction} className="counter-payment-finalize">
                <input name="companyId" type="hidden" value={selectedCompany.company.id} />
                <input name="orderId" type="hidden" value={order.id} />
                <input name="returnTo" type="hidden" value={detailPath} />
                <div>
                  <strong>Cobrar e finalizar</strong>
                  <span>{counterCollectText.help}</span>
                </div>
                <label>
                  Forma de pagamento
                  <select defaultValue={order.paymentMethod ?? ""} name="paymentMethod" required>
                    {paymentMethodOptions.map(([value, label]) => (
                      <option key={value || "empty"} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Observacao do pagamento
                  <textarea
                    defaultValue={order.paymentNote ?? ""}
                    maxLength={600}
                    name="paymentNote"
                    rows={2}
                  />
                </label>
                <PendingSubmitButton className="primary-action compact-action" pendingLabel="Finalizando...">
                  {counterCollectText.buttonLabel}
                </PendingSubmitButton>
              </form>
            </section>
          ) : null}

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
                    {item.itemNote ? (
                      <small className="public-item-note">Obs.: {item.itemNote}</small>
                    ) : null}
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

function isCounterOrderPendingPayment(order: FoodOrderContract): boolean {
  return isInternalManualFoodOrder(order) && order.paymentStatus === "pending";
}

function isCounterOrderEditable(order: FoodOrderContract): boolean {
  return (
    isCounterOrderPendingPayment(order) &&
    order.status !== "cancelled" &&
    order.status !== "delivered"
  );
}

function isCounterOrderReadyToCollect(order: FoodOrderContract): boolean {
  return (
    isCounterOrderPendingPayment(order) &&
    (order.status === "ready" || order.status === "out_for_delivery")
  );
}

function getFulfillmentDescription(fulfillmentMethod: FoodOrderFulfillmentMethod): string {
  if (fulfillmentMethod === "delivery") {
    return "Pedido de balcao com entrega.";
  }

  if (fulfillmentMethod === "pickup") {
    return "Pedido para retirada no balcao.";
  }

  return "Pedido para consumo no local.";
}

function getCounterCollectText(fulfillmentMethod: FoodOrderFulfillmentMethod): {
  buttonLabel: string;
  description: string;
  help: string;
  verb: string;
} {
  if (fulfillmentMethod === "delivery") {
    return {
      buttonLabel: "Marcar pago e entregar",
      description: "Registre o pagamento e finalize a entrega do pedido em uma unica etapa.",
      help: "Use esta acao para pedidos de balcao: registra o pagamento e move o pedido para Entregue em uma unica etapa.",
      verb: "finalizar a entrega"
    };
  }

  return {
    buttonLabel: "Marcar pago e finalizar",
    description: "Registre o pagamento e finalize o atendimento em uma unica etapa.",
    help: "Use esta acao para pedidos de balcao: registra o pagamento e conclui o atendimento em uma unica etapa.",
    verb: "finalizar o atendimento"
  };
}
