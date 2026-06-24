import { NextResponse } from "next/server";
import type { ValidatePublicFoodCartInput } from "@fp/types";
import { getCurrentPublicStoreUser } from "@/lib/auth";
import {
  ensurePublicFoodCustomerStoreAccess,
  validatePublicFoodCart
} from "@/lib/internal-api";

type PublicCartValidationRequest = ValidatePublicFoodCartInput & {
  publicSlug?: string | null;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PublicCartValidationRequest | null;
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
        error: "Entre para validar o carrinho."
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
        error: "Complete seu cadastro antes de validar o carrinho."
      },
      {
        status: 400
      }
    );
  }

  const result = await validatePublicFoodCart(publicSlug, {
    items: body?.items ?? []
  });

  if (result.error || !result.data) {
    return NextResponse.json(
      {
        error: result.error ?? "Nao foi possivel validar o carrinho."
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
