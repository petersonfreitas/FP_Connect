import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createAdminCompany, listAdminBasicPlans } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

type NewCompanyPageProps = {
  searchParams?: Promise<{
    erro?: string;
  }>;
};

export default async function NewCompanyPage({ searchParams }: NewCompanyPageProps) {
  const params = await searchParams;
  const basicPlansResult = await listAdminBasicPlans();
  const basicPlans = basicPlansResult.data ?? [];

  async function createCompanyAction(formData: FormData) {
    "use server";

    const result = await createAdminCompany({
      legalName: readFormValue(formData, "legalName"),
      tradeName: readOptionalFormValue(formData, "tradeName"),
      document: readOptionalFormValue(formData, "document"),
      primaryEmail: readOptionalFormValue(formData, "primaryEmail"),
      primaryPhone: readOptionalFormValue(formData, "primaryPhone"),
      primaryResponsibleName: readFormValue(formData, "primaryResponsibleName"),
      primaryResponsibleEmail: readOptionalFormValue(formData, "primaryResponsibleEmail"),
      basicPlanId: readOptionalFormValue(formData, "basicPlanId"),
      implementationNotes: readOptionalFormValue(formData, "implementationNotes")
    });

    if (result.error || !result.data) {
      redirect(
        `/cadastro/empresas/nova?erro=${encodeURIComponent(
          result.error ?? "API interna nao retornou a empresa criada."
        )}`
      );
    }

    redirect(`/cadastro/empresas/${result.data.id}`);
  }

  return (
    <AppShell activePath="/cadastro/empresas">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Nova empresa</strong>
        </div>
      </header>

      {basicPlansResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar planos base.</strong>
          <span>{basicPlansResult.error}</span>
        </section>
      ) : null}

      {params?.erro ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel cadastrar a empresa.</strong>
          <span>{params.erro}</span>
        </section>
      ) : null}

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>Cadastrar empresa</h1>
            <p>Crie a empresa no core para depois liberar usuarios e modulos contratados.</p>
          </div>
        </div>

        <form className="form-grid" action={createCompanyAction}>
          <label>
            Razao social
            <input name="legalName" required />
          </label>

          <label>
            Nome fantasia
            <input name="tradeName" />
          </label>

          <label>
            Documento
            <input name="document" />
          </label>

          <label>
            Plano base
            <select name="basicPlanId" defaultValue="">
              <option value="">Sem plano definido</option>
              {basicPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            E-mail principal
            <input name="primaryEmail" type="email" />
          </label>

          <label>
            Telefone principal
            <input name="primaryPhone" />
          </label>

          <label>
            Responsavel principal
            <input name="primaryResponsibleName" required />
          </label>

          <label>
            E-mail do responsavel
            <input name="primaryResponsibleEmail" type="email" />
          </label>

          <label className="form-full">
            Observacoes de implantacao
            <textarea name="implementationNotes" rows={4} />
          </label>

          <div className="form-actions">
            <a className="secondary-action" href="/cadastro/empresas">
              Cancelar
            </a>
            <button className="primary-action" type="submit">
              Salvar empresa
            </button>
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

function readOptionalFormValue(formData: FormData, key: string): string | null {
  const value = readFormValue(formData, key);
  return value || null;
}
