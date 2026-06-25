"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import type {
  CreatePublicFoodCheckoutContract,
  FoodOrderContract,
  FoodPublicCheckoutContract,
  RetryPublicFoodPaymentInput
} from "@fp/types";
import {
  storeLoginUrl,
  storeOrderUrl,
  storeUrl,
  type PublicStoreUrlContext
} from "@/lib/public-store-urls";

type PublicOrderPaymentRetryProps = {
  checkout: FoodPublicCheckoutContract | null;
  isAuthenticated: boolean;
  isCustomerCompleteForCheckout: boolean;
  order: FoodOrderContract;
  storeContext: PublicStoreUrlContext;
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
    fpFoodRetryCardPaymentBrick?: CardPaymentBrickController;
  }
}

export function PublicOrderPaymentRetry({
  checkout,
  isAuthenticated,
  isCustomerCompleteForCheckout,
  order,
  storeContext
}: PublicOrderPaymentRetryProps) {
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardStatus, setCardStatus] = useState<string | null>(null);
  const [isPayingWithCard, setIsPayingWithCard] = useState(false);
  const [isPayingWithPix, setIsPayingWithPix] = useState(false);
  const [mercadoPagoReady, setMercadoPagoReady] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"card" | "pix">("pix");
  const [pixError, setPixError] = useState<string | null>(null);
  const publicKey = checkout?.mercadoPago.enabled ? checkout.mercadoPago.publicKey : null;
  const loginHref = storeLoginUrl(storeContext, storeOrderUrl(storeContext, order.orderNumber));
  const accountHref = storeUrl(storeContext, "/conta");
  const hasPendingPayment =
    Boolean(publicKey) && order.paymentStatus === "pending" && order.status !== "cancelled";
  const canRetry = isAuthenticated && isCustomerCompleteForCheckout && hasPendingPayment;

  const completeRetry = useCallback(
    (data: CreatePublicFoodCheckoutContract) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      window.location.href = `${storeOrderUrl(
        storeContext,
        order.orderNumber
      )}?retry=1&payment=${encodeURIComponent(data.paymentStatus)}`;
    },
    [order.orderNumber, storeContext]
  );

  const submitCardPayment = useCallback(
    async (formData: CardPaymentFormData, additionalData: CardPaymentAdditionalData) => {
      const paymentMethodType = normalizePaymentMethodType(additionalData.paymentTypeId);
      const payload = buildRetryPayload({
        orderNumber: order.orderNumber,
        payment: {
          cardToken: normalizeFormText(formData.token),
          customerEmail: normalizeFormText(formData.payer?.email),
          installments: Number(formData.installments),
          paymentMethodId: normalizeFormText(formData.payment_method_id),
          paymentMethodType
        },
        publicSlug: storeContext.publicSlug
      });

      setCardError(null);
      setCardStatus("Processando nova tentativa...");
      setIsPayingWithCard(true);

      const response = await fetch("/api/public/checkout/mercado-pago/retry", {
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
        throw new Error(body?.error ?? "Nao foi possivel reprocessar o pagamento.");
      }

      completeRetry(body.data);
    },
    [completeRetry, order.orderNumber, storeContext.publicSlug]
  );

  useEffect(() => {
    if (!canRetry || paymentMode !== "card" || !publicKey || !mercadoPagoReady) {
      return undefined;
    }

    let disposed = false;
    setCardError(null);
    window.fpFoodRetryCardPaymentBrick?.unmount();
    window.fpFoodRetryCardPaymentBrick = undefined;

    if (!window.MercadoPago) {
      setCardError("Mercado Pago.js ainda nao foi carregado.");
      return undefined;
    }

    const mercadoPago = new window.MercadoPago(publicKey, {
      locale: "pt-BR"
    });

    mercadoPago
      .bricks()
      .create("cardPayment", "fp-food-retry-card-payment-brick", {
        callbacks: {
          onError: () => {
            setCardError("Nao foi possivel carregar o checkout de cartao.");
          },
          onReady: () => {
            setCardStatus("Checkout de retentativa pronto.");
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
          amount: order.totalCents / 100
        }
      })
      .then((controller) => {
        if (disposed) {
          controller.unmount();
          return;
        }

        window.fpFoodRetryCardPaymentBrick = controller;
      })
      .catch(() => {
        setCardError("Nao foi possivel inicializar o checkout de cartao.");
      });

    return () => {
      disposed = true;
      window.fpFoodRetryCardPaymentBrick?.unmount();
      window.fpFoodRetryCardPaymentBrick = undefined;
    };
  }, [
    canRetry,
    mercadoPagoReady,
    order.totalCents,
    paymentMode,
    publicKey,
    submitCardPayment
  ]);

  if (!hasPendingPayment) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <section className="public-online-payment">
        <div>
          <div className="eyebrow">Pagamento pendente</div>
          <h2>Entre para pagar novamente</h2>
          <p>A nova tentativa de pagamento exige login para proteger o pedido.</p>
        </div>
        <a className="primary-action" href={loginHref}>
          Entrar
        </a>
      </section>
    );
  }

  if (!isCustomerCompleteForCheckout) {
    return (
      <section className="public-online-payment">
        <div>
          <div className="eyebrow">Pagamento pendente</div>
          <h2>Complete seu cadastro</h2>
          <p>A nova tentativa de pagamento exige os dados minimos do consumidor.</p>
        </div>
        <a className="primary-action" href={accountHref}>
          Minha conta
        </a>
      </section>
    );
  }

  async function submitPixPayment() {
    const payload = buildRetryPayload({
      orderNumber: order.orderNumber,
      payment: {
        paymentMethodType: "pix"
      },
      publicSlug: storeContext.publicSlug
    });

    setIsPayingWithPix(true);
    setPixError(null);

    const response = await fetch("/api/public/checkout/mercado-pago/retry", {
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
      setPixError(body?.error ?? "Nao foi possivel gerar a nova tentativa Pix.");
      setIsPayingWithPix(false);
      return;
    }

    completeRetry(body.data);
  }

  return (
    <section className="public-online-payment">
      <Script
        onReady={() => setMercadoPagoReady(true)}
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
      />

      <div>
        <div className="eyebrow">Pagamento pendente</div>
        <h2>Tentar pagar novamente</h2>
        <p>Crie uma nova tentativa Pix ou Cartao pelo FP Gateway/Mercado Pago.</p>
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
        <span>Total do pedido</span>
        <strong>{formatMoney(order.totalCents)}</strong>
      </div>

      {paymentMode === "pix" ? (
        <div className="public-payment-method-panel">
          <button
            className="primary-action"
            disabled={!canRetry || isPayingWithPix}
            onClick={submitPixPayment}
            type="button"
          >
            {isPayingWithPix ? "Gerando Pix..." : "Pagar com Pix"}
          </button>
          {pixError ? <p className="public-payment-error">{pixError}</p> : null}
        </div>
      ) : (
        <div className="public-payment-method-panel">
          <div
            aria-busy={isPayingWithCard}
            className={isPayingWithCard ? "public-card-payment is-loading" : "public-card-payment"}
            id="fp-food-retry-card-payment-brick"
          />
          {cardStatus ? <p className="public-payment-note">{cardStatus}</p> : null}
          {cardError ? <p className="public-payment-error">{cardError}</p> : null}
        </div>
      )}
    </section>
  );
}

function buildRetryPayload({
  orderNumber,
  payment,
  publicSlug
}: {
  orderNumber: string;
  payment: RetryPublicFoodPaymentInput["payment"];
  publicSlug: string;
}): Omit<RetryPublicFoodPaymentInput, "authUserId" | "email"> & {
  orderNumber: string;
  publicSlug: string;
} {
  return {
    orderNumber,
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

function normalizeFormText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Nao foi possivel reprocessar o pagamento.";
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(value / 100);
}
