"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CreatePublicFoodCheckoutContract,
  CreatePublicFoodCheckoutInput,
  FoodMenuContract,
  FoodProductContract,
  FoodPublicCartValidationContract,
  FoodPublicCheckoutContract,
  ValidatePublicFoodCartInput
} from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PublicCustomerMenu } from "@/components/public-customer-menu";
import {
  storeLoginUrl,
  storeOrderUrl,
  storeUrl,
  type PublicStoreUrlContext
} from "@/lib/public-store-urls";

type PublicStorefrontProps = {
  checkout: FoodPublicCheckoutContract | null;
  createOrderAction: (formData: FormData) => void | Promise<void>;
  isAuthenticated: boolean;
  isCustomerCompleteForCheckout: boolean;
  menu: FoodMenuContract;
  storeContext: PublicStoreUrlContext;
  trackOrderAction: (formData: FormData) => void | Promise<void>;
};

type CardPaymentBrickController = {
  unmount: () => void;
};

type CardPaymentFormData = {
  installments?: number | string;
  payer?: {
    email?: string;
  };
  payment_method_id?: string;
  token?: string;
};

type CardPaymentAdditionalData = {
  paymentTypeId?: string;
};

type MercadoPagoInstance = {
  bricks: () => {
    create: (
      brick: "cardPayment",
      containerId: string,
      settings: {
        callbacks: {
          onError: (error: unknown) => void;
          onReady: () => void;
          onSubmit: (
            formData: CardPaymentFormData,
            additionalData: CardPaymentAdditionalData
          ) => Promise<void>;
        };
        initialization: {
          amount: number;
        };
      }
    ) => Promise<CardPaymentBrickController>;
  };
};

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options: { locale: string }) => MercadoPagoInstance;
    fpFoodCardPaymentBrick?: CardPaymentBrickController;
  }
}

export function PublicStorefront({
  checkout,
  createOrderAction,
  isAuthenticated,
  isCustomerCompleteForCheckout,
  menu,
  storeContext,
  trackOrderAction
}: PublicStorefrontProps) {
  const orderFormRef = useRef<HTMLFormElement>(null);
  const products = useMemo(() => flattenProducts(menu), [menu]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardStatus, setCardStatus] = useState<string | null>(null);
  const [cartValidation, setCartValidation] =
    useState<FoodPublicCartValidationContract | null>(null);
  const [cartValidationError, setCartValidationError] = useState<string | null>(null);
  const [cartValidationPending, setCartValidationPending] = useState(false);
  const [mercadoPagoReady, setMercadoPagoReady] = useState(false);
  const [payingWithCard, setPayingWithCard] = useState(false);
  const selectedItems = useMemo(
    () => products.filter((product) => (quantities[product.id] ?? 0) > 0),
    [products, quantities]
  );
  const selectedItemsCount = selectedItems.reduce(
    (sum, product) => sum + (quantities[product.id] ?? 0),
    0
  );
  const totalCents = selectedItems.reduce(
    (sum, product) => sum + product.priceCents * (quantities[product.id] ?? 0),
    0
  );
  const selectedCartItems = useMemo(
    () =>
      selectedItems.map((product) => ({
        productId: product.id,
        quantity: quantities[product.id] ?? 0
      })),
    [quantities, selectedItems]
  );
  const validatedTotalCents = cartValidation?.totalCents ?? totalCents;
  const isCartValidForCheckout = cartValidation?.isValidForCheckout ?? false;
  const canOrderNow = menu.availability.isOrderingOpen;
  const loginHref = storeLoginUrl(storeContext);
  const accountHref = storeUrl(storeContext, "/conta");
  const publicKey = checkout?.mercadoPago.enabled ? checkout.mercadoPago.publicKey : null;

  const submitCardPayment = useCallback(
    async (formData: CardPaymentFormData, additionalData: CardPaymentAdditionalData) => {
      if (!isAuthenticated) {
        window.location.href = loginHref;
        return;
      }

      if (!isCustomerCompleteForCheckout) {
        window.location.href = accountHref;
        return;
      }

      if (!isCartValidForCheckout) {
        throw new Error(cartValidationError ?? "Valide o carrinho antes de pagar.");
      }

      const payload = buildCardCheckoutPayload({
        additionalData,
        formData,
        formElement: orderFormRef.current,
        products,
        publicSlug: menu.store.publicSlug,
        quantities
      });

      setCardError(null);
      setCardStatus("Processando pagamento...");
      setPayingWithCard(true);

      const response = await fetch("/api/public/checkout/mercado-pago", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const body = (await response.json().catch(() => null)) as
        | {
            data?: CreatePublicFoodCheckoutContract;
            error?: string;
          }
        | null;

      if (!response.ok || !body?.data) {
        setPayingWithCard(false);
        throw new Error(body?.error ?? "Nao foi possivel processar o pagamento.");
      }

      window.location.href = `${storeOrderUrl(
        storeContext,
        body.data.order.orderNumber
      )}?created=1&payment=${encodeURIComponent(body.data.paymentStatus)}`;
    },
    [
      accountHref,
      cartValidationError,
      isAuthenticated,
      isCartValidForCheckout,
      isCustomerCompleteForCheckout,
      loginHref,
      menu.store.publicSlug,
      products,
      quantities,
      storeContext
    ]
  );

  useEffect(() => {
    if (
      !isAuthenticated ||
      !isCustomerCompleteForCheckout ||
      !isCartValidForCheckout ||
      !canOrderNow ||
      !publicKey ||
      !mercadoPagoReady ||
      selectedItems.length === 0 ||
      totalCents <= 0
    ) {
      return undefined;
    }

    let disposed = false;
    setCardError(null);
    window.fpFoodCardPaymentBrick?.unmount();
    window.fpFoodCardPaymentBrick = undefined;

    if (!window.MercadoPago) {
      setCardError("Mercado Pago.js ainda nao foi carregado.");
      return undefined;
    }

    const mercadoPago = new window.MercadoPago(publicKey, {
      locale: "pt-BR"
    });

    mercadoPago
      .bricks()
      .create("cardPayment", "fp-food-card-payment-brick", {
        callbacks: {
          onError: () => {
            setCardError("Nao foi possivel carregar o checkout de cartao.");
          },
          onReady: () => {
            setCardStatus("Checkout de cartao pronto.");
          },
          onSubmit: async (formData, additionalData) => {
            try {
              await submitCardPayment(formData, additionalData);
            } catch (error) {
              setCardError(getErrorMessage(error));
              setCardStatus(null);
              setPayingWithCard(false);
              throw error;
            }
          }
        },
        initialization: {
          amount: validatedTotalCents / 100
        }
      })
      .then((controller) => {
        if (disposed) {
          controller.unmount();
          return;
        }

        window.fpFoodCardPaymentBrick = controller;
      })
      .catch(() => {
        setCardError("Nao foi possivel inicializar o checkout de cartao.");
      });

    return () => {
      disposed = true;
      window.fpFoodCardPaymentBrick?.unmount();
      window.fpFoodCardPaymentBrick = undefined;
    };
  }, [
    canOrderNow,
    isAuthenticated,
    isCartValidForCheckout,
    isCustomerCompleteForCheckout,
    mercadoPagoReady,
    publicKey,
    selectedItems.length,
    submitCardPayment,
    totalCents,
    validatedTotalCents
  ]);

  useEffect(() => {
    if (!isAuthenticated || !isCustomerCompleteForCheckout || selectedCartItems.length === 0) {
      setCartValidation(null);
      setCartValidationError(null);
      setCartValidationPending(false);
      return undefined;
    }

    const controller = new AbortController();
    const payload: ValidatePublicFoodCartInput & { publicSlug: string } = {
      items: selectedCartItems,
      publicSlug: menu.store.publicSlug
    };

    setCartValidationPending(true);
    setCartValidationError(null);

    fetch("/api/public/cart/validate", {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      signal: controller.signal
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as
          | {
              data?: FoodPublicCartValidationContract;
              error?: string;
            }
          | null;

        if (!response.ok || !body?.data) {
          throw new Error(body?.error ?? "Nao foi possivel validar o carrinho.");
        }

        setCartValidation(body.data);
        setCartValidationError(body.data.issues[0] ?? null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setCartValidation(null);
        setCartValidationError(getErrorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCartValidationPending(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [
    isAuthenticated,
    isCustomerCompleteForCheckout,
    menu.store.publicSlug,
    selectedCartItems
  ]);

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
      {publicKey ? (
        <Script
          onReady={() => setMercadoPagoReady(true)}
          src="https://sdk.mercadopago.com/js/v2"
          strategy="afterInteractive"
        />
      ) : null}

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
            <a href="#meus-pedidos">Meus pedidos</a>
          </div>
        </div>
        <div className={canOrderNow ? "public-store-status" : "public-store-status closed"}>
          <span>{canOrderNow ? "Pedidos abertos" : "Pedidos fechados"}</span>
          <small>{selectedItemsCount > 0 ? `${selectedItemsCount} item(ns) no pedido` : menu.availability.message}</small>
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
          <strong>{publicKey ? "Online e loja" : "Na loja"}</strong>
          <p>{publicKey ? "Cartao Mercado Pago ou fluxo combinado." : "Combine com a loja."}</p>
        </article>
      </section>

      <section className="public-order-lookup" id="meus-pedidos">
        <div>
          <div className="eyebrow">Meus pedidos</div>
          <h2>Acompanhar pedido realizado</h2>
          <p>Informe o numero do pedido para consultar o status atual.</p>
        </div>
        <form action={trackOrderAction}>
          <input name="publicSlug" type="hidden" value={menu.store.publicSlug} />
          <input
            maxLength={40}
            name="orderNumber"
            placeholder="PED-20260616-123456"
            required
          />
          <PendingSubmitButton className="secondary-action" pendingLabel="Buscando...">
            Acompanhar
          </PendingSubmitButton>
        </form>
      </section>

      <form action={createOrderAction} className="public-order-layout" ref={orderFormRef}>
        <input name="publicSlug" type="hidden" value={menu.store.publicSlug} />

        <section className="public-menu" id="cardapio">
          <div className="public-section-heading">
            <div>
              <div className="eyebrow">Cardapio</div>
              <h2>Escolha os itens do pedido</h2>
              <p>Use os controles de quantidade e finalize no carrinho ao lado.</p>
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
          <div className="public-cart-heading">
            <div>
              <div className="eyebrow">Checkout</div>
              <h2>Seu pedido</h2>
              <p>Confira os itens e finalize com os dados salvos na sua conta.</p>
            </div>
            <span>{selectedItemsCount} item(ns)</span>
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
            <span>{cartValidation ? "Total validado" : "Total estimado"}</span>
            <strong>{formatMoney(validatedTotalCents)}</strong>
          </div>

          {cartValidationPending ? (
            <p className="public-delivery-note">Validando carrinho com a loja...</p>
          ) : null}

          {cartValidationError ? (
            <p className="public-payment-error">{cartValidationError}</p>
          ) : null}

          {!canOrderNow ? (
            <p className="public-delivery-note">
              {menu.availability.message} O cardapio segue disponivel para consulta.
            </p>
          ) : null}

          <label>
            Observacao
            <textarea maxLength={600} name="customerNote" rows={3} />
          </label>

          {menu.store.deliveryNotes ? (
            <p className="public-delivery-note" id="ajuda">
              {menu.store.deliveryNotes}
            </p>
          ) : null}

          {isAuthenticated && isCustomerCompleteForCheckout ? (
            <PendingSubmitButton
              disabled={
                selectedItems.length === 0 ||
                !canOrderNow ||
                cartValidationPending ||
                !isCartValidForCheckout
              }
              pendingLabel="Enviando pedido..."
            >
              Enviar pedido
            </PendingSubmitButton>
          ) : isAuthenticated ? (
            <a className="primary-action" href={accountHref}>
              Completar cadastro
            </a>
          ) : (
            <a className="primary-action" href={loginHref}>
              Entrar para finalizar
            </a>
          )}
        </aside>
      </form>

      {publicKey ? (
        <section className="public-online-payment">
          <div>
            <div className="eyebrow">Pagamento online</div>
            <h2>Cartao de credito ou debito</h2>
            <p>
              Preencha os dados do pedido acima e finalize com cartao pelo Mercado Pago.
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="empty-state public-empty-cart">
              Entre para finalizar o pedido e habilitar pagamento online.
              <a className="secondary-action compact-action" href={loginHref}>
                Entrar
              </a>
            </div>
          ) : !isCustomerCompleteForCheckout ? (
            <div className="empty-state public-empty-cart">
              Complete seu cadastro para habilitar pagamento online.
              <a className="secondary-action compact-action" href={accountHref}>
                Minha conta
              </a>
            </div>
          ) : !canOrderNow ? (
            <div className="empty-state public-empty-cart">
              Pagamento online indisponivel fora do horario de pedidos.
            </div>
          ) : selectedItems.length === 0 ? (
            <div className="empty-state public-empty-cart">
              Adicione itens ao pedido para habilitar o pagamento com cartao.
            </div>
          ) : cartValidationPending ? (
            <div className="empty-state public-empty-cart">
              Validando carrinho com a loja antes do pagamento.
            </div>
          ) : !isCartValidForCheckout ? (
            <div className="empty-state public-empty-cart">
              {cartValidationError ?? "Valide o carrinho antes de pagar."}
            </div>
          ) : (
            <>
              <div className="public-payment-summary">
                <span>Total selecionado</span>
                <strong>{formatMoney(validatedTotalCents)}</strong>
              </div>
              <div
                aria-busy={payingWithCard}
                className={payingWithCard ? "public-card-payment is-loading" : "public-card-payment"}
                id="fp-food-card-payment-brick"
              />
              {cardStatus ? <p className="public-payment-note">{cardStatus}</p> : null}
              {cardError ? <p className="public-payment-error">{cardError}</p> : null}
            </>
          )}
        </section>
      ) : null}
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

function buildCardCheckoutPayload({
  additionalData,
  formData,
  formElement,
  products,
  publicSlug,
  quantities
}: {
  additionalData: CardPaymentAdditionalData;
  formData: CardPaymentFormData;
  formElement: HTMLFormElement | null;
  products: FoodProductContract[];
  publicSlug: string;
  quantities: Record<string, number>;
}): Omit<CreatePublicFoodCheckoutInput, "authUserId" | "email"> & { publicSlug: string } {
  if (!formElement) {
    throw new Error("Formulario do pedido nao esta disponivel.");
  }

  const orderFormData = new FormData(formElement);
  const customerNote = normalizeFormText(orderFormData.get("customerNote"));
  const items = products
    .map((product) => ({
      productId: product.id,
      quantity: quantities[product.id] ?? 0
    }))
    .filter((item) => item.quantity > 0);

  if (items.length === 0) {
    throw new Error("Adicione itens ao pedido antes de pagar com cartao.");
  }

  const cardToken = normalizeFormText(formData.token);
  const customerEmail = normalizeFormText(formData.payer?.email);
  const paymentMethodId = normalizeFormText(formData.payment_method_id);
  const installments = Number(formData.installments);
  const paymentMethodType = normalizePaymentMethodType(additionalData.paymentTypeId);

  if (!cardToken || !customerEmail || !paymentMethodId || !Number.isFinite(installments)) {
    throw new Error("Dados de pagamento incompletos no Mercado Pago.");
  }

  return {
    customerNote,
    items,
    payment: {
      cardToken,
      customerEmail,
      installments,
      paymentMethodId,
      paymentMethodType
    },
    publicSlug
  };
}

function normalizePaymentMethodType(value: string | undefined): "credit_card" | "debit_card" {
  if (value === "credit_card" || value === "debit_card") {
    return value;
  }

  throw new Error("Tipo de pagamento do Mercado Pago nao suportado.");
}

function normalizeFormText(value: FormDataEntryValue | string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Nao foi possivel processar o pagamento.";
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(value / 100);
}
