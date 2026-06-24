import type { FoodPublicCustomerAddressContract } from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type PublicCustomerAddressesFormProps = {
  addresses: FoodPublicCustomerAddressContract[];
  publicSlug: string;
  saveAction: (formData: FormData) => void | Promise<void>;
  setPrimaryAction: (formData: FormData) => void | Promise<void>;
};

export function PublicCustomerAddressesForm({
  addresses,
  publicSlug,
  saveAction,
  setPrimaryAction
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
              {!address.isPrimary ? (
                <form action={setPrimaryAction}>
                  <input name="publicSlug" type="hidden" value={publicSlug} />
                  <input name="addressId" type="hidden" value={address.id} />
                  <PendingSubmitButton className="secondary-action compact-action" pendingLabel="Salvando...">
                    Tornar padrao
                  </PendingSubmitButton>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state public-empty-cart">
          Cadastre ao menos um endereco para liberar checkout de entrega.
        </div>
      )}

      <form action={saveAction} className="form-grid">
        <input name="publicSlug" type="hidden" value={publicSlug} />
        <label>
          Apelido
          <input maxLength={80} name="label" placeholder="Casa, trabalho..." />
        </label>
        <label>
          CEP
          <input inputMode="numeric" maxLength={16} name="postalCode" placeholder="00000-000" />
        </label>
        <label className="span-2">
          Rua
          <input maxLength={160} name="street" required />
        </label>
        <label>
          Numero
          <input maxLength={20} name="number" required />
        </label>
        <label>
          Complemento
          <input maxLength={120} name="complement" />
        </label>
        <label>
          Bairro
          <input maxLength={120} name="district" />
        </label>
        <label>
          Cidade
          <input maxLength={120} name="city" required />
        </label>
        <label>
          UF
          <input maxLength={2} name="state" placeholder="SP" required />
        </label>
        <label className="span-2">
          Referencia
          <input maxLength={160} name="reference" placeholder="Perto de..." />
        </label>
        <label className="checkbox-field span-2">
          <input name="isPrimary" type="checkbox" />
          Usar como endereco padrao
        </label>
        <div className="form-actions span-2">
          <PendingSubmitButton pendingLabel="Salvando...">
            Adicionar endereco
          </PendingSubmitButton>
        </div>
      </form>
    </section>
  );
}
