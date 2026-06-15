import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PaginationControls } from "@/components/pagination-controls";
import { listAdminCompanies } from "@/lib/internal-api";

export const dynamic = "force-dynamic";
const pageSize = 20;

type CompaniesPageProps = {
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

const personTypeLabels = {
  individual: "Pessoa Fisica",
  legal_entity: "Pessoa Juridica"
};

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const query = searchParams ? await searchParams : {};
  const page = normalizePage(query.page);
  const companiesResult = await listAdminCompanies({ page, pageSize });
  const pagination = companiesResult.data;
  const companies = pagination?.items ?? [];

  return (
    <AppShell activePath="/cadastro/empresas">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Empresas</strong>
        </div>
        <Link className="primary-action" href="/cadastro/empresas/nova">
          Nova empresa
        </Link>
      </header>

      {companiesResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar empresas.</strong>
          <span>{companiesResult.error}</span>
        </section>
      ) : null}

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>Empresas cadastradas</h1>
            <p>Base central do Admin Console para liberar usuarios, modulos e permissoes.</p>
          </div>
          <span>{pagination?.total ?? 0} registro(s)</span>
        </div>

        {companies.length > 0 ? (
          <div className="data-table" role="table" aria-label="Empresas cadastradas">
            <div className="data-row data-row-head" role="row">
              <span>Empresa</span>
              <span>Documento</span>
              <span>Status</span>
              <span />
            </div>
            {companies.map((company) => (
              <div className="data-row" role="row" key={company.id}>
                <span>
                  <strong>{company.tradeName ?? company.legalName}</strong>
                  <small>{company.legalName}</small>
                </span>
                <span>
                  {formatDocument(company.document, company.personType)}
                  <small>{personTypeLabels[company.personType]}</small>
                </span>
                <span>{statusLabels[company.status]}</span>
                <Link href={`/cadastro/empresas/${company.id}`}>Detalhes</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            Nenhuma empresa cadastrada ainda. Crie a primeira empresa para validar o fluxo do
            Admin Console.
          </div>
        )}

        {pagination ? (
          <PaginationControls
            basePath="/cadastro/empresas"
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

function formatDocument(value: string | null, personType: "individual" | "legal_entity"): string {
  if (!value) {
    return "Nao informado";
  }

  if (personType === "individual") {
    return value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }

  return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
