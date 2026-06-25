import { NextResponse } from "next/server";
import type { CreatePublicFoodCheckoutInput } from "@fp/types";
import { getCurrentPublicStoreUser } from "@/lib/auth";
import {
  createPublicFoodCheckout,
  ensurePublicFoodCustomerStoreAccess
} from "@/lib/internal-api";

type PublicCheckoutRequest = Omit<CreatePublicFoodCheckoutInput, "authUserId" | "email"> & {
  publicSlug?: string | null;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PublicCheckoutRequest | null;
  const publicSlug = typeof body?.publicSlug === "string" ? body.publicSlug.trim() : "";

  if (!publicSlug) {
    return NextResponse.json(
      {
        error: "Loja publica nao informada."
      },
      {
        status: 400
      }
    );
  }

  const currentUser = await getCurrentPublicStoreUser(publicSlug);

  if (!currentUser) {
    return NextResponse.json(
      {
        error: "Entre para finalizar o pedido."
      },
      {
        status: 401
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

  if (!customerSessionResult.data?.isCompleteForCheckout) {
    return NextResponse.json(
      {
        error: "Complete seu cadastro antes de finalizar o pedido."
      },
      {
        status: 400
      }
    );
  }

  const result = await createPublicFoodCheckout(publicSlug, {
    authUserId: currentUser.id,
    customerName: customerSessionResult.data.customer.fullName,
    customerNote: body?.customerNote,
    customerPhone: customerSessionResult.data.primaryPhone?.phoneE164 ?? null,
    deliveryAddressId: body?.deliveryAddressId,
    email: currentUser.email,
    items: body?.items ?? [],
    payment: body?.payment
      ? {
          ...body.payment,
          customerEmail: body.payment.customerEmail ?? currentUser.email
        }
      : body?.payment
  });

  if (result.error || !result.data) {
    return NextResponse.json(
      {
        error: result.error ?? "Nao foi possivel processar o pagamento."
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
