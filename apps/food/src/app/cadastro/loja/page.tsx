import Link from "next/link";
import { CompanySwitcher } from "@/components/company-switcher";
import { StoreForm } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { displayCompanyName, getFoodPageContext } from "@/lib/food-context";
import { getFoodAccess, getFoodStore } from "@/lib/internal-api";

type StorePageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    saved?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function StorePage({ searchParams }: StorePageProps) {
  const params = await searchParams;
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const storeResult =
    selectedCompany && !foodAccessResult.error
      ? await getFoodStore(selectedCompany.company.id)
      : { data: null, error: null };
  const missingStore =
    storeResult.error?.includes("404") || storeResult.error?.includes("ainda nao configurada");

  return (
    <FoodShell activePath="/cadastro/loja">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Loja</strong>
        </div>
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {params?.error ? <Notice tone="danger" message={params.error} /> : null}
      {params?.saved ? <Notice tone="success" message="Loja Food salva com sucesso." /> : null}

      <CompanySwitcher
        basePath="/cadastro/loja"
        companies={context.foodCompanies}
        selectedCompanyId={selectedCompany?.company.id}
      />

      {!selectedCompany ? (
        <EmptyFoodAccess />
      ) : foodAccessResult.error ? (
        <Notice tone="danger" message={foodAccessResult.error} />
      ) : storeResult.error && !missingStore ? (
        <Notice tone="danger" message={storeResult.error} />
      ) : (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>{displayCompanyName(selectedCompany)}</h1>
              <p>Configuracao operacional da loja Food vinculada a empresa.</p>
            </div>
            <div className="panel-heading-actions">
              <span>{storeResult.data ? "Configurada" : "Primeira configuracao"}</span>
              {storeResult.data ? (
                <div className="store-link-actions">
                  <a
                    className="primary-action compact-action"
                    href={`/l/${encodeURIComponent(storeResult.data.publicSlug)}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir vitrine
                  </a>
                  <Link
                    className="secondary-action compact-action"
                    href={`/movimentacao/cardapio?companyId=${selectedCompany.company.id}`}
                  >
                    Abrir cardapio
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
          {storeResult.data ? (
            <div className="store-public-link">
              <span>Link publico</span>
              <strong>/l/{storeResult.data.publicSlug}</strong>
              <small>
                Compartilhe este caminho com clientes ou use para validar a experiencia publica.
              </small>
            </div>
          ) : null}
          <StoreForm company={selectedCompany} store={storeResult.data} />
        </section>
      )}
    </FoodShell>
  );
}
