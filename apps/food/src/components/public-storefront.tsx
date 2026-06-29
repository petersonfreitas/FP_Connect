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
  customerEmail?: string | null;
  isAuthenticated: boolean;
  menu: FoodMenuContract;
  storeContext: PublicStoreUrlContext;
};

export function PublicStorefront({
  customerEmail,
  isAuthenticated,
  menu,
  storeContext
}: PublicStorefrontProps) {
  const products = useMemo(() => flattenProducts(menu), [menu]);
  const [cartItems, setCartItems] = useState(() => readPublicCart(menu.store.publicSlug));
  const canOrderNow = menu.availability.isOrderingOpen;
  const cartHref = storeUrl(storeContext, "/carrinho");
  const cartItemsCount = getPublicCartItemCount(cartItems);

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
        customerEmail={customerEmail}
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

      <section className="public-menu-layout">
        <div className="public-menu" id="cardapio">
          <div className="public-section-heading">
            <div>
              <div className="eyebrow">Cardapio</div>
              <h2>Escolha os itens do pedido</h2>
              <p>Adicione produtos ao carrinho e revise tudo antes do pagamento.</p>
            </div>
            <div className="public-section-actions">
              <span>{products.length} produto(s)</span>
              <a className="secondary-action compact-action" href={cartHref}>
                Ver carrinho ({cartItemsCount})
              </a>
            </div>
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
      ) : (
        <div className="public-product-image public-product-image-placeholder" aria-hidden="true">
          <span>Sem imagem</span>
        </div>
      )}
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
