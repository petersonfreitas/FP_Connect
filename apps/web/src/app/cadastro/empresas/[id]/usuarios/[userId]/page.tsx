import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  getAdminCompany,
  getAdminCompanyUserAccess,
  grantAdminUserRole,
  revokeAdminUserRole
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
  const [companyResult, accessResult] = await Promise.all([
    getAdminCompany(id),
    getAdminCompanyUserAccess(id, userId)
  ]);
  const company = companyResult.data;
  const access = accessResult.data;
  const availableRoles = access?.availableRoles ?? [];
  const grants = access?.grants ?? [];

  async function grantRoleAction(formData: FormData) {
    "use server";

    const result = await grantAdminUserRole(id, userId, {
      roleId: readFormValue(formData, "roleId")
    });

    revalidatePath(`/cadastro/empresas/${id}/usuarios/${userId}`);

    if (result.error) {
      redirect(
        `/cadastro/empresas/${id}/usuarios/${userId}?accessError=${encodeURIComponent(
          result.error
        )}`
      );
    }

    redirect(`/cadastro/empresas/${id}/usuarios/${userId}?accessSaved=1`);
  }

  async function revokeRoleAction(formData: FormData) {
    "use server";

    const result = await revokeAdminUserRole(id, userId, {
      grantId: readFormValue(formData, "grantId")
    });

    revalidatePath(`/cadastro/empresas/${id}/usuarios/${userId}`);

    if (result.error) {
      redirect(
        `/cadastro/empresas/${id}/usuarios/${userId}?accessError=${encodeURIComponent(
          result.error
        )}`
      );
    }

    redirect(`/cadastro/empresas/${id}/usuarios/${userId}?accessSaved=1`);
  }

  return (
    <AppShell activePath="/cadastro/usuarios">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Acessos do usuario</strong>
        </div>
        <Link className="secondary-action" href={`/cadastro/empresas/${id}`}>
          Voltar para empresa
        </Link>
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
          Acessos atualizados com sucesso.
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
                <h1>Conceder papel</h1>
                <p>Disponivel apenas para modulos contratados em implantacao ou ativos.</p>
              </div>
            </div>

            {availableRoles.length > 0 ? (
              <form className="access-grant-form" action={grantRoleAction}>
                <label>
                  Papel
                  <select name="roleId" required defaultValue="">
                    <option value="">Selecione um papel</option>
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.applicationName} - {role.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary-action" type="submit">
                  Conceder
                </button>
              </form>
            ) : (
              <div className="empty-state">
                Nenhum papel disponivel. Contrate ou ative um modulo antes de conceder acessos.
              </div>
            )}
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Papeis concedidos</h1>
                <p>Papeis atualmente ativos para este usuario nesta empresa.</p>
              </div>
            </div>

            {grants.length > 0 ? (
              <div className="access-role-list">
                {grants.map((grant) => (
                  <form action={revokeRoleAction} className="access-role-row" key={grant.id}>
                    <input name="grantId" type="hidden" value={grant.id} />
                    <div>
                      <strong>{grant.roleName}</strong>
                      <small>{grant.applicationName}</small>
                    </div>
                    <span>{grant.roleKey}</span>
                    <button className="secondary-action" type="submit">
                      Revogar
                    </button>
                  </form>
                ))}
              </div>
            ) : (
              <div className="empty-state">Nenhum papel concedido para este usuario ainda.</div>
            )}
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

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
