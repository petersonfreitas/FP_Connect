import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompanyForm } from "@/components/company-form";
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
      personType: readFormValue(formData, "personType") === "individual" ? "individual" : "legal_entity",
      legalName: readFormValue(formData, "legalName"),
      tradeName: readOptionalFormValue(formData, "tradeName"),
      document: readOptionalFormValue(formData, "document"),
      primaryEmail: readOptionalFormValue(formData, "primaryEmail"),
      primaryPhone: readOptionalFormValue(formData, "primaryPhone"),
      primaryMobilePhone: readOptionalFormValue(formData, "primaryMobilePhone"),
      primaryResponsibleName: readFormValue(formData, "primaryResponsibleName"),
      primaryResponsibleEmail: readOptionalFormValue(formData, "primaryResponsibleEmail"),
      addressPostalCode: readOptionalFormValue(formData, "addressPostalCode"),
      addressStreetType: readOptionalFormValue(formData, "addressStreetType"),
      addressStreet: readOptionalFormValue(formData, "addressStreet"),
      addressNumber: readOptionalFormValue(formData, "addressNumber"),
      addressComplement: readOptionalFormValue(formData, "addressComplement"),
      addressDistrict: readOptionalFormValue(formData, "addressDistrict"),
      addressCity: readOptionalFormValue(formData, "addressCity"),
      addressState: readOptionalFormValue(formData, "addressState"),
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

        <CompanyForm
          action={createCompanyAction}
          basicPlans={basicPlans}
          cancelHref="/cadastro/empresas"
          submitLabel="Salvar empresa"
        />
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
