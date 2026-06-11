import type { CnpjLookupContract } from "@fp/types";
import { NextResponse } from "next/server";
import { isValidCnpj, normalizeBrazilPhone, onlyDigits } from "@/lib/br-documents";

const DEFAULT_CNPJ_LOOKUP_BASE_URL = "https://brasilapi.com.br/api/cnpj/v1";

type CnpjRouteProps = {
  params: Promise<{
    cnpj: string;
  }>;
};

type BrasilApiCnpjResponse = {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  email?: string;
  ddd_telefone_1?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
};

export async function GET(_request: Request, { params }: CnpjRouteProps) {
  const { cnpj } = await params;
  const digits = onlyDigits(cnpj);

  if (!isValidCnpj(digits)) {
    return NextResponse.json({ message: "CNPJ invalido" }, { status: 400 });
  }

  const response = await fetch(`${getCnpjLookupBaseUrl()}/${digits}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: `Consulta de CNPJ respondeu ${response.status}` },
      { status: response.status }
    );
  }

  const body = (await response.json()) as BrasilApiCnpjResponse;
  const result: CnpjLookupContract = {
    cnpj: onlyDigits(body.cnpj ?? digits),
    legalName: body.razao_social ?? "",
    tradeName: body.nome_fantasia || null,
    primaryEmail: body.email || null,
    primaryPhone: normalizeBrazilPhone(body.ddd_telefone_1 ?? "").value || null,
    address: formatAddress(body)
  };

  return NextResponse.json(result);
}

function getCnpjLookupBaseUrl(): string {
  return (process.env.FP_CNPJ_LOOKUP_BASE_URL?.trim() || DEFAULT_CNPJ_LOOKUP_BASE_URL).replace(
    /\/$/,
    ""
  );
}

function formatAddress(body: BrasilApiCnpjResponse): string | null {
  const street = [body.logradouro, body.numero].filter(Boolean).join(", ");
  const city = [body.municipio, body.uf].filter(Boolean).join(" - ");
  const parts = [street, body.complemento, body.bairro, city, body.cep].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : null;
}
