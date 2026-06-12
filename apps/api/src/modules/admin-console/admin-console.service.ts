import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type {
  AdminAuditLogContract,
  AdminApplicationContract,
  AdminBasicPlanContract,
  AdminCompanyApplicationContract,
  AdminCompanyUserAccessContract,
  AdminCompanyUserContract,
  AdminCompanyContract,
  AdminConsoleOverviewContract,
  AdminPermissionContract,
  AdminRoleContract,
  AdminUserContract,
  AdminUserApplicationRoleContract,
  CreateAdminCompanyInput,
  CreateAdminUserInput,
  GrantAdminUserRoleInput,
  RevokeAdminUserRoleContract,
  RevokeAdminUserRoleInput,
  UpdateAdminCompanyApplicationInput
} from "./admin-console.contracts";
import { SupabaseService } from "../../supabase/supabase.service";

type SupabaseFailure = {
  message: string;
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

type CompanyRow = {
  id: string;
  person_type: AdminCompanyContract["personType"];
  legal_name: string;
  trade_name: string | null;
  document: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  primary_responsible_name: string;
  primary_responsible_email: string | null;
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

const companySelect =
  "id,person_type,legal_name,trade_name,document,primary_email,primary_phone,primary_responsible_name,primary_responsible_email,status,basic_plan_id,implementation_notes,created_at";
const userSelect = "id,full_name,email,status,created_at";
const applicationSelect = "id,key,name,description,entry_path,status,sort_order";
const companyApplicationSelect =
  "id,company_id,application_id,status,implementation_notes,activated_at,suspended_at,cancelled_at";
const permissionSelect = "id,application_id,key,name,description";
const roleSelect = "id,application_id,key,name,description";
const rolePermissionSelect = "role_id,permission_id";
const userApplicationRoleSelect = "id,company_id,user_id,application_id,role_id,created_at";
const auditLogSelect =
  "id,company_id,actor_user_id,action,entity_schema,entity_table,entity_id,metadata,created_at";

@Injectable()
export class AdminConsoleService {
  constructor(private readonly supabase: SupabaseService) {}

  async getOverview(): Promise<AdminConsoleOverviewContract> {
    const [applications, basicPlans, companies] = await Promise.all([
      this.listApplications(),
      this.listBasicPlans(),
      this.listCompanies()
    ]);

    return {
      applications,
      basicPlans,
      companies
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

  async listAuditLogs(): Promise<AdminAuditLogContract[]> {
    const { data, error } = await this.supabase.core
      .from("audit_logs")
      .select(auditLogSelect)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      throwSupabaseError(error);
    }

    const rows = (data ?? []) as AuditLogRow[];
    const companyIds = unique(rows.flatMap((row) => (row.company_id ? [row.company_id] : [])));
    const companiesById = await this.listAuditCompaniesById(companyIds);

    return rows.map((row) => mapAuditLog(row, companiesById.get(row.company_id ?? "")));
  }

  async listCompanies(): Promise<AdminCompanyContract[]> {
    const { data, error } = await this.supabase.core
      .from("companies")
      .select(companySelect)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as CompanyRow[]).map(mapCompany);
  }

  async listUsers(): Promise<AdminUserContract[]> {
    const { data, error } = await this.supabase.core
      .from("profiles")
      .select(userSelect)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as UserRow[]).map(mapUser);
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

  async createCompany(input: CreateAdminCompanyInput): Promise<AdminCompanyContract> {
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
        primary_responsible_name: company.primaryResponsibleName,
        primary_responsible_email: company.primaryResponsibleEmail,
        basic_plan_id: company.basicPlanId,
        implementation_notes: company.implementationNotes
      })
      .select(companySelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const createdCompany = mapCompany(data as CompanyRow);
    await this.createAuditLog(createdCompany.id, "core.company.created", "companies", createdCompany.id, {
      legalName: createdCompany.legalName,
      status: createdCompany.status
    });

    return createdCompany;
  }

  async createUser(input: CreateAdminUserInput): Promise<AdminCompanyUserContract> {
    const userInput = normalizeCreateUserInput(input);
    await this.ensureCompanyExists(userInput.companyId);

    const { data: authData, error: authError } = await this.supabase.admin.auth.admin.createUser({
      email: userInput.email,
      email_confirm: false,
      password: createTemporaryPassword(),
      user_metadata: {
        full_name: userInput.fullName
      }
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("already")) {
        throw new ConflictException("Usuario ja existe no Supabase Auth");
      }

      throw new InternalServerErrorException({
        message: "Supabase auth user creation failed",
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

      await this.createAuditLog(userInput.companyId, "core.user.invited", "profiles", userId, {
        email: userInput.email,
        fullName: userInput.fullName
      });

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

  async updateCompanyApplication(
    companyId: string,
    input: UpdateAdminCompanyApplicationInput
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
      }
    );

    return mapCompanyApplication(application, companyApplication);
  }

  async grantUserRole(
    companyId: string,
    userId: string,
    input: GrantAdminUserRoleInput
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
      }
    );

    return this.hydrateUserApplicationRole(grant);
  }

  async revokeUserRole(
    companyId: string,
    userId: string,
    input: RevokeAdminUserRoleInput
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
      }
    );

    return { revoked: true };
  }

  private async ensureCompanyExists(companyId: string): Promise<void> {
    await this.getCompany(companyId);
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
    companyId: string,
    action: string,
    entityTable: string,
    entityId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const { error } = await this.supabase.core.from("audit_logs").insert({
      company_id: companyId,
      action,
      entity_table: entityTable,
      entity_id: entityId,
      metadata
    });

    if (error) {
      throwSupabaseError(error);
    }
  }
}

function throwSupabaseError(error: SupabaseFailure): never {
  throw new InternalServerErrorException({
    message: "Supabase query failed",
    detail: error.message
  });
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

function mapCompany(row: CompanyRow): AdminCompanyContract {
  return {
    id: row.id,
    personType: row.person_type,
    legalName: row.legal_name,
    tradeName: row.trade_name,
    document: row.document,
    primaryEmail: row.primary_email,
    primaryPhone: row.primary_phone,
    primaryResponsibleName: row.primary_responsible_name,
    primaryResponsibleEmail: row.primary_responsible_email,
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
    primaryResponsibleEmail: normalizeOptional(input.primaryResponsibleEmail, 254),
    basicPlanId: normalizeOptional(input.basicPlanId),
    implementationNotes: normalizeOptional(input.implementationNotes, 1000)
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

function normalizeUuid(value: unknown, field: string): string {
  const id = normalizeRequired(value, field, 36);
  if (!isUuid(id)) {
    throw new BadRequestException(`Invalid ${field}`);
  }

  return id;
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

function createTemporaryPassword(): string {
  return `${randomBytes(24).toString("base64url")}Aa1!`;
}
