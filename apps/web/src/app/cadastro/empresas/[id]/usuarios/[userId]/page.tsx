import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { UserRolesTable } from "@/components/user-roles-table";
import {
  bulkGrantAdminUserRoles,
  bulkRevokeAdminUserRoles,
  getAdminCompany,
  getAdminCompanyUserAccess,
  updateAdminCompanyUserMembership
} from "@/lib/internal-api";

export const dynamic = "force-dynamic";

type UserAccessPageProps = {
  params: Promise<{
    id: string;
    userId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const membershipStatusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  invited: "Convidado"
};

const moduleStatusLabels = {
  active: "Ativo",
  cancelled: "Cancelado",
  implementation: "Em implantacao",
  suspended: "Suspenso"
};

export default async function UserAccessPage({ params, searchParams }: UserAccessPageProps) {
  const { id, userId } = await params;
  const query = searchParams ? await searchParams : {};
  const accessError = getQueryValue(query.accessError);
  const accessSaved = getQueryValue(query.accessSaved);
  const membershipError = getQueryValue(query.membershipError);
  const membershipSaved = getQueryValue(query.membershipSaved);
  const accessSavedMessage =
    accessSaved && accessSaved !== "1" ? accessSaved : "Acessos atualizados com sucesso.";
  const membershipSavedMessage =
    membershipSaved && membershipSaved !== "1"
      ? membershipSaved
      : "Vinculo empresarial atualizado com sucesso.";
  const [companyResult, accessResult] = await Promise.all([
    getAdminCompany(id),
    getAdminCompanyUserAccess(id, userId)
  ]);
  const company = companyResult.data;
  const access = accessResult.data;
  const availableRoles = access?.availableRoles ?? [];
  const grants = access?.grants ?? [];

  async function updateMembershipAction(formData: FormData) {
    "use server";

    const result = await updateAdminCompanyUserMembership(id, userId, {
      isPrimaryContact: formData.get("isPrimaryContact") === "on",
      status: normalizeMembershipStatus(readFormValue(formData, "membershipStatus"))
    });

    revalidatePath(`/cadastro/empresas/${id}`);
    revalidatePath(`/cadastro/empresas/${id}/usuarios/${userId}`);

    if (result.error || !result.data) {
      redirect(
        `/cadastro/empresas/${id}/usuarios/${userId}?membershipError=${encodeURIComponent(
          result.error ?? "API interna nao retornou o vinculo atualizado."
        )}`
      );
    }

    redirect(
      `/cadastro/empresas/${id}/usuarios/${userId}?membershipSaved=${encodeURIComponent(
        `Vinculo atualizado para ${membershipStatusLabels[result.data.membershipStatus]}.`
      )}`
    );
  }

  async function bulkGrantRolesAction(formData: FormData) {
    "use server";

    const result = await bulkGrantAdminUserRoles(id, userId, {
      roleIds: readFormValues(formData, "roleIds")
    });

    revalidatePath(`/cadastro/empresas/${id}/usuarios/${userId}`);

    if (result.error) {
      redirect(
        `/cadastro/empresas/${id}/usuarios/${userId}?accessError=${encodeURIComponent(
          result.error
        )}`
      );
    }

    if (!result.data) {
      redirect(
        `/cadastro/empresas/${id}/usuarios/${userId}?accessError=${encodeURIComponent(
          "API interna nao retornou dados da concessao."
        )}`
      );
    }

    redirect(
      `/cadastro/empresas/${id}/usuarios/${userId}?accessSaved=${encodeURIComponent(
        `${result.data.granted.length} papel(eis) concedido(s).`
      )}`
    );
  }

  async function bulkRevokeRolesAction(formData: FormData) {
    "use server";

    const result = await bulkRevokeAdminUserRoles(id, userId, {
      grantIds: readFormValues(formData, "grantIds")
    });

    revalidatePath(`/cadastro/empresas/${id}/usuarios/${userId}`);

    if (result.error) {
      redirect(
        `/cadastro/empresas/${id}/usuarios/${userId}?accessError=${encodeURIComponent(
          result.error
        )}`
      );
    }

    if (!result.data) {
      redirect(
        `/cadastro/empresas/${id}/usuarios/${userId}?accessError=${encodeURIComponent(
          "API interna nao retornou dados da revogacao."
        )}`
      );
    }

    redirect(
      `/cadastro/empresas/${id}/usuarios/${userId}?accessSaved=${encodeURIComponent(
        `${result.data.count} papel(eis) revogado(s).`
      )}`
    );
  }

  return (
    <AppShell activePath="/cadastro/usuarios">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Acessos do usuario</strong>
        </div>
        <div className="topbar-actions">
          <Link
            className="secondary-action"
            href={`/cadastro/usuarios/${userId}/editar?returnTo=${encodeURIComponent(
              `/cadastro/empresas/${id}/usuarios/${userId}`
            )}`}
          >
            Editar perfil
          </Link>
          <Link className="secondary-action" href={`/cadastro/empresas/${id}`}>
            Voltar para empresa
          </Link>
        </div>
      </header>

      {companyResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar a empresa.</strong>
          <span>{companyResult.error}</span>
        </section>
      ) : null}

      {accessResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar acessos do usuario.</strong>
          <span>{accessResult.error}</span>
        </section>
      ) : null}

      {accessError ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel atualizar os acessos.</strong>
          <span>{accessError}</span>
        </section>
      ) : null}

      {accessSaved ? (
        <section className="form-alert neutral page-feedback" role="status">
          {accessSavedMessage}
        </section>
      ) : null}

      {membershipError ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel atualizar o vinculo empresarial.</strong>
          <span>{membershipError}</span>
        </section>
      ) : null}

      {membershipSaved ? (
        <section className="form-alert neutral page-feedback" role="status">
          {membershipSavedMessage}
        </section>
      ) : null}

      {access ? (
        <>
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <h1>{access.user.fullName}</h1>
                <p>
                  {company?.tradeName ?? company?.legalName ?? "Empresa"} -{" "}
                  {membershipStatusLabels[access.user.membershipStatus]}
                </p>
              </div>
              <span>{grants.length} papel(eis)</span>
            </div>

            <dl className="detail-grid">
              <div>
                <dt>E-mail</dt>
                <dd>{access.user.email ?? "Nao informado"}</dd>
              </div>
              <div>
                <dt>Contato</dt>
                <dd>{access.user.isPrimaryContact ? "Principal" : "Usuario vinculado"}</dd>
              </div>
            </dl>
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Vinculo empresarial</h1>
                <p>Altere apenas o vinculo deste usuario com a empresa atual.</p>
              </div>
            </div>

            <form className="form-grid" action={updateMembershipAction}>
              <label>
                Status do vinculo
                <select
                  name="membershipStatus"
                  required
                  defaultValue={access.user.membershipStatus}
                >
                  {Object.entries(membershipStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="checkbox-field">
                <input
                  defaultChecked={access.user.isPrimaryContact}
                  name="isPrimaryContact"
                  type="checkbox"
                />
                Definir como contato principal da empresa
              </label>

              <div className="form-alert neutral">
                Esta acao nao altera o perfil central do usuario. Para bloquear o login global,
                use a edicao do perfil.
              </div>

              <div className="form-actions">
                <button className="secondary-action" type="reset">
                  Restaurar
                </button>
                <PendingSubmitButton pendingLabel="Salvando...">
                  Salvar vinculo
                </PendingSubmitButton>
              </div>
            </form>
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Papeis e permissoes</h1>
                <p>
                  Conceda ou revogue acessos em lote para modulos contratados em implantacao ou
                  ativos.
                </p>
              </div>
            </div>

            <UserRolesTable
              availableRoles={availableRoles}
              grantAction={bulkGrantRolesAction}
              grants={grants}
              revokeAction={bulkRevokeRolesAction}
            />
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Modulos da empresa</h1>
                <p>Referencia rapida dos modulos vinculados a esta empresa.</p>
              </div>
            </div>

            {access.applications.length > 0 ? (
              <div className="module-status-list">
                {access.applications.map((application) => (
                  <div className="module-status-row" key={application.id}>
                    <strong>{application.name}</strong>
                    <span>
                      {application.companyStatus
                        ? moduleStatusLabels[application.companyStatus]
                        : "Nao contratado"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Empresa ainda nao possui modulos contratados.</div>
            )}
          </section>
        </>
      ) : null}
    </AppShell>
  );
}

function getQueryValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function readFormValues(formData: FormData, key: string): string[] {
  return formData.getAll(key).flatMap((value) => (typeof value === "string" ? [value] : []));
}

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMembershipStatus(value: string) {
  if (value === "active" || value === "inactive" || value === "invited") {
    return value;
  }

  return "inactive";
}
