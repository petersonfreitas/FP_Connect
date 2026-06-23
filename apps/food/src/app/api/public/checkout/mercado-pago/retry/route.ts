import { NextResponse } from "next/server";
import type { RetryPublicFoodPaymentInput } from "@fp/types";
import { getCurrentUser } from "@/lib/auth";
import {
  ensurePublicFoodCustomerStoreAccess,
  retryPublicFoodPayment
} from "@/lib/internal-api";

type PublicPaymentRetryRequest = RetryPublicFoodPaymentInput & {
  orderNumber?: string | null;
  publicSlug?: string | null;
};

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      {
        error: "Entre para tentar pagar novamente."
      },
      {
        status: 401
      }
    );
  }

  const body = (await request.json().catch(() => null)) as PublicPaymentRetryRequest | null;
  const publicSlug = typeof body?.publicSlug === "string" ? body.publicSlug.trim() : "";
  const orderNumber = typeof body?.orderNumber === "string" ? body.orderNumber.trim() : "";

  if (!publicSlug || !orderNumber) {
    return NextResponse.json(
      {
        error: "Loja publica ou pedido nao informado."
      },
      {
        status: 400
      }
    );
  }

  const customerSessionResult = await ensurePublicFoodCustomerStoreAccess(publicSlug, {
    authUserId: currentUser.id,
    email: currentUser.email
  });

  if (customerSessionResult.error) {
    return NextResponse.json(
      {
        error: customerSessionResult.error
      },
      {
        status: 400
      }
    );
  }

  const result = await retryPublicFoodPayment(publicSlug, orderNumber, {
    payment: body?.payment
  });

  if (result.error || !result.data) {
    return NextResponse.json(
      {
        error: result.error ?? "Nao foi possivel reprocessar o pagamento."
      },
      {
        status: 400
      }
    );
  }

  return NextResponse.json({
    data: result.data
  });
}
