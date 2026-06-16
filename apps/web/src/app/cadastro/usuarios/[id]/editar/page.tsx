import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { getAdminUser, updateAdminUser } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

type EditUserPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    erro?: string;
    returnTo?: string;
  }>;
};

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  invited: "Convidado"
};

const globalRoleLabels = {
  company_user: "Usuario da empresa",
  fp_admin: "Admin do Console",
  super_admin: "Superadmin",
  support: "Suporte"
};

export default async function EditUserPage({ params, searchParams }: EditUserPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const returnTo = getSafeReturnPath(query?.returnTo);
  const activePath = returnTo?.startsWith("/cadastro/usuarios-console")
    ? "/cadastro/usuarios-console"
    : "/cadastro/usuarios";
  const userResult = await getAdminUser(id);
  const user = userResult.data;

  async function updateUserAction(formData: FormData) {
    "use server";

    const status = readFormValue(formData, "status");
    const result = await updateAdminUser(id, {
      fullName: readFormValue(formData, "fullName"),
      email: readFormValue(formData, "email"),
      globalRole: normalizeGlobalRole(readFormValue(formData, "globalRole")),
      status: status === "active" || status === "inactive" || status === "invited" ? status : "invited"
    });

    if (result.error || !result.data) {
      const returnSearch = returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : "";

      redirect(
        `/cadastro/usuarios/${id}/editar?erro=${encodeURIComponent(
          result.error ?? "API interna nao retornou o usuario atualizado."
        )}${returnSearch}`
      );
    }

    redirect(returnTo ?? "/cadastro/usuarios");
  }

  return (
    <AppShell activePath={activePath}>
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Editar usuario</strong>
        </div>
      </header>

      {userResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar o usuario.</strong>
          <span>{userResult.error}</span>
        </section>
      ) : null}

      {query?.erro ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel atualizar o usuario.</strong>
          <span>{query.erro}</span>
        </section>
      ) : null}

      {user ? (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>{user.fullName}</h1>
              <p>Atualize os dados administrativos do perfil central.</p>
            </div>
            <span>{user.isInternalUser ? "Usuario do Console" : "Usuario da empresa"}</span>
          </div>

          <form className="form-grid" action={updateUserAction}>
            <label>
              Nome completo
              <input defaultValue={user.fullName} maxLength={140} name="fullName" required />
            </label>

            <label>
              E-mail
              <input defaultValue={user.email ?? ""} maxLength={254} name="email" required type="email" />
            </label>

            <label>
              Status
              <select name="status" required defaultValue={user.status}>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Papel de plataforma
              <select name="globalRole" required defaultValue={user.globalRole}>
                {Object.entries(globalRoleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-alert neutral">
              Usuarios com papel Superadmin, Admin do Console ou Suporte sao tratados como usuarios
              internos da plataforma. Usuarios da empresa continuam com acesso definido pelos
              vinculos e permissoes por modulo.
            </div>

            <div className="form-actions">
              <Link className="secondary-action" href={returnTo ?? "/cadastro/usuarios"}>
                Cancelar
              </Link>
              <PendingSubmitButton pendingLabel="Salvando...">
                Salvar alteracoes
              </PendingSubmitButton>
            </div>
          </form>
        </section>
      ) : null}
    </AppShell>
  );
}

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeGlobalRole(value: string) {
  if (
    value === "company_user" ||
    value === "fp_admin" ||
    value === "super_admin" ||
    value === "support"
  ) {
    return value;
  }

  return "company_user";
}

function getSafeReturnPath(value: string | undefined): string | null {
  if (!value || !value.startsWith("/cadastro/") || value.startsWith("//")) {
    return null;
  }

  return value;
}
