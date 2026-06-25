import type { FoodPublicCustomerAddressContract } from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type PublicCustomerAddressesFormProps = {
  addresses: FoodPublicCustomerAddressContract[];
  deleteAction: (formData: FormData) => void | Promise<void>;
  publicSlug: string;
  saveAction: (formData: FormData) => void | Promise<void>;
  setPrimaryAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
};

export function PublicCustomerAddressesForm({
  addresses,
  deleteAction,
  publicSlug,
  saveAction,
  setPrimaryAction,
  updateAction
}: PublicCustomerAddressesFormProps) {
  return (
    <section className="public-account-panel">
      <div>
        <div className="eyebrow">Entrega</div>
        <h2>Enderecos de entrega</h2>
        <p>Cadastre mais de um endereco e mantenha um deles como padrao.</p>
      </div>

      {addresses.length > 0 ? (
        <div className="public-address-list">
          {addresses.map((address) => (
            <article className="public-address-item" key={address.id}>
              <div>
                <strong>
                  {address.label ?? "Endereco"} {address.isPrimary ? "(padrao)" : ""}
                </strong>
                <p>
                  {address.street}, {address.number}
                  {address.complement ? ` - ${address.complement}` : ""} - {address.city}/
                  {address.state}
                </p>
                {address.reference ? <small>{address.reference}</small> : null}
              </div>
              <div className="public-address-actions">
                {!address.isPrimary ? (
                  <form action={setPrimaryAction}>
                    <input name="publicSlug" type="hidden" value={publicSlug} />
                    <input name="addressId" type="hidden" value={address.id} />
                    <PendingSubmitButton className="secondary-action compact-action" pendingLabel="Salvando...">
                      Tornar padrao
                    </PendingSubmitButton>
                  </form>
                ) : null}
                <form action={deleteAction}>
                  <input name="publicSlug" type="hidden" value={publicSlug} />
                  <input name="addressId" type="hidden" value={address.id} />
                  <PendingSubmitButton className="secondary-action compact-action danger-action" pendingLabel="Removendo...">
                    Remover
                  </PendingSubmitButton>
                </form>
              </div>

              <details className="public-address-edit">
                <summary>Editar endereco</summary>
                <AddressFields
                  action={updateAction}
                  address={address}
                  publicSlug={publicSlug}
                  submitLabel="Salvar endereco"
                />
              </details>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state public-empty-cart">
          Cadastre ao menos um endereco para liberar checkout de entrega.
        </div>
      )}

      <AddressFields
        action={saveAction}
        publicSlug={publicSlug}
        submitLabel="Adicionar endereco"
      />
    </section>
  );
}

function AddressFields({
  action,
  address,
  publicSlug,
  submitLabel
}: {
  action: (formData: FormData) => void | Promise<void>;
  address?: FoodPublicCustomerAddressContract;
  publicSlug: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="form-grid">
      <input name="publicSlug" type="hidden" value={publicSlug} />
      {address ? <input name="addressId" type="hidden" value={address.id} /> : null}
      <label>
        Apelido
        <input
          defaultValue={address?.label ?? ""}
          maxLength={80}
          name="label"
          placeholder="Casa, trabalho..."
        />
      </label>
      <label>
        CEP
        <input
          defaultValue={address?.postalCode ?? ""}
          inputMode="numeric"
          maxLength={16}
          name="postalCode"
          placeholder="00000-000"
        />
      </label>
      <label className="span-2">
        Rua
        <input defaultValue={address?.street ?? ""} maxLength={160} name="street" required />
      </label>
      <label>
        Numero
        <input defaultValue={address?.number ?? ""} maxLength={20} name="number" required />
      </label>
      <label>
        Complemento
        <input defaultValue={address?.complement ?? ""} maxLength={120} name="complement" />
      </label>
      <label>
        Bairro
        <input defaultValue={address?.district ?? ""} maxLength={120} name="district" />
      </label>
      <label>
        Cidade
        <input defaultValue={address?.city ?? ""} maxLength={120} name="city" required />
      </label>
      <label>
        UF
        <input
          defaultValue={address?.state ?? ""}
          maxLength={2}
          name="state"
          placeholder="SP"
          required
        />
      </label>
      <label className="span-2">
        Referencia
        <input
          defaultValue={address?.reference ?? ""}
          maxLength={160}
          name="reference"
          placeholder="Perto de..."
        />
      </label>
      <label className="checkbox-field span-2">
        <input defaultChecked={address?.isPrimary ?? false} name="isPrimary" type="checkbox" />
        Usar como endereco padrao
      </label>
      <div className="form-actions span-2">
        <PendingSubmitButton pendingLabel="Salvando...">
          {submitLabel}
        </PendingSubmitButton>
      </div>
    </form>
  );
}
