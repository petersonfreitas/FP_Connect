import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import type {
  ActivateAdminUserInviteContract,
  AdminAuditLogContract,
  AdminAuditScope,
  AdminApplicationContract,
  AdminBasicPlanCatalogContract,
  AdminBasicPlanContract,
  BulkGrantAdminUserRolesContract,
  BulkGrantAdminUserRolesInput,
  BulkRevokeAdminUserRolesContract,
  BulkRevokeAdminUserRolesInput,
  BulkUpdateAdminCompanyApplicationsContract,
  BulkUpdateAdminCompanyApplicationsInput,
  AdminCatalogContract,
  AdminCompanyApplicationContract,
  AdminCompanyUserAccessContract,
  AdminCompanyUserContract,
  AdminCompanyContract,
  AdminConsoleOverviewContract,
  AdminContractedModuleContract,
  AdminCurrentUserAccessContract,
  AdminCurrentUserCompanyAccessContract,
  AdminCurrentUserModuleAccessContract,
  AdminNavigationContract,
  AdminPermissionContract,
  PaginatedContract,
  AdminRoleContract,
  AdminUserContract,
  AdminUserApplicationRoleContract,
  CreateAdminCompanyInput,
  CreateAdminUserInput,
  GrantAdminUserRoleInput,
  ResendAdminUserInviteContract,
  RevokeAdminUserRoleContract,
  RevokeAdminUserRoleInput,
  UpdateAdminCompanyInput,
  UpdateAdminUserInput,
  UpdateAdminCompanyApplicationInput,
  UserGlobalRole
} from "./admin-console.contracts";
import {
  emptyInternalApiContext,
  type InternalApiContext
} from "../../auth/internal-api-context";
import { AppConfigService } from "../../config/app-config.service";
import { SupabaseService } from "../../supabase/supabase.service";

type SupabaseFailure = {
  message: string;
};

type PaginationOptions = {
  page?: string;
  pageSize?: string;
};

type ApplicationRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  entry_path: string | null;
  status: AdminApplicationContract["status"];
  sort_order: number;
};

type BasicPlanRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: AdminBasicPlanContract["status"];
};

type BasicPlanApplicationRow = {
  basic_plan_id: string;
  application_id: string;
};

type CompanyRow = {
  id: string;
  person_type: AdminCompanyContract["personType"];
  legal_name: string;
  trade_name: string | null;
  document: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  primary_mobile_phone: string | null;
  primary_responsible_name: string;
  primary_responsible_email: string | null;
  address_postal_code: string | null;
  address_street_type: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_district: string | null;
  address_city: string | null;
  address_state: string | null;
  status: AdminCompanyContract["status"];
  basic_plan_id: string | null;
  implementation_notes: string | null;
  created_at: string;
};

type UserRow = {
  id: string;
  full_name: string;
  email: string | null;
  status: AdminUserContract["status"];
  created_at: string;
};

type CurrentUserProfileRow = UserRow & {
  global_role: UserGlobalRole;
  is_internal_user: boolean;
};

type CompanyUserRow = {
  id: string;
  company_id: string;
  user_id: string;
  status: AdminCompanyUserContract["membershipStatus"];
  is_primary_contact: boolean;
};

type CompanyApplicationRow = {
  id: string;
  company_id: string;
  application_id: string;
  status: NonNullable<AdminCompanyApplicationContract["companyStatus"]>;
  implementation_notes: string | null;
  activated_at: string | null;
  suspended_at: string | null;
  cancelled_at: string | null;
  created_at?: string;
};

type PermissionRow = {
  id: string;
  application_id: string;
  key: string;
  name: string;
  description: string | null;
};

type RoleRow = {
  id: string;
  application_id: string;
  key: string;
  name: string;
  description: string | null;
};

type RolePermissionRow = {
  role_id: string;
  permission_id: string;
};

type UserApplicationRoleRow = {
  id: string;
  company_id: string;
  user_id: string;
  application_id: string;
  role_id: string;
  created_at: string;
};

type AuditLogRow = {
  id: string;
  company_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_schema: string;
  entity_table: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type AuditCompanyRow = {
  id: string;
  legal_name: string;
  trade_name: string | null;
};

type ContractedModuleCompanyRow = {
  id: string;
  legal_name: string;
  trade_name: string | null;
};

const companySelect =
  "id,person_type,legal_name,trade_name,document,primary_email,primary_phone,primary_mobile_phone,primary_responsible_name,primary_responsible_email,address_postal_code,address_street_type,address_street,address_number,address_complement,address_district,address_city,address_state,status,basic_plan_id,implementation_notes,created_at";
const userSelect = "id,full_name,email,status,created_at";
const applicationSelect = "id,key,name,description,entry_path,status,sort_order";
const companyApplicationSelect =
  "id,company_id,application_id,status,implementation_notes,activated_at,suspended_at,cancelled_at";
const contractedModuleSelect =
  "id,company_id,application_id,status,implementation_notes,activated_at,suspended_at,cancelled_at,created_at";
const permissionSelect = "id,application_id,key,name,description";
const roleSelect = "id,application_id,key,name,description";
const rolePermissionSelect = "role_id,permission_id";
const userApplicationRoleSelect = "id,company_id,user_id,application_id,role_id,created_at";
const auditLogSelect =
  "id,company_id,actor_user_id,action,entity_schema,entity_table,entity_id,metadata,created_at";
const basicPlanApplicationSelect = "basic_plan_id,application_id";
const defaultPage = 1;
const defaultPageSize = 20;
const maxPageSize = 100;

@Injectable()
export class AdminConsoleService {
  constructor(
    private readonly config: AppConfigService,
    private readonly supabase: SupabaseService
  ) {}

  async getCurrentUserAccess(
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<AdminCurrentUserAccessContract> {
    if (!context.actorUserId) {
      throw new UnauthorizedException("Authenticated actor is required");
    }

    const actorUserId = normalizeUuid(context.actorUserId, "actorUserId");
    const profile = await this.getCurrentUserProfile(actorUserId);
    const isSuperAdmin = profile.global_role === "super_admin";
    const isPlatformUser =
      isSuperAdmin ||
      profile.global_role === "fp_admin" ||
      profile.global_role === "support" ||
      profile.is_internal_user;
    const memberships = await this.listUserMembershipRows(actorUserId);
    const companyIds = unique(memberships.map((membership) => membership.company_id));
    const [companiesById, grantRows, companyApplicationRows] = await Promise.all([
      this.listCompaniesById(companyIds),
      this.listUserApplicationRoleRowsByUserId(actorUserId, companyIds),
      this.listCompanyApplicationRowsByCompanyIds(companyIds)
    ]);
    const applicationIds = unique([
      ...grantRows.map((grant) => grant.application_id),
      ...companyApplicationRows.map((companyApplication) => companyApplication.application_id)
    ]);
    const [applicationsById, roleRows] = await Promise.all([
      this.listApplicationsById(applicationIds),
      this.listRoleRowsByApplicationIds(unique(grantRows.map((grant) => grant.application_id)))
    ]);
    const rolePermissionsByRoleId = await this.listPermissionsByRoleId(roleRows);
    const rolesById = new Map(roleRows.map((role) => [role.id, role]));
    const companyApplicationsByCompanyAndApplication = new Map(
      companyApplicationRows.map((row) => [
        `${row.company_id}:${row.application_id}`,
        row
      ])
    );
    const grantsByCompanyId = new Map<string, UserApplicationRoleRow[]>();

    for (const grant of grantRows) {
      const grants = grantsByCompanyId.get(grant.company_id) ?? [];
      grants.push(grant);
      grantsByCompanyId.set(grant.company_id, grants);
    }

    const companies = memberships.flatMap((membership): AdminCurrentUserCompanyAccessContract[] => {
      const company = companiesById.get(membership.company_id);

      if (!company) {
        return [];
      }

      const grants = grantsByCompanyId.get(membership.company_id) ?? [];
      const adminPermissions = new Set<string>();
      const modulesByCompanyAndApplication = new Map<string, AdminCurrentUserModuleAccessContract>();

      for (const grant of grants) {
        const application = applicationsById.get(grant.application_id);
        const role = rolesById.get(grant.role_id);

        if (!application || !role || application.status !== "active") {
          continue;
        }

        const permissions = rolePermissionsByRoleId.get(role.id) ?? [];
        const permissionKeys = permissions.map((permission) => permission.key);
        const companyApplication = companyApplicationsByCompanyAndApplication.get(
          `${membership.company_id}:${grant.application_id}`
        );
        const isActiveContractedModule = companyApplication?.status === "active";

        if (application.key === "admin-console" && isActiveContractedModule) {
          for (const permissionKey of permissionKeys) {
            adminPermissions.add(permissionKey);
          }
          continue;
        }

        if (!isActiveContractedModule || permissionKeys.length === 0) {
          continue;
        }

        modulesByCompanyAndApplication.set(`${membership.company_id}:${application.id}`, {
          applicationId: application.id,
          applicationKey: application.key,
          applicationName: application.name,
          companyId: membership.company_id,
          companyName: getCompanyDisplayName(company),
          entryPath: application.entry_path,
          permissions: permissionKeys
        });
      }

      return [
        {
          company: mapCompany(company),
          membershipId: membership.id,
          membershipStatus: membership.status,
          isPrimaryContact: membership.is_primary_contact,
          adminPermissions: Array.from(adminPermissions).sort(),
          modules: Array.from(modulesByCompanyAndApplication.values()).sort((first, second) =>
            first.applicationName.localeCompare(second.applicationName, "pt-BR")
          )
        }
      ];
    });

    return {
      user: {
        ...mapUser(profile),
        globalRole: profile.global_role,
        isInternalUser: profile.is_internal_user
      },
      isSuperAdmin,
      isPlatformUser,
      companies,
      navigation: buildCurrentUserNavigation(isSuperAdmin, companies)
    };
  }

  async getOverview(): Promise<AdminConsoleOverviewContract> {
    const [applications, basicPlans, companiesPage] = await Promise.all([
      this.listApplications(),
      this.listBasicPlans(),
      this.listCompanies({ page: "1", pageSize: "1000" })
    ]);

    return {
      applications,
      basicPlans,
      companies: companiesPage.items
    };
  }

  async listApplications(): Promise<AdminApplicationContract[]> {
    const { data, error } = await this.supabase.core
      .from("applications")
      .select(applicationSelect)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as ApplicationRow[]).map(mapApplication);
  }

  async listCompanyApplications(companyId: string): Promise<AdminCompanyApplicationContract[]> {
    await this.ensureCompanyExists(companyId);

    const [applicationsResult, companyApplicationsResult] = await Promise.all([
      this.supabase.core
        .from("applications")
        .select(applicationSelect)
        .is("deleted_at", null)
        .neq("status", "hidden")
        .order("sort_order", { ascending: true }),
      this.supabase.core
        .from("company_applications")
        .select(companyApplicationSelect)
        .eq("company_id", companyId)
        .is("deleted_at", null)
    ]);

    if (applicationsResult.error) {
      throwSupabaseError(applicationsResult.error);
    }

    if (companyApplicationsResult.error) {
      throwSupabaseError(companyApplicationsResult.error);
    }

    const companyApplicationsByApplicationId = new Map(
      ((companyApplicationsResult.data ?? []) as CompanyApplicationRow[]).map((row) => [
        row.application_id,
        row
      ])
    );

    return ((applicationsResult.data ?? []) as ApplicationRow[]).map((application) => {
      const companyApplication = companyApplicationsByApplicationId.get(application.id);

      return mapCompanyApplication(application, companyApplication);
    });
  }

  async listBasicPlans(): Promise<AdminBasicPlanContract[]> {
    const { data, error } = await this.supabase.core
      .from("basic_plans")
      .select("id,key,name,description,status")
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as BasicPlanRow[]).map(mapBasicPlan);
  }

  async getCatalog(): Promise<AdminCatalogContract> {
    const [applicationsResult, basicPlansResult, planApplicationsResult] = await Promise.all([
      this.supabase.core
        .from("applications")
        .select(applicationSelect)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
      this.supabase.core
        .from("basic_plans")
        .select("id,key,name,description,status")
        .is("deleted_at", null)
        .order("name", { ascending: true }),
      this.supabase.core.from("basic_plan_applications").select(basicPlanApplicationSelect)
    ]);

    if (applicationsResult.error) {
      throwSupabaseError(applicationsResult.error);
    }

    if (basicPlansResult.error) {
      throwSupabaseError(basicPlansResult.error);
    }

    if (planApplicationsResult.error) {
      throwSupabaseError(planApplicationsResult.error);
    }

    const applications = ((applicationsResult.data ?? []) as ApplicationRow[]).map(mapApplication);
    const applicationsById = new Map(applications.map((application) => [application.id, application]));
    const planApplications = (planApplicationsResult.data ?? []) as BasicPlanApplicationRow[];
    const applicationIdsByPlanId = groupApplicationIdsByPlanId(planApplications);
    const basicPlans = ((basicPlansResult.data ?? []) as BasicPlanRow[]).map((plan) =>
      mapBasicPlanCatalog(
        plan,
        (applicationIdsByPlanId.get(plan.id) ?? []).flatMap((applicationId) => {
          const application = applicationsById.get(applicationId);
          return application ? [application] : [];
        })
      )
    );

    return {
      applications,
      basicPlans
    };
  }

  async listContractedModules(): Promise<AdminContractedModuleContract[]> {
    const { data, error } = await this.supabase.core
      .from("company_applications")
      .select(contractedModuleSelect)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError(error);
    }

    const rows = (data ?? []) as Required<CompanyApplicationRow>[];
    const companyIds = unique(rows.map((row) => row.company_id));
    const applicationIds = unique(rows.map((row) => row.application_id));
    const [companiesById, applicationsById] = await Promise.all([
      this.listContractedModuleCompaniesById(companyIds),
      this.listApplicationsById(applicationIds)
    ]);

    return rows.flatMap((row) => {
      const company = companiesById.get(row.company_id);
      const application = applicationsById.get(row.application_id);

      if (!company || !application) {
        return [];
      }

      return [mapContractedModule(row, company, application)];
    });
  }

  async listAuditLogs(scope: AdminAuditScope = "all"): Promise<AdminAuditLogContract[]> {
    const normalizedScope = normalizeAuditScope(scope);
    const actions = getAuditScopeActions(normalizedScope);
    let query = this.supabase.core
      .from("audit_logs")
      .select(auditLogSelect)
      .order("created_at", { ascending: false })
      .limit(100);

    if (actions) {
      query = query.in("action", actions);
    }

    const { data, error } = await query;

    if (error) {
      throwSupabaseError(error);
    }

    const rows = (data ?? []) as AuditLogRow[];
    const companyIds = unique(rows.flatMap((row) => (row.company_id ? [row.company_id] : [])));
    const companiesById = await this.listAuditCompaniesById(companyIds);

    return rows.map((row) => mapAuditLog(row, companiesById.get(row.company_id ?? "")));
  }

  async listCompanies(options: PaginationOptions = {}): Promise<PaginatedContract<AdminCompanyContract>> {
    const pagination = normalizePagination(options);
    const { from, to } = getPaginationRange(pagination);
    const { count, data, error } = await this.supabase.core
      .from("companies")
      .select(companySelect, { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throwSupabaseError(error);
    }

    return mapPaginatedResult(
      ((data ?? []) as CompanyRow[]).map(mapCompany),
      count,
      pagination
    );
  }

  async listUsers(options: PaginationOptions = {}): Promise<PaginatedContract<AdminUserContract>> {
    const pagination = normalizePagination(options);
    const { from, to } = getPaginationRange(pagination);
    const { count, data, error } = await this.supabase.core
      .from("profiles")
      .select(userSelect, { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throwSupabaseError(error);
    }

    return mapPaginatedResult(
      ((data ?? []) as UserRow[]).map(mapUser),
      count,
      pagination
    );
  }

  async getUser(id: string): Promise<AdminUserContract> {
    const userId = normalizeUuid(id, "userId");

    const { data, error } = await this.supabase.core
      .from("profiles")
      .select(userSelect)
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("User not found");
    }

    return mapUser(data as UserRow);
  }

  async listCompanyUsers(companyId: string): Promise<AdminCompanyUserContract[]> {
    if (!isUuid(companyId)) {
      throw new BadRequestException("Invalid company id");
    }

    const { data, error } = await this.supabase.core
      .from("company_memberships")
      .select("id,company_id,user_id,status,is_primary_contact")
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError(error);
    }

    return this.hydrateCompanyUsers((data ?? []) as CompanyUserRow[]);
  }

  async getCompanyUserAccess(
    companyId: string,
    userId: string
  ): Promise<AdminCompanyUserAccessContract> {
    const normalizedCompanyId = normalizeUuid(companyId, "companyId");
    const normalizedUserId = normalizeUuid(userId, "userId");
    const membership = await this.getCompanyMembership(normalizedCompanyId, normalizedUserId);
    const [user] = await this.hydrateCompanyUsers([membership]);

    if (!user) {
      throw new NotFoundException("User profile not found");
    }

    const [allApplications, grantRows] = await Promise.all([
      this.listCompanyApplications(normalizedCompanyId),
      this.listUserApplicationRoleRows(normalizedCompanyId, normalizedUserId)
    ]);
    const contractedApplications = allApplications.filter((application) => application.companyStatus);
    const grantableApplicationIds = new Set(
      allApplications.filter(isGrantableCompanyApplication).map((application) => application.id)
    );
    const roleApplicationIds = unique([
      ...Array.from(grantableApplicationIds),
      ...grantRows.map((grant) => grant.application_id)
    ]);
    const roleRows = await this.listRoleRowsByApplicationIds(roleApplicationIds);
    const rolePermissionsByRoleId = await this.listPermissionsByRoleId(roleRows);
    const applicationsById = new Map(allApplications.map((application) => [application.id, application]));
    const roles = roleRows.flatMap((role) => {
      const application = applicationsById.get(role.application_id);

      if (!application) {
        return [];
      }

      return [mapRole(role, application, rolePermissionsByRoleId.get(role.id) ?? [])];
    });
    const rolesById = new Map(roles.map((role) => [role.id, role]));
    const grants = grantRows.flatMap((grant) => {
      const role = rolesById.get(grant.role_id);
      const application = applicationsById.get(grant.application_id);

      if (!role || !application) {
        return [];
      }

      return [mapUserApplicationRole(grant, application, role)];
    });

    return {
      user,
      applications: contractedApplications,
      availableRoles: roles.filter((role) => grantableApplicationIds.has(role.applicationId)),
      grants
    };
  }

  async getCompany(id: string): Promise<AdminCompanyContract> {
    if (!isUuid(id)) {
      throw new BadRequestException("Invalid company id");
    }

    const { data, error } = await this.supabase.core
      .from("companies")
      .select(companySelect)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("Company not found");
    }

    return mapCompany(data as CompanyRow);
  }

  async createCompany(
    input: CreateAdminCompanyInput,
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<AdminCompanyContract> {
    const company = normalizeCreateCompanyInput(input);

    const { data, error } = await this.supabase.core
      .from("companies")
      .insert({
        person_type: company.personType,
        legal_name: company.legalName,
        trade_name: company.tradeName,
        document: company.document,
        primary_email: company.primaryEmail,
        primary_phone: company.primaryPhone,
        primary_mobile_phone: company.primaryMobilePhone,
        primary_responsible_name: company.primaryResponsibleName,
        primary_responsible_email: company.primaryResponsibleEmail,
        address_postal_code: company.addressPostalCode,
        address_street_type: company.addressStreetType,
        address_street: company.addressStreet,
        address_number: company.addressNumber,
        address_complement: company.addressComplement,
        address_district: company.addressDistrict,
        address_city: company.addressCity,
        address_state: company.addressState,
        basic_plan_id: company.basicPlanId,
        implementation_notes: company.implementationNotes
      })
      .select(companySelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const createdCompany = mapCompany(data as CompanyRow);
    await this.createAuditLog(
      createdCompany.id,
      "core.company.created",
      "companies",
      createdCompany.id,
      {
        legalName: createdCompany.legalName,
        status: createdCompany.status
      },
      context
    );

    return createdCompany;
  }

  async updateCompany(
    companyId: string,
    input: UpdateAdminCompanyInput,
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<AdminCompanyContract> {
    const normalizedCompanyId = normalizeUuid(companyId, "companyId");
    const currentCompany = await this.getCompany(normalizedCompanyId);
    const company = normalizeUpdateCompanyInput(input, currentCompany.status);

    const { data, error } = await this.supabase.core
      .from("companies")
      .update({
        person_type: company.personType,
        legal_name: company.legalName,
        trade_name: company.tradeName,
        document: company.document,
        primary_email: company.primaryEmail,
        primary_phone: company.primaryPhone,
        primary_mobile_phone: company.primaryMobilePhone,
        primary_responsible_name: company.primaryResponsibleName,
        primary_responsible_email: company.primaryResponsibleEmail,
        address_postal_code: company.addressPostalCode,
        address_street_type: company.addressStreetType,
        address_street: company.addressStreet,
        address_number: company.addressNumber,
        address_complement: company.addressComplement,
        address_district: company.addressDistrict,
        address_city: company.addressCity,
        address_state: company.addressState,
        basic_plan_id: company.basicPlanId,
        implementation_notes: company.implementationNotes,
        status: company.status
      })
      .eq("id", normalizedCompanyId)
      .is("deleted_at", null)
      .select(companySelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const updatedCompany = mapCompany(data as CompanyRow);
    await this.createAuditLog(
      updatedCompany.id,
      "core.company.updated",
      "companies",
      updatedCompany.id,
      {
        legalName: updatedCompany.legalName,
        status: updatedCompany.status
      },
      context
    );

    return updatedCompany;
  }

  async createUser(
    input: CreateAdminUserInput,
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<AdminCompanyUserContract> {
    const userInput = normalizeCreateUserInput(input);
    await this.ensureCompanyExists(userInput.companyId);

    const { data: authData, error: authError } =
      await this.supabase.admin.auth.admin.inviteUserByEmail(userInput.email, {
        redirectTo: this.getPasswordRedirectUrl(),
        data: {
          full_name: userInput.fullName
        }
      });

    if (authError) {
      if (authError.message.toLowerCase().includes("already")) {
        throw new ConflictException("Usuario ja existe no Supabase Auth");
      }

      throw new InternalServerErrorException({
        message: "Supabase auth invitation failed",
        detail: authError.message
      });
    }

    const userId = authData.user?.id;
    if (!userId) {
      throw new InternalServerErrorException("Supabase Auth did not return a user id");
    }

    try {
      const { error: profileError } = await this.supabase.core.from("profiles").insert({
        id: userId,
        full_name: userInput.fullName,
        email: userInput.email,
        status: "invited",
        global_role: "company_user"
      });

      if (profileError) {
        throw profileError;
      }

      const { data: membershipData, error: membershipError } = await this.supabase.core
        .from("company_memberships")
        .insert({
          company_id: userInput.companyId,
          user_id: userId,
          status: "invited",
          is_primary_contact: userInput.isPrimaryContact,
          invited_at: new Date().toISOString()
        })
        .select("id,company_id,user_id,status,is_primary_contact")
        .single();

      if (membershipError) {
        throw membershipError;
      }

      const [companyUser] = await this.hydrateCompanyUsers([membershipData as CompanyUserRow]);

      await this.createAuditLog(
        userInput.companyId,
        "core.user.invited",
        "profiles",
        userId,
        {
          email: userInput.email,
          fullName: userInput.fullName
        },
        context
      );

      return companyUser;
    } catch (error) {
      await this.supabase.admin.auth.admin.deleteUser(userId).catch(() => undefined);

      if (error instanceof Error) {
        throw new InternalServerErrorException({
          message: "Core user creation failed",
          detail: error.message
        });
      }

      throw new InternalServerErrorException("Core user creation failed");
    }
  }

  async resendUserInvite(
    companyId: string,
    userId: string,
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<ResendAdminUserInviteContract> {
    const normalizedCompanyId = normalizeUuid(companyId, "companyId");
    const normalizedUserId = normalizeUuid(userId, "userId");
    const membership = await this.getCompanyMembership(normalizedCompanyId, normalizedUserId);
    const [companyUser] = await this.hydrateCompanyUsers([membership]);

    if (!companyUser) {
      throw new NotFoundException("User profile not found");
    }

    if (companyUser.status !== "invited" || companyUser.membershipStatus !== "invited") {
      throw new BadRequestException("Convite so pode ser reenviado para usuarios pendentes");
    }

    if (!companyUser.email) {
      throw new BadRequestException("Usuario nao possui e-mail cadastrado para convite");
    }

    const { error: authError } = await this.supabase.admin.auth.admin.inviteUserByEmail(
      companyUser.email,
      {
        redirectTo: this.getPasswordRedirectUrl(),
        data: {
          full_name: companyUser.fullName
        }
      }
    );

    if (authError) {
      throw new InternalServerErrorException({
        message: "Supabase auth invitation resend failed",
        detail: authError.message
      });
    }

    const { error: membershipError } = await this.supabase.core
      .from("company_memberships")
      .update({
        invited_at: new Date().toISOString()
      })
      .eq("id", membership.id)
      .is("deleted_at", null);

    if (membershipError) {
      throwSupabaseError(membershipError);
    }

    await this.createAuditLog(
      normalizedCompanyId,
      "core.user.invite_resent",
      "profiles",
      normalizedUserId,
      {
        email: companyUser.email,
        fullName: companyUser.fullName
      },
      context
    );

    return {
      sent: true
    };
  }

  async activateCurrentUserInvite(
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<ActivateAdminUserInviteContract> {
    const actorUserId = context.actorUserId;

    if (!actorUserId) {
      throw new UnauthorizedException("Authenticated actor is required");
    }

    const userId = normalizeUuid(actorUserId, "userId");
    const { data: profileData, error: profileError } = await this.supabase.core
      .from("profiles")
      .select("id,status")
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (profileError) {
      throwSupabaseError(profileError);
    }

    const profile = profileData as Pick<UserRow, "id" | "status"> | null;

    if (!profile || profile.status !== "invited") {
      return {
        activated: false
      };
    }

    const timestamp = new Date().toISOString();
    const { error: userError } = await this.supabase.core
      .from("profiles")
      .update({
        status: "active"
      })
      .eq("id", userId)
      .eq("status", "invited")
      .is("deleted_at", null);

    if (userError) {
      throwSupabaseError(userError);
    }

    const { error: membershipError } = await this.supabase.core
      .from("company_memberships")
      .update({
        accepted_at: timestamp,
        status: "active"
      })
      .eq("user_id", userId)
      .eq("status", "invited")
      .is("deleted_at", null);

    if (membershipError) {
      throwSupabaseError(membershipError);
    }

    await this.createAuditLog(
      null,
      "core.user.invite_accepted",
      "profiles",
      userId,
      {
        activatedAt: timestamp
      },
      context
    );

    return {
      activated: true
    };
  }

  async updateUser(
    id: string,
    input: UpdateAdminUserInput,
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<AdminUserContract> {
    const userId = normalizeUuid(id, "userId");
    await this.getUser(userId);
    const userInput = normalizeUpdateUserInput(input);

    const { error: authError } = await this.supabase.admin.auth.admin.updateUserById(userId, {
      email: userInput.email,
      user_metadata: {
        full_name: userInput.fullName
      }
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("already")) {
        throw new ConflictException("E-mail ja existe no Supabase Auth");
      }

      throw new InternalServerErrorException({
        message: "Supabase auth user update failed",
        detail: authError.message
      });
    }

    const { data, error } = await this.supabase.core
      .from("profiles")
      .update({
        full_name: userInput.fullName,
        email: userInput.email,
        status: userInput.status
      })
      .eq("id", userId)
      .is("deleted_at", null)
      .select(userSelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const updatedUser = mapUser(data as UserRow);
    const { error: membershipError } = await this.supabase.core
      .from("company_memberships")
      .update({
        status: updatedUser.status
      })
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (membershipError) {
      throwSupabaseError(membershipError);
    }

    await this.createAuditLog(
      null,
      "core.user.updated",
      "profiles",
      userId,
      {
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        membershipStatus: updatedUser.status,
        status: updatedUser.status
      },
      context
    );

    return updatedUser;
  }

  async updateCompanyApplication(
    companyId: string,
    input: UpdateAdminCompanyApplicationInput,
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<AdminCompanyApplicationContract> {
    await this.ensureCompanyExists(companyId);

    const applicationId = normalizeUuid(input.applicationId, "applicationId");
    const status = normalizeCompanyApplicationStatus(input.status);
    const implementationNotes = normalizeOptional(input.implementationNotes, 1000);
    const application = await this.getApplication(applicationId);
    const current = await this.getCurrentCompanyApplication(companyId, applicationId);
    const timestamp = new Date().toISOString();

    const statusTimestamps = {
      activated_at: status === "active" ? (current?.activated_at ?? timestamp) : current?.activated_at,
      suspended_at: status === "suspended" ? timestamp : current?.suspended_at,
      cancelled_at: status === "cancelled" ? timestamp : current?.cancelled_at
    };

    const payload = {
      status,
      implementation_notes: implementationNotes,
      ...statusTimestamps
    };

    const { data, error } = current
      ? await this.supabase.core
          .from("company_applications")
          .update(payload)
          .eq("id", current.id)
          .select(companyApplicationSelect)
          .single()
      : await this.supabase.core
          .from("company_applications")
          .insert({
            company_id: companyId,
            application_id: applicationId,
            ...payload
          })
          .select(companyApplicationSelect)
          .single();

    if (error) {
      throwSupabaseError(error);
    }

    const companyApplication = data as CompanyApplicationRow;

    await this.createAuditLog(
      companyId,
      "core.company_application.updated",
      "company_applications",
      companyApplication.id,
      {
        applicationId,
        applicationKey: application.key,
        status
      },
      context
    );

    return mapCompanyApplication(application, companyApplication);
  }

  async bulkUpdateCompanyApplications(
    companyId: string,
    input: BulkUpdateAdminCompanyApplicationsInput,
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<BulkUpdateAdminCompanyApplicationsContract> {
    const applicationIds = normalizeUuidList(input.applicationIds, "applicationIds");

    if (applicationIds.length === 0) {
      throw new BadRequestException("Selecione ao menos um modulo");
    }

    const status = normalizeCompanyApplicationStatus(input.status);
    const implementationNotes = normalizeOptional(input.implementationNotes, 1000);
    const updated: AdminCompanyApplicationContract[] = [];

    for (const applicationId of applicationIds) {
      updated.push(
        await this.updateCompanyApplication(
          companyId,
          {
            applicationId,
            status,
            implementationNotes
          },
          context
        )
      );
    }

    return { updated };
  }

  async grantUserRole(
    companyId: string,
    userId: string,
    input: GrantAdminUserRoleInput,
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<AdminUserApplicationRoleContract> {
    const normalizedCompanyId = normalizeUuid(companyId, "companyId");
    const normalizedUserId = normalizeUuid(userId, "userId");
    const roleId = normalizeUuid(input.roleId, "roleId");
    await this.getCompanyMembership(normalizedCompanyId, normalizedUserId);

    const role = await this.getRole(roleId);
    const application = await this.getApplication(role.application_id);
    const companyApplication = await this.getCurrentCompanyApplication(
      normalizedCompanyId,
      application.id
    );

    if (!companyApplication || !isGrantableCompanyApplicationStatus(companyApplication.status)) {
      throw new BadRequestException(
        "Modulo precisa estar contratado e em implantacao ou ativo para receber papeis"
      );
    }

    const current = await this.getCurrentUserApplicationRole(
      normalizedCompanyId,
      normalizedUserId,
      application.id,
      roleId
    );

    if (current) {
      return this.hydrateUserApplicationRole(current);
    }

    const { data, error } = await this.supabase.core
      .from("user_application_roles")
      .insert({
        company_id: normalizedCompanyId,
        user_id: normalizedUserId,
        application_id: application.id,
        role_id: roleId
      })
      .select(userApplicationRoleSelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const grant = data as UserApplicationRoleRow;

    await this.createAuditLog(
      normalizedCompanyId,
      "core.user_application_role.granted",
      "user_application_roles",
      grant.id,
      {
        applicationId: application.id,
        applicationKey: application.key,
        roleId,
        userId: normalizedUserId
      },
      context
    );

    return this.hydrateUserApplicationRole(grant);
  }

  async bulkGrantUserRoles(
    companyId: string,
    userId: string,
    input: BulkGrantAdminUserRolesInput,
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<BulkGrantAdminUserRolesContract> {
    const roleIds = normalizeUuidList(input.roleIds, "roleIds");

    if (roleIds.length === 0) {
      throw new BadRequestException("Selecione ao menos um papel");
    }

    const granted: AdminUserApplicationRoleContract[] = [];

    for (const roleId of roleIds) {
      granted.push(await this.grantUserRole(companyId, userId, { roleId }, context));
    }

    return { granted };
  }

  async revokeUserRole(
    companyId: string,
    userId: string,
    input: RevokeAdminUserRoleInput,
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<RevokeAdminUserRoleContract> {
    const normalizedCompanyId = normalizeUuid(companyId, "companyId");
    const normalizedUserId = normalizeUuid(userId, "userId");
    const grantId = normalizeUuid(input.grantId, "grantId");
    await this.getCompanyMembership(normalizedCompanyId, normalizedUserId);

    const { data, error } = await this.supabase.core
      .from("user_application_roles")
      .select(userApplicationRoleSelect)
      .eq("id", grantId)
      .eq("company_id", normalizedCompanyId)
      .eq("user_id", normalizedUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("User role grant not found");
    }

    const { error: updateError } = await this.supabase.core
      .from("user_application_roles")
      .update({
        deleted_at: new Date().toISOString(),
        delete_reason: "Revogado pelo Admin Console"
      })
      .eq("id", grantId);

    if (updateError) {
      throwSupabaseError(updateError);
    }

    await this.createAuditLog(
      normalizedCompanyId,
      "core.user_application_role.revoked",
      "user_application_roles",
      grantId,
      {
        userId: normalizedUserId
      },
      context
    );

    return { revoked: true };
  }

  async bulkRevokeUserRoles(
    companyId: string,
    userId: string,
    input: BulkRevokeAdminUserRolesInput,
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<BulkRevokeAdminUserRolesContract> {
    const grantIds = normalizeUuidList(input.grantIds, "grantIds");

    if (grantIds.length === 0) {
      throw new BadRequestException("Selecione ao menos uma concessao");
    }

    for (const grantId of grantIds) {
      await this.revokeUserRole(companyId, userId, { grantId }, context);
    }

    return { revoked: true, count: grantIds.length };
  }

  private async ensureCompanyExists(companyId: string): Promise<void> {
    await this.getCompany(companyId);
  }

  private async getCurrentUserProfile(userId: string): Promise<CurrentUserProfileRow> {
    const { data, error } = await this.supabase.core
      .from("profiles")
      .select("id,full_name,email,status,created_at,global_role,is_internal_user")
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("User profile not found");
    }

    return data as CurrentUserProfileRow;
  }

  private async listUserMembershipRows(userId: string): Promise<CompanyUserRow[]> {
    const { data, error } = await this.supabase.core
      .from("company_memberships")
      .select("id,company_id,user_id,status,is_primary_contact")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as CompanyUserRow[];
  }

  private async getCompanyMembership(companyId: string, userId: string): Promise<CompanyUserRow> {
    const { data, error } = await this.supabase.core
      .from("company_memberships")
      .select("id,company_id,user_id,status,is_primary_contact")
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("Company user membership not found");
    }

    return data as CompanyUserRow;
  }

  private async listCompaniesById(companyIds: string[]): Promise<Map<string, CompanyRow>> {
    if (companyIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabase.core
      .from("companies")
      .select(companySelect)
      .in("id", companyIds)
      .is("deleted_at", null);

    if (error) {
      throwSupabaseError(error);
    }

    return new Map(((data ?? []) as CompanyRow[]).map((company) => [company.id, company]));
  }

  private async listAuditCompaniesById(companyIds: string[]): Promise<Map<string, AuditCompanyRow>> {
    if (companyIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabase.core
      .from("companies")
      .select("id,legal_name,trade_name")
      .in("id", companyIds);

    if (error) {
      throwSupabaseError(error);
    }

    return new Map(((data ?? []) as AuditCompanyRow[]).map((company) => [company.id, company]));
  }

  private async listContractedModuleCompaniesById(
    companyIds: string[]
  ): Promise<Map<string, ContractedModuleCompanyRow>> {
    if (companyIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabase.core
      .from("companies")
      .select("id,legal_name,trade_name")
      .in("id", companyIds);

    if (error) {
      throwSupabaseError(error);
    }

    return new Map(
      ((data ?? []) as ContractedModuleCompanyRow[]).map((company) => [company.id, company])
    );
  }

  private async getApplication(applicationId: string): Promise<ApplicationRow> {
    const { data, error } = await this.supabase.core
      .from("applications")
      .select(applicationSelect)
      .eq("id", applicationId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("Application not found");
    }

    return data as ApplicationRow;
  }

  private async listApplicationsById(applicationIds: string[]): Promise<Map<string, ApplicationRow>> {
    if (applicationIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabase.core
      .from("applications")
      .select(applicationSelect)
      .in("id", applicationIds)
      .is("deleted_at", null);

    if (error) {
      throwSupabaseError(error);
    }

    return new Map(((data ?? []) as ApplicationRow[]).map((application) => [application.id, application]));
  }

  private async getCurrentCompanyApplication(
    companyId: string,
    applicationId: string
  ): Promise<CompanyApplicationRow | null> {
    const { data, error } = await this.supabase.core
      .from("company_applications")
      .select(companyApplicationSelect)
      .eq("company_id", companyId)
      .eq("application_id", applicationId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    return (data as CompanyApplicationRow | null) ?? null;
  }

  private async getRole(roleId: string): Promise<RoleRow> {
    const { data, error } = await this.supabase.core
      .from("roles")
      .select(roleSelect)
      .eq("id", roleId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("Role not found");
    }

    return data as RoleRow;
  }

  private async listRoleRowsByApplicationIds(applicationIds: string[]): Promise<RoleRow[]> {
    if (applicationIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase.core
      .from("roles")
      .select(roleSelect)
      .in("application_id", applicationIds)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as RoleRow[];
  }

  private async listPermissionsByRoleId(
    roles: RoleRow[]
  ): Promise<Map<string, AdminPermissionContract[]>> {
    const roleIds = roles.map((role) => role.id);

    if (roleIds.length === 0) {
      return new Map();
    }

    const [permissionsResult, rolePermissionsResult] = await Promise.all([
      this.supabase.core
        .from("permissions")
        .select(permissionSelect)
        .in("application_id", unique(roles.map((role) => role.application_id)))
        .is("deleted_at", null),
      this.supabase.core
        .from("role_permissions")
        .select(rolePermissionSelect)
        .in("role_id", roleIds)
    ]);

    if (permissionsResult.error) {
      throwSupabaseError(permissionsResult.error);
    }

    if (rolePermissionsResult.error) {
      throwSupabaseError(rolePermissionsResult.error);
    }

    const permissionsById = new Map(
      ((permissionsResult.data ?? []) as PermissionRow[]).map((permission) => [
        permission.id,
        mapPermission(permission)
      ])
    );
    const permissionsByRoleId = new Map<string, AdminPermissionContract[]>();

    for (const row of (rolePermissionsResult.data ?? []) as RolePermissionRow[]) {
      const permission = permissionsById.get(row.permission_id);

      if (!permission) {
        continue;
      }

      const permissions = permissionsByRoleId.get(row.role_id) ?? [];
      permissions.push(permission);
      permissionsByRoleId.set(row.role_id, permissions);
    }

    return permissionsByRoleId;
  }

  private async listUserApplicationRoleRows(
    companyId: string,
    userId: string
  ): Promise<UserApplicationRoleRow[]> {
    const { data, error } = await this.supabase.core
      .from("user_application_roles")
      .select(userApplicationRoleSelect)
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as UserApplicationRoleRow[];
  }

  private async listUserApplicationRoleRowsByUserId(
    userId: string,
    companyIds: string[]
  ): Promise<UserApplicationRoleRow[]> {
    if (companyIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase.core
      .from("user_application_roles")
      .select(userApplicationRoleSelect)
      .eq("user_id", userId)
      .in("company_id", companyIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as UserApplicationRoleRow[];
  }

  private async listCompanyApplicationRowsByCompanyIds(
    companyIds: string[]
  ): Promise<CompanyApplicationRow[]> {
    if (companyIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase.core
      .from("company_applications")
      .select(companyApplicationSelect)
      .in("company_id", companyIds)
      .is("deleted_at", null);

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as CompanyApplicationRow[];
  }

  private async getCurrentUserApplicationRole(
    companyId: string,
    userId: string,
    applicationId: string,
    roleId: string
  ): Promise<UserApplicationRoleRow | null> {
    const { data, error } = await this.supabase.core
      .from("user_application_roles")
      .select(userApplicationRoleSelect)
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .eq("application_id", applicationId)
      .eq("role_id", roleId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    return (data as UserApplicationRoleRow | null) ?? null;
  }

  private async hydrateUserApplicationRole(
    grant: UserApplicationRoleRow
  ): Promise<AdminUserApplicationRoleContract> {
    const [application, role] = await Promise.all([
      this.getApplication(grant.application_id),
      this.getRole(grant.role_id)
    ]);

    return mapUserApplicationRole(grant, application, mapRole(role, application, []));
  }

  private async hydrateCompanyUsers(
    memberships: CompanyUserRow[]
  ): Promise<AdminCompanyUserContract[]> {
    const userIds = memberships.map((membership) => membership.user_id);

    if (userIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase.core
      .from("profiles")
      .select(userSelect)
      .in("id", userIds)
      .is("deleted_at", null);

    if (error) {
      throwSupabaseError(error);
    }

    const usersById = new Map(((data ?? []) as UserRow[]).map((user) => [user.id, user]));

    return memberships.flatMap((membership) => {
      const user = usersById.get(membership.user_id);

      if (!user) {
        return [];
      }

      return [mapCompanyUser(membership, user)];
    });
  }

  private async createAuditLog(
    companyId: string | null,
    action: string,
    entityTable: string,
    entityId: string,
    metadata: Record<string, unknown>,
    context: InternalApiContext = emptyInternalApiContext
  ): Promise<void> {
    const { error } = await this.supabase.core.from("audit_logs").insert({
      company_id: companyId,
      actor_user_id: context.actorUserId,
      action,
      entity_table: entityTable,
      entity_id: entityId,
      metadata
    });

    if (error) {
      throwSupabaseError(error);
    }
  }

  private getPasswordRedirectUrl(): string {
    return `${this.config.webUrl}/login/atualizar-senha`;
  }
}

function throwSupabaseError(error: SupabaseFailure): never {
  throw new InternalServerErrorException({
    message: "Supabase query failed",
    detail: error.message
  });
}

function normalizePagination(options: PaginationOptions): Required<PaginationOptions> {
  const page = normalizePositiveInteger(options.page, defaultPage);
  const requestedPageSize = normalizePositiveInteger(options.pageSize, defaultPageSize);

  return {
    page: String(page),
    pageSize: String(Math.min(requestedPageSize, maxPageSize))
  };
}

function normalizePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function getPaginationRange(pagination: Required<PaginationOptions>): { from: number; to: number } {
  const page = Number(pagination.page);
  const pageSize = Number(pagination.pageSize);
  const from = (page - 1) * pageSize;

  return {
    from,
    to: from + pageSize - 1
  };
}

function mapPaginatedResult<T>(
  items: T[],
  count: number | null,
  pagination: Required<PaginationOptions>
): PaginatedContract<T> {
  const total = count ?? items.length;
  const page = Number(pagination.page);
  const pageSize = Number(pagination.pageSize);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

function mapApplication(row: ApplicationRow): AdminApplicationContract {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    entryPath: row.entry_path,
    status: row.status,
    sortOrder: row.sort_order
  };
}

function mapCompanyApplication(
  application: ApplicationRow,
  companyApplication?: CompanyApplicationRow | null
): AdminCompanyApplicationContract {
  return {
    id: application.id,
    key: application.key,
    name: application.name,
    description: application.description,
    entryPath: application.entry_path,
    applicationStatus: application.status,
    companyApplicationId: companyApplication?.id ?? null,
    companyStatus: companyApplication?.status ?? null,
    implementationNotes: companyApplication?.implementation_notes ?? null,
    activatedAt: companyApplication?.activated_at ?? null,
    suspendedAt: companyApplication?.suspended_at ?? null,
    cancelledAt: companyApplication?.cancelled_at ?? null
  };
}

function mapContractedModule(
  row: Required<CompanyApplicationRow>,
  company: ContractedModuleCompanyRow,
  application: ApplicationRow
): AdminContractedModuleContract {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: company.trade_name ?? company.legal_name,
    applicationId: row.application_id,
    applicationKey: application.key,
    applicationName: application.name,
    applicationEntryPath: application.entry_path,
    status: row.status,
    implementationNotes: row.implementation_notes,
    activatedAt: row.activated_at,
    suspendedAt: row.suspended_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at
  };
}

function mapAuditLog(row: AuditLogRow, company?: AuditCompanyRow): AdminAuditLogContract {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: company ? (company.trade_name ?? company.legal_name) : null,
    actorUserId: row.actor_user_id,
    action: row.action,
    entitySchema: row.entity_schema,
    entityTable: row.entity_table,
    entityId: row.entity_id,
    metadata: row.metadata,
    createdAt: row.created_at
  };
}

function mapPermission(row: PermissionRow): AdminPermissionContract {
  return {
    id: row.id,
    applicationId: row.application_id,
    key: row.key,
    name: row.name,
    description: row.description
  };
}

function mapRole(
  row: RoleRow,
  application: { id: string; key: string; name: string },
  permissions: AdminPermissionContract[]
): AdminRoleContract {
  return {
    id: row.id,
    applicationId: row.application_id,
    applicationKey: application.key,
    applicationName: application.name,
    key: row.key,
    name: row.name,
    description: row.description,
    permissions
  };
}

function mapUserApplicationRole(
  row: UserApplicationRoleRow,
  application: { id: string; key: string; name: string },
  role: AdminRoleContract
): AdminUserApplicationRoleContract {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    applicationId: row.application_id,
    applicationKey: application.key,
    applicationName: application.name,
    roleId: row.role_id,
    roleKey: role.key,
    roleName: role.name,
    createdAt: row.created_at
  };
}

function mapBasicPlan(row: BasicPlanRow): AdminBasicPlanContract {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    status: row.status
  };
}

function mapBasicPlanCatalog(
  row: BasicPlanRow,
  applications: AdminApplicationContract[]
): AdminBasicPlanCatalogContract {
  return {
    ...mapBasicPlan(row),
    applications
  };
}

function getCompanyDisplayName(row: CompanyRow): string {
  return row.trade_name ?? row.legal_name;
}

function mapCompany(row: CompanyRow): AdminCompanyContract {
  return {
    id: row.id,
    personType: row.person_type,
    legalName: row.legal_name,
    tradeName: row.trade_name,
    document: row.document,
    primaryEmail: row.primary_email,
    primaryPhone: row.primary_phone,
    primaryMobilePhone: row.primary_mobile_phone,
    primaryResponsibleName: row.primary_responsible_name,
    primaryResponsibleEmail: row.primary_responsible_email,
    addressPostalCode: row.address_postal_code,
    addressStreetType: row.address_street_type,
    addressStreet: row.address_street,
    addressNumber: row.address_number,
    addressComplement: row.address_complement,
    addressDistrict: row.address_district,
    addressCity: row.address_city,
    addressState: row.address_state,
    status: row.status,
    basicPlanId: row.basic_plan_id,
    implementationNotes: row.implementation_notes,
    createdAt: row.created_at
  };
}

function mapUser(row: UserRow): AdminUserContract {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    status: row.status,
    createdAt: row.created_at
  };
}

function mapCompanyUser(
  membership: CompanyUserRow,
  user: UserRow
): AdminCompanyUserContract {
  return {
    ...mapUser(user),
    membershipId: membership.id,
    companyId: membership.company_id,
    membershipStatus: membership.status,
    isPrimaryContact: membership.is_primary_contact
  };
}

function normalizeCreateCompanyInput(input: CreateAdminCompanyInput): CreateAdminCompanyInput {
  const personType = normalizePersonType(input.personType);
  const legalName = normalizeRequired(input.legalName, "legalName", 180);
  const primaryResponsibleName = normalizeRequired(
    input.primaryResponsibleName,
    "primaryResponsibleName",
    140
  );
  const document = normalizeDocument(input.document, personType);

  return {
    personType,
    legalName,
    primaryResponsibleName,
    tradeName: normalizeOptional(input.tradeName, 140),
    document,
    primaryEmail: normalizeOptional(input.primaryEmail, 254),
    primaryPhone: normalizePhone(input.primaryPhone),
    primaryMobilePhone: normalizeMobilePhone(input.primaryMobilePhone),
    primaryResponsibleEmail: normalizeOptional(input.primaryResponsibleEmail, 254),
    addressPostalCode: normalizePostalCode(input.addressPostalCode),
    addressStreetType: normalizeOptional(input.addressStreetType, 40),
    addressStreet: normalizeOptional(input.addressStreet, 160),
    addressNumber: normalizeOptional(input.addressNumber, 20),
    addressComplement: normalizeOptional(input.addressComplement, 120),
    addressDistrict: normalizeOptional(input.addressDistrict, 120),
    addressCity: normalizeOptional(input.addressCity, 120),
    addressState: normalizeState(input.addressState),
    basicPlanId: normalizeOptional(input.basicPlanId),
    implementationNotes: normalizeOptional(input.implementationNotes, 1000)
  };
}

function normalizeUpdateCompanyInput(
  input: UpdateAdminCompanyInput,
  fallbackStatus: UpdateAdminCompanyInput["status"]
): UpdateAdminCompanyInput {
  return {
    ...normalizeCreateCompanyInput(input),
    status: normalizeCompanyStatus(input.status ?? fallbackStatus)
  };
}

function normalizeCreateUserInput(input: CreateAdminUserInput): Required<CreateAdminUserInput> {
  return {
    companyId: normalizeUuid(input.companyId, "companyId"),
    fullName: normalizeRequired(input.fullName, "fullName", 140),
    email: normalizeEmail(input.email),
    isPrimaryContact: Boolean(input.isPrimaryContact)
  };
}

function normalizeUpdateUserInput(input: UpdateAdminUserInput): UpdateAdminUserInput {
  return {
    fullName: normalizeRequired(input.fullName, "fullName", 140),
    email: normalizeEmail(input.email),
    status: normalizeUserStatus(input.status)
  };
}

function normalizeUserStatus(value: unknown): UpdateAdminUserInput["status"] {
  if (value === "invited" || value === "active" || value === "inactive") {
    return value;
  }

  throw new BadRequestException("status must be invited, active or inactive");
}

function normalizeUuid(value: unknown, field: string): string {
  const id = normalizeRequired(value, field, 36);
  if (!isUuid(id)) {
    throw new BadRequestException(`Invalid ${field}`);
  }

  return id;
}

function normalizeUuidList(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new BadRequestException(`${field} must be an array`);
  }

  return unique(value.map((item) => normalizeUuid(item, field)));
}

function normalizeCompanyApplicationStatus(
  value: unknown
): UpdateAdminCompanyApplicationInput["status"] {
  if (
    value === "implementation" ||
    value === "active" ||
    value === "suspended" ||
    value === "cancelled"
  ) {
    return value;
  }

  throw new BadRequestException("status must be implementation, active, suspended or cancelled");
}

function normalizeAuditScope(value: unknown): AdminAuditScope {
  if (
    value === "companies" ||
    value === "users" ||
    value === "modules" ||
    value === "system"
  ) {
    return value;
  }

  return "all";
}

function getAuditScopeActions(scope: AdminAuditScope): string[] | null {
  if (scope === "companies") {
    return ["core.company.created", "core.company.updated"];
  }

  if (scope === "users") {
    return [
      "core.user.invited",
      "core.user.updated",
      "core.user_application_role.granted",
      "core.user_application_role.revoked"
    ];
  }

  if (scope === "modules") {
    return [
      "core.company_application.updated",
      "core.user_application_role.granted",
      "core.user_application_role.revoked"
    ];
  }

  if (scope === "system") {
    return ["core.system.event"];
  }

  return null;
}

function buildCurrentUserNavigation(
  isSuperAdmin: boolean,
  companies: AdminCurrentUserCompanyAccessContract[]
): AdminNavigationContract {
  const primary = [{ href: "/", label: "Portal" }];

  if (isSuperAdmin) {
    return {
      primary,
      groups: [
        {
          label: "Cadastro",
          items: [
            { href: "/cadastro/empresas", label: "Empresas" },
            { href: "/cadastro/usuarios", label: "Usuarios" },
            { href: "/cadastro/planos", label: "Planos" },
            { href: "/cadastro/modulos", label: "Modulos" }
          ]
        },
        {
          label: "Movimentacao",
          items: [{ href: "/movimentacao/modulos-contratados", label: "Modulos contratados" }]
        },
        {
          label: "Sistemas",
          items: [{ href: "/robots", label: "FP Robots" }]
        },
        {
          label: "Auditoria",
          items: [
            { href: "/auditoria", label: "Visao geral" },
            { href: "/auditoria/empresas", label: "Empresas" },
            { href: "/auditoria/usuarios", label: "Usuarios" },
            { href: "/auditoria/modulos", label: "Modulos e permissoes" },
            { href: "/auditoria/sistema", label: "Sistema" }
          ]
        }
      ]
    };
  }

  const groups: AdminNavigationContract["groups"] = [];
  const companyItems = companies
    .filter((company) => company.adminPermissions.includes("admin.companies.read"))
    .map((company) => ({
      href: `/cadastro/empresas/${company.company.id}`,
      label: company.company.tradeName ?? company.company.legalName
    }));
  const moduleItems = buildModuleNavigationItems(companies);

  if (companyItems.length > 0) {
    groups.push({
      label: "Minhas empresas",
      items: companyItems
    });
  }

  if (moduleItems.length > 0) {
    groups.push({
      label: "Sistemas",
      items: moduleItems
    });
  }

  return {
    primary,
    groups
  };
}

function buildModuleNavigationItems(companies: AdminCurrentUserCompanyAccessContract[]) {
  const modules = companies.flatMap((company) =>
    company.modules.filter((module) => module.entryPath)
  );
  const pathCounts = new Map<string, number>();

  for (const module of modules) {
    const path = module.entryPath ?? "";
    pathCounts.set(path, (pathCounts.get(path) ?? 0) + 1);
  }

  return modules.map((module) => {
    const path = module.entryPath ?? "/";
    const shouldShowCompany = (pathCounts.get(path) ?? 0) > 1;

    return {
      href: path,
      label: shouldShowCompany
        ? `${module.applicationName} - ${module.companyName}`
        : module.applicationName
    };
  });
}

function isGrantableCompanyApplication(application: AdminCompanyApplicationContract): boolean {
  return (
    application.applicationStatus === "active" &&
    isGrantableCompanyApplicationStatus(application.companyStatus)
  );
}

function isGrantableCompanyApplicationStatus(
  status: AdminCompanyApplicationContract["companyStatus"]
): boolean {
  return status === "implementation" || status === "active";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function groupApplicationIdsByPlanId(
  rows: BasicPlanApplicationRow[]
): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const row of rows) {
    const applicationIds = grouped.get(row.basic_plan_id) ?? [];
    applicationIds.push(row.application_id);
    grouped.set(row.basic_plan_id, applicationIds);
  }

  return grouped;
}

function normalizeEmail(value: unknown): string {
  const email = normalizeRequired(value, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException("E-mail invalido");
  }

  return email;
}

function normalizeRequired(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestException(`${field} is required`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new BadRequestException(`${field} must have at most ${maxLength} characters`);
  }

  return normalized;
}

function normalizeOptional(value: unknown, maxLength?: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (maxLength && normalized.length > maxLength) {
    throw new BadRequestException(`Field must have at most ${maxLength} characters`);
  }

  return normalized;
}

function normalizePersonType(value: unknown): CreateAdminCompanyInput["personType"] {
  if (value === "individual" || value === "legal_entity") {
    return value;
  }

  throw new BadRequestException("personType must be individual or legal_entity");
}

function normalizeCompanyStatus(value: unknown): UpdateAdminCompanyInput["status"] {
  if (
    value === "implementation" ||
    value === "active" ||
    value === "suspended" ||
    value === "cancelled"
  ) {
    return value;
  }

  throw new BadRequestException("status must be implementation, active, suspended or cancelled");
}

function normalizeDocument(
  value: unknown,
  personType: CreateAdminCompanyInput["personType"]
): string {
  const digits = onlyDigits(typeof value === "string" ? value : "");

  if (personType === "individual") {
    if (!isValidCpf(digits)) {
      throw new BadRequestException("CPF invalido");
    }

    return digits;
  }

  if (!isValidCnpj(digits)) {
    throw new BadRequestException("CNPJ invalido");
  }

  return digits;
}

function normalizePhone(value: unknown): string | null {
  const rawValue = normalizeOptional(value, 20);

  if (!rawValue) {
    return null;
  }

  const digits = onlyDigits(rawValue);
  const nationalNumber =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
      ? digits.slice(2)
      : digits;
  const isLandline = nationalNumber.length === 10;
  const isMobile = nationalNumber.length === 11 && nationalNumber[2] === "9";

  if (!isLandline && !isMobile) {
    throw new BadRequestException(
      "Telefone invalido. Informe DDD + numero ou +55 + DDD + numero."
    );
  }

  return `+55${nationalNumber}`;
}

function normalizeMobilePhone(value: unknown): string | null {
  const rawValue = normalizeOptional(value, 20);

  if (!rawValue) {
    return null;
  }

  const digits = onlyDigits(rawValue);
  const nationalNumber =
    digits.startsWith("55") && digits.length === 13 ? digits.slice(2) : digits;
  const isMobile = nationalNumber.length === 11 && nationalNumber[2] === "9";

  if (!isMobile) {
    throw new BadRequestException(
      "Celular invalido. Informe DDD + numero de celular ou +55 + DDD + numero."
    );
  }

  return `+55${nationalNumber}`;
}

function normalizePostalCode(value: unknown): string | null {
  const rawValue = normalizeOptional(value, 12);

  if (!rawValue) {
    return null;
  }

  const digits = onlyDigits(rawValue);
  if (digits.length !== 8) {
    throw new BadRequestException("CEP invalido");
  }

  return digits;
}

function normalizeState(value: unknown): string | null {
  const rawValue = normalizeOptional(value, 2);

  if (!rawValue) {
    return null;
  }

  const state = rawValue.toUpperCase();
  if (!brazilianStates.has(state)) {
    throw new BadRequestException("Estado invalido");
  }

  return state;
}

const brazilianStates = new Set([
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO"
]);

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidCpf(value: string): boolean {
  if (!/^\d{11}$/.test(value) || /^(\d)\1+$/.test(value)) {
    return false;
  }

  const firstDigit = calculateCpfDigit(value.slice(0, 9));
  const secondDigit = calculateCpfDigit(`${value.slice(0, 9)}${firstDigit}`);

  return value === `${value.slice(0, 9)}${firstDigit}${secondDigit}`;
}

function calculateCpfDigit(base: string): number {
  const weightStart = base.length + 1;
  const sum = [...base].reduce((total, digit, index) => {
    return total + Number(digit) * (weightStart - index);
  }, 0);
  const rest = (sum * 10) % 11;

  return rest === 10 ? 0 : rest;
}

function isValidCnpj(value: string): boolean {
  if (!/^\d{14}$/.test(value) || /^(\d)\1+$/.test(value)) {
    return false;
  }

  const firstDigit = calculateCnpjDigit(value.slice(0, 12));
  const secondDigit = calculateCnpjDigit(`${value.slice(0, 12)}${firstDigit}`);

  return value === `${value.slice(0, 12)}${firstDigit}${secondDigit}`;
}

function calculateCnpjDigit(base: string): number {
  const weights =
    base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = [...base].reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const rest = sum % 11;

  return rest < 2 ? 0 : 11 - rest;
}
