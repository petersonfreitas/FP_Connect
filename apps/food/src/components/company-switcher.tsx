import Link from "next/link";
import type { AdminCurrentUserCompanyAccessContract } from "@fp/types";

type CompanySwitcherProps = {
  basePath: string;
  companies: AdminCurrentUserCompanyAccessContract[];
  selectedCompanyId?: string;
};

export function CompanySwitcher({
  basePath,
  companies,
  selectedCompanyId
}: CompanySwitcherProps) {
  if (companies.length === 0) {
    return null;
  }

  return (
    <div className="company-switcher" aria-label="Empresas com FP Food">
      {companies.map((companyAccess) => (
        <Link
          className={
            companyAccess.company.id === selectedCompanyId ? "company-pill active" : "company-pill"
          }
          href={`${basePath}?companyId=${companyAccess.company.id}`}
          key={companyAccess.company.id}
        >
          {companyAccess.company.tradeName ?? companyAccess.company.legalName}
        </Link>
      ))}
    </div>
  );
}
