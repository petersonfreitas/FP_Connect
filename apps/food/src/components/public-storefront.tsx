"use client";

import { useEffect, useMemo, useState } from "react";
import type { FoodMenuContract, FoodProductContract } from "@fp/types";
import { PublicCustomerMenu } from "@/components/public-customer-menu";
import {
  getPublicCartItemCount,
  getPublicCartQuantity,
  readPublicCart,
  setPublicCartProductQuantity
} from "@/lib/public-cart-store";
import { storeUrl, type PublicStoreUrlContext } from "@/lib/public-store-urls";

type PublicStorefrontProps = {
  isAuthenticated: boolean;
  menu: FoodMenuContract;
  storeContext: PublicStoreUrlContext;
};

export function PublicStorefront({
  isAuthenticated,
  menu,
  storeContext
}: PublicStorefrontProps) {
  const products = useMemo(() => flattenProducts(menu), [menu]);
  const [cartItems, setCartItems] = useState(() => readPublicCart(menu.store.publicSlug));
  const canOrderNow = menu.availability.isOrderingOpen;
  const cartHref = storeUrl(storeContext, "/carrinho");
  const cartItemsCount = getPublicCartItemCount(cartItems);
  const cartTotalCents = cartItems.reduce((sum, item) => {
    const product = products.find((currentProduct) => currentProduct.id === item.productId);
    return product ? sum + product.priceCents * item.quantity : sum;
  }, 0);

  useEffect(() => {
    setCartItems(readPublicCart(menu.store.publicSlug));
  }, [menu.store.publicSlug]);

  function changeQuantity(productId: string, delta: number) {
    const product = products.find((currentProduct) => currentProduct.id === productId);
    const currentQuantity = getPublicCartQuantity(cartItems, productId);
    const maxQuantity = product?.stockControlEnabled ? product.stockQuantity : 99;
    const nextQuantity = Math.min(Math.max(currentQuantity + delta, 0), maxQuantity);
    setCartItems(setPublicCartProductQuantity(menu.store.publicSlug, productId, nextQuantity));
  }

  return (
    <main className="public-store">
      <PublicCustomerMenu
        active="menu"
        contactPhone={menu.store.contactPhone}
        isAuthenticated={isAuthenticated}
        storeContext={storeContext}
      />

      <section className="public-hero">
        <div>
          <div className="eyebrow">FP Food</div>
          <h1>{menu.store.displayName}</h1>
          <p>
            {menu.store.preparationTimeMinutes
              ? `Preparo medio: ${menu.store.preparationTimeMinutes} min.`
              : "Cardapio aberto para pedidos."}
          </p>
          <div className="public-hero-actions">
            <a href="#cardapio">Ver cardapio</a>
            <a href={cartHref}>Abrir carrinho</a>
            <a href={storeUrl(storeContext, "/pedidos")}>Meus pedidos</a>
          </div>
        </div>
        <div className={canOrderNow ? "public-store-status" : "public-store-status closed"}>
          <span>{canOrderNow ? "Pedidos abertos" : "Pedidos fechados"}</span>
          <small>{cartItemsCount > 0 ? `${cartItemsCount} item(ns) no carrinho` : menu.availability.message}</small>
        </div>
      </section>

      <section className="public-store-overview" aria-label="Informacoes da loja">
        <article className="public-info-card">
          <span>Preparo</span>
          <strong>
            {menu.store.preparationTimeMinutes
              ? `${menu.store.preparationTimeMinutes} min`
              : "Sob consulta"}
          </strong>
          <p>Tempo medio informado pela loja.</p>
        </article>
        <article className="public-info-card">
          <span>Atendimento</span>
          <strong>{canOrderNow ? "Aceitando pedidos" : "Fora do horario"}</strong>
          <p>{menu.store.contactPhone ?? "Canal para duvidas sobre pedido e entrega."}</p>
        </article>
        <article className="public-info-card">
          <span>Entrega</span>
          <strong>{menu.availability.isDeliveryOpen ? "Disponivel" : "Fora do horario"}</strong>
          <p>Horario de entrega parametrizado pela loja.</p>
        </article>
        <article className="public-info-card">
          <span>Pagamento</span>
          <strong>Gateway</strong>
          <p>Finalizacao pelo FP Gateway com Mercado Pago.</p>
        </article>
      </section>

      <section className="public-order-layout">
        <div className="public-menu" id="cardapio">
          <div className="public-section-heading">
            <div>
              <div className="eyebrow">Cardapio</div>
              <h2>Escolha os itens do pedido</h2>
              <p>Adicione produtos ao carrinho e revise tudo antes do pagamento.</p>
            </div>
            <span>{products.length} produto(s)</span>
          </div>

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
                    quantity={getPublicCartQuantity(cartItems, product.id)}
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
                    quantity={getPublicCartQuantity(cartItems, product.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="public-cart">
          <div className="public-cart-heading">
            <div>
              <div className="eyebrow">Carrinho</div>
              <h2>Resumo</h2>
              <p>Edite quantidades e avance para a revisao.</p>
            </div>
            <span>{cartItemsCount} item(ns)</span>
          </div>

          {cartItemsCount > 0 ? (
            <div className="public-cart-items">
              {cartItems.map((item) => {
                const product = products.find((currentProduct) => currentProduct.id === item.productId);

                return (
                  <div className="public-cart-row" key={item.productId}>
                    <span>
                      {item.quantity}x {product?.name ?? "Produto indisponivel"}
                    </span>
                    <strong>{formatMoney((product?.priceCents ?? 0) * item.quantity)}</strong>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state public-empty-cart">Adicione itens ao carrinho.</div>
          )}

          <div className="public-cart-total">
            <span>Total estimado</span>
            <strong>{formatMoney(cartTotalCents)}</strong>
          </div>

          {!canOrderNow ? (
            <p className="public-delivery-note">
              {menu.availability.message} O cardapio segue disponivel para consulta.
            </p>
          ) : null}

          <a className="primary-action" href={cartHref}>
            Ver carrinho
          </a>
        </aside>
      </section>
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
  const isStockControlled = product.stockControlEnabled;
  const isOutOfStock = isStockControlled && product.stockQuantity <= 0;
  const reachedStockLimit = isStockControlled && quantity >= product.stockQuantity;

  return (
    <article className="public-product-card">
      {product.imageUrl ? (
        <img alt={product.name} className="public-product-image" src={product.imageUrl} />
      ) : null}
      <div className="public-product-body">
        <div>
          <h3>{product.name}</h3>
          {product.description ? <p>{product.description}</p> : null}
          {isStockControlled ? (
            <small className="public-stock-note">
              {isOutOfStock ? "Sem estoque" : `${product.stockQuantity} em estoque`}
            </small>
          ) : null}
        </div>
        <div className="public-product-footer">
          <strong>{formatMoney(product.priceCents)}</strong>
          <div className="quantity-control">
            <button aria-label={`Remover ${product.name}`} onClick={onDecrease} type="button">
              -
            </button>
            <span>{quantity}</span>
            <button
              aria-label={`Adicionar ${product.name}`}
              disabled={isOutOfStock || reachedStockLimit}
              onClick={onIncrease}
              type="button"
            >
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
