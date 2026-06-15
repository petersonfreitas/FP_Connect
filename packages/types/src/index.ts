export type CompanyStatus = "implementation" | "active" | "suspended" | "cancelled";
export type CompanyPersonType = "individual" | "legal_entity";
export type UserStatus = "invited" | "active" | "inactive";
export type ApplicationStatus = "active" | "inactive" | "hidden";
export type CompanyApplicationStatus = "implementation" | "active" | "suspended" | "cancelled";
export type BasicPlanStatus = "active" | "inactive";
export type AdminAuditScope = "all" | "companies" | "users" | "modules" | "system";
export type UserGlobalRole = "company_user" | "fp_admin" | "super_admin" | "support";
export type ModuleApplicationKey =
  | "billing"
  | "food"
  | "marketing"
  | "robots"
  | "sales"
  | "tickets"
  | "tracking";

export type ModuleAccessContract = {
  actorUserId: string | null;
  applicationKey: ModuleApplicationKey;
  companyId: string | null;
  granted: true;
};

export type PaginatedContract<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

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
  primaryMobilePhone: string | null;
  primaryResponsibleName: string;
  primaryResponsibleEmail: string | null;
  addressPostalCode: string | null;
  addressStreetType: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  addressCity: string | null;
  addressState: string | null;
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

export type AdminContractedModuleContract = {
  id: string;
  companyId: string;
  companyName: string;
  applicationId: string;
  applicationKey: string;
  applicationName: string;
  applicationEntryPath: string | null;
  status: CompanyApplicationStatus;
  implementationNotes: string | null;
  activatedAt: string | null;
  suspendedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
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

export type AdminNavigationItemContract = {
  href: string;
  label: string;
};

export type AdminNavigationGroupContract = {
  label: string;
  items: AdminNavigationItemContract[];
};

export type AdminNavigationContract = {
  primary: AdminNavigationItemContract[];
  groups: AdminNavigationGroupContract[];
};

export type AdminCurrentUserModuleAccessContract = {
  applicationId: string;
  applicationKey: string;
  applicationName: string;
  companyId: string;
  companyName: string;
  entryPath: string | null;
  permissions: string[];
};

export type AdminCurrentUserCompanyAccessContract = {
  company: AdminCompanyContract;
  membershipId: string;
  membershipStatus: UserStatus;
  isPrimaryContact: boolean;
  adminPermissions: string[];
  modules: AdminCurrentUserModuleAccessContract[];
};

export type AdminCurrentUserAccessContract = {
  user: AdminUserContract & {
    globalRole: UserGlobalRole;
    isInternalUser: boolean;
  };
  isSuperAdmin: boolean;
  isPlatformUser: boolean;
  companies: AdminCurrentUserCompanyAccessContract[];
  navigation: AdminNavigationContract;
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
  primaryMobilePhone?: string | null;
  primaryResponsibleName: string;
  primaryResponsibleEmail?: string | null;
  addressPostalCode?: string | null;
  addressStreetType?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  addressDistrict?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  basicPlanId?: string | null;
  implementationNotes?: string | null;
};

export type UpdateAdminCompanyInput = CreateAdminCompanyInput & {
  status: CompanyStatus;
};

export type CnpjLookupContract = {
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  addressPostalCode: string | null;
  addressStreetType: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  addressCity: string | null;
  addressState: string | null;
};

export type AdminUserContract = {
  id: string;
  fullName: string;
  email: string | null;
  status: UserStatus;
  globalRole: UserGlobalRole;
  isInternalUser: boolean;
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

export type UpdateAdminCompanyUserInput = {
  status: UserStatus;
  isPrimaryContact: boolean;
};

export type LinkAdminCompanySupportInput = {
  userId: string;
};

export type UpdateAdminUserInput = {
  fullName: string;
  email: string;
  status: UserStatus;
  globalRole: UserGlobalRole;
};

export type UpdateAdminCompanyApplicationInput = {
  applicationId: string;
  status: CompanyApplicationStatus;
  implementationNotes?: string | null;
};

export type BulkUpdateAdminCompanyApplicationsInput = {
  applicationIds: string[];
  status: CompanyApplicationStatus;
  implementationNotes?: string | null;
};

export type BulkUpdateAdminCompanyApplicationsContract = {
  updated: AdminCompanyApplicationContract[];
};

export type GrantAdminUserRoleInput = {
  roleId: string;
};

export type BulkGrantAdminUserRolesInput = {
  roleIds: string[];
};

export type BulkGrantAdminUserRolesContract = {
  granted: AdminUserApplicationRoleContract[];
};

export type RevokeAdminUserRoleInput = {
  grantId: string;
};

export type RevokeAdminUserRoleContract = {
  revoked: true;
};

export type BulkRevokeAdminUserRolesInput = {
  grantIds: string[];
};

export type BulkRevokeAdminUserRolesContract = {
  revoked: true;
  count: number;
};

export type ResendAdminUserInviteContract = {
  sent: true;
};

export type ActivateAdminUserInviteContract = {
  activated: boolean;
};
