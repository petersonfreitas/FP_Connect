import Link from "next/link";
import { CompanySwitcher } from "@/components/company-switcher";
import { MenuPreview } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { getFoodPageContext } from "@/lib/food-context";
import { getFoodAccess, getFoodMenu } from "@/lib/internal-api";

type MenuPageProps = {
  searchParams?: Promise<{
    companyId?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const params = await searchParams;
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const menuResult =
    selectedCompany && !foodAccessResult.error
      ? await getFoodMenu(selectedCompany.company.id)
      : { data: null, error: null };

  return (
    <FoodShell activePath="/movimentacao/cardapio">
      <header className="topbar">
        <div>
          <div className="eyebrow">Movimentacao</div>
          <strong>Cardapio</strong>
        </div>
        {selectedCompany ? (
          <Link
            className="secondary-action"
            href={`/cadastro/produtos?companyId=${selectedCompany.company.id}`}
          >
            Gerenciar produtos
          </Link>
        ) : null}
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
      {menuResult.error ? <Notice tone="danger" message={menuResult.error} /> : null}

      <CompanySwitcher
        basePath="/movimentacao/cardapio"
        companies={context.foodCompanies}
        selectedCompanyId={selectedCompany?.company.id}
      />

      {!selectedCompany ? <EmptyFoodAccess /> : <MenuPreview menu={menuResult.data} />}
    </FoodShell>
  );
}
