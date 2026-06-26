"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  CreatePublicFoodCheckoutContract,
  CreatePublicFoodCheckoutInput,
  FoodOrderFulfillmentMethod,
  FoodMenuContract,
  FoodPublicCartValidationContract,
  FoodPublicCustomerAddressContract,
  FoodPublicCheckoutContract,
  ValidatePublicFoodCartInput
} from "@fp/types";
import { PublicCustomerMenu } from "@/components/public-customer-menu";
import {
  clearPublicCart,
  getPublicCartItemCount,
  readPublicCart,
  type PublicCartItem
} from "@/lib/public-cart-store";
import {
  storeLoginUrl,
  storeOrderUrl,
  storeUrl,
  type PublicStoreUrlContext
} from "@/lib/public-store-urls";

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
    fpFoodCheckoutCardPaymentBrick?: CardPaymentBrickController;
  }
}

type PublicCartReviewProps = {
  addresses: FoodPublicCustomerAddressContract[];
  checkout: FoodPublicCheckoutContract | null;
  customerEmail?: string | null;
  hasSavedPaymentMethods: boolean;
  isAuthenticated: boolean;
  isCustomerCompleteForCheckout: boolean;
  menu: FoodMenuContract;
  storeContext: PublicStoreUrlContext;
};

type CheckoutStepId = "account" | "cart" | "fulfillment" | "payment" | "shipping";
type CheckoutStepStatus = "blocked" | "complete" | "current" | "pending";

export function PublicCartReview({
  addresses,
  checkout,
  customerEmail,
  hasSavedPaymentMethods,
  isAuthenticated,
  isCustomerCompleteForCheckout,
  menu,
  storeContext
}: PublicCartReviewProps) {
  const [cartItems, setCartItems] = useState<PublicCartItem[]>(() =>
    readPublicCart(menu.store.publicSlug)
  );
  const [validation, setValidation] = useState<FoodPublicCartValidationContract | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardStatus, setCardStatus] = useState<string | null>(null);
  const [isPayingWithPix, setIsPayingWithPix] = useState(false);
  const [isPayingWithCard, setIsPayingWithCard] = useState(false);
  const [mercadoPagoReady, setMercadoPagoReady] = useState(false);
  const [customerNote, setCustomerNote] = useState("");
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FoodOrderFulfillmentMethod | null>(
    null
  );
  const [paymentMode, setPaymentMode] = useState<"card" | "pix">("pix");
  const [activeStep, setActiveStep] = useState<CheckoutStepId>("cart");
  const [pixError, setPixError] = useState<string | null>(null);
  const primaryAddress = useMemo(
    () => addresses.find((address) => address.isPrimary) ?? addresses[0] ?? null,
    [addresses]
  );
  const [selectedAddressId, setSelectedAddressId] = useState(primaryAddress?.id ?? "");
  const cartItemsCount = getPublicCartItemCount(cartItems);
  const cartHref = storeUrl(storeContext, "/carrinho");
  const accountHref = storeUrl(storeContext, "/conta");
  const reviewHref = storeUrl(storeContext, "/revisao");
  const loginHref = storeLoginUrl(storeContext, reviewHref);
  const accountReady = isAuthenticated && isCustomerCompleteForCheckout;
  const canValidate = isAuthenticated && isCustomerCompleteForCheckout && cartItems.length > 0;
  const publicKey = checkout?.mercadoPago.enabled ? checkout.mercadoPago.publicKey : null;
  const canPay = Boolean(
    publicKey &&
      validation?.isValidForCheckout &&
      isAuthenticated &&
      isCustomerCompleteForCheckout &&
      isFulfillmentReady(fulfillmentMethod, selectedAddressId)
  );
  const cartReady = Boolean(validation?.isValidForCheckout);
  const fulfillmentReady = isFulfillmentReady(fulfillmentMethod, selectedAddressId);
  const paymentReady = canPay && Boolean(publicKey);
  const cartBlocked = cartItems.length === 0;
  const fulfillmentBlocked = !accountReady || !cartReady;
  const shippingBlocked = fulfillmentBlocked || !fulfillmentMethod;
  const paymentBlocked = !accountReady || !cartReady || !fulfillmentReady || !publicKey;
  const stepStatuses = {
    account: getStepStatus({ isComplete: accountReady }),
    cart: getStepStatus({
      isBlocked: cartBlocked,
      isComplete: cartReady,
      isCurrent: isValidating
    }),
    fulfillment: getStepStatus({
      isBlocked: fulfillmentBlocked,
      isComplete: Boolean(fulfillmentMethod)
    }),
    payment: getStepStatus({
      isBlocked: paymentBlocked,
      isComplete: paymentReady
    }),
    shipping: getStepStatus({
      isBlocked: shippingBlocked,
      isComplete: fulfillmentReady
    })
  } satisfies Record<CheckoutStepId, CheckoutStepStatus>;
  const nextCheckoutStep = getNextCheckoutStep({
    accountReady,
    cartReady,
    fulfillmentReady
  });
  const checkoutStepHintContext = {
    accountReady,
    cartItemsCount,
    cartReady,
    fulfillmentMethod,
    fulfillmentReady,
    isValidating,
    publicKey
  };
  const cartStepActionLabel = getCartStepActionLabel({ accountReady, cartReady });
  const issues = useMemo(
    () => validation?.issues ?? (validationError ? [validationError] : []),
    [validation?.issues, validationError]
  );
  const checkoutItems = useMemo(
    () =>
      validation?.items
        .filter((item) => item.status === "available")
        .map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        })) ?? [],
    [validation?.items]
  );

  function selectFulfillmentMethod(method: FoodOrderFulfillmentMethod) {
    setFulfillmentMethod(method);

    if (method === "delivery" && !selectedAddressId && primaryAddress) {
      setSelectedAddressId(primaryAddress.id);
    }
  }

  const completeCheckout = useCallback(
    (data: CreatePublicFoodCheckoutContract) => {
      clearPublicCart(menu.store.publicSlug);

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      window.location.href = `${storeOrderUrl(
        storeContext,
        data.order.orderNumber
      )}?created=1&payment=${encodeURIComponent(data.paymentStatus)}`;
    },
    [menu.store.publicSlug, storeContext]
  );

  const submitCardPayment = useCallback(
    async (formData: CardPaymentFormData, additionalData: CardPaymentAdditionalData) => {
      if (!fulfillmentMethod) {
        throw new Error("Escolha entrega ou retirada antes de pagar.");
      }

      const paymentMethodType = normalizePaymentMethodType(additionalData.paymentTypeId);
      const payload = buildCheckoutPayload({
        items: checkoutItems,
        customerNote,
        deliveryAddressId: fulfillmentMethod === "delivery" ? selectedAddressId : null,
        fulfillmentMethod,
        payment: {
          cardToken: normalizeFormText(formData.token),
          customerEmail: normalizeFormText(formData.payer?.email),
          installments: Number(formData.installments),
          paymentMethodId: normalizeFormText(formData.payment_method_id),
          paymentMethodType,
          saveForFuture: saveCardForFuture
        },
        publicSlug: menu.store.publicSlug
      });

      setCardError(null);
      setCardStatus("Processando pagamento...");
      setIsPayingWithCard(true);

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
        setIsPayingWithCard(false);
        throw new Error(body?.error ?? "Nao foi possivel processar o pagamento.");
      }

      completeCheckout(body.data);
    },
    [
      checkoutItems,
      completeCheckout,
      customerNote,
      fulfillmentMethod,
      menu.store.publicSlug,
      saveCardForFuture,
      selectedAddressId
    ]
  );

  useEffect(() => {
    setCartItems(readPublicCart(menu.store.publicSlug));
  }, [menu.store.publicSlug]);

  useEffect(() => {
    if (!canValidate) {
      setValidation(null);
      setValidationError(null);
      setIsValidating(false);
      return undefined;
    }

    const controller = new AbortController();
    const payload: ValidatePublicFoodCartInput & { publicSlug: string } = {
      items: cartItems,
      publicSlug: menu.store.publicSlug
    };

    setIsValidating(true);
    setValidationError(null);

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

        setValidation(body.data);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setValidation(null);
        setValidationError(
          error instanceof Error ? error.message : "Nao foi possivel validar o carrinho."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsValidating(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [canValidate, cartItems, menu.store.publicSlug]);

  useEffect(() => {
    if (!canPay || paymentMode !== "card" || !publicKey || !mercadoPagoReady) {
      return undefined;
    }

    let disposed = false;
    setCardError(null);
    window.fpFoodCheckoutCardPaymentBrick?.unmount();
    window.fpFoodCheckoutCardPaymentBrick = undefined;

    if (!window.MercadoPago) {
      setCardError("Mercado Pago.js ainda nao foi carregado.");
      return undefined;
    }

    const mercadoPago = new window.MercadoPago(publicKey, {
      locale: "pt-BR"
    });

    mercadoPago
      .bricks()
      .create("cardPayment", "fp-food-checkout-card-payment-brick", {
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
              setIsPayingWithCard(false);
              throw error;
            }
          }
        },
        initialization: {
          amount: (validation?.totalCents ?? 0) / 100
        }
      })
      .then((controller) => {
        if (disposed) {
          controller.unmount();
          return;
        }

        window.fpFoodCheckoutCardPaymentBrick = controller;
      })
      .catch(() => {
        setCardError("Nao foi possivel inicializar o checkout de cartao.");
      });

    return () => {
      disposed = true;
      window.fpFoodCheckoutCardPaymentBrick?.unmount();
      window.fpFoodCheckoutCardPaymentBrick = undefined;
    };
  }, [
    canPay,
    mercadoPagoReady,
    paymentMode,
    publicKey,
    submitCardPayment,
    validation?.totalCents
  ]);

  async function submitPixPayment() {
    if (!fulfillmentMethod) {
      setPixError("Escolha entrega ou retirada antes de pagar.");
      return;
    }

    const payload = buildCheckoutPayload({
      items: checkoutItems,
      customerNote,
      deliveryAddressId: fulfillmentMethod === "delivery" ? selectedAddressId : null,
      fulfillmentMethod,
      payment: {
        paymentMethodType: "pix"
      },
      publicSlug: menu.store.publicSlug
    });

    setIsPayingWithPix(true);
    setPixError(null);

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
      setPixError(body?.error ?? "Nao foi possivel gerar o pagamento Pix.");
      setIsPayingWithPix(false);
      return;
    }

    completeCheckout(body.data);
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
        active="review"
        contactPhone={menu.store.contactPhone}
        customerEmail={customerEmail}
        isAuthenticated={isAuthenticated}
        storeContext={storeContext}
      />

      <section className="public-hero compact-public-hero">
        <div>
          <div className="eyebrow">Revisao</div>
          <h1>Conferir pedido</h1>
          <p>Antes de entrega e pagamento, a loja revalida produtos, precos e estoque.</p>
          <div className="public-hero-actions">
            <a href={cartHref}>Editar carrinho</a>
            <a href={storeUrl(storeContext)}>Voltar ao cardapio</a>
          </div>
        </div>
        <div className={validation?.isValidForCheckout ? "public-store-status" : "public-store-status closed"}>
          <span>{validation?.isValidForCheckout ? "Carrinho validado" : "Aguardando validacao"}</span>
          <small>{cartItemsCount} item(ns) no carrinho</small>
        </div>
      </section>

      <section className="public-checkout-layout">
        <div className="public-checkout-accordion">
          <CheckoutAccordionStep
            active={activeStep === "cart"}
            eyebrow="Resumo"
            hint={getCheckoutStepHint("cart", checkoutStepHintContext)}
            onOpen={() => setActiveStep("cart")}
            status={stepStatuses.cart}
            title="Carrinho e valores"
          >
            <div className="public-section-heading">
              <div>
                <div className="eyebrow">Tabela</div>
                <h2>Resumo validado</h2>
                <p>Os valores abaixo usam a resposta atual do servidor Food.</p>
              </div>
              <span>{validation?.items.length ?? cartItems.length} produto(s)</span>
            </div>

            {cartItems.length === 0 ? (
              <div className="empty-state public-empty-cart">
                Seu carrinho esta vazio.
                <a className="primary-action" href={storeUrl(storeContext)}>
                  Voltar ao cardapio
                </a>
              </div>
            ) : !accountReady ? (
              <div className="empty-state public-empty-cart">
                Entre e complete seu cadastro para a loja validar o carrinho.
              </div>
            ) : isValidating ? (
              <div className="empty-state public-empty-cart">Validando carrinho com a loja...</div>
            ) : validation ? (
              <div className="data-table" role="table" aria-label="Resumo do carrinho validado">
                <div className="data-row public-review-row data-row-head" role="row">
                  <span>Produto</span>
                  <span>Qtd.</span>
                  <span>Unitario</span>
                  <span>Subtotal</span>
                  <span>Status</span>
                </div>
                {validation.items.map((item) => (
                  <div className="data-row public-review-row" role="row" key={item.productId}>
                    <span>{item.productName ?? "Produto indisponivel"}</span>
                    <span>{item.quantity}</span>
                    <span>{formatMoney(item.unitPriceCents)}</span>
                    <span>{formatMoney(item.totalPriceCents)}</span>
                    <span>{formatStatus(item.status)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state public-empty-cart">
                {validationError ?? "Nao foi possivel validar o carrinho."}
              </div>
            )}

            {issues.length > 0 ? (
              <div className="public-review-issues">
                <strong>Pontos para corrigir</strong>
                {issues.map((issue) => (
                  <span key={issue}>{issue}</span>
                ))}
              </div>
            ) : null}

            <CheckoutStepActions
              disabled={accountReady && !cartReady}
              label={cartStepActionLabel}
              onNext={() => setActiveStep(accountReady ? "fulfillment" : "account")}
              secondaryHref={cartHref}
              secondaryLabel="Editar carrinho"
            />
          </CheckoutAccordionStep>

          <CheckoutAccordionStep
            active={activeStep === "account"}
            eyebrow="Conta"
            hint={getCheckoutStepHint("account", checkoutStepHintContext)}
            onOpen={() => setActiveStep("account")}
            status={stepStatuses.account}
            title="Conta do cliente"
          >
            {!isAuthenticated ? (
              <div className="empty-state public-empty-cart">
                Entre nesta loja para finalizar o pedido com seus dados.
                <a className="primary-action" href={loginHref}>
                  Entrar para comprar
                </a>
              </div>
            ) : !isCustomerCompleteForCheckout ? (
              <div className="empty-state public-empty-cart">
                Complete nome, telefone e aceites antes de finalizar.
                <a className="primary-action" href={accountHref}>
                  Completar cadastro
                </a>
              </div>
            ) : (
              <div className="public-checkout-ready">
                <strong>Cadastro pronto para compra.</strong>
                <span>Nome, telefone e aceites serao usados no pedido.</span>
                <CheckoutStepActions
                  label={cartReady ? "Continuar para recebimento" : "Voltar ao carrinho"}
                  onNext={() => setActiveStep(cartReady ? "fulfillment" : "cart")}
                />
              </div>
            )}
          </CheckoutAccordionStep>

          <CheckoutAccordionStep
            active={activeStep === "fulfillment"}
            disabled={fulfillmentBlocked}
            eyebrow="Recebimento"
            hint={getCheckoutStepHint("fulfillment", checkoutStepHintContext)}
            onOpen={() => setActiveStep("fulfillment")}
            status={stepStatuses.fulfillment}
            title="Entrega ou retirada"
          >
            <div className="public-fulfillment-panel">
              <div className="public-fulfillment-choice-grid">
                <button
                  className={
                    fulfillmentMethod === "delivery"
                      ? "public-fulfillment-choice selected"
                      : "public-fulfillment-choice"
                  }
                  disabled={!menu.availability.isDeliveryOpen}
                  onClick={() => selectFulfillmentMethod("delivery")}
                  type="button"
                >
                  <span>Receber em casa</span>
                  <small>Usar endereco cadastrado ou escolher outro.</small>
                </button>
                <button
                  className={
                    fulfillmentMethod === "pickup"
                      ? "public-fulfillment-choice selected"
                      : "public-fulfillment-choice"
                  }
                  onClick={() => selectFulfillmentMethod("pickup")}
                  type="button"
                >
                  <span>Retirar no balcao</span>
                  <small>Buscar o pedido diretamente na loja.</small>
                </button>
              </div>

              {!menu.availability.isDeliveryOpen ? (
                <p className="public-delivery-note">
                  Entrega indisponivel neste horario.
                </p>
              ) : null}
            </div>

            <CheckoutStepActions
              disabled={!fulfillmentMethod}
              label="Continuar"
              onNext={() => setActiveStep("shipping")}
            />
          </CheckoutAccordionStep>

          <CheckoutAccordionStep
            active={activeStep === "shipping"}
            disabled={shippingBlocked}
            eyebrow={fulfillmentMethod === "pickup" ? "Retirada" : "Endereco"}
            hint={getCheckoutStepHint("shipping", checkoutStepHintContext)}
            onOpen={() => setActiveStep("shipping")}
            status={stepStatuses.shipping}
            title={getShippingStepTitle(fulfillmentMethod)}
          >
            <div className="public-fulfillment-panel">
              {fulfillmentMethod === "delivery" ? (
                addresses.length > 0 ? (
                  <div className="public-address-panel">
                    {selectedAddressId ? (
                      <div className="public-address-selected">
                        <span>Endereco selecionado</span>
                        <strong>
                          {formatAddressOption(
                            addresses.find((address) => address.id === selectedAddressId) ??
                              primaryAddress ??
                              addresses[0]
                          )}
                        </strong>
                      </div>
                    ) : null}
                    <label>
                      Manter endereco padrao ou escolher outro
                      <select
                        name="deliveryAddressId"
                        onChange={(event) => setSelectedAddressId(event.target.value)}
                        required
                        value={selectedAddressId}
                      >
                        {addresses.map((address) => (
                          <option key={address.id} value={address.id}>
                            {formatAddressOption(address)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <a className="secondary-action compact-action" href={accountHref}>
                      Gerenciar enderecos
                    </a>
                  </div>
                ) : (
                  <a className="secondary-action" href={accountHref}>
                    Cadastrar endereco
                  </a>
                )
              ) : (
                <p className="public-delivery-note">
                  A loja avisara quando o pedido estiver pronto para retirada.
                </p>
              )}

              <label>
                Observacao
                <textarea
                  maxLength={600}
                  onChange={(event) => setCustomerNote(event.target.value)}
                  rows={3}
                  value={customerNote}
                />
              </label>
            </div>

            <CheckoutStepActions
              disabled={!fulfillmentReady}
              label={fulfillmentReady ? "Continuar para pagamento" : "Informe o endereco"}
              onNext={() => setActiveStep("payment")}
            />
          </CheckoutAccordionStep>

          <CheckoutAccordionStep
            active={activeStep === "payment"}
            disabled={paymentBlocked}
            eyebrow="Pagamento"
            hint={getCheckoutStepHint("payment", checkoutStepHintContext)}
            onOpen={() => setActiveStep("payment")}
            status={stepStatuses.payment}
            title="Pagamento e confirmacao"
          >
            {!validation?.isValidForCheckout ? (
              <div className="empty-state public-empty-cart">
                Corrija os passos anteriores para liberar o pagamento.
              </div>
            ) : !publicKey ? (
              <div className="empty-state public-empty-cart">
                Pagamento online ainda nao configurado para esta loja.
              </div>
            ) : (
              <div className="public-online-payment" id="pagamento">
                <div>
                  <div className="eyebrow">Gateway</div>
                  <h2>Escolha como pagar</h2>
                  <p>Pix e cartao usam Mercado Pago via FP Gateway.</p>
                </div>

                <div className="public-payment-tabs" role="tablist" aria-label="Forma de pagamento">
                  <button
                    className={paymentMode === "pix" ? "active" : ""}
                    onClick={() => setPaymentMode("pix")}
                    type="button"
                  >
                    Pix
                  </button>
                  <button
                    className={paymentMode === "card" ? "active" : ""}
                    onClick={() => setPaymentMode("card")}
                    type="button"
                  >
                    Cartao
                  </button>
                </div>

                <div className="public-payment-summary">
                  <span>Total validado</span>
                  <strong>{formatMoney(validation.totalCents)}</strong>
                </div>

                {paymentMode === "pix" ? (
                  <div className="public-payment-method-panel">
                    <p>
                      Ao confirmar, o Gateway cria a cobranca Pix no Mercado Pago e abre a
                      experiencia de pagamento retornada pelo provedor.
                    </p>
                    <button
                      className="primary-action"
                      disabled={!canPay || isPayingWithPix}
                      onClick={submitPixPayment}
                      type="button"
                    >
                      {isPayingWithPix ? "Gerando Pix..." : "Pagar com Pix"}
                    </button>
                    {pixError ? <p className="public-payment-error">{pixError}</p> : null}
                  </div>
                ) : (
                  <div className="public-payment-method-panel">
                    {!hasSavedPaymentMethods ? (
                      <label className="checkbox-field public-save-card-option">
                        <input
                          checked={saveCardForFuture}
                          onChange={(event) => setSaveCardForFuture(event.target.checked)}
                          type="checkbox"
                        />
                        Salvar este cartao tokenizado para compras futuras nesta loja.
                      </label>
                    ) : null}
                    <div
                      aria-busy={isPayingWithCard}
                      className={
                        isPayingWithCard
                          ? "public-card-payment is-loading"
                          : "public-card-payment"
                      }
                      id="fp-food-checkout-card-payment-brick"
                    />
                    {cardStatus ? <p className="public-payment-note">{cardStatus}</p> : null}
                    {cardError ? <p className="public-payment-error">{cardError}</p> : null}
                  </div>
                )}
              </div>
            )}
          </CheckoutAccordionStep>
        </div>

        <aside className="public-cart public-checkout-summary">
          <div className="public-cart-heading">
            <div>
              <div className="eyebrow">Revisao final</div>
              <h2>Pedido</h2>
              <p>Confira cada etapa antes de gerar o pagamento.</p>
            </div>
          </div>

          <div className="public-cart-total">
            <span>Subtotal</span>
            <strong>{formatMoney(validation?.subtotalCents ?? 0)}</strong>
          </div>
          <div className="public-cart-total">
            <span>Total</span>
            <strong>{formatMoney(validation?.totalCents ?? 0)}</strong>
          </div>

          {validation?.checkedAt ? (
            <p className="public-delivery-note">
              Validado em {formatDateTime(validation.checkedAt)}.
            </p>
          ) : null}

          <div className="public-checkout-summary-status">
            <span>{accountReady ? "Conta pronta" : "Conta pendente"}</span>
            <span>{cartReady ? "Carrinho validado" : "Carrinho pendente"}</span>
            <span>{fulfillmentReady ? "Recebimento pronto" : "Recebimento pendente"}</span>
            <span>{publicKey ? "Pagamento online ativo" : "Pagamento online pendente"}</span>
          </div>

          <div className="public-cart-actions">
            <a className="secondary-action" href={cartHref}>
              Editar carrinho
            </a>
            <button
              className="primary-action"
              disabled={cartItems.length === 0}
              onClick={() => setActiveStep(nextCheckoutStep)}
              type="button"
            >
              {nextCheckoutStep === "payment" ? "Ir para pagamento" : "Continuar checkout"}
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

function CheckoutAccordionStep({
  active,
  children,
  disabled = false,
  eyebrow,
  hint,
  onOpen,
  status,
  title
}: {
  active: boolean;
  children: ReactNode;
  disabled?: boolean;
  eyebrow: string;
  hint?: string;
  onOpen: () => void;
  status: CheckoutStepStatus;
  title: string;
}) {
  return (
    <article
      className={[
        "public-checkout-step",
        active ? "active" : "",
        disabled ? "blocked" : ""
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        aria-expanded={active}
        className="public-checkout-step-header"
        disabled={disabled}
        onClick={onOpen}
        type="button"
      >
        <span>
          <small>{eyebrow}</small>
          <strong>{title}</strong>
          {hint ? <small className="checkout-step-hint">{hint}</small> : null}
        </span>
        <em className={`checkout-step-status ${status}`}>{formatStepStatus(status)}</em>
      </button>
      {active ? <div className="public-checkout-step-body">{children}</div> : null}
    </article>
  );
}

function CheckoutStepActions({
  disabled = false,
  label,
  onNext,
  secondaryHref,
  secondaryLabel
}: {
  disabled?: boolean;
  label: string;
  onNext: () => void;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="public-checkout-step-actions">
      {secondaryHref && secondaryLabel ? (
        <a className="secondary-action" href={secondaryHref}>
          {secondaryLabel}
        </a>
      ) : null}
      <button className="primary-action" disabled={disabled} onClick={onNext} type="button">
        {label}
      </button>
    </div>
  );
}

function getStepStatus({
  isBlocked = false,
  isComplete,
  isCurrent = false
}: {
  isBlocked?: boolean;
  isComplete: boolean;
  isCurrent?: boolean;
}): CheckoutStepStatus {
  if (isBlocked) {
    return "blocked";
  }

  if (isComplete) {
    return "complete";
  }

  return isCurrent ? "current" : "pending";
}

function getNextCheckoutStep({
  accountReady,
  cartReady,
  fulfillmentReady
}: {
  accountReady: boolean;
  cartReady: boolean;
  fulfillmentReady: boolean;
}): CheckoutStepId {
  if (!accountReady) {
    return "account";
  }

  if (!cartReady) {
    return "cart";
  }

  if (!fulfillmentReady) {
    return "shipping";
  }

  return "payment";
}

function getCartStepActionLabel({
  accountReady,
  cartReady
}: {
  accountReady: boolean;
  cartReady: boolean;
}): string {
  if (!accountReady) {
    return "Continuar para conta";
  }

  return cartReady ? "Continuar para recebimento" : "Aguardando validacao";
}

function getCheckoutStepHint(
  step: CheckoutStepId,
  context: {
    accountReady: boolean;
    cartItemsCount: number;
    cartReady: boolean;
    fulfillmentMethod: FoodOrderFulfillmentMethod | null;
    fulfillmentReady: boolean;
    isValidating: boolean;
    publicKey: string | null;
  }
): string {
  if (step === "account") {
    return context.accountReady ? "Cadastro verificado" : "Obrigatorio para comprar";
  }

  if (step === "cart") {
    if (context.cartItemsCount === 0) {
      return "Carrinho vazio";
    }

    if (!context.accountReady) {
      return "Conta necessaria para validar";
    }

    if (context.isValidating) {
      return "Validando com a loja";
    }

    return context.cartReady ? "Precos e itens conferidos" : "Aguardando validacao";
  }

  if (step === "fulfillment") {
    return context.cartReady ? "Escolha como receber" : "Valide o carrinho primeiro";
  }

  if (step === "shipping") {
    if (!context.cartReady) {
      return "Complete as etapas anteriores";
    }

    if (!context.fulfillmentMethod) {
      return "Escolha entrega ou retirada";
    }

    return context.fulfillmentMethod === "pickup"
      ? "Retirada no balcao"
      : "Escolha o endereco";
  }

  if (!context.publicKey) {
    return "Gateway pendente";
  }

  return context.fulfillmentReady ? "Liberado para pagar" : "Complete recebimento";
}

function formatStepStatus(status: CheckoutStepStatus): string {
  const labels: Record<CheckoutStepStatus, string> = {
    blocked: "Bloqueado",
    complete: "Pronto",
    current: "Em andamento",
    pending: "Pendente"
  };

  return labels[status];
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    available: "Disponivel",
    insufficient_stock: "Estoque insuficiente",
    missing: "Nao encontrado",
    unavailable: "Indisponivel"
  };

  return labels[status] ?? status;
}

function buildCheckoutPayload({
  customerNote,
  deliveryAddressId,
  fulfillmentMethod,
  items,
  payment,
  publicSlug
}: {
  customerNote: string;
  deliveryAddressId: string | null;
  fulfillmentMethod: FoodOrderFulfillmentMethod;
  items: PublicCartItem[];
  payment: CreatePublicFoodCheckoutInput["payment"];
  publicSlug: string;
}): Omit<CreatePublicFoodCheckoutInput, "authUserId" | "email"> & { publicSlug: string } {
  if (items.length === 0) {
    throw new Error("Adicione itens ao carrinho antes de pagar.");
  }

  return {
    customerNote: normalizeFormText(customerNote),
    deliveryAddressId,
    fulfillmentMethod,
    items,
    payment,
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

function isFulfillmentReady(
  fulfillmentMethod: FoodOrderFulfillmentMethod | null,
  selectedAddressId: string
): boolean {
  return fulfillmentMethod === "pickup" || selectedAddressId.trim().length > 0;
}

function getShippingStepTitle(fulfillmentMethod: FoodOrderFulfillmentMethod | null): string {
  if (fulfillmentMethod === "pickup") {
    return "Dados de retirada";
  }

  if (fulfillmentMethod === "delivery") {
    return "Endereco e observacao";
  }

  return "Endereco ou retirada";
}

function formatAddressOption(address: FoodPublicCustomerAddressContract): string {
  const label = address.label ? `${address.label} - ` : "";
  const primary = address.isPrimary ? " (padrao)" : "";
  return `${label}${address.street}, ${address.number} - ${address.city}/${address.state}${primary}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Nao foi possivel processar o pagamento.";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(value / 100);
}
