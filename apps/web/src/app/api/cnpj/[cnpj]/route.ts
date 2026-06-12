import type { CnpjLookupContract } from "@fp/types";
import { NextResponse } from "next/server";
import { isValidCnpj, normalizeBrazilPhone, onlyDigits } from "@/lib/br-documents";

const DEFAULT_CNPJ_LOOKUP_BASE_URL = "https://brasilapi.com.br/api/cnpj/v1";
const DEFAULT_CNPJ_LOOKUP_USER_AGENT =
  "FP-Connect/0.1 (+https://github.com/petersonfreitas/FP_Connect)";
const CNPJ_LOOKUP_TIMEOUT_MS = 8000;
const MAX_CNPJ_LOOKUP_ATTEMPTS = 3;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export const runtime = "nodejs";

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

  const { response, error } = await fetchBrasilApiCnpj(digits);

  if (error) {
    return NextResponse.json(
      { message: "Nao foi possivel consultar o provedor de CNPJ." },
      { status: 503 }
    );
  }

  if (!response?.ok) {
    return NextResponse.json(
      { message: `Consulta de CNPJ respondeu ${response?.status ?? 503}` },
      { status: response?.status ?? 503 }
    );
  }

  const body = (await response.json()) as BrasilApiCnpjResponse;
  const parsedStreet = parseStreet(body.logradouro);
  const result: CnpjLookupContract = {
    cnpj: onlyDigits(body.cnpj ?? digits),
    legalName: body.razao_social ?? "",
    tradeName: body.nome_fantasia || null,
    primaryEmail: body.email || null,
    primaryPhone: normalizeBrazilPhone(body.ddd_telefone_1 ?? "").value || null,
    addressPostalCode: onlyDigits(body.cep ?? "") || null,
    addressStreetType: parsedStreet.type,
    addressStreet: parsedStreet.street,
    addressNumber: body.numero || null,
    addressComplement: body.complemento || null,
    addressDistrict: body.bairro || null,
    addressCity: body.municipio || null,
    addressState: body.uf || null
  };

  return NextResponse.json(result);
}

function getCnpjLookupBaseUrl(): string {
  return (process.env.FP_CNPJ_LOOKUP_BASE_URL?.trim() || DEFAULT_CNPJ_LOOKUP_BASE_URL).replace(
    /\/$/,
    ""
  );
}

async function fetchBrasilApiCnpj(
  digits: string
): Promise<{ response: Response | null; error: Error | null }> {
  const url = `${getCnpjLookupBaseUrl()}/${digits}`;

  for (let attempt = 1; attempt <= MAX_CNPJ_LOOKUP_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CNPJ_LOOKUP_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": getCnpjLookupUserAgent()
        },
        signal: controller.signal
      });

      if (!shouldRetry(response.status) || attempt === MAX_CNPJ_LOOKUP_ATTEMPTS) {
        return { response, error: null };
      }
    } catch (error) {
      if (attempt === MAX_CNPJ_LOOKUP_ATTEMPTS) {
        return {
          response: null,
          error: error instanceof Error ? error : new Error("CNPJ lookup failed")
        };
      }
    } finally {
      clearTimeout(timeout);
    }

    await delay(300 * attempt);
  }

  return { response: null, error: new Error("CNPJ lookup failed") };
}

function getCnpjLookupUserAgent(): string {
  return process.env.FP_CNPJ_LOOKUP_USER_AGENT?.trim() || DEFAULT_CNPJ_LOOKUP_USER_AGENT;
}

function shouldRetry(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function parseStreet(value: string | undefined): { street: string | null; type: string | null } {
  const street = value?.trim();

  if (!street) {
    return {
      street: null,
      type: null
    };
  }

  const knownTypes = ["Rua", "Avenida", "Rodovia", "Travessa", "Alameda", "Estrada", "Praca", "Largo"];
  const streetLower = street.toLowerCase();
  const type = knownTypes.find((item) => streetLower.startsWith(`${item.toLowerCase()} `));

  if (!type) {
    return {
      street,
      type: null
    };
  }

  return {
    street: street.slice(type.length).trim() || street,
    type
  };
}
