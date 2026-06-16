import Link from "next/link";
import { CategoryForm } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { CompanySwitcher } from "@/components/company-switcher";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { getFoodPageContext } from "@/lib/food-context";
import { getFoodAccess, listFoodCategories } from "@/lib/internal-api";

type CategoriesPageProps = {
  searchParams?: Promise<{
    categoryCreated?: string;
    categoryUpdated?: string;
    companyId?: string;
    edit?: string;
    error?: string;
    page?: string;
  }>;
};

export const dynamic = "force-dynamic";
const pageSize = 20;

const categoryStatusLabels = {
  active: "Ativa",
  inactive: "Inativa"
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const params = await searchParams;
  const page = normalizePage(params?.page);
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const categoriesResult =
    selectedCompany && !foodAccessResult.error
      ? await listFoodCategories(selectedCompany.company.id, { page, pageSize })
      : { data: null, error: null };
  const pagination = categoriesResult.data;
  const categories = pagination?.items ?? [];
  const editingCategory = categories.find((category) => category.id === params?.edit);

  return (
    <FoodShell activePath="/cadastro/categorias">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Categorias</strong>
        </div>
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
      {categoriesResult.error ? <Notice tone="danger" message={categoriesResult.error} /> : null}
      {params?.error ? <Notice tone="danger" message={params.error} /> : null}
      {params?.categoryCreated ? <Notice tone="success" message="Categoria criada com sucesso." /> : null}
      {params?.categoryUpdated ? (
        <Notice tone="success" message="Categoria atualizada com sucesso." />
      ) : null}

      <CompanySwitcher
        basePath="/cadastro/categorias"
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
                <h1>{editingCategory ? "Editar categoria" : "Nova categoria"}</h1>
                <p>Organize o cardapio por grupos como Lanches, Bebidas e Sobremesas.</p>
              </div>
              {editingCategory ? (
                <Link
                  className="secondary-action"
                  href={`/cadastro/categorias?companyId=${selectedCompany.company.id}`}
                >
                  Nova categoria
                </Link>
              ) : null}
            </div>
            <CategoryForm category={editingCategory} companyId={selectedCompany.company.id} />
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Categorias cadastradas</h1>
                <p>Lista paginada das categorias da empresa selecionada.</p>
              </div>
              <span>{pagination?.total ?? 0} registro(s)</span>
            </div>

            {categories.length > 0 ? (
              <div className="data-table" role="table" aria-label="Categorias cadastradas">
                <div className="data-row food-categories-row data-row-head" role="row">
                  <span>Categoria</span>
                  <span>Status</span>
                  <span>Ordem</span>
                  <span />
                </div>
                {categories.map((category) => (
                  <div className="data-row food-categories-row" role="row" key={category.id}>
                    <span>
                      <strong>{category.name}</strong>
                      <small>{category.slug}</small>
                    </span>
                    <span>{categoryStatusLabels[category.status]}</span>
                    <span>{category.sortOrder}</span>
                    <Link href={`/cadastro/categorias?companyId=${selectedCompany.company.id}&edit=${category.id}`}>
                      Editar
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Nenhuma categoria cadastrada ainda.</div>
            )}

            {pagination ? (
              <PaginationControls
                basePath="/cadastro/categorias"
                page={pagination.page}
                pageSize={pagination.pageSize}
                params={{ companyId: selectedCompany.company.id }}
                total={pagination.total}
                totalPages={pagination.totalPages}
              />
            ) : null}
          </section>
        </>
      )}
    </FoodShell>
  );
}

function normalizePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
