import { CompanySwitcher } from "@/components/company-switcher";
import { FoodShell } from "@/components/food-shell";
import { PaginationControls } from "@/components/pagination-controls";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import type { FoodStockMovementContract, FoodStockMovementType } from "@fp/types";
import { createFoodStockEntryAction } from "@/app/actions";
import { getFoodPageContext } from "@/lib/food-context";
import {
  getFoodAccess,
  listAllFoodProducts,
  listFoodStockMovements
} from "@/lib/internal-api";

type StockPageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    page?: string;
    stockEntryCreated?: string;
  }>;
};

export const dynamic = "force-dynamic";
const pageSize = 20;

export default async function StockPage({ searchParams }: StockPageProps) {
  const params = await searchParams;
  const page = normalizePage(params?.page);
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const [productsResult, movementsResult] =
    selectedCompany && !foodAccessResult.error
      ? await Promise.all([
          listAllFoodProducts(selectedCompany.company.id),
          listFoodStockMovements(selectedCompany.company.id, { page, pageSize })
        ])
      : [{ data: null, error: null }, { data: null, error: null }];
  const controlledProducts = (productsResult.data ?? []).filter(
    (product) => product.stockControlEnabled
  );
  const movements = movementsResult.data?.items ?? [];

  return (
    <FoodShell activePath="/movimentacao/estoque">
      <header className="topbar">
        <div>
          <div className="eyebrow">Movimentacao</div>
          <strong>Estoque</strong>
        </div>
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
      {productsResult.error ? <Notice tone="danger" message={productsResult.error} /> : null}
      {movementsResult.error ? <Notice tone="danger" message={movementsResult.error} /> : null}
      {params?.error ? <Notice tone="danger" message={params.error} /> : null}
      {params?.stockEntryCreated ? (
        <Notice tone="success" message="Entrada de estoque registrada com sucesso." />
      ) : null}

      <CompanySwitcher
        basePath="/movimentacao/estoque"
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
                <h1>Entrada de estoque</h1>
                <p>Some uma nova entrada ao saldo atual do produto e guarde NF, lote e validade.</p>
              </div>
              <span>{controlledProducts.length} produto(s) com controle</span>
            </div>

            <form action={createFoodStockEntryAction} className="store-form">
              <input name="companyId" type="hidden" value={selectedCompany.company.id} />

              <div className="form-grid">
                <label>
                  Produto
                  <select name="productId" required>
                    <option value="">Selecione um produto</option>
                    {controlledProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - atual {product.stockQuantity} / minimo{" "}
                        {product.stockMinQuantity}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantidade de entrada
                  <input min={1} name="quantity" placeholder="0" required type="number" />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  NF de entrada
                  <input maxLength={80} name="invoiceNumber" placeholder="Numero da nota" />
                </label>
                <label>
                  Lote
                  <input maxLength={80} name="batchCode" placeholder="Lote ou codigo interno" />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  Validade
                  <input name="expiresAt" type="date" />
                </label>
                <label>
                  Observacao
                  <input maxLength={600} name="notes" placeholder="Compra, ajuste ou fornecedor" />
                </label>
              </div>

              <div className="form-footer">
                <span>Produtos sem controle de estoque continuam fora deste painel.</span>
                <PendingSubmitButton
                  disabled={controlledProducts.length === 0}
                  pendingLabel="Registrando..."
                >
                  Registrar entrada
                </PendingSubmitButton>
              </div>
            </form>
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Historico de movimentacoes</h1>
                <p>Entradas registradas com saldo anterior e novo saldo do produto.</p>
              </div>
              <span>{movementsResult.data?.total ?? 0} registro(s)</span>
            </div>

            {movements.length > 0 ? (
              <div className="data-table" role="table" aria-label="Movimentacoes de estoque">
                <div className="data-row stock-movements-row data-row-head" role="row">
                  <span>Produto</span>
                  <span>Movimento</span>
                  <span>Saldo</span>
                  <span>NF / lote</span>
                  <span>Data</span>
                </div>
                {movements.map((movement) => (
                  <div className="data-row stock-movements-row" role="row" key={movement.id}>
                    <span>
                      <strong>{movement.productName ?? "Produto removido"}</strong>
                      {movement.expiresAt ? <small>Validade {formatDate(movement.expiresAt)}</small> : null}
                    </span>
                    <span>{formatMovementQuantity(movement)}</span>
                    <span>
                      {movement.previousQuantity} para {movement.newQuantity}
                    </span>
                    <span>
                      {movement.invoiceNumber ?? "Sem NF"}
                      {movement.batchCode ? <small>Lote {movement.batchCode}</small> : null}
                    </span>
                    <span>{formatDateTime(movement.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Nenhuma movimentacao de estoque registrada ainda.</div>
            )}

            {movementsResult.data ? (
              <PaginationControls
                basePath="/movimentacao/estoque"
                page={movementsResult.data.page}
                pageSize={movementsResult.data.pageSize}
                params={{ companyId: selectedCompany.company.id }}
                total={movementsResult.data.total}
                totalPages={movementsResult.data.totalPages}
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatMovementQuantity(movement: FoodStockMovementContract): string {
  const signal = movement.movementType === "sale" ? "-" : "+";
  return `${getMovementTypeLabel(movement.movementType)} ${signal}${movement.quantity}`;
}

function getMovementTypeLabel(type: FoodStockMovementType): string {
  const labels: Record<FoodStockMovementType, string> = {
    adjustment: "Ajuste",
    entry: "Entrada",
    sale: "Venda"
  };

  return labels[type];
}
