"use client";

import type { AdminBasicPlanContract, CnpjLookupContract, CompanyPersonType } from "@fp/types";
import { useState, type FormEvent } from "react";
import { isValidCnpj, isValidCpf, onlyDigits } from "@/lib/br-documents";

type CompanyFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  basicPlans: AdminBasicPlanContract[];
};

export function CompanyForm({ action, basicPlans }: CompanyFormProps) {
  const [personType, setPersonType] = useState<CompanyPersonType>("legal_entity");
  const [document, setDocument] = useState("");
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [implementationNotes, setImplementationNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lookupStatus, setLookupStatus] = useState<string | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  const documentLabel = personType === "individual" ? "CPF" : "CNPJ";
  const documentMaxLength = personType === "individual" ? 11 : 14;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const digits = onlyDigits(document);
    const isValidDocument =
      personType === "individual" ? isValidCpf(digits) : isValidCnpj(digits);

    if (!isValidDocument) {
      event.preventDefault();
      setValidationError(`${documentLabel} invalido.`);
      return;
    }

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
    setPrimaryPhone((body.primaryPhone ?? "").slice(0, 20));

    if (body.address && !implementationNotes) {
      setImplementationNotes(`Endereco consultado: ${body.address}`.slice(0, 1000));
    }

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
            onChange={(event) => setDocument(onlyDigits(event.target.value).slice(0, documentMaxLength))}
            required
            value={document}
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
        <select name="basicPlanId" defaultValue="">
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
          maxLength={20}
          name="primaryPhone"
          onChange={(event) => setPrimaryPhone(event.target.value)}
          value={primaryPhone}
        />
      </label>

      <label>
        Responsavel principal
        <input maxLength={140} name="primaryResponsibleName" required />
      </label>

      <label>
        E-mail do responsavel
        <input maxLength={254} name="primaryResponsibleEmail" type="email" />
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
        <a className="secondary-action" href="/cadastro/empresas">
          Cancelar
        </a>
        <button className="primary-action" type="submit">
          Salvar empresa
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
