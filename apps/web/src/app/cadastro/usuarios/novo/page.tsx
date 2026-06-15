import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { createAdminUser, listAdminCompanies } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

type NewUserPageProps = {
  searchParams?: Promise<{
    erro?: string;
  }>;
};

export default async function NewUserPage({ searchParams }: NewUserPageProps) {
  const params = await searchParams;
  const companiesResult = await listAdminCompanies({ pageSize: 100 });
  const companies = companiesResult.data?.items ?? [];

  async function createUserAction(formData: FormData) {
    "use server";

    const result = await createAdminUser({
      companyId: readFormValue(formData, "companyId"),
      email: readFormValue(formData, "email"),
      fullName: readFormValue(formData, "fullName"),
      isPrimaryContact: formData.get("isPrimaryContact") === "on"
    });

    if (result.error || !result.data) {
      redirect(
        `/cadastro/usuarios/novo?erro=${encodeURIComponent(
          result.error ?? "API interna nao retornou o usuario criado."
        )}`
      );
    }

    redirect(`/cadastro/empresas/${result.data.companyId}`);
  }

  return (
    <AppShell activePath="/cadastro/usuarios">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Novo usuario</strong>
        </div>
      </header>

      {companiesResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar empresas.</strong>
          <span>{companiesResult.error}</span>
        </section>
      ) : null}

      {params?.erro ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel cadastrar o usuario.</strong>
          <span>{params.erro}</span>
        </section>
      ) : null}

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>Cadastrar usuario</h1>
            <p>Envia convite pelo Supabase Auth, registra perfil no core e vincula a empresa.</p>
          </div>
        </div>

        <form className="form-grid" action={createUserAction}>
          <label>
            Empresa
            <select name="companyId" required defaultValue="">
              <option value="">Selecione uma empresa</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.tradeName ?? company.legalName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nome completo
            <input maxLength={140} name="fullName" required />
          </label>

          <label>
            E-mail
            <input maxLength={254} name="email" required type="email" />
          </label>

          <label className="checkbox-field">
            <input name="isPrimaryContact" type="checkbox" />
            Definir como contato principal da empresa
          </label>

          <div className="form-actions">
            <a className="secondary-action" href="/cadastro/usuarios">
              Cancelar
            </a>
            <PendingSubmitButton pendingLabel="Enviando convite...">
              Enviar convite
            </PendingSubmitButton>
          </div>
        </form>
      </section>
    </AppShell>
  );
}

function readFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
