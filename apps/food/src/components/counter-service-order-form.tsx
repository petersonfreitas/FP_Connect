"use client";

import { useMemo, useState } from "react";
import type {
  FoodOrderFulfillmentMethod,
  FoodProductContract
} from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type CounterServiceOrderFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  companyId: string;
  customerName?: string | null;
  customerNote?: string | null;
  customerPhone?: string | null;
  fulfillmentMethod?: FoodOrderFulfillmentMethod;
  initialItems?: CounterInitialCartItem[];
  orderId?: string;
  pendingLabel?: string;
  products: FoodProductContract[];
  returnTo?: string;
  submitLabel?: string;
  title?: string;
};

type CounterInitialCartItem = {
  itemNote?: string | null;
  lineId?: string;
  orderItemId?: string | null;
  productId: string;
  quantity: number;
};

type CounterCartItem = {
  itemNote: string;
  lineId: string;
  orderItemId: string | null;
  productId: string;
  quantity: number;
};

export function CounterServiceOrderForm({
  action,
  companyId,
  customerName,
  customerNote,
  customerPhone,
  fulfillmentMethod = "dine_in",
  initialItems = [],
  orderId,
  pendingLabel = "Criando...",
  products,
  returnTo = "/movimentacao/atendimento",
  submitLabel = "Criar pedido de balcao",
  title = "Pedido de balcao"
}: CounterServiceOrderFormProps) {
  const stockCreditsByProductId = useMemo(
    () => aggregateInitialItemQuantities(initialItems),
    [initialItems]
  );
  const [items, setItems] = useState<CounterCartItem[]>(() =>
    initialItems.map((item, index) => ({
      itemNote: item.itemNote ?? "",
      lineId: item.lineId ?? createCartLineId(`${item.productId}:${index}`),
      orderItemId: item.orderItemId ?? null,
      productId: item.productId,
      quantity: item.quantity
    }))
  );
  const cartRows = useMemo(
    () =>
      items.map((item) => ({
        item,
        product: products.find((product) => product.id === item.productId) ?? null
      })),
    [items, products]
  );
  const totalCents = cartRows.reduce(
    (sum, row) => sum + (row.product?.priceCents ?? 0) * row.item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  function addProduct(product: FoodProductContract) {
    setItems((currentItems) => {
      const maxQuantity = getMaxQuantity(product, getStockCredit(product.id));
      const currentProductQuantity = getProductQuantity(currentItems, product.id);

      if (currentProductQuantity >= maxQuantity) {
        return currentItems;
      }

      return [
        ...currentItems,
        {
          itemNote: "",
          lineId: createCartLineId(product.id),
          orderItemId: null,
          productId: product.id,
          quantity: 1
        }
      ];
    });
  }

  function updateQuantity(lineId: string, product: FoodProductContract, quantity: number) {
    setItems((currentItems) => {
      const currentItem = currentItems.find((item) => item.lineId === lineId);

      if (!currentItem) {
        return currentItems;
      }

      const otherProductQuantity = currentItems
        .filter((item) => item.productId === product.id && item.lineId !== lineId)
        .reduce((sum, item) => sum + item.quantity, 0);
      const lineMaxQuantity = Math.max(
        getMaxQuantity(product, getStockCredit(product.id)) - otherProductQuantity,
        0
      );
      const nextQuantity = Math.min(Math.max(Math.trunc(quantity), 0), lineMaxQuantity);

      if (nextQuantity <= 0) {
        return currentItems.filter((item) => item.lineId !== lineId);
      }

      return currentItems.map((item) =>
        item.lineId === lineId ? { ...item, quantity: nextQuantity } : item
      );
    });
  }

  function updateItemNote(lineId: string, itemNote: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.lineId === lineId ? { ...item, itemNote: itemNote.slice(0, 300) } : item
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  function getStockCredit(productId: string): number {
    return stockCreditsByProductId.get(productId) ?? 0;
  }

  return (
    <form action={action} className="counter-service-layout">
      <input name="companyId" type="hidden" value={companyId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      {orderId ? <input name="orderId" type="hidden" value={orderId} /> : null}
      {items.map((item) => (
        <span hidden key={item.lineId}>
          <input name="cartLineId" type="hidden" value={item.lineId} />
          {item.orderItemId ? (
            <input name={`orderItemId:${item.lineId}`} type="hidden" value={item.orderItemId} />
          ) : null}
          <input name={`productId:${item.lineId}`} type="hidden" value={item.productId} />
          <input
            name={`quantity:${item.lineId}`}
            type="hidden"
            value={String(item.quantity)}
          />
          <input name={`itemNote:${item.lineId}`} type="hidden" value={item.itemNote} />
        </span>
      ))}

      <section className="counter-service-catalog" aria-label="Catalogo de produtos">
        <div className="counter-service-panel-heading">
          <div>
            <strong>Catalogo</strong>
            <span>{products.length} produto(s) disponivel(is)</span>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="counter-product-grid">
            {products.map((product) => {
              const stockCredit = getStockCredit(product.id);
              const maxQuantity = getMaxQuantity(product, stockCredit);
              const cartQuantity = getProductQuantity(items, product.id);
              const isUnavailable = maxQuantity <= 0;
              const isDisabled = product.status !== "available" || isUnavailable;

              return (
                <button
                  className="counter-product-card"
                  disabled={isDisabled || cartQuantity >= maxQuantity}
                  key={product.id}
                  onClick={() => addProduct(product)}
                  type="button"
                >
                  {product.imageUrl ? (
                    <img alt={product.name} src={product.imageUrl} />
                  ) : (
                    <span className="counter-product-placeholder">Sem imagem</span>
                  )}
                  <span>
                    <strong>{product.name}</strong>
                    {product.description ? <small>{product.description}</small> : null}
                    <b>{formatMoney(product.priceCents)}</b>
                    {product.status !== "available" ? (
                      <small>Produto indisponivel</small>
                    ) : null}
                    {product.stockControlEnabled ? (
                      <small>
                        {formatStockAvailability(product, stockCredit, isUnavailable)}
                      </small>
                    ) : null}
                    {cartQuantity > 0 ? <em>{cartQuantity} no pedido</em> : null}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            Cadastre produtos disponiveis antes de criar pedidos de balcao.
          </div>
        )}
      </section>

      <aside className="counter-service-cart" aria-label="Carrinho do atendimento">
        <div className="counter-service-panel-heading">
          <div>
            <strong>{title}</strong>
            <span>{itemCount} item(ns)</span>
          </div>
          {items.length > 0 ? (
            <button className="link-button danger-link" onClick={clearCart} type="button">
              Limpar
            </button>
          ) : null}
        </div>

        <label>
          Tipo de atendimento
          <select defaultValue={fulfillmentMethod} name="fulfillmentMethod">
            <option value="dine_in">Comer no local</option>
            <option value="delivery">Entrega</option>
          </select>
        </label>

        <div className="form-grid">
          <label>
            Cliente opcional
            <input
              defaultValue={customerName ?? ""}
              maxLength={120}
              name="customerName"
              placeholder="Cliente balcao"
            />
          </label>
          <label>
            Telefone opcional
            <input
              defaultValue={customerPhone ?? ""}
              maxLength={40}
              name="customerPhone"
              placeholder="(00) 00000-0000"
            />
          </label>
        </div>
        <label>
          Observacao do atendimento
          <textarea
            defaultValue={customerNote ?? ""}
            maxLength={600}
            name="customerNote"
            placeholder="Ex.: retirar no balcao, pedido de telefone, sem pressa"
            rows={3}
          />
        </label>

        {cartRows.length > 0 ? (
          <div className="counter-cart-list">
            {cartRows.map(({ item, product }) =>
              product ? (
                <article className="counter-cart-row" key={item.lineId}>
                  <div>
                    <strong>{product.name}</strong>
                    <small>{formatMoney(product.priceCents)} cada</small>
                  </div>
                  <div className="quantity-control">
                    <button
                      aria-label="Diminuir quantidade"
                      onClick={() => updateQuantity(item.lineId, product, item.quantity - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      aria-label="Aumentar quantidade"
                      disabled={
                        item.quantity >=
                        getLineMaxQuantity(item, product, items, getStockCredit(product.id))
                      }
                      onClick={() => updateQuantity(item.lineId, product, item.quantity + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  <strong>{formatMoney(product.priceCents * item.quantity)}</strong>
                  <label className="counter-cart-row-note">
                    Observacao do item
                    <textarea
                      maxLength={300}
                      onChange={(event) => updateItemNote(item.lineId, event.target.value)}
                      placeholder="Ex.: sem cebola, cortar ao meio, sem gelo"
                      rows={2}
                      value={item.itemNote}
                    />
                  </label>
                </article>
              ) : null
            )}
          </div>
        ) : (
          <div className="empty-state counter-empty-cart">
            Selecione produtos no catalogo para montar o pedido.
          </div>
        )}

        <div className="counter-service-total">
          <span>Total</span>
          <strong>{formatMoney(totalCents)}</strong>
        </div>

        <div className="form-footer">
          <span>
            O pedido nasce na operacao; produtos prontos pulam a etapa de cozinha.
          </span>
          <PendingSubmitButton
            disabled={items.length === 0}
            pendingLabel={pendingLabel}
          >
            {submitLabel}
          </PendingSubmitButton>
        </div>
      </aside>
    </form>
  );
}

function aggregateInitialItemQuantities(
  items: CounterInitialCartItem[]
): Map<string, number> {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  return quantities;
}

function getMaxQuantity(product: FoodProductContract, stockCredit = 0): number {
  return product.stockControlEnabled ? Math.max(product.stockQuantity + stockCredit, 0) : 99;
}

function getProductQuantity(items: CounterCartItem[], productId: string): number {
  return items
    .filter((item) => item.productId === productId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

function getLineMaxQuantity(
  item: CounterCartItem,
  product: FoodProductContract,
  items: CounterCartItem[],
  stockCredit = 0
): number {
  const otherProductQuantity = items
    .filter((cartItem) => cartItem.productId === item.productId && cartItem.lineId !== item.lineId)
    .reduce((sum, cartItem) => sum + cartItem.quantity, 0);

  return Math.max(getMaxQuantity(product, stockCredit) - otherProductQuantity, 0);
}

function formatStockAvailability(
  product: FoodProductContract,
  stockCredit: number,
  isUnavailable: boolean
): string {
  if (isUnavailable) {
    return "Sem estoque";
  }

  if (stockCredit > 0) {
    return `${product.stockQuantity + stockCredit} disponivel para ajuste`;
  }

  return `${product.stockQuantity} em estoque`;
}

function createCartLineId(productId: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${productId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(value / 100);
}
