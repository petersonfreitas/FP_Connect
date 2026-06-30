import Link from "next/link";
import { createInternalFoodOrderAction } from "@/app/actions";
import { CompanySwitcher } from "@/components/company-switcher";
import { formatMoney } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { getFoodPageContext } from "@/lib/food-context";
import {
  getFoodAccess,
  listAllFoodProducts
} from "@/lib/internal-api";

type ServicePageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    orderCreated?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ServicePage({ searchParams }: ServicePageProps) {
  const params = await searchParams;
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const productsResult =
    selectedCompany && !foodAccessResult.error
      ? await listAllFoodProducts(selectedCompany.company.id)
      : { data: null, error: null };
  const availableProducts = (productsResult.data ?? []).filter(
    (product) => product.status === "available"
  );
  const ordersHref = selectedCompany
    ? `/movimentacao/pedidos?companyId=${selectedCompany.company.id}`
    : "/movimentacao/pedidos";

  return (
    <FoodShell activePath="/movimentacao/atendimento">
      <header className="topbar">
        <div>
          <div className="eyebrow">Movimentacao</div>
          <strong>Atendimento</strong>
        </div>
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
      {productsResult.error ? <Notice tone="danger" message={productsResult.error} /> : null}
      {params?.error ? <Notice tone="danger" message={params.error} /> : null}
      {params?.orderCreated ? (
        <Notice tone="success" message="Pedido de balcao criado com sucesso." />
      ) : null}

      <CompanySwitcher
        basePath="/movimentacao/atendimento"
        companies={context.foodCompanies}
        selectedCompanyId={selectedCompany?.company.id}
      />

      {!selectedCompany ? (
        <EmptyFoodAccess />
      ) : (
        <>
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Pedido rapido</div>
                <h1>Atendimento de balcao</h1>
                <p>
                  Monte pedidos presenciais sem exigir cadastro do cliente e envie para a
                  operacao da loja.
                </p>
              </div>
              <div className="panel-heading-actions">
                <span>{availableProducts.length} produto(s) disponivel(is)</span>
                <Link className="secondary-action compact-action" href={ordersHref}>
                  Ver pedidos
                </Link>
              </div>
            </div>

            <form action={createInternalFoodOrderAction} className="store-form">
              <input name="companyId" type="hidden" value={selectedCompany.company.id} />
              <input name="returnTo" type="hidden" value="/movimentacao/atendimento" />
              <div className="form-grid">
                <label>
                  Cliente opcional
                  <input maxLength={120} name="customerName" placeholder="Cliente balcao" />
                </label>
                <label>
                  Telefone opcional
                  <input maxLength={40} name="customerPhone" placeholder="(00) 00000-0000" />
                </label>
              </div>
              <label>
                Observacao do atendimento
                <textarea
                  maxLength={600}
                  name="customerNote"
                  placeholder="Ex.: retirar no balcao, pedido de telefone, sem pressa"
                  rows={3}
                />
              </label>

              {availableProducts.length > 0 ? (
                <div className="order-product-list">
                  {availableProducts.map((product) => (
                    <label className="order-product-row" key={product.id}>
                      <input name="productId" type="hidden" value={product.id} />
                      <span>
                        <strong>{product.name}</strong>
                        <small>{formatMoney(product.priceCents)}</small>
                      </span>
                      <input
                        min={0}
                        max={99}
                        name={`quantity:${product.id}`}
                        placeholder="0"
                        type="number"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  Cadastre produtos disponiveis antes de criar pedidos de balcao.
                </div>
              )}

              <div className="form-footer">
                <span>
                  O pedido nasce como atendimento interno e pode seguir para cozinha mesmo sem
                  pagamento online.
                </span>
                <PendingSubmitButton
                  disabled={availableProducts.length === 0}
                  pendingLabel="Criando..."
                >
                  Criar pedido de balcao
                </PendingSubmitButton>
              </div>
            </form>
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Proximas frentes do atendimento</h1>
                <p>
                  O fluxo de balcao e o primeiro passo para separar venda rapida, pedidos e mesas.
                </p>
              </div>
            </div>
            <div className="service-mode-grid">
              <article className="service-mode-card">
                <span>Balcao</span>
                <strong>Pedido rapido</strong>
                <p>Criacao manual com cliente opcional e envio para acompanhamento.</p>
              </article>
              <article className="service-mode-card">
                <span>Telefone</span>
                <strong>Mesmo fluxo</strong>
                <p>Usa os dados opcionais do cliente e observacao do atendimento.</p>
              </article>
              <article className="service-mode-card">
                <span>Mesas</span>
                <strong>Comanda futura</strong>
                <p>Deve evoluir com mesa, sessao aberta, itens incrementais e fechamento.</p>
              </article>
            </div>
          </section>
        </>
      )}
    </FoodShell>
  );
}
