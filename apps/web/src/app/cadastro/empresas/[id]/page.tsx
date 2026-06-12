import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  getAdminCompany,
  listAdminCompanyApplications,
  listAdminCompanyUsers,
  updateAdminCompanyApplication
} from "@/lib/internal-api";

export const dynamic = "force-dynamic";

type CompanyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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

const moduleStatusLabels = {
  active: "Ativo",
  cancelled: "Cancelado",
  implementation: "Em implantacao",
  suspended: "Suspenso"
};

export default async function CompanyDetailPage({ params, searchParams }: CompanyDetailPageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const moduleError = getQueryValue(query.moduleError);
  const moduleSaved = getQueryValue(query.moduleSaved);

  async function updateModuleAction(formData: FormData) {
    "use server";

    const applicationId = readFormValue(formData, "applicationId");
    const status = readFormValue(formData, "status");
    const implementationNotes = readOptionalFormValue(formData, "implementationNotes");
    const result = await updateAdminCompanyApplication(id, {
      applicationId,
      status:
        status === "active" ||
        status === "suspended" ||
        status === "cancelled" ||
        status === "implementation"
          ? status
          : "implementation",
      implementationNotes
    });

    revalidatePath(`/cadastro/empresas/${id}`);

    if (result.error) {
      redirect(`/cadastro/empresas/${id}?moduleError=${encodeURIComponent(result.error)}`);
    }

    redirect(`/cadastro/empresas/${id}?moduleSaved=1`);
  }

  const [companyResult, usersResult, applicationsResult] = await Promise.all([
    getAdminCompany(id),
    listAdminCompanyUsers(id),
    listAdminCompanyApplications(id)
  ]);
  const company = companyResult.data;
  const users = usersResult.data ?? [];
  const applications = applicationsResult.data ?? [];

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
            <h1>Modulos contratados</h1>
            <p>Libere, suspenda ou cancele os modulos disponiveis para esta empresa.</p>
          </div>
          <span>
            {applications.filter((application) => application.companyStatus).length} contratado(s)
          </span>
        </div>

        {applicationsResult.error ? (
          <div className="data-alert inline-alert" role="status">
            <strong>Nao foi possivel carregar modulos da empresa.</strong>
            <span>{applicationsResult.error}</span>
          </div>
        ) : null}

        {moduleError ? (
          <div className="data-alert inline-alert" role="status">
            <strong>Nao foi possivel atualizar o modulo.</strong>
            <span>{moduleError}</span>
          </div>
        ) : null}

        {moduleSaved ? (
          <div className="form-alert neutral module-feedback" role="status">
            Modulo atualizado com sucesso.
          </div>
        ) : null}

        {applications.length > 0 ? (
          <div className="company-modules-list">
            {applications.map((application) => (
              <form
                action={updateModuleAction}
                className="company-module-row"
                key={application.id}
              >
                <input name="applicationId" type="hidden" value={application.id} />
                <div>
                  <strong>{application.name}</strong>
                  <small>{application.description ?? application.key}</small>
                </div>
                <label>
                  Status
                  <select
                    name="status"
                    defaultValue={application.companyStatus ?? "implementation"}
                  >
                    {Object.entries(moduleStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Observacoes
                  <input
                    maxLength={1000}
                    name="implementationNotes"
                    placeholder="Opcional"
                    defaultValue={application.implementationNotes ?? ""}
                  />
                </label>
                <button className="primary-action" type="submit">
                  Salvar
                </button>
              </form>
            ))}
          </div>
        ) : (
          <div className="empty-state">Nenhum modulo disponivel para contratacao.</div>
        )}
      </section>

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

function getQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readOptionalFormValue(formData: FormData, key: string): string | null {
  const value = readFormValue(formData, key).trim();
  return value || null;
}
