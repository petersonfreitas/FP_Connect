import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompanyModulesTable } from "@/components/company-modules-table";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import {
  bulkUpdateAdminCompanyApplications,
  getAdminCompany,
  listAdminCompanyApplications,
  listAdminCompanyUsers,
  resendAdminUserInvite
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

export default async function CompanyDetailPage({ params, searchParams }: CompanyDetailPageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const inviteError = getQueryValue(query.inviteError);
  const inviteSent = getQueryValue(query.inviteSent);
  const moduleError = getQueryValue(query.moduleError);
  const moduleSaved = getQueryValue(query.moduleSaved);

  async function bulkUpdateModulesAction(formData: FormData) {
    "use server";

    const applicationIds = formData
      .getAll("applicationIds")
      .filter((value): value is string => typeof value === "string");
    const status = readFormValue(formData, "status");
    const implementationNotes = readOptionalFormValue(formData, "implementationNotes");
    const result = await bulkUpdateAdminCompanyApplications(id, {
      applicationIds,
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

    redirect(`/cadastro/empresas/${id}?moduleSaved=${result.data?.updated.length ?? 0}`);
  }

  async function resendInviteAction(formData: FormData) {
    "use server";

    const userId = readFormValue(formData, "userId");
    const result = await resendAdminUserInvite(id, userId);

    revalidatePath(`/cadastro/empresas/${id}`);

    if (result.error) {
      redirect(`/cadastro/empresas/${id}?inviteError=${encodeURIComponent(result.error)}`);
    }

    redirect(`/cadastro/empresas/${id}?inviteSent=1`);
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
            <Link className="secondary-action" href={`/cadastro/empresas/${company.id}/editar`}>
              Editar
            </Link>
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
              <dd>{formatDocument(company.document, company.personType)}</dd>
            </div>
            <div>
              <dt>E-mail principal</dt>
              <dd>{company.primaryEmail ?? "Nao informado"}</dd>
            </div>
            <div>
              <dt>Telefone principal</dt>
              <dd>{formatBrazilPhone(company.primaryPhone)}</dd>
            </div>
            <div>
              <dt>Celular / WhatsApp</dt>
              <dd>{formatBrazilPhone(company.primaryMobilePhone)}</dd>
            </div>
            <div>
              <dt>Responsavel principal</dt>
              <dd>{company.primaryResponsibleName}</dd>
            </div>
            <div>
              <dt>E-mail do responsavel</dt>
              <dd>{company.primaryResponsibleEmail ?? "Nao informado"}</dd>
            </div>
            <div>
              <dt>CEP</dt>
              <dd>{formatPostalCode(company.addressPostalCode)}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{company.addressState ?? "Nao informado"}</dd>
            </div>
            <div className="detail-full">
              <dt>Endereco</dt>
              <dd>{formatAddress(company)}</dd>
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
            {moduleSaved} modulo(s) atualizado(s) com sucesso.
          </div>
        ) : null}

        {applications.length > 0 ? (
          <CompanyModulesTable action={bulkUpdateModulesAction} applications={applications} />
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

        {inviteError ? (
          <div className="data-alert inline-alert" role="status">
            <strong>Nao foi possivel reenviar o convite.</strong>
            <span>{inviteError}</span>
          </div>
        ) : null}

        {inviteSent ? (
          <div className="form-alert neutral module-feedback" role="status">
            Convite reenviado com sucesso.
          </div>
        ) : null}

        {users.length > 0 ? (
          <div className="data-table" role="table" aria-label="Usuarios vinculados">
            <div className="data-row data-row-head company-users-row" role="row">
              <span>Usuario</span>
              <span>E-mail</span>
              <span>Status</span>
              <span>Contato</span>
              <span>Acoes</span>
            </div>
            {users.map((user) => (
              <div className="data-row company-users-row" role="row" key={user.membershipId}>
                <span>
                  <strong>{user.fullName}</strong>
                  <small>{user.id}</small>
                </span>
                <span>{user.email ?? "Nao informado"}</span>
                <span>{user.membershipStatus}</span>
                <span>
                  {user.isPrimaryContact ? "Principal" : "-"}
                </span>
                <span className="row-actions">
                  <Link href={`/cadastro/empresas/${id}/usuarios/${user.id}`}>Acessos</Link>
                  {user.status === "invited" && user.membershipStatus === "invited" ? (
                    <form action={resendInviteAction}>
                      <input name="userId" type="hidden" value={user.id} />
                      <PendingSubmitButton
                        className="secondary-action compact-action"
                        pendingLabel="Reenviando..."
                      >
                        Reenviar convite
                      </PendingSubmitButton>
                    </form>
                  ) : null}
                </span>
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

type CompanyAddress = {
  addressCity: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  addressNumber: string | null;
  addressState: string | null;
  addressStreet: string | null;
  addressStreetType: string | null;
};

function formatDocument(value: string | null, personType: "individual" | "legal_entity"): string {
  if (!value) {
    return "Nao informado";
  }

  if (personType === "individual") {
    return value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }

  return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function formatBrazilPhone(value: string | null): string {
  if (!value) {
    return "Nao informado";
  }

  const digits = value.replace(/\D/g, "");
  const nationalNumber =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
      ? digits.slice(2)
      : digits;

  if (nationalNumber.length === 10) {
    return nationalNumber.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }

  if (nationalNumber.length === 11) {
    return nationalNumber.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }

  return value;
}

function formatPostalCode(value: string | null): string {
  if (!value) {
    return "Nao informado";
  }

  return value.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

function formatAddress(company: CompanyAddress): string {
  const street = [company.addressStreetType, company.addressStreet].filter(Boolean).join(" ");
  const streetLine = [street, company.addressNumber].filter(Boolean).join(", ");
  const cityLine = [company.addressCity, company.addressState].filter(Boolean).join(" - ");
  const parts = [
    streetLine,
    company.addressComplement,
    company.addressDistrict,
    cityLine
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "Nao informado";
}
