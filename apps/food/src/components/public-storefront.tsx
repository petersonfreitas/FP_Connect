"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CreatePublicFoodCheckoutContract,
  CreatePublicFoodCheckoutInput,
  FoodMenuContract,
  FoodProductContract,
  FoodPublicCheckoutContract
} from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PublicCustomerMenu } from "@/components/public-customer-menu";

type PublicStorefrontProps = {
  checkout: FoodPublicCheckoutContract | null;
  createOrderAction: (formData: FormData) => void | Promise<void>;
  menu: FoodMenuContract;
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
  menu,
  trackOrderAction
}: PublicStorefrontProps) {
  const orderFormRef = useRef<HTMLFormElement>(null);
  const products = useMemo(() => flattenProducts(menu), [menu]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardStatus, setCardStatus] = useState<string | null>(null);
  const [mercadoPagoReady, setMercadoPagoReady] = useState(false);
  const [payingWithCard, setPayingWithCard] = useState(false);
  const selectedItems = products.filter((product) => (quantities[product.id] ?? 0) > 0);
  const totalCents = selectedItems.reduce(
    (sum, product) => sum + product.priceCents * (quantities[product.id] ?? 0),
    0
  );
  const publicKey = checkout?.mercadoPago.enabled ? checkout.mercadoPago.publicKey : null;

  const submitCardPayment = useCallback(
    async (formData: CardPaymentFormData, additionalData: CardPaymentAdditionalData) => {
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

      window.location.href = `/l/${encodeURIComponent(menu.store.publicSlug)}/pedido/${encodeURIComponent(
        body.data.order.orderNumber
      )}?created=1&payment=${encodeURIComponent(body.data.paymentStatus)}`;
    },
    [menu.store.publicSlug, products, quantities]
  );

  useEffect(() => {
    if (!publicKey || !mercadoPagoReady || selectedItems.length === 0 || totalCents <= 0) {
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
          amount: totalCents / 100
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
  }, [mercadoPagoReady, publicKey, selectedItems.length, submitCardPayment, totalCents]);

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
        slug={menu.store.publicSlug}
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
        </div>
        <div className="public-store-status">Loja aberta</div>
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
            <p className="public-delivery-note" id="ajuda">
              {menu.store.deliveryNotes}
            </p>
          ) : null}

          <PendingSubmitButton
            disabled={selectedItems.length === 0}
            pendingLabel="Enviando pedido..."
          >
            Enviar pedido
          </PendingSubmitButton>
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

          {selectedItems.length === 0 ? (
            <div className="empty-state public-empty-cart">
              Adicione itens ao pedido para habilitar o pagamento com cartao.
            </div>
          ) : (
            <>
              <div className="public-payment-summary">
                <span>Total selecionado</span>
                <strong>{formatMoney(totalCents)}</strong>
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
}): CreatePublicFoodCheckoutInput & { publicSlug: string } {
  if (!formElement) {
    throw new Error("Formulario do pedido nao esta disponivel.");
  }

  const orderFormData = new FormData(formElement);
  const customerName = normalizeFormText(orderFormData.get("customerName"));
  const customerPhone = normalizeFormText(orderFormData.get("customerPhone"));
  const customerNote = normalizeFormText(orderFormData.get("customerNote"));
  const items = products
    .map((product) => ({
      productId: product.id,
      quantity: quantities[product.id] ?? 0
    }))
    .filter((item) => item.quantity > 0);

  if (!customerName || !customerPhone) {
    throw new Error("Informe nome e WhatsApp antes de pagar com cartao.");
  }

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
    customerName,
    customerNote,
    customerPhone,
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
