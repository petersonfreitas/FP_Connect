"use client";

import { useState } from "react";
import type {
  FoodCustomerPreferredContactMethod,
  FoodPublicCustomerSessionContract
} from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type PublicCustomerProfileFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  publicSlug: string;
  session: FoodPublicCustomerSessionContract | null;
};

export function PublicCustomerProfileForm({
  action,
  publicSlug,
  session
}: PublicCustomerProfileFormProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(
    Boolean(session?.account.termsAcceptedAt)
  );
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(
    Boolean(session?.account.privacyAcceptedAt)
  );
  const preferredContactMethod: FoodCustomerPreferredContactMethod =
    session?.customer.preferredContactMethod ?? "whatsapp";
  const canSubmit = acceptedTerms && acceptedPrivacy;

  return (
    <form action={action} className="form-grid">
      <input name="publicSlug" type="hidden" value={publicSlug} />

      <label className="span-2">
        Nome completo
        <input
          defaultValue={session?.customer.fullName ?? ""}
          maxLength={120}
          name="fullName"
          placeholder="Seu nome"
          required
        />
      </label>

      <label>
        Telefone/WhatsApp
        <input
          defaultValue={session?.primaryPhone?.phoneE164 ?? ""}
          maxLength={40}
          name="phone"
          placeholder="(00) 00000-0000"
          required
        />
      </label>

      <label>
        Canal preferido
        <select defaultValue={preferredContactMethod} name="preferredContactMethod">
          <option value="whatsapp">WhatsApp</option>
          <option value="cellphone">Celular</option>
          <option value="email">Email</option>
          <option value="landline">Telefone fixo</option>
        </select>
      </label>

      <label className="checkbox-field span-2">
        <input
          checked={acceptedTerms}
          name="acceptedTerms"
          onChange={(event) => setAcceptedTerms(event.target.checked)}
          type="checkbox"
        />
        Aceito os termos de uso da loja.
      </label>

      <label className="checkbox-field span-2">
        <input
          checked={acceptedPrivacy}
          name="acceptedPrivacy"
          onChange={(event) => setAcceptedPrivacy(event.target.checked)}
          type="checkbox"
        />
        Aceito a politica de privacidade para compra online.
      </label>

      <div className="form-actions span-2">
        <PendingSubmitButton disabled={!canSubmit} pendingLabel="Salvando...">
          Salvar cadastro
        </PendingSubmitButton>
      </div>
    </form>
  );
}
