import type {
  FoodOrderDetailContract,
  FoodOrderFulfillmentMethod,
  FoodOrderItemContract,
  FoodOrderItemStatus,
  FoodOrderStatus,
  FoodPaymentMethod,
  FoodPaymentStatus
} from "@fp/types";
import { formatMoney } from "@/components/food-forms";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { PrintPageActions } from "@/components/print-page-actions";
import { getFoodPageContext } from "@/lib/food-context";
import { getFoodAccess, getFoodOrderDetail } from "@/lib/internal-api";

type PrintOrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;
  searchParams?: Promise<{
    companyId?: string;
    itemStatus?: string;
    mode?: string;
  }>;
};

type PrintMode = "kitchen" | "order";

export const dynamic = "force-dynamic";

const fulfillmentLabels: Record<FoodOrderFulfillmentMethod, string> = {
  delivery: "Entrega",
  dine_in: "Local",
  pickup: "Retirada"
};

const itemStatusLabels: Record<FoodOrderItemStatus, string> = {
  cancelled: "Cancelado",
  pending: "Pendente",
  preparing: "Em preparo",
  ready: "Pronto"
};

const orderStatusLabels: Record<FoodOrderStatus, string> = {
  accepted: "Aceito",
  cancelled: "Cancelado",
  created: "Criado",
  delivered: "Entregue",
  out_for_delivery: "Saiu para entrega",
  preparing: "Em preparo",
  ready: "Pronto"
};

const paymentMethodLabels: Record<FoodPaymentMethod, string> = {
  card: "Cartao",
  cash: "Dinheiro",
  other: "Outro",
  pix: "Pix"
};

const paymentStatusLabels: Record<FoodPaymentStatus, string> = {
  cancelled: "Cancelado",
  paid: "Pago",
  pending: "Pendente"
};

export default async function PrintOrderPage({ params, searchParams }: PrintOrderPageProps) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const mode = normalizePrintMode(query?.mode);
  const itemStatus = normalizeItemStatus(query?.itemStatus);
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
  const backHref = selectedCompany
    ? `/movimentacao/pedidos/${orderId}?companyId=${selectedCompany.company.id}`
    : "/movimentacao/pedidos";

  if (context.accessError || foodAccessResult.error || orderResult.error) {
    return (
      <main className="print-shell no-print">
        {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
        {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
        {orderResult.error ? <Notice tone="danger" message={orderResult.error} /> : null}
        <PrintPageActions backHref={backHref} />
      </main>
    );
  }

  if (!selectedCompany) {
    return (
      <main className="print-shell no-print">
        <EmptyFoodAccess />
        <PrintPageActions backHref="/movimentacao/pedidos" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="print-shell no-print">
        <Notice tone="danger" message="Pedido nao encontrado." />
        <PrintPageActions backHref={backHref} />
      </main>
    );
  }

  const items = getPrintItems(order, mode, itemStatus);
  const isKitchen = mode === "kitchen";

  return (
    <main className="print-shell">
      <PrintPageActions backHref={backHref} />

      <article className="thermal-ticket">
        <header className="thermal-ticket-header">
          <strong>{isKitchen ? "COMANDA COZINHA" : "PEDIDO"}</strong>
          <span>{order.orderNumber}</span>
          <small>{new Date(order.createdAt).toLocaleString("pt-BR")}</small>
        </header>

        <section className="thermal-ticket-section">
          <div className="thermal-ticket-row">
            <span>Status</span>
            <strong>{orderStatusLabels[order.status]}</strong>
          </div>
          <div className="thermal-ticket-row">
            <span>Atendimento</span>
            <strong>{fulfillmentLabels[order.fulfillmentMethod]}</strong>
          </div>
          {isKitchen && itemStatus ? (
            <div className="thermal-ticket-row">
              <span>Fila</span>
              <strong>{itemStatusLabels[itemStatus]}</strong>
            </div>
          ) : null}
        </section>

        <section className="thermal-ticket-section">
          <strong>Cliente</strong>
          <span>{order.customerName ?? "Nao informado"}</span>
          {order.customerPhone ? <span>{order.customerPhone}</span> : null}
          {order.customerNote ? <span>Obs.: {order.customerNote}</span> : null}
        </section>

        {order.deliveryAddress && !isKitchen ? (
          <section className="thermal-ticket-section">
            <strong>Endereco</strong>
            <span>
              {order.deliveryAddress.street}, {order.deliveryAddress.number}
            </span>
            {order.deliveryAddress.complement ? <span>{order.deliveryAddress.complement}</span> : null}
            <span>
              {order.deliveryAddress.district ? `${order.deliveryAddress.district} - ` : ""}
              {order.deliveryAddress.city}/{order.deliveryAddress.state}
            </span>
            {order.deliveryAddress.reference ? (
              <span>Ref.: {order.deliveryAddress.reference}</span>
            ) : null}
          </section>
        ) : null}

        <section className="thermal-ticket-section">
          <strong>{isKitchen ? "Itens para preparo" : "Itens"}</strong>
          {items.length > 0 ? (
            <div className="thermal-ticket-items">
              {items.map((item) => (
                <div className="thermal-ticket-item" key={item.id}>
                  <div>
                    <strong>
                      {item.quantity}x {item.productName}
                    </strong>
                    {isKitchen ? <span>{itemStatusLabels[item.itemStatus]}</span> : null}
                    {item.itemNote ? <span>Obs.: {item.itemNote}</span> : null}
                  </div>
                  {!isKitchen ? <span>{formatMoney(item.totalPriceCents)}</span> : null}
                </div>
              ))}
            </div>
          ) : (
            <span>Nenhum item para este modelo de impressao.</span>
          )}
        </section>

        {!isKitchen ? (
          <section className="thermal-ticket-section">
            <div className="thermal-ticket-row">
              <span>Subtotal</span>
              <strong>{formatMoney(order.subtotalCents)}</strong>
            </div>
            <div className="thermal-ticket-row thermal-ticket-total">
              <span>Total</span>
              <strong>{formatMoney(order.totalCents)}</strong>
            </div>
            <div className="thermal-ticket-row">
              <span>Pagamento</span>
              <strong>{paymentStatusLabels[order.paymentStatus]}</strong>
            </div>
            <div className="thermal-ticket-row">
              <span>Forma</span>
              <strong>{order.paymentMethod ? paymentMethodLabels[order.paymentMethod] : "Nao informada"}</strong>
            </div>
          </section>
        ) : null}

        <footer className="thermal-ticket-footer">
          <span>FP Food</span>
          <span>{new Date().toLocaleString("pt-BR")}</span>
        </footer>
      </article>
    </main>
  );
}

function getPrintItems(
  order: FoodOrderDetailContract,
  mode: PrintMode,
  itemStatus: FoodOrderItemStatus | null
): FoodOrderItemContract[] {
  if (mode !== "kitchen") {
    return order.items;
  }

  return order.items.filter(
    (item) => item.kitchenRequired && (!itemStatus || item.itemStatus === itemStatus)
  );
}

function normalizeItemStatus(value: string | undefined): FoodOrderItemStatus | null {
  if (value === "cancelled" || value === "pending" || value === "preparing" || value === "ready") {
    return value;
  }

  return null;
}

function normalizePrintMode(value: string | undefined): PrintMode {
  return value === "kitchen" ? "kitchen" : "order";
}
