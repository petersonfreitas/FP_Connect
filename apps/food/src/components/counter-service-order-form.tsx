"use client";

import { useMemo, useState } from "react";
import type { FoodProductContract } from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type CounterServiceOrderFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  companyId: string;
  products: FoodProductContract[];
};

type CounterCartItem = {
  productId: string;
  quantity: number;
};

export function CounterServiceOrderForm({
  action,
  companyId,
  products
}: CounterServiceOrderFormProps) {
  const [items, setItems] = useState<CounterCartItem[]>([]);
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
      const existingItem = currentItems.find((item) => item.productId === product.id);
      const maxQuantity = getMaxQuantity(product);

      if (existingItem) {
        return currentItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, maxQuantity) }
            : item
        );
      }

      return [...currentItems, { productId: product.id, quantity: 1 }];
    });
  }

  function updateQuantity(product: FoodProductContract, quantity: number) {
    const nextQuantity = Math.min(Math.max(Math.trunc(quantity), 0), getMaxQuantity(product));

    setItems((currentItems) => {
      if (nextQuantity <= 0) {
        return currentItems.filter((item) => item.productId !== product.id);
      }

      const existingItem = currentItems.find((item) => item.productId === product.id);

      if (!existingItem) {
        return [...currentItems, { productId: product.id, quantity: nextQuantity }];
      }

      return currentItems.map((item) =>
        item.productId === product.id ? { ...item, quantity: nextQuantity } : item
      );
    });
  }

  function clearCart() {
    setItems([]);
  }

  return (
    <form action={action} className="counter-service-layout">
      <input name="companyId" type="hidden" value={companyId} />
      <input name="returnTo" type="hidden" value="/movimentacao/atendimento" />
      {items.map((item) => (
        <span hidden key={item.productId}>
          <input name="productId" type="hidden" value={item.productId} />
          <input
            name={`quantity:${item.productId}`}
            type="hidden"
            value={String(item.quantity)}
          />
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
              const cartItem = items.find((item) => item.productId === product.id);
              const maxQuantity = getMaxQuantity(product);
              const isUnavailable = maxQuantity <= 0;

              return (
                <button
                  className="counter-product-card"
                  disabled={isUnavailable || Boolean(cartItem && cartItem.quantity >= maxQuantity)}
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
                    {product.stockControlEnabled ? (
                      <small>
                        {isUnavailable ? "Sem estoque" : `${product.stockQuantity} em estoque`}
                      </small>
                    ) : null}
                    {cartItem ? <em>{cartItem.quantity} no pedido</em> : null}
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
            <strong>Pedido de balcao</strong>
            <span>{itemCount} item(ns)</span>
          </div>
          {items.length > 0 ? (
            <button className="link-button danger-link" onClick={clearCart} type="button">
              Limpar
            </button>
          ) : null}
        </div>

        <div className="form-grid">
          <label>
            Cliente opcional
            <input maxLength={120} name="customerName" placeholder="Cliente balcao" />
          </label>
          <label>
            Telefone opcional
            <input maxLength={40} name="customerPhone" placeholder="(00) 00000-0000" />
          </label>
        </div>
        <label>
          Observacao do atendimento
          <textarea
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
                <article className="counter-cart-row" key={item.productId}>
                  <div>
                    <strong>{product.name}</strong>
                    <small>{formatMoney(product.priceCents)} cada</small>
                  </div>
                  <div className="quantity-control">
                    <button
                      aria-label="Diminuir quantidade"
                      onClick={() => updateQuantity(product, item.quantity - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      aria-label="Aumentar quantidade"
                      disabled={item.quantity >= getMaxQuantity(product)}
                      onClick={() => updateQuantity(product, item.quantity + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  <strong>{formatMoney(product.priceCents * item.quantity)}</strong>
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
            O pedido nasce aceito e entra na fila da cozinha mesmo sem pagamento online.
          </span>
          <PendingSubmitButton
            disabled={items.length === 0}
            pendingLabel="Criando..."
          >
            Criar pedido de balcao
          </PendingSubmitButton>
        </div>
      </aside>
    </form>
  );
}

function getMaxQuantity(product: FoodProductContract): number {
  return product.stockControlEnabled ? Math.max(product.stockQuantity, 0) : 99;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(value / 100);
}
