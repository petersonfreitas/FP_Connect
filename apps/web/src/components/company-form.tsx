"use client";

import type {
  AdminBasicPlanContract,
  AdminCompanyContract,
  CnpjLookupContract,
  CompanyPersonType
} from "@fp/types";
import { useState, type FormEvent } from "react";
import { isValidCnpj, isValidCpf, normalizeBrazilPhone, onlyDigits } from "@/lib/br-documents";

type CompanyFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  basicPlans: AdminBasicPlanContract[];
  cancelHref?: string;
  company?: AdminCompanyContract;
  submitLabel?: string;
};

export function CompanyForm({
  action,
  basicPlans,
  cancelHref = "/cadastro/empresas",
  company,
  submitLabel = "Salvar empresa"
}: CompanyFormProps) {
  const [personType, setPersonType] = useState<CompanyPersonType>(
    company?.personType ?? "legal_entity"
  );
  const [document, setDocument] = useState(company?.document ?? "");
  const [legalName, setLegalName] = useState(company?.legalName ?? "");
  const [tradeName, setTradeName] = useState(company?.tradeName ?? "");
  const [primaryEmail, setPrimaryEmail] = useState(company?.primaryEmail ?? "");
  const [primaryPhone, setPrimaryPhone] = useState(company?.primaryPhone ?? "");
  const [primaryMobilePhone, setPrimaryMobilePhone] = useState(company?.primaryMobilePhone ?? "");
  const [addressPostalCode, setAddressPostalCode] = useState(company?.addressPostalCode ?? "");
  const [addressStreetType, setAddressStreetType] = useState(company?.addressStreetType ?? "");
  const [addressStreet, setAddressStreet] = useState(company?.addressStreet ?? "");
  const [addressNumber, setAddressNumber] = useState(company?.addressNumber ?? "");
  const [addressComplement, setAddressComplement] = useState(company?.addressComplement ?? "");
  const [addressDistrict, setAddressDistrict] = useState(company?.addressDistrict ?? "");
  const [addressCity, setAddressCity] = useState(company?.addressCity ?? "");
  const [addressState, setAddressState] = useState(company?.addressState ?? "");
  const [implementationNotes, setImplementationNotes] = useState(
    company?.implementationNotes ?? ""
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lookupStatus, setLookupStatus] = useState<string | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  const documentLabel = personType === "individual" ? "CPF" : "CNPJ";
  const documentMaxLength = personType === "individual" ? 14 : 18;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const digits = onlyDigits(document);
    const isValidDocument =
      personType === "individual" ? isValidCpf(digits) : isValidCnpj(digits);
    const normalizedPhone = normalizeBrazilPhone(primaryPhone);
    const normalizedMobilePhone = normalizeBrazilPhone(primaryMobilePhone);
    const postalCode = onlyDigits(addressPostalCode);

    if (!isValidDocument) {
      event.preventDefault();
      setValidationError(`${documentLabel} invalido.`);
      return;
    }

    if (!normalizedPhone.isValid) {
      event.preventDefault();
      setValidationError("Telefone invalido. Informe DDD + numero ou +55 + DDD + numero.");
      return;
    }

    if (normalizedMobilePhone.value && (!normalizedMobilePhone.isValid || !normalizedMobilePhone.isMobile)) {
      event.preventDefault();
      setValidationError("Celular invalido. Informe DDD + numero de celular.");
      return;
    }

    if (postalCode && postalCode.length !== 8) {
      event.preventDefault();
      setValidationError("CEP invalido.");
      return;
    }

    const documentInput = event.currentTarget.elements.namedItem("document");
    if (documentInput instanceof HTMLInputElement) {
      documentInput.value = digits;
    }

    const phoneInput = event.currentTarget.elements.namedItem("primaryPhone");
    if (phoneInput instanceof HTMLInputElement) {
      phoneInput.value = normalizedPhone.value;
    }
    setPrimaryPhone(normalizedPhone.value);

    const mobilePhoneInput = event.currentTarget.elements.namedItem("primaryMobilePhone");
    if (mobilePhoneInput instanceof HTMLInputElement) {
      mobilePhoneInput.value = normalizedMobilePhone.value;
    }
    setPrimaryMobilePhone(normalizedMobilePhone.value);

    const postalCodeInput = event.currentTarget.elements.namedItem("addressPostalCode");
    if (postalCodeInput instanceof HTMLInputElement) {
      postalCodeInput.value = postalCode;
    }
    setAddressPostalCode(postalCode);

    setValidationError(null);
  }

  async function handleCnpjLookup() {
    const digits = onlyDigits(document);
    if (!isValidCnpj(digits)) {
      setValidationError("CNPJ invalido.");
      return;
    }

    setValidationError(null);
    setLookupStatus(null);
    setIsLookupLoading(true);

    const response = await fetch(`/api/cnpj/${digits}`);
    const body = (await response.json().catch(() => null)) as
      | CnpjLookupContract
      | { message?: string }
      | null;

    setIsLookupLoading(false);

    if (!response.ok || !isCnpjLookup(body)) {
      setLookupStatus(readLookupError(body));
      return;
    }

    setLegalName(body.legalName.slice(0, 180));
    setTradeName((body.tradeName ?? "").slice(0, 140));
    setPrimaryEmail((body.primaryEmail ?? "").slice(0, 254));
    setPrimaryPhone(normalizeBrazilPhone(body.primaryPhone ?? "").value.slice(0, 20));
    setAddressPostalCode(body.addressPostalCode ?? "");
    setAddressStreetType(body.addressStreetType ?? "");
    setAddressStreet((body.addressStreet ?? "").slice(0, 160));
    setAddressNumber((body.addressNumber ?? "").slice(0, 20));
    setAddressComplement((body.addressComplement ?? "").slice(0, 120));
    setAddressDistrict((body.addressDistrict ?? "").slice(0, 120));
    setAddressCity((body.addressCity ?? "").slice(0, 120));
    setAddressState(body.addressState ?? "");

    setLookupStatus("Dados cadastrais preenchidos a partir do CNPJ.");
  }

  return (
    <form className="form-grid" action={action} onSubmit={handleSubmit}>
      {validationError ? (
        <div className="form-alert" role="status">
          {validationError}
        </div>
      ) : null}

      {lookupStatus ? (
        <div className="form-alert neutral" role="status">
          {lookupStatus}
        </div>
      ) : null}

      <label>
        Tipo de pessoa
        <select
          name="personType"
          value={personType}
          onChange={(event) => {
            const value = event.target.value as CompanyPersonType;
            setPersonType(value);
            setDocument("");
            setValidationError(null);
            setLookupStatus(null);
          }}
        >
          <option value="legal_entity">Pessoa Juridica</option>
          <option value="individual">Pessoa Fisica</option>
        </select>
      </label>

      <label>
        {documentLabel}
        <div className="input-with-action">
          <input
            inputMode="numeric"
            maxLength={documentMaxLength}
            name="document"
            onChange={(event) => {
              const maxDigits = personType === "individual" ? 11 : 14;
              setDocument(formatDocument(onlyDigits(event.target.value).slice(0, maxDigits), personType));
            }}
            required
            value={formatDocument(document, personType)}
          />
          {personType === "legal_entity" ? (
            <button
              className="secondary-action"
              disabled={isLookupLoading}
              onClick={handleCnpjLookup}
              type="button"
            >
              {isLookupLoading ? "Buscando" : "Buscar CNPJ"}
            </button>
          ) : null}
        </div>
      </label>

      <label>
        Razao social / Nome completo
        <input
          maxLength={180}
          name="legalName"
          onChange={(event) => setLegalName(event.target.value)}
          required
          value={legalName}
        />
      </label>

      <label>
        Nome fantasia
        <input
          maxLength={140}
          name="tradeName"
          onChange={(event) => setTradeName(event.target.value)}
          value={tradeName}
        />
      </label>

      <label>
        Plano base
        <select name="basicPlanId" defaultValue={company?.basicPlanId ?? ""}>
          <option value="">Sem plano definido</option>
          {basicPlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        E-mail principal
        <input
          maxLength={254}
          name="primaryEmail"
          onChange={(event) => setPrimaryEmail(event.target.value)}
          type="email"
          value={primaryEmail}
        />
      </label>

      <label>
        Telefone principal
        <input
          maxLength={15}
          name="primaryPhone"
          onBlur={() => {
            const normalizedPhone = normalizeBrazilPhone(primaryPhone);

            if (normalizedPhone.isValid) {
              setPrimaryPhone(formatBrazilPhone(normalizedPhone.value));
            }
          }}
          onChange={(event) => setPrimaryPhone(formatBrazilPhone(event.target.value))}
          placeholder="(11) 3333-4444"
          value={formatBrazilPhone(primaryPhone)}
        />
      </label>

      <label>
        Celular / WhatsApp
        <input
          maxLength={16}
          name="primaryMobilePhone"
          onBlur={() => {
            const normalizedPhone = normalizeBrazilPhone(primaryMobilePhone);

            if (normalizedPhone.isValid && normalizedPhone.isMobile) {
              setPrimaryMobilePhone(formatBrazilPhone(normalizedPhone.value));
            }
          }}
          onChange={(event) => setPrimaryMobilePhone(formatBrazilPhone(event.target.value))}
          placeholder="(11) 93333-4444"
          value={formatBrazilPhone(primaryMobilePhone)}
        />
      </label>

      <label>
        Responsavel principal
        <input
          defaultValue={company?.primaryResponsibleName ?? ""}
          maxLength={140}
          name="primaryResponsibleName"
          required
        />
      </label>

      <label>
        E-mail do responsavel
        <input
          defaultValue={company?.primaryResponsibleEmail ?? ""}
          maxLength={254}
          name="primaryResponsibleEmail"
          type="email"
        />
      </label>

      <label>
        CEP
        <input
          inputMode="numeric"
          maxLength={9}
          name="addressPostalCode"
          onChange={(event) => setAddressPostalCode(formatPostalCode(event.target.value))}
          placeholder="00000-000"
          value={formatPostalCode(addressPostalCode)}
        />
      </label>

      <label>
        Tipo de logradouro
        <select
          name="addressStreetType"
          onChange={(event) => setAddressStreetType(event.target.value)}
          value={addressStreetType}
        >
          <option value="">Selecione</option>
          {streetTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label>
        Logradouro
        <input
          maxLength={160}
          name="addressStreet"
          onChange={(event) => setAddressStreet(event.target.value)}
          value={addressStreet}
        />
      </label>

      <label>
        Numero
        <input
          maxLength={20}
          name="addressNumber"
          onChange={(event) => setAddressNumber(event.target.value)}
          value={addressNumber}
        />
      </label>

      <label>
        Complemento
        <input
          maxLength={120}
          name="addressComplement"
          onChange={(event) => setAddressComplement(event.target.value)}
          value={addressComplement}
        />
      </label>

      <label>
        Bairro
        <input
          maxLength={120}
          name="addressDistrict"
          onChange={(event) => setAddressDistrict(event.target.value)}
          value={addressDistrict}
        />
      </label>

      <label>
        Cidade
        <input
          maxLength={120}
          name="addressCity"
          onChange={(event) => setAddressCity(event.target.value)}
          value={addressCity}
        />
      </label>

      <label>
        Estado
        <select
          name="addressState"
          onChange={(event) => setAddressState(event.target.value)}
          value={addressState}
        >
          <option value="">Selecione</option>
          {brazilianStates.map((state) => (
            <option key={state.uf} value={state.uf}>
              {state.uf} - {state.name}
            </option>
          ))}
        </select>
      </label>

      <label className="form-full">
        Observacoes de implantacao
        <textarea
          maxLength={1000}
          name="implementationNotes"
          onChange={(event) => setImplementationNotes(event.target.value)}
          rows={4}
          value={implementationNotes}
        />
      </label>

      <div className="form-actions">
        <a className="secondary-action" href={cancelHref}>
          Cancelar
        </a>
        <button className="primary-action" type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function isCnpjLookup(value: CnpjLookupContract | { message?: string } | null): value is CnpjLookupContract {
  return Boolean(value && "legalName" in value);
}

function readLookupError(value: CnpjLookupContract | { message?: string } | null): string {
  if (value && "message" in value && value.message) {
    return value.message;
  }

  return "Nao foi possivel consultar o CNPJ.";
}

function formatDocument(value: string, personType: CompanyPersonType): string {
  const digits = onlyDigits(value);

  if (personType === "individual") {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

function formatPostalCode(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

function formatBrazilPhone(value: string): string {
  const digits = onlyDigits(value);
  const nationalNumber =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
      ? digits.slice(2)
      : digits;
  const limited = nationalNumber.slice(0, 11);

  if (limited.length <= 2) {
    return limited;
  }

  if (limited.length <= 10) {
    return limited
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/^(\(\d{2}\) \d{4})(\d)/, "$1-$2");
  }

  return limited
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/^(\(\d{2}\) \d{5})(\d)/, "$1-$2");
}

const streetTypes = [
  "Rua",
  "Avenida",
  "Rodovia",
  "Travessa",
  "Alameda",
  "Estrada",
  "Praca",
  "Largo",
  "Outro"
];

const brazilianStates = [
  { uf: "AC", name: "Acre" },
  { uf: "AL", name: "Alagoas" },
  { uf: "AP", name: "Amapa" },
  { uf: "AM", name: "Amazonas" },
  { uf: "BA", name: "Bahia" },
  { uf: "CE", name: "Ceara" },
  { uf: "DF", name: "Distrito Federal" },
  { uf: "ES", name: "Espirito Santo" },
  { uf: "GO", name: "Goias" },
  { uf: "MA", name: "Maranhao" },
  { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "MG", name: "Minas Gerais" },
  { uf: "PA", name: "Para" },
  { uf: "PB", name: "Paraiba" },
  { uf: "PR", name: "Parana" },
  { uf: "PE", name: "Pernambuco" },
  { uf: "PI", name: "Piaui" },
  { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "RN", name: "Rio Grande do Norte" },
  { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondonia" },
  { uf: "RR", name: "Roraima" },
  { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "Sao Paulo" },
  { uf: "SE", name: "Sergipe" },
  { uf: "TO", name: "Tocantins" }
];
