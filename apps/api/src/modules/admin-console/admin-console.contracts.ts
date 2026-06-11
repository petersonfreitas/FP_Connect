export type CompanyStatus = "implementation" | "active" | "suspended" | "cancelled";
export type ApplicationStatus = "active" | "inactive" | "hidden";
export type BasicPlanStatus = "active" | "inactive";

export type AdminApplicationContract = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  entryPath: string | null;
  status: ApplicationStatus;
  sortOrder: number;
};

export type AdminBasicPlanContract = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: BasicPlanStatus;
};

export type AdminCompanyContract = {
  id: string;
  legalName: string;
  tradeName: string | null;
  document: string | null;
  primaryResponsibleName: string;
  status: CompanyStatus;
  basicPlanId: string | null;
  createdAt: string;
};

export type AdminConsoleOverviewContract = {
  applications: AdminApplicationContract[];
  basicPlans: AdminBasicPlanContract[];
  companies: AdminCompanyContract[];
};
