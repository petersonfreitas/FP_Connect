import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompanyForm } from "@/components/company-form";
import {
  getAdminCompany,
  listAdminBasicPlans,
  updateAdminCompany
} from "@/lib/internal-api";

export const dynamic = "force-dynamic";

type EditCompanyPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    erro?: string;
  }>;
};

export default async function EditCompanyPage({ params, searchParams }: EditCompanyPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const [companyResult, basicPlansResult] = await Promise.all([
    getAdminCompany(id),
    listAdminBasicPlans()
  ]);
  const company = companyResult.data;
  const basicPlans = basicPlansResult.data ?? [];

  async function updateCompanyAction(formData: FormData) {
    "use server";

    const result = await updateAdminCompany(id, {
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
      implementationNotes: readOptionalFormValue(formData, "implementationNotes"),
      status: normalizeCompanyStatus(readFormValue(formData, "status"))
    });

    if (result.error || !result.data) {
      redirect(
        `/cadastro/empresas/${id}/editar?erro=${encodeURIComponent(
          result.error ?? "API interna nao retornou a empresa atualizada."
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
          <strong>Editar empresa</strong>
        </div>
      </header>

      {companyResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar a empresa.</strong>
          <span>{companyResult.error}</span>
        </section>
      ) : null}

      {basicPlansResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar planos base.</strong>
          <span>{basicPlansResult.error}</span>
        </section>
      ) : null}

      {query?.erro ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel atualizar a empresa.</strong>
          <span>{query.erro}</span>
        </section>
      ) : null}

      {company ? (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>{company.legalName}</h1>
              <p>Atualize os dados cadastrais principais desta empresa.</p>
            </div>
          </div>

          <CompanyForm
            action={updateCompanyAction}
            basicPlans={basicPlans}
            cancelHref={`/cadastro/empresas/${company.id}`}
            company={company}
            submitLabel="Salvar alteracoes"
          />
        </section>
      ) : null}
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

function normalizeCompanyStatus(value: string) {
  if (
    value === "active" ||
    value === "cancelled" ||
    value === "implementation" ||
    value === "suspended"
  ) {
    return value;
  }

  return "implementation";
}
