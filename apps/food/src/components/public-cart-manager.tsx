"use client";

import { useEffect, useMemo, useState } from "react";
import type { FoodMenuContract, FoodProductContract } from "@fp/types";
import { PublicCustomerMenu } from "@/components/public-customer-menu";
import {
  clearPublicCart,
  getPublicCartItemCount,
  readPublicCart,
  setPublicCartLineQuantity,
  setPublicCartProduct,
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
  const [editingItem, setEditingItem] = useState<PublicCartItem | null>(null);
  const [editingQuantity, setEditingQuantity] = useState(1);
  const [editingItemNote, setEditingItemNote] = useState("");
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
  const editingProduct =
    editingItem ? products.find((product) => product.id === editingItem.productId) ?? null : null;
  const editingMaxQuantity =
    editingItem && editingProduct
      ? getLineMaxQuantity(editingItem, editingProduct, cartItems)
      : 0;

  useEffect(() => {
    setCartItems(readPublicCart(menu.store.publicSlug));
  }, [menu.store.publicSlug]);

  function updateQuantity(item: PublicCartItem, product: FoodProductContract | null, quantity: number) {
    const otherProductQuantity = cartItems
      .filter((cartItem) => cartItem.productId === item.productId && cartItem.lineId !== item.lineId)
      .reduce((sum, cartItem) => sum + cartItem.quantity, 0);
    const maxQuantity = product?.stockControlEnabled
      ? Math.max(product.stockQuantity - otherProductQuantity, 0)
      : 99;
    const nextQuantity = Math.min(Math.max(quantity, 0), maxQuantity);
    setCartItems(setPublicCartLineQuantity(menu.store.publicSlug, item.lineId, nextQuantity));
  }

  function openEditItem(item: PublicCartItem, product: FoodProductContract | null) {
    if (!product) {
      return;
    }

    const maxQuantity = getLineMaxQuantity(item, product, cartItems);

    setEditingItem(item);
    setEditingQuantity(Math.min(Math.max(item.quantity, 1), maxQuantity));
    setEditingItemNote(item.itemNote ?? "");
  }

  function closeEditItem() {
    setEditingItem(null);
    setEditingQuantity(1);
    setEditingItemNote("");
  }

  function changeEditingQuantity(delta: number) {
    if (!editingItem || !editingProduct) {
      return;
    }

    const maxQuantity = getLineMaxQuantity(editingItem, editingProduct, cartItems);
    const nextQuantity = Math.min(Math.max(editingQuantity + delta, 1), maxQuantity);

    setEditingQuantity(nextQuantity);
  }

  function saveEditedItem() {
    if (!editingItem || !editingProduct || editingQuantity <= 0) {
      return;
    }

    setCartItems(
      setPublicCartProduct(menu.store.publicSlug, {
        ...editingItem,
        itemNote: editingItemNote,
        quantity: editingQuantity
      })
    );
    closeEditItem();
  }

  function removeProduct(lineId: string) {
    setCartItems(setPublicCartLineQuantity(menu.store.publicSlug, lineId, 0));
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
                <article className="public-cart-edit-row" key={item.lineId}>
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
                    {item.itemNote ? (
                      <small className="public-item-note">Obs.: {item.itemNote}</small>
                    ) : null}
                  </div>
                  <div className="quantity-control">
                    <button
                      aria-label="Diminuir quantidade"
                      onClick={() => updateQuantity(item, product, item.quantity - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      aria-label="Aumentar quantidade"
                      disabled={
                        !product ||
                        (product.stockControlEnabled &&
                          getProductQuantity(cartItems, item.productId) >= product.stockQuantity)
                      }
                      onClick={() => updateQuantity(item, product, item.quantity + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  <strong>{formatMoney((product?.priceCents ?? 0) * item.quantity)}</strong>
                  <div className="public-cart-row-actions">
                    <button
                      className="link-button"
                      disabled={!product}
                      onClick={() => openEditItem(item, product)}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className="link-button danger-link"
                      onClick={() => removeProduct(item.lineId)}
                      type="button"
                    >
                      Remover
                    </button>
                  </div>
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

      {editingItem && editingProduct ? (
        <CartItemEditModal
          itemNote={editingItemNote}
          maxQuantity={editingMaxQuantity}
          onClose={closeEditItem}
          onDecrease={() => changeEditingQuantity(-1)}
          onIncrease={() => changeEditingQuantity(1)}
          onItemNoteChange={setEditingItemNote}
          onSave={saveEditedItem}
          product={editingProduct}
          quantity={editingQuantity}
        />
      ) : null}
    </main>
  );
}

function CartItemEditModal({
  itemNote,
  maxQuantity,
  onClose,
  onDecrease,
  onIncrease,
  onItemNoteChange,
  onSave,
  product,
  quantity
}: {
  itemNote: string;
  maxQuantity: number;
  onClose: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onItemNoteChange: (value: string) => void;
  onSave: () => void;
  product: FoodProductContract;
  quantity: number;
}) {
  const isUnavailable = maxQuantity <= 0;
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
        aria-labelledby="public-cart-edit-modal-title"
        aria-modal="true"
        className="public-product-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Fechar edicao do item"
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
            <div className="eyebrow">Editar item</div>
            <h2 id="public-cart-edit-modal-title">{product.name}</h2>
            {product.description ? <p>{product.description}</p> : null}
          </div>

          <div className="public-product-modal-meta">
            <strong>{formatMoney(product.priceCents)}</strong>
            <span>
              {product.stockControlEnabled
                ? `${maxQuantity} disponivel(is) para esta linha`
                : "Disponivel para pedido"}
            </span>
          </div>

          <div className="public-product-modal-quantity">
            <span>Quantidade</span>
            <div className="quantity-control">
              <button
                aria-label="Diminuir quantidade"
                disabled={quantity <= 1 || isUnavailable}
                onClick={onDecrease}
                type="button"
              >
                -
              </button>
              <span>{isUnavailable ? 0 : quantity}</span>
              <button
                aria-label="Aumentar quantidade"
                disabled={isUnavailable || quantity >= maxQuantity}
                onClick={onIncrease}
                type="button"
              >
                +
              </button>
            </div>
          </div>

          <div className="public-product-modal-total">
            <span>Subtotal</span>
            <strong>{formatMoney(isUnavailable ? 0 : subtotal)}</strong>
          </div>

          <label className="public-product-item-note">
            Observacao do item
            <textarea
              maxLength={300}
              onChange={(event) => onItemNoteChange(event.target.value)}
              placeholder="Ex.: sem cebola, molho a parte"
              rows={3}
              value={itemNote}
            />
          </label>

          <div className="public-product-modal-actions">
            <button className="secondary-action" onClick={onClose} type="button">
              Cancelar
            </button>
            <button
              className="primary-action"
              disabled={isUnavailable}
              onClick={onSave}
              type="button"
            >
              Atualizar carrinho
            </button>
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

function getProductQuantity(items: PublicCartItem[], productId: string): number {
  return items
    .filter((item) => item.productId === productId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

function getLineMaxQuantity(
  item: PublicCartItem,
  product: FoodProductContract,
  items: PublicCartItem[]
): number {
  if (!product.stockControlEnabled) {
    return 99;
  }

  const otherProductQuantity = items
    .filter((cartItem) => cartItem.productId === item.productId && cartItem.lineId !== item.lineId)
    .reduce((sum, cartItem) => sum + cartItem.quantity, 0);

  return Math.max(product.stockQuantity - otherProductQuantity, 0);
}
