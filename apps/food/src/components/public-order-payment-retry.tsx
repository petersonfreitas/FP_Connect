"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import type {
  CreatePublicFoodCheckoutContract,
  FoodOrderContract,
  FoodPublicCheckoutContract,
  RetryPublicFoodPaymentInput
} from "@fp/types";

type PublicOrderPaymentRetryProps = {
  checkout: FoodPublicCheckoutContract | null;
  isAuthenticated: boolean;
  order: FoodOrderContract;
  slug: string;
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
  order,
  slug
}: PublicOrderPaymentRetryProps) {
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardStatus, setCardStatus] = useState<string | null>(null);
  const [mercadoPagoReady, setMercadoPagoReady] = useState(false);
  const [payingWithCard, setPayingWithCard] = useState(false);
  const publicKey = checkout?.mercadoPago.enabled ? checkout.mercadoPago.publicKey : null;
  const loginHref = `/login?next=${encodeURIComponent(
    `/l/${slug}/pedido/${order.orderNumber}`
  )}`;
  const hasPendingPayment =
    Boolean(publicKey) && order.paymentStatus === "pending" && order.status !== "cancelled";
  const canRetry = isAuthenticated && hasPendingPayment;

  const submitCardPayment = useCallback(
    async (formData: CardPaymentFormData, additionalData: CardPaymentAdditionalData) => {
      if (!isAuthenticated) {
        window.location.href = loginHref;
        return;
      }

      const payload = buildRetryPayload({
        additionalData,
        formData,
        orderNumber: order.orderNumber,
        publicSlug: slug
      });

      setCardError(null);
      setCardStatus("Processando nova tentativa...");
      setPayingWithCard(true);

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
        setPayingWithCard(false);
        throw new Error(body?.error ?? "Nao foi possivel reprocessar o pagamento.");
      }

      window.location.href = `/l/${encodeURIComponent(slug)}/pedido/${encodeURIComponent(
        order.orderNumber
      )}?retry=1&payment=${encodeURIComponent(body.data.paymentStatus)}`;
    },
    [isAuthenticated, loginHref, order.orderNumber, slug]
  );

  useEffect(() => {
    if (!canRetry || !publicKey || !mercadoPagoReady || order.totalCents <= 0) {
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
              setPayingWithCard(false);
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
  }, [canRetry, mercadoPagoReady, order.totalCents, publicKey, submitCardPayment]);

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
        <p>
          Use outro cartao ou outro cenario de teste Mercado Pago para criar uma nova tentativa
          sem duplicar o pedido.
        </p>
      </div>

      <div className="public-payment-summary">
        <span>Total do pedido</span>
        <strong>{formatMoney(order.totalCents)}</strong>
      </div>
      <div
        aria-busy={payingWithCard}
        className={payingWithCard ? "public-card-payment is-loading" : "public-card-payment"}
        id="fp-food-retry-card-payment-brick"
      />
      {cardStatus ? <p className="public-payment-note">{cardStatus}</p> : null}
      {cardError ? <p className="public-payment-error">{cardError}</p> : null}
    </section>
  );
}

function buildRetryPayload({
  additionalData,
  formData,
  orderNumber,
  publicSlug
}: {
  additionalData: CardPaymentAdditionalData;
  formData: CardPaymentFormData;
  orderNumber: string;
  publicSlug: string;
}): RetryPublicFoodPaymentInput & {
  orderNumber: string;
  publicSlug: string;
} {
  const cardToken = normalizeFormText(formData.token);
  const customerEmail = normalizeFormText(formData.payer?.email);
  const paymentMethodId = normalizeFormText(formData.payment_method_id);
  const installments = Number(formData.installments);
  const paymentMethodType = normalizePaymentMethodType(additionalData.paymentTypeId);

  if (!cardToken || !customerEmail || !paymentMethodId || !Number.isFinite(installments)) {
    throw new Error("Dados de pagamento incompletos no Mercado Pago.");
  }

  return {
    orderNumber,
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
