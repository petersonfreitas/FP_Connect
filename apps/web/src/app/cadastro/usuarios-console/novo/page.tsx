import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { createAdminConsoleUser, getCurrentAdminAccess } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

type NewConsoleUserPageProps = {
  searchParams?: Promise<{
    erro?: string;
  }>;
};

const globalRoleLabels = {
  fp_admin: "Admin do Console",
  super_admin: "Superadmin",
  support: "Suporte"
};

export default async function NewConsoleUserPage({ searchParams }: NewConsoleUserPageProps) {
  const query = searchParams ? await searchParams : {};
  const accessResult = await getCurrentAdminAccess();
  const isSuperAdmin = accessResult.data?.isSuperAdmin === true;
  const canInviteSupport = isSuperAdmin || accessResult.data?.user.globalRole === "fp_admin";
  const roleOptions = Object.entries(globalRoleLabels).filter(([value]) =>
    isSuperAdmin ? true : value === "support"
  );
  const formTitle = isSuperAdmin ? "Convidar usuario interno" : "Convidar suporte";
  const formDescription = isSuperAdmin
    ? "Crie acessos de superadmin, admin do Console ou suporte operacional."
    : "Convide usuarios de suporte operacional para atuarem nas carteiras permitidas.";

  async function createConsoleUserAction(formData: FormData) {
    "use server";

    const result = await createAdminConsoleUser({
      email: readFormValue(formData, "email"),
      fullName: readFormValue(formData, "fullName"),
      globalRole: normalizePlatformGlobalRole(readFormValue(formData, "globalRole"))
    });

    if (result.error || !result.data) {
      redirect(
        `/cadastro/usuarios-console/novo?erro=${encodeURIComponent(
          result.error ?? "API interna nao retornou o usuario criado."
        )}`
      );
    }

    redirect(
      `/cadastro/usuarios-console?created=${encodeURIComponent(
        result.data.email ?? result.data.fullName
      )}`
    );
  }

  return (
    <AppShell activePath="/cadastro/usuarios-console">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Novo usuario do Console</strong>
        </div>
        <Link className="secondary-action" href="/cadastro/usuarios-console">
          Voltar
        </Link>
      </header>

      {query.erro ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel convidar o usuario.</strong>
          <span>{query.erro}</span>
        </section>
      ) : null}

      {accessResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar seu acesso atual.</strong>
          <span>{accessResult.error}</span>
        </section>
      ) : null}

      {!canInviteSupport ? (
        <section className="data-alert" role="status">
          <strong>Voce nao possui permissao para convidar usuarios internos.</strong>
          <span>Solicite a um admin do Console ou superadmin.</span>
        </section>
      ) : null}

      {canInviteSupport ? (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>{formTitle}</h1>
              <p>{formDescription}</p>
            </div>
          </div>

          <form className="form-grid" action={createConsoleUserAction}>
            <label>
              Nome completo
              <input maxLength={140} name="fullName" required />
            </label>

            <label>
              E-mail
              <input maxLength={254} name="email" required type="email" />
            </label>

            <label>
              Papel no Console
              <select name="globalRole" required defaultValue="support">
                {roleOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-alert neutral">
              Usuarios internos podem ser vinculados depois como suporte administrativo de empresas
              especificas.
            </div>

            <div className="form-actions">
              <Link className="secondary-action" href="/cadastro/usuarios-console">
                Cancelar
              </Link>
              <PendingSubmitButton pendingLabel="Enviando convite...">
                Enviar convite
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

function normalizePlatformGlobalRole(value: string) {
  if (value === "fp_admin" || value === "super_admin" || value === "support") {
    return value;
  }

  return "support";
}
