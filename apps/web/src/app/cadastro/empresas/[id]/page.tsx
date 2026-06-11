import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getAdminCompany } from "@/lib/internal-api";

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
  const companyResult = await getAdminCompany(id);
  const company = companyResult.data;

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
    </AppShell>
  );
}
