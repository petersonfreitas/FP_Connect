import type { ReactNode } from "react";
import type {
  AdminCurrentUserCompanyAccessContract,
  AdminCurrentUserModuleAccessContract,
  CompanyStatus
} from "@fp/types";

export type ContextSummaryItem = {
  label: string;
  value: ReactNode;
  tone?: "default" | "strong";
};

type ContextSummaryProps = {
  items: ContextSummaryItem[];
};

export function ContextSummary({ items }: ContextSummaryProps) {
  return (
    <section className="context-summary" aria-label="Contexto operacional">
      {items.map((item) => (
        <div className="context-summary-item" key={item.label}>
          <span>{item.label}</span>
          <strong className={item.tone === "strong" ? "context-summary-strong" : undefined}>
            {item.value}
          </strong>
        </div>
      ))}
    </section>
  );
}

export function getCompanyContextName(
  companyAccess: AdminCurrentUserCompanyAccessContract | null | undefined
): string {
  return companyAccess?.company.tradeName ?? companyAccess?.company.legalName ?? "Sem empresa";
}

export function getCompanyContextStatusLabel(status: CompanyStatus | null | undefined): string {
  const labels: Record<CompanyStatus, string> = {
    active: "Ativa",
    cancelled: "Cancelada",
    implementation: "Em implantacao",
    suspended: "Suspensa"
  };

  return status ? labels[status] : "Nao informado";
}

export function getCompanyContextPlanLabel(
  companyAccess: AdminCurrentUserCompanyAccessContract | null | undefined
): string {
  return companyAccess?.company.basicPlanId ? "Plano vinculado" : "Sem plano informado";
}

export function getModuleContextAccessLabel(
  moduleAccess: AdminCurrentUserModuleAccessContract | null | undefined
): string {
  if (!moduleAccess) {
    return "Modulo indisponivel";
  }

  if (moduleAccess.permissions.length === 0) {
    return "Sem permissoes diretas";
  }

  return `${moduleAccess.permissions.length} permissao(oes)`;
}
