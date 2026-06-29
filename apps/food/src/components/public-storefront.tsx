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
  const [selectedProduct, setSelectedProduct] = useState<FoodProductContract | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const canOrderNow = menu.availability.isOrderingOpen;
  const cartHref = storeUrl(storeContext, "/carrinho");
  const cartItemsCount = getPublicCartItemCount(cartItems);

  useEffect(() => {
    setCartItems(readPublicCart(menu.store.publicSlug));
  }, [menu.store.publicSlug]);

  function openProductDetail(product: FoodProductContract) {
    const currentQuantity = getPublicCartQuantity(cartItems, product.id);
    const maxQuantity = getProductMaxQuantity(product);
    const initialQuantity = currentQuantity > 0 ? currentQuantity : 1;

    setSelectedProduct(product);
    setSelectedQuantity(Math.min(initialQuantity, maxQuantity));
  }

  function closeProductDetail() {
    setSelectedProduct(null);
    setSelectedQuantity(1);
  }

  function changeSelectedQuantity(delta: number) {
    if (!selectedProduct) {
      return;
    }

    const maxQuantity = getProductMaxQuantity(selectedProduct);
    const nextQuantity = Math.min(Math.max(selectedQuantity + delta, 1), maxQuantity);

    setSelectedQuantity(nextQuantity);
  }

  function saveSelectedProductToCart() {
    if (!selectedProduct) {
      return;
    }

    setCartItems(
      setPublicCartProductQuantity(
        menu.store.publicSlug,
        selectedProduct.id,
        selectedQuantity
      )
    );
    closeProductDetail();
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
                    cartQuantity={getPublicCartQuantity(cartItems, product.id)}
                    key={product.id}
                    onOpen={() => openProductDetail(product)}
                    product={product}
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
                    cartQuantity={getPublicCartQuantity(cartItems, product.id)}
                    key={product.id}
                    onOpen={() => openProductDetail(product)}
                    product={product}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {selectedProduct ? (
        <ProductDetailModal
          cartHref={cartHref}
          cartQuantity={getPublicCartQuantity(cartItems, selectedProduct.id)}
          onClose={closeProductDetail}
          onDecrease={() => changeSelectedQuantity(-1)}
          onIncrease={() => changeSelectedQuantity(1)}
          onSave={saveSelectedProductToCart}
          product={selectedProduct}
          quantity={selectedQuantity}
        />
      ) : null}
    </main>
  );
}

function PublicProductCard({
  cartQuantity,
  onOpen,
  product,
}: {
  cartQuantity: number;
  onOpen: () => void;
  product: FoodProductContract;
}) {
  const isStockControlled = product.stockControlEnabled;
  const isOutOfStock = isStockControlled && product.stockQuantity <= 0;

  return (
    <article
      className="public-product-card"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
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
          <div className="public-product-card-actions">
            {cartQuantity > 0 ? (
              <span className="public-cart-badge">{cartQuantity} no carrinho</span>
            ) : null}
            <span className="secondary-action compact-action public-product-card-cta">
              {isOutOfStock ? "Indisponivel" : "Ver detalhes"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductDetailModal({
  cartHref,
  cartQuantity,
  onClose,
  onDecrease,
  onIncrease,
  onSave,
  product,
  quantity
}: {
  cartHref: string;
  cartQuantity: number;
  onClose: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onSave: () => void;
  product: FoodProductContract;
  quantity: number;
}) {
  const isStockControlled = product.stockControlEnabled;
  const isOutOfStock = isStockControlled && product.stockQuantity <= 0;
  const maxQuantity = getProductMaxQuantity(product);
  const subtotal = product.priceCents * quantity;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="public-product-modal-backdrop" onClick={onClose} role="presentation">
      <section
        aria-labelledby="public-product-modal-title"
        aria-modal="true"
        className="public-product-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Fechar detalhe do produto"
          className="public-product-modal-close"
          onClick={onClose}
          type="button"
        >
          x
        </button>

        <div className="public-product-modal-media">
          {product.imageUrl ? (
            <img alt={product.name} src={product.imageUrl} />
          ) : (
            <span>Sem imagem</span>
          )}
        </div>

        <div className="public-product-modal-content">
          <div>
            <div className="eyebrow">Produto</div>
            <h2 id="public-product-modal-title">{product.name}</h2>
            {product.description ? <p>{product.description}</p> : null}
          </div>

          <div className="public-product-modal-meta">
            <strong>{formatMoney(product.priceCents)}</strong>
            {isStockControlled ? (
              <span>{isOutOfStock ? "Sem estoque" : `${product.stockQuantity} em estoque`}</span>
            ) : (
              <span>Disponivel para pedido</span>
            )}
          </div>

          <div className="public-product-modal-quantity">
            <span>Quantidade</span>
            <div className="quantity-control">
              <button
                aria-label="Diminuir quantidade"
                disabled={quantity <= 1 || isOutOfStock}
                onClick={onDecrease}
                type="button"
              >
                -
              </button>
              <span>{isOutOfStock ? 0 : quantity}</span>
              <button
                aria-label="Aumentar quantidade"
                disabled={isOutOfStock || quantity >= maxQuantity}
                onClick={onIncrease}
                type="button"
              >
                +
              </button>
            </div>
          </div>

          <div className="public-product-modal-total">
            <span>Subtotal</span>
            <strong>{formatMoney(isOutOfStock ? 0 : subtotal)}</strong>
          </div>

          <div className="public-product-modal-actions">
            <button className="secondary-action" onClick={onClose} type="button">
              Continuar vendo
            </button>
            <button
              className="primary-action"
              disabled={isOutOfStock}
              onClick={onSave}
              type="button"
            >
              {cartQuantity > 0 ? "Atualizar carrinho" : "Adicionar ao carrinho"}
            </button>
            {cartQuantity > 0 ? (
              <a className="link-button" href={cartHref}>
                Abrir carrinho
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
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

function getProductMaxQuantity(product: FoodProductContract): number {
  return product.stockControlEnabled ? Math.max(product.stockQuantity, 0) : 99;
}
