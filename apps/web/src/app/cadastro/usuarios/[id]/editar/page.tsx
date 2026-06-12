import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getAdminUser, updateAdminUser } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

type EditUserPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    erro?: string;
  }>;
};

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  invited: "Convidado"
};

export default async function EditUserPage({ params, searchParams }: EditUserPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const userResult = await getAdminUser(id);
  const user = userResult.data;

  async function updateUserAction(formData: FormData) {
    "use server";

    const status = readFormValue(formData, "status");
    const result = await updateAdminUser(id, {
      fullName: readFormValue(formData, "fullName"),
      email: readFormValue(formData, "email"),
      status: status === "active" || status === "inactive" || status === "invited" ? status : "invited"
    });

    if (result.error || !result.data) {
      redirect(
        `/cadastro/usuarios/${id}/editar?erro=${encodeURIComponent(
          result.error ?? "API interna nao retornou o usuario atualizado."
        )}`
      );
    }

    redirect("/cadastro/usuarios");
  }

  return (
    <AppShell activePath="/cadastro/usuarios">
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

            <div className="form-actions">
              <a className="secondary-action" href="/cadastro/usuarios">
                Cancelar
              </a>
              <button className="primary-action" type="submit">
                Salvar alteracoes
              </button>
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
