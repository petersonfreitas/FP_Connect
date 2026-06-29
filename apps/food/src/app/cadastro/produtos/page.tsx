import Link from "next/link";
import { ProductForm, formatMoney } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { CompanySwitcher } from "@/components/company-switcher";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { getFoodPageContext } from "@/lib/food-context";
import {
  getFoodAccess,
  listAllFoodCategories,
  listFoodProducts
} from "@/lib/internal-api";

type ProductsPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    edit?: string;
    error?: string;
    page?: string;
    productCreated?: string;
    productUpdated?: string;
  }>;
};

export const dynamic = "force-dynamic";
const pageSize = 20;

const productStatusLabels = {
  available: "Disponivel",
  hidden: "Oculto",
  unavailable: "Indisponivel"
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = normalizePage(params?.page);
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const [categoriesResult, productsResult] =
    selectedCompany && !foodAccessResult.error
      ? await Promise.all([
          listAllFoodCategories(selectedCompany.company.id),
          listFoodProducts(selectedCompany.company.id, { page, pageSize })
        ])
      : [{ data: null, error: null }, { data: null, error: null }];
  const categories = categoriesResult.data ?? [];
  const pagination = productsResult.data;
  const products = pagination?.items ?? [];
  const editingProduct = products.find((product) => product.id === params?.edit);
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <FoodShell activePath="/cadastro/produtos">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Produtos</strong>
        </div>
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
      {categoriesResult.error ? <Notice tone="danger" message={categoriesResult.error} /> : null}
      {productsResult.error ? <Notice tone="danger" message={productsResult.error} /> : null}
      {params?.error ? <Notice tone="danger" message={params.error} /> : null}
      {params?.productCreated ? <Notice tone="success" message="Produto criado com sucesso." /> : null}
      {params?.productUpdated ? <Notice tone="success" message="Produto atualizado com sucesso." /> : null}

      <CompanySwitcher
        basePath="/cadastro/produtos"
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
                <h1>{editingProduct ? "Editar produto" : "Novo produto"}</h1>
                <p>Cadastre itens vendidos no Food e vincule a uma categoria quando aplicavel.</p>
              </div>
              {editingProduct ? (
                <Link
                  className="secondary-action"
                  href={`/cadastro/produtos?companyId=${selectedCompany.company.id}`}
                >
                  Novo produto
                </Link>
              ) : null}
            </div>
            <ProductForm
              categories={categories}
              companyId={selectedCompany.company.id}
              product={editingProduct}
            />
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Produtos cadastrados</h1>
                <p>Lista paginada dos produtos da empresa selecionada.</p>
              </div>
              <span>{pagination?.total ?? 0} registro(s)</span>
            </div>

            {products.length > 0 ? (
              <div className="data-table" role="table" aria-label="Produtos cadastrados">
                <div className="data-row food-products-row data-row-head" role="row">
                  <span>Imagem</span>
                  <span>Produto</span>
                  <span>Categoria</span>
                  <span>Preco</span>
                  <span>Status</span>
                  <span>Estoque</span>
                  <span />
                </div>
                {products.map((product) => (
                  <div className="data-row food-products-row" role="row" key={product.id}>
                    <span>
                      {product.imageUrl ? (
                        <img
                          alt={product.name}
                          className="product-list-image"
                          src={product.imageUrl}
                        />
                      ) : (
                        <span className="product-list-placeholder">Sem foto</span>
                      )}
                    </span>
                    <span>
                      <strong>{product.name}</strong>
                      <small>{product.slug}</small>
                    </span>
                    <span>{product.categoryId ? categoryNames.get(product.categoryId) ?? "Categoria removida" : "Sem categoria"}</span>
                    <span>{formatMoney(product.priceCents)}</span>
                    <span>{productStatusLabels[product.status]}</span>
                    <span>
                      {formatProductStock(product)}
                      {isProductAtOrBelowMinStock(product) ? (
                        <small className="stock-alert">Abaixo do minimo</small>
                      ) : null}
                    </span>
                    <Link href={`/cadastro/produtos?companyId=${selectedCompany.company.id}&edit=${product.id}`}>
                      Editar
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Nenhum produto cadastrado ainda.</div>
            )}

            {pagination ? (
              <PaginationControls
                basePath="/cadastro/produtos"
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

function formatProductStock(product: {
  stockControlEnabled: boolean;
  stockMinQuantity: number;
  stockQuantity: number;
}): string {
  return product.stockControlEnabled
    ? `${product.stockQuantity} atual / ${product.stockMinQuantity} minimo`
    : "Nao controla";
}

function isProductAtOrBelowMinStock(product: {
  stockControlEnabled: boolean;
  stockMinQuantity: number;
  stockQuantity: number;
}): boolean {
  return product.stockControlEnabled && product.stockQuantity <= product.stockMinQuantity;
}
