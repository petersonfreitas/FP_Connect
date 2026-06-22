import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PaginationControls } from "@/components/pagination-controls";
import { listCurrentUserCompanies } from "@/lib/internal-api";

export const dynamic = "force-dynamic";
const pageSize = 20;

type CompanyPortfolioPageProps = {
  searchParams?: Promise<{
    module?: string;
    page?: string;
    q?: string;
    status?: string;
  }>;
};

const statusLabels = {
  active: "Ativa",
  cancelled: "Cancelada",
  implementation: "Em implantacao",
  suspended: "Suspensa"
};

const membershipStatusLabels = {
  active: "Vinculo ativo",
  inactive: "Vinculo inativo",
  invited: "Convite pendente"
};

const moduleOptions = [
  { key: "food", label: "FP Food" },
  { key: "gateway", label: "FP Gateway" },
  { key: "robots", label: "FP Robots" }
];

export default async function CompanyPortfolioPage({
  searchParams
}: CompanyPortfolioPageProps) {
  const query = searchParams ? await searchParams : {};
  const page = normalizePage(query.page);
  const filters = {
    module: normalizeFilterValue(query.module),
    q: normalizeFilterValue(query.q),
    status: normalizeFilterValue(query.status)
  };
  const hasFilters = Boolean(filters.module || filters.q || filters.status);
  const companiesResult = await listCurrentUserCompanies({
    module: filters.module,
    page,
    pageSize,
    q: filters.q,
    status: filters.status
  });
  const pagination = companiesResult.data;
  const companies = pagination?.items ?? [];

  return (
    <AppShell activePath="/carteira/empresas">
      <header className="topbar">
        <div>
          <div className="eyebrow">Carteira</div>
          <strong>Carteira de empresas</strong>
        </div>
      </header>

      {companiesResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar sua carteira.</strong>
          <span>{companiesResult.error}</span>
        </section>
      ) : null}

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>Empresas vinculadas</h1>
            <p>
              Acompanhe as empresas em que voce possui vinculo, suporte ou acesso operacional.
            </p>
          </div>
          <span>{pagination?.total ?? 0} registro(s)</span>
        </div>

        <form action="/carteira/empresas" className="filter-bar">
          <label>
            Buscar
            <input
              defaultValue={filters.q ?? ""}
              maxLength={80}
              name="q"
              placeholder="Nome, razao social ou documento"
            />
          </label>
          <label>
            Status
            <select defaultValue={filters.status ?? ""} name="status">
              <option value="">Todos</option>
              <option value="implementation">Em implantacao</option>
              <option value="active">Ativa</option>
              <option value="suspended">Suspensa</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </label>
          <label>
            Modulo
            <select defaultValue={filters.module ?? ""} name="module">
              <option value="">Todos</option>
              {moduleOptions.map((module) => (
                <option key={module.key} value={module.key}>
                  {module.label}
                </option>
              ))}
            </select>
          </label>
          <div className="filter-actions">
            <button className="primary-action" type="submit">
              Filtrar
            </button>
            {hasFilters ? (
              <Link className="secondary-action" href="/carteira/empresas">
                Limpar
              </Link>
            ) : null}
          </div>
        </form>

        {companies.length > 0 ? (
          <div className="data-table" role="table" aria-label="Carteira de empresas">
            <div className="data-row data-row-head portfolio-company-row" role="row">
              <span>Empresa</span>
              <span>Status</span>
              <span>Modulos</span>
              <span>Permissoes</span>
              <span />
            </div>
            {companies.map((companyAccess) => {
              const company = companyAccess.company;
              const canReadCompany = companyAccess.adminPermissions.includes(
                "admin.companies.read"
              );
              const modules = companyAccess.modules.map((module) => module.applicationName);

              return (
                <div className="data-row portfolio-company-row" role="row" key={company.id}>
                  <span>
                    <strong>{company.tradeName ?? company.legalName}</strong>
                    <small>{company.legalName}</small>
                  </span>
                  <span>
                    <strong>{statusLabels[company.status]}</strong>
                    <small>{membershipStatusLabels[companyAccess.membershipStatus]}</small>
                  </span>
                  <span className="tag-list">
                    {modules.length > 0 ? (
                      modules.slice(0, 3).map((module) => (
                        <span className="tag" key={`${company.id}:${module}`}>
                          {module}
                        </span>
                      ))
                    ) : (
                      <span className="tag muted-tag">Sem modulo operacional</span>
                    )}
                    {modules.length > 3 ? (
                      <span className="tag muted-tag">+{modules.length - 3}</span>
                    ) : null}
                  </span>
                  <span>
                    <strong>{companyAccess.adminPermissions.length}</strong>
                    <small>permissao(oes) administrativas</small>
                  </span>
                  {canReadCompany ? (
                    <Link href={`/cadastro/empresas/${company.id}`}>Detalhes</Link>
                  ) : (
                    <span className="muted">Acesso operacional</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            {hasFilters
              ? "Nenhuma empresa encontrada para os filtros informados."
              : "Nenhuma empresa vinculada ao seu usuario. Quando uma carteira for delegada, ela aparecera aqui."}
          </div>
        )}

        {pagination ? (
          <PaginationControls
            basePath="/carteira/empresas"
            page={pagination.page}
            pageSize={pagination.pageSize}
            searchParams={filters}
            total={pagination.total}
            totalPages={pagination.totalPages}
          />
        ) : null}
      </section>
    </AppShell>
  );
}

function normalizePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function normalizeFilterValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}
