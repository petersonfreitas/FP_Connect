import { redirect } from "next/navigation";
import { completeGatewayMercadoPagoOAuth } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

type MercadoPagoCallbackPageProps = {
  searchParams?: Promise<{
    code?: string;
    error?: string;
    error_description?: string;
    state?: string;
  }>;
};

export default async function MercadoPagoCallbackPage({
  searchParams
}: MercadoPagoCallbackPageProps) {
  const query = searchParams ? await searchParams : {};
  const companyId = readCompanyIdFromState(query.state);

  if (!companyId) {
    redirect(
      `/gateway?tab=payments&error=${encodeURIComponent(
        query.error_description ?? query.error ?? "Callback Mercado Pago sem empresa valida."
      )}`
    );
  }

  if (query.error || !query.code || !query.state) {
    redirect(
      `/gateway?companyId=${companyId}&tab=payments&error=${encodeURIComponent(
        query.error_description ?? query.error ?? "Mercado Pago nao retornou codigo OAuth."
      )}`
    );
  }

  const result = await completeGatewayMercadoPagoOAuth(companyId, {
    code: query.code,
    state: query.state
  });

  if (result.error) {
    redirect(`/gateway?companyId=${companyId}&tab=payments&error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/gateway?companyId=${companyId}&tab=payments&mpOAuth=connected`);
}

function readCompanyIdFromState(state: string | undefined): string | null {
  const encodedPayload = state?.split(".")[0];

  if (!encodedPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as
      | { companyId?: unknown }
      | undefined;

    return typeof payload?.companyId === "string" ? payload.companyId : null;
  } catch {
    return null;
  }
}
