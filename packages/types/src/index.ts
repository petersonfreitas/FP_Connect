export type CompanyStatus = "implementation" | "active" | "suspended" | "cancelled";
export type CompanyPersonType = "individual" | "legal_entity";
export type UserStatus = "invited" | "active" | "inactive";
export type ApplicationStatus = "active" | "inactive" | "hidden";
export type CompanyApplicationStatus = "implementation" | "active" | "suspended" | "cancelled";
export type BasicPlanStatus = "active" | "inactive";
export type AdminAuditScope = "all" | "companies" | "users" | "modules" | "system";

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

export type AdminBasicPlanCatalogContract = AdminBasicPlanContract & {
  applications: AdminApplicationContract[];
};

export type AdminCatalogContract = {
  applications: AdminApplicationContract[];
  basicPlans: AdminBasicPlanCatalogContract[];
};

export type AdminCompanyContract = {
  id: string;
  personType: CompanyPersonType;
  legalName: string;
  tradeName: string | null;
  document: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  primaryResponsibleName: string;
  primaryResponsibleEmail: string | null;
  status: CompanyStatus;
  basicPlanId: string | null;
  implementationNotes: string | null;
  createdAt: string;
};

export type AdminConsoleOverviewContract = {
  applications: AdminApplicationContract[];
  basicPlans: AdminBasicPlanContract[];
  companies: AdminCompanyContract[];
};

export type AdminCompanyApplicationContract = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  entryPath: string | null;
  applicationStatus: ApplicationStatus;
  companyApplicationId: string | null;
  companyStatus: CompanyApplicationStatus | null;
  implementationNotes: string | null;
  activatedAt: string | null;
  suspendedAt: string | null;
  cancelledAt: string | null;
};

export type AdminPermissionContract = {
  id: string;
  applicationId: string;
  key: string;
  name: string;
  description: string | null;
};

export type AdminRoleContract = {
  id: string;
  applicationId: string;
  applicationKey: string;
  applicationName: string;
  key: string;
  name: string;
  description: string | null;
  permissions: AdminPermissionContract[];
};

export type AdminUserApplicationRoleContract = {
  id: string;
  companyId: string;
  userId: string;
  applicationId: string;
  applicationKey: string;
  applicationName: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  createdAt: string;
};

export type AdminCompanyUserAccessContract = {
  user: AdminCompanyUserContract;
  applications: AdminCompanyApplicationContract[];
  availableRoles: AdminRoleContract[];
  grants: AdminUserApplicationRoleContract[];
};

export type AdminAuditLogContract = {
  id: string;
  companyId: string | null;
  companyName: string | null;
  actorUserId: string | null;
  action: string;
  entitySchema: string;
  entityTable: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CreateAdminCompanyInput = {
  personType: CompanyPersonType;
  legalName: string;
  tradeName?: string | null;
  document?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  primaryResponsibleName: string;
  primaryResponsibleEmail?: string | null;
  basicPlanId?: string | null;
  implementationNotes?: string | null;
};

export type CnpjLookupContract = {
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  address: string | null;
};

export type AdminUserContract = {
  id: string;
  fullName: string;
  email: string | null;
  status: UserStatus;
  createdAt: string;
};

export type AdminCompanyUserContract = AdminUserContract & {
  membershipId: string;
  companyId: string;
  membershipStatus: UserStatus;
  isPrimaryContact: boolean;
};

export type CreateAdminUserInput = {
  fullName: string;
  email: string;
  companyId: string;
  isPrimaryContact?: boolean;
};

export type UpdateAdminCompanyApplicationInput = {
  applicationId: string;
  status: CompanyApplicationStatus;
  implementationNotes?: string | null;
};

export type GrantAdminUserRoleInput = {
  roleId: string;
};

export type RevokeAdminUserRoleInput = {
  grantId: string;
};

export type RevokeAdminUserRoleContract = {
  revoked: true;
};
