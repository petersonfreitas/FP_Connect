import { NextResponse } from "next/server";
import type { CreatePublicFoodCheckoutInput } from "@fp/types";
import { createPublicFoodCheckout } from "@/lib/internal-api";

type PublicCheckoutRequest = CreatePublicFoodCheckoutInput & {
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

  const result = await createPublicFoodCheckout(publicSlug, {
    customerName: body?.customerName,
    customerNote: body?.customerNote,
    customerPhone: body?.customerPhone,
    items: body?.items ?? [],
    payment: body?.payment
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
