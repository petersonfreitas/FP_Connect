import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getAdminCompany, listAdminCompanyUsers } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

type CompanyDetailPageProps = {
  params: Promise<{
    id: string;
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

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { id } = await params;
  const [companyResult, usersResult] = await Promise.all([
    getAdminCompany(id),
    listAdminCompanyUsers(id)
  ]);
  const company = companyResult.data;
  const users = usersResult.data ?? [];

  return (
    <AppShell activePath="/cadastro/empresas">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>{company?.tradeName ?? company?.legalName ?? "Empresa"}</strong>
        </div>
        <Link className="secondary-action" href="/cadastro/empresas">
          Voltar
        </Link>
      </header>

      {companyResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar a empresa.</strong>
          <span>{companyResult.error}</span>
        </section>
      ) : null}

      {company ? (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>{company.legalName}</h1>
              <p>Status atual: {statusLabels[company.status]}</p>
            </div>
          </div>

          <dl className="detail-grid">
            <div>
              <dt>Tipo de pessoa</dt>
              <dd>{personTypeLabels[company.personType]}</dd>
            </div>
            <div>
              <dt>Nome fantasia</dt>
              <dd>{company.tradeName ?? "Nao informado"}</dd>
            </div>
            <div>
              <dt>Documento</dt>
              <dd>{company.document ?? "Nao informado"}</dd>
            </div>
            <div>
              <dt>E-mail principal</dt>
              <dd>{company.primaryEmail ?? "Nao informado"}</dd>
            </div>
            <div>
              <dt>Telefone principal</dt>
              <dd>{company.primaryPhone ?? "Nao informado"}</dd>
            </div>
            <div>
              <dt>Responsavel principal</dt>
              <dd>{company.primaryResponsibleName}</dd>
            </div>
            <div>
              <dt>E-mail do responsavel</dt>
              <dd>{company.primaryResponsibleEmail ?? "Nao informado"}</dd>
            </div>
            <div className="detail-full">
              <dt>Observacoes de implantacao</dt>
              <dd>{company.implementationNotes ?? "Nao informado"}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="content-panel stack-panel">
        <div className="panel-heading">
          <div>
            <h1>Usuarios vinculados</h1>
            <p>Perfis com vinculo ativo ou convite pendente nesta empresa.</p>
          </div>
          <Link className="primary-action" href="/cadastro/usuarios/novo">
            Novo usuario
          </Link>
        </div>

        {usersResult.error ? (
          <div className="data-alert inline-alert" role="status">
            <strong>Nao foi possivel carregar usuarios vinculados.</strong>
            <span>{usersResult.error}</span>
          </div>
        ) : null}

        {users.length > 0 ? (
          <div className="data-table" role="table" aria-label="Usuarios vinculados">
            <div className="data-row data-row-head" role="row">
              <span>Usuario</span>
              <span>E-mail</span>
              <span>Status</span>
              <span>Contato</span>
            </div>
            {users.map((user) => (
              <div className="data-row" role="row" key={user.membershipId}>
                <span>
                  <strong>{user.fullName}</strong>
                  <small>{user.id}</small>
                </span>
                <span>{user.email ?? "Nao informado"}</span>
                <span>{user.membershipStatus}</span>
                <span>{user.isPrimaryContact ? "Principal" : "-"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Nenhum usuario vinculado a esta empresa ainda.</div>
        )}
      </section>
    </AppShell>
  );
}
