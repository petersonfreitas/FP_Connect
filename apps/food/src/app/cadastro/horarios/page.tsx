import { CompanySwitcher } from "@/components/company-switcher";
import { StoreHoursForm } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { displayCompanyName, getFoodPageContext } from "@/lib/food-context";
import { getFoodAccess, getFoodStore, listFoodStoreHours } from "@/lib/internal-api";

type StoreHoursPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    hoursSaved?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function StoreHoursPage({ searchParams }: StoreHoursPageProps) {
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
  const hoursResult =
    selectedCompany && storeResult.data && !foodAccessResult.error
      ? await listFoodStoreHours(selectedCompany.company.id)
      : { data: [], error: null };
  const missingStore =
    storeResult.error?.includes("404") || storeResult.error?.includes("ainda nao configurada");

  return (
    <FoodShell activePath="/cadastro/horarios">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Horarios</strong>
        </div>
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
      {storeResult.error && !missingStore ? <Notice tone="danger" message={storeResult.error} /> : null}
      {hoursResult.error ? <Notice tone="danger" message={hoursResult.error} /> : null}
      {params?.error ? <Notice tone="danger" message={params.error} /> : null}
      {params?.hoursSaved ? <Notice tone="success" message="Horarios salvos com sucesso." /> : null}

      <CompanySwitcher
        basePath="/cadastro/horarios"
        companies={context.foodCompanies}
        selectedCompanyId={selectedCompany?.company.id}
      />

      {!selectedCompany ? (
        <EmptyFoodAccess />
      ) : foodAccessResult.error || (storeResult.error && !missingStore) ? (
        null
      ) : missingStore ? (
        <Notice tone="warning" message="Configure a loja antes de definir horarios." />
      ) : (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>{displayCompanyName(selectedCompany)}</h1>
              <p>Defina janelas de pedidos e deixe a base de entregas pronta para o proximo bloco.</p>
            </div>
            <span>{storeResult.data?.status === "open" ? "Loja aberta" : "Loja nao aberta"}</span>
          </div>
          <StoreHoursForm companyId={selectedCompany.company.id} hours={hoursResult.data ?? []} />
        </section>
      )}
    </FoodShell>
  );
}
