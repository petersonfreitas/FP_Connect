import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PaginationControls } from "@/components/pagination-controls";
import { listCurrentUserCompanies } from "@/lib/internal-api";

export const dynamic = "force-dynamic";
const pageSize = 20;

type CompanyPortfolioPageProps = {
  searchParams?: Promise<{
    page?: string;
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

export default async function CompanyPortfolioPage({
  searchParams
}: CompanyPortfolioPageProps) {
  const query = searchParams ? await searchParams : {};
  const page = normalizePage(query.page);
  const companiesResult = await listCurrentUserCompanies({ page, pageSize });
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
            Nenhuma empresa vinculada ao seu usuario. Quando uma carteira for delegada, ela
            aparecera aqui.
          </div>
        )}

        {pagination ? (
          <PaginationControls
            basePath="/carteira/empresas"
            page={pagination.page}
            pageSize={pagination.pageSize}
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
