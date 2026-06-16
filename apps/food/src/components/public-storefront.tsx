"use client";

import { useMemo, useState } from "react";
import type { FoodMenuContract, FoodProductContract } from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type PublicStorefrontProps = {
  createOrderAction: (formData: FormData) => void | Promise<void>;
  menu: FoodMenuContract;
};

export function PublicStorefront({ createOrderAction, menu }: PublicStorefrontProps) {
  const products = useMemo(() => flattenProducts(menu), [menu]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const selectedItems = products.filter((product) => (quantities[product.id] ?? 0) > 0);
  const totalCents = selectedItems.reduce(
    (sum, product) => sum + product.priceCents * (quantities[product.id] ?? 0),
    0
  );

  function changeQuantity(productId: string, delta: number) {
    setQuantities((current) => {
      const nextQuantity = Math.min(Math.max((current[productId] ?? 0) + delta, 0), 99);
      return {
        ...current,
        [productId]: nextQuantity
      };
    });
  }

  return (
    <main className="public-store">
      <section className="public-hero">
        <div>
          <div className="eyebrow">FP Food</div>
          <h1>{menu.store.displayName}</h1>
          <p>
            {menu.store.preparationTimeMinutes
              ? `Preparo medio: ${menu.store.preparationTimeMinutes} min.`
              : "Cardapio aberto para pedidos."}
          </p>
        </div>
        <div className="public-store-status">Loja aberta</div>
      </section>

      <form action={createOrderAction} className="public-order-layout">
        <input name="publicSlug" type="hidden" value={menu.store.publicSlug} />

        <section className="public-menu">
          {menu.categories.map((category) => (
            <div className="public-category" key={category.id}>
              <div>
                <h2>{category.name}</h2>
                {category.description ? <p>{category.description}</p> : null}
              </div>

              <div className="public-product-grid">
                {category.products.map((product) => (
                  <PublicProductCard
                    key={product.id}
                    onDecrease={() => changeQuantity(product.id, -1)}
                    onIncrease={() => changeQuantity(product.id, 1)}
                    product={product}
                    quantity={quantities[product.id] ?? 0}
                  />
                ))}
              </div>
            </div>
          ))}

          {menu.uncategorizedProducts.length > 0 ? (
            <div className="public-category">
              <div>
                <h2>Outros produtos</h2>
              </div>
              <div className="public-product-grid">
                {menu.uncategorizedProducts.map((product) => (
                  <PublicProductCard
                    key={product.id}
                    onDecrease={() => changeQuantity(product.id, -1)}
                    onIncrease={() => changeQuantity(product.id, 1)}
                    product={product}
                    quantity={quantities[product.id] ?? 0}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="public-cart">
          <div>
            <h2>Seu pedido</h2>
            <p>Confira os itens e informe seus dados para enviar para a loja.</p>
          </div>

          {products.map((product) => (
            <input key={product.id} name="productId" type="hidden" value={product.id} />
          ))}

          {products.map((product) => (
            <input
              key={`${product.id}:quantity`}
              name={`quantity:${product.id}`}
              type="hidden"
              value={quantities[product.id] ?? 0}
            />
          ))}

          {selectedItems.length > 0 ? (
            <div className="public-cart-items">
              {selectedItems.map((product) => (
                <div className="public-cart-row" key={product.id}>
                  <span>
                    {quantities[product.id]}x {product.name}
                  </span>
                  <strong>{formatMoney(product.priceCents * (quantities[product.id] ?? 0))}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state public-empty-cart">Adicione itens ao pedido.</div>
          )}

          <div className="public-cart-total">
            <span>Total</span>
            <strong>{formatMoney(totalCents)}</strong>
          </div>

          <label>
            Nome
            <input maxLength={120} name="customerName" placeholder="Seu nome" required />
          </label>
          <label>
            WhatsApp
            <input maxLength={40} name="customerPhone" placeholder="(00) 00000-0000" required />
          </label>
          <label>
            Observacao
            <textarea maxLength={600} name="customerNote" rows={3} />
          </label>

          {menu.store.deliveryNotes ? (
            <p className="public-delivery-note">{menu.store.deliveryNotes}</p>
          ) : null}

          <PendingSubmitButton
            disabled={selectedItems.length === 0}
            pendingLabel="Enviando pedido..."
          >
            Enviar pedido
          </PendingSubmitButton>
        </aside>
      </form>
    </main>
  );
}

function PublicProductCard({
  onDecrease,
  onIncrease,
  product,
  quantity
}: {
  onDecrease: () => void;
  onIncrease: () => void;
  product: FoodProductContract;
  quantity: number;
}) {
  return (
    <article className="public-product-card">
      {product.imageUrl ? (
        <img alt={product.name} className="public-product-image" src={product.imageUrl} />
      ) : null}
      <div className="public-product-body">
        <div>
          <h3>{product.name}</h3>
          {product.description ? <p>{product.description}</p> : null}
        </div>
        <div className="public-product-footer">
          <strong>{formatMoney(product.priceCents)}</strong>
          <div className="quantity-control">
            <button aria-label={`Remover ${product.name}`} onClick={onDecrease} type="button">
              -
            </button>
            <span>{quantity}</span>
            <button aria-label={`Adicionar ${product.name}`} onClick={onIncrease} type="button">
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function flattenProducts(menu: FoodMenuContract): FoodProductContract[] {
  return [
    ...menu.categories.flatMap((category) => category.products),
    ...menu.uncategorizedProducts
  ];
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(value / 100);
}
