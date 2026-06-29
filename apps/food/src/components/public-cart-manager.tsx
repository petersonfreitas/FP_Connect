"use client";

import { useEffect, useMemo, useState } from "react";
import type { FoodMenuContract, FoodProductContract } from "@fp/types";
import { PublicCustomerMenu } from "@/components/public-customer-menu";
import {
  clearPublicCart,
  getPublicCartItemCount,
  getPublicCartQuantity,
  readPublicCart,
  setPublicCartProductQuantity,
  type PublicCartItem
} from "@/lib/public-cart-store";
import {
  storeUrl,
  type PublicStoreUrlContext
} from "@/lib/public-store-urls";

type PublicCartManagerProps = {
  customerEmail?: string | null;
  isAuthenticated: boolean;
  menu: FoodMenuContract;
  storeContext: PublicStoreUrlContext;
};

export function PublicCartManager({
  customerEmail,
  isAuthenticated,
  menu,
  storeContext
}: PublicCartManagerProps) {
  const products = useMemo(() => flattenProducts(menu), [menu]);
  const [cartItems, setCartItems] = useState<PublicCartItem[]>(() =>
    readPublicCart(menu.store.publicSlug)
  );
  const cartRows = useMemo(
    () =>
      cartItems.map((item) => ({
        item,
        product: products.find((product) => product.id === item.productId) ?? null
      })),
    [cartItems, products]
  );
  const cartItemsCount = getPublicCartItemCount(cartItems);
  const totalCents = cartRows.reduce(
    (sum, row) => sum + (row.product?.priceCents ?? 0) * row.item.quantity,
    0
  );
  const menuHref = storeUrl(storeContext);
  const reviewHref = storeUrl(storeContext, "/revisao");
  const canReview = cartItemsCount > 0 && menu.availability.isOrderingOpen;

  useEffect(() => {
    setCartItems(readPublicCart(menu.store.publicSlug));
  }, [menu.store.publicSlug]);

  function updateQuantity(product: FoodProductContract | null, productId: string, quantity: number) {
    const maxQuantity = product?.stockControlEnabled ? product.stockQuantity : 99;
    const nextQuantity = Math.min(Math.max(quantity, 0), maxQuantity);
    setCartItems(setPublicCartProductQuantity(menu.store.publicSlug, productId, nextQuantity));
  }

  function removeProduct(productId: string) {
    setCartItems(setPublicCartProductQuantity(menu.store.publicSlug, productId, 0));
  }

  function clearCart() {
    setCartItems(clearPublicCart(menu.store.publicSlug));
  }

  return (
    <main className="public-store">
      <PublicCustomerMenu
        active="cart"
        contactPhone={menu.store.contactPhone}
        customerEmail={customerEmail}
        isAuthenticated={isAuthenticated}
        storeContext={storeContext}
      />

      <section className="public-hero compact-public-hero">
        <div>
          <div className="eyebrow">Carrinho</div>
          <h1>{menu.store.displayName}</h1>
          <p>Altere quantidades, remova itens ou volte ao cardapio para continuar escolhendo.</p>
          <div className="public-hero-actions">
            <a href={menuHref}>Continuar comprando</a>
            <a href={reviewHref}>Ir para revisao</a>
          </div>
        </div>
        <div className={menu.availability.isOrderingOpen ? "public-store-status" : "public-store-status closed"}>
          <span>{cartItemsCount} item(ns)</span>
          <small>{menu.availability.isOrderingOpen ? "Pronto para revisar" : menu.availability.message}</small>
        </div>
      </section>

      <section className="public-cart-page">
        <div className="public-cart-management">
          <div className="public-section-heading">
            <div>
              <div className="eyebrow">Itens</div>
              <h2>Seu carrinho</h2>
              <p>Os valores abaixo ainda serao revalidados pela loja no proximo passo.</p>
            </div>
            <span>{cartRows.length} produto(s)</span>
          </div>

          {cartRows.length > 0 ? (
            <div className="public-cart-list">
              {cartRows.map(({ item, product }) => (
                <article className="public-cart-edit-row" key={item.productId}>
                  {product?.imageUrl ? (
                    <img alt={product.name} className="public-cart-item-image" src={product.imageUrl} />
                  ) : (
                    <span className="public-cart-item-image placeholder" aria-hidden="true">
                      Foto
                    </span>
                  )}
                  <div>
                    <strong>{product?.name ?? "Produto indisponivel"}</strong>
                    {product ? (
                      <small>{formatMoney(product.priceCents)} cada</small>
                    ) : (
                      <small>Remova este item para continuar.</small>
                    )}
                  </div>
                  <div className="quantity-control">
                    <button
                      aria-label="Diminuir quantidade"
                      onClick={() => updateQuantity(product, item.productId, item.quantity - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <span>{getPublicCartQuantity(cartItems, item.productId)}</span>
                    <button
                      aria-label="Aumentar quantidade"
                      disabled={
                        !product ||
                        (product.stockControlEnabled && item.quantity >= product.stockQuantity)
                      }
                      onClick={() => updateQuantity(product, item.productId, item.quantity + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  <strong>{formatMoney((product?.priceCents ?? 0) * item.quantity)}</strong>
                  <button
                    className="link-button danger-link"
                    onClick={() => removeProduct(item.productId)}
                    type="button"
                  >
                    Remover
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state public-empty-cart">
              Seu carrinho esta vazio. Volte ao cardapio para adicionar produtos.
            </div>
          )}
        </div>

        <aside className="public-cart">
          <div className="public-cart-heading">
            <div>
              <div className="eyebrow">Resumo</div>
              <h2>Total estimado</h2>
              <p>Subtotal calculado com os dados carregados da vitrine.</p>
            </div>
          </div>

          <div className="public-cart-total">
            <span>Subtotal</span>
            <strong>{formatMoney(totalCents)}</strong>
          </div>
          <div className="public-cart-total">
            <span>Total estimado</span>
            <strong>{formatMoney(totalCents)}</strong>
          </div>

          {!menu.availability.isOrderingOpen ? (
            <p className="public-delivery-note">{menu.availability.message}</p>
          ) : null}

          <div className="public-cart-actions">
            <a className="secondary-action" href={menuHref}>
              Continuar comprando
            </a>
            {canReview ? (
              <a className="primary-action" href={reviewHref}>
                Revisar pedido
              </a>
            ) : (
              <button className="primary-action" disabled type="button">
                Revisar pedido
              </button>
            )}
            {cartItemsCount > 0 ? (
              <button className="link-button danger-link" onClick={clearCart} type="button">
                Limpar carrinho
              </button>
            ) : null}
          </div>
        </aside>
      </section>
    </main>
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
