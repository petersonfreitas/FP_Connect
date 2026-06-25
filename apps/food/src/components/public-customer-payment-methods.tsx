import type { FoodPublicCustomerPaymentMethodContract } from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type PublicCustomerPaymentMethodsProps = {
  deleteAction: (formData: FormData) => void | Promise<void>;
  paymentMethods: FoodPublicCustomerPaymentMethodContract[];
  publicSlug: string;
  setPrimaryAction: (formData: FormData) => void | Promise<void>;
};

export function PublicCustomerPaymentMethods({
  deleteAction,
  paymentMethods,
  publicSlug,
  setPrimaryAction
}: PublicCustomerPaymentMethodsProps) {
  return (
    <section className="public-account-panel">
      <div className="public-section-heading">
        <div>
          <div className="eyebrow">Pagamento</div>
          <h2>Cartoes salvos</h2>
          <p>
            Salve cartoes tokenizados pelo Mercado Pago durante uma compra com cartao.
            Nao armazenamos numero completo nem codigo de seguranca.
          </p>
        </div>
      </div>

      {paymentMethods.length > 0 ? (
        <div className="public-address-list">
          {paymentMethods.map((paymentMethod) => (
            <article className="public-address-item" key={paymentMethod.id}>
              <div className="public-payment-method-summary">
                <strong>
                  {formatPaymentMethod(paymentMethod)}
                  {paymentMethod.isDefault ? " (padrao)" : ""}
                </strong>
                <small>{formatPaymentMethodStatus(paymentMethod.status)}</small>
              </div>

              <div className="public-address-actions">
                {!paymentMethod.isDefault ? (
                  <form action={setPrimaryAction}>
                    <input name="publicSlug" type="hidden" value={publicSlug} />
                    <input name="paymentMethodId" type="hidden" value={paymentMethod.id} />
                    <PendingSubmitButton className="secondary-action compact-action" pendingLabel="Salvando...">
                      Tornar padrao
                    </PendingSubmitButton>
                  </form>
                ) : null}
                <form action={deleteAction}>
                  <input name="publicSlug" type="hidden" value={publicSlug} />
                  <input name="paymentMethodId" type="hidden" value={paymentMethod.id} />
                  <PendingSubmitButton className="secondary-action compact-action danger-action" pendingLabel="Removendo...">
                    Remover
                  </PendingSubmitButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state public-empty-cart">
          Nenhum cartao salvo. Na primeira compra com cartao, marque a opcao para guardar
          os dados tokenizados para compras futuras.
        </div>
      )}
    </section>
  );
}

function formatPaymentMethod(paymentMethod: FoodPublicCustomerPaymentMethodContract): string {
  const brand = paymentMethod.cardBrand ?? paymentMethod.paymentMethodId ?? "Cartao";
  const type = paymentMethod.paymentMethodType === "debit_card" ? "debito" : "credito";
  const finalDigits = paymentMethod.cardLast4 ? ` final ${paymentMethod.cardLast4}` : "";

  return `${brand.toUpperCase()} ${type}${finalDigits}`;
}

function formatPaymentMethodStatus(
  status: FoodPublicCustomerPaymentMethodContract["status"]
): string {
  if (status === "active") {
    return "Disponivel para compras futuras.";
  }

  if (status === "pending_tokenization") {
    return "Aguardando confirmacao do cofre do Gateway.";
  }

  return "Inativo.";
}
