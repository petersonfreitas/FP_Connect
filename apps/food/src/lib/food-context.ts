import "server-only";

import type { AdminCurrentUserCompanyAccessContract } from "@fp/types";
import { getCurrentAdminAccess } from "./internal-api";

export type FoodPageContext = {
  accessError: string | null;
  foodCompanies: AdminCurrentUserCompanyAccessContract[];
  selectedCompany: AdminCurrentUserCompanyAccessContract | null;
};

export async function getFoodPageContext(companyId?: string): Promise<FoodPageContext> {
  const accessResult = await getCurrentAdminAccess();
  const foodCompanies = accessResult.data
    ? accessResult.data.companies.filter((companyAccess) =>
        companyAccess.modules.some((module) => module.applicationKey === "food")
      )
    : [];
  const selectedCompany =
    foodCompanies.find((companyAccess) => companyAccess.company.id === companyId) ??
    foodCompanies[0] ??
    null;

  return {
    accessError: accessResult.error,
    foodCompanies,
    selectedCompany
  };
}

export function displayCompanyName(companyAccess: AdminCurrentUserCompanyAccessContract): string {
  return companyAccess.company.tradeName ?? companyAccess.company.legalName;
}
