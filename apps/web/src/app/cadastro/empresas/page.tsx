import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { listAdminCompanies } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

const statusLabels = {
  active: "Ativa",
  cancelled: "Cancelada",
  implementation: "Em implantacao",
  suspended: "Suspensa"
};

export default async function CompaniesPage() {
  const companiesResult = await listAdminCompanies();
  const companies = companiesResult.data ?? [];

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
          <span>{companies.length} registro(s)</span>
        </div>

        {companies.length > 0 ? (
          <div className="data-table" role="table" aria-label="Empresas cadastradas">
            <div className="data-row data-row-head" role="row">
              <span>Empresa</span>
              <span>Responsavel</span>
              <span>Status</span>
              <span />
            </div>
            {companies.map((company) => (
              <div className="data-row" role="row" key={company.id}>
                <span>
                  <strong>{company.tradeName ?? company.legalName}</strong>
                  <small>{company.legalName}</small>
                </span>
                <span>{company.primaryResponsibleName}</span>
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
      </section>
    </AppShell>
  );
}
