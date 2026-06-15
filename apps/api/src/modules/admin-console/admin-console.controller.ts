import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { readInternalApiContext } from "../../auth/internal-api-context";
import type {
  AdminAuditScope,
  BulkGrantAdminUserRolesInput,
  BulkRevokeAdminUserRolesInput,
  BulkUpdateAdminCompanyApplicationsInput,
  CreateAdminCompanyInput,
  CreateAdminConsoleUserInput,
  CreateAdminUserInput,
  GrantAdminUserRoleInput,
  LinkAdminCompanySupportInput,
  RevokeAdminUserRoleInput,
  UpdateAdminCompanyUserInput,
  UpdateAdminCompanyInput,
  UpdateAdminUserInput,
  UpdateAdminCompanyApplicationInput
} from "./admin-console.contracts";
import { AdminConsoleAccessGuard } from "./admin-console-access.guard";
import {
  AdminConsoleAuthenticatedOnly,
  AdminConsolePolicy,
  AdminConsoleSuperAdminOnly
} from "./admin-console-policy.decorator";
import { AdminConsoleService } from "./admin-console.service";

@Controller("admin-console")
@UseGuards(InternalApiGuard, AdminConsoleAccessGuard)
export class AdminConsoleController {
  constructor(private readonly adminConsole: AdminConsoleService) {}

  @Get("users/me/access")
  @AdminConsoleAuthenticatedOnly()
  getCurrentUserAccess(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.adminConsole.getCurrentUserAccess(readInternalApiContext(headers));
  }

  @Get("overview")
  @AdminConsoleSuperAdminOnly()
  getOverview() {
    return this.adminConsole.getOverview();
  }

  @Get("applications")
  @AdminConsoleSuperAdminOnly()
  listApplications() {
    return this.adminConsole.listApplications();
  }

  @Get("basic-plans")
  @AdminConsoleSuperAdminOnly()
  listBasicPlans() {
    return this.adminConsole.listBasicPlans();
  }

  @Get("catalog")
  @AdminConsoleSuperAdminOnly()
  getCatalog() {
    return this.adminConsole.getCatalog();
  }

  @Get("contracted-modules")
  @AdminConsoleSuperAdminOnly()
  listContractedModules() {
    return this.adminConsole.listContractedModules();
  }

  @Get("audit-logs")
  @AdminConsoleSuperAdminOnly()
  listAuditLogs(@Query("scope") scope?: AdminAuditScope) {
    return this.adminConsole.listAuditLogs(scope);
  }

  @Get("companies")
  @AdminConsoleSuperAdminOnly()
  listCompanies(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.adminConsole.listCompanies({ page, pageSize });
  }

  @Get("companies/:id")
  @AdminConsolePolicy({ companyParam: "id", permissionKey: "admin.companies.read" })
  getCompany(@Param("id") id: string) {
    return this.adminConsole.getCompany(id);
  }

  @Get("companies/:id/users")
  @AdminConsolePolicy({ companyParam: "id", permissionKey: "admin.users.manage" })
  listCompanyUsers(@Param("id") id: string) {
    return this.adminConsole.listCompanyUsers(id);
  }

  @Get("companies/:id/support-candidates")
  @AdminConsolePolicy({ companyParam: "id", permissionKey: "admin.users.manage" })
  listCompanySupportCandidates(
    @Param("id") id: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.listCompanySupportCandidates(id, readInternalApiContext(headers));
  }

  @Get("companies/:companyId/users/:userId/access")
  @AdminConsolePolicy({ companyParam: "companyId", permissionKey: "admin.users.manage" })
  getCompanyUserAccess(@Param("companyId") companyId: string, @Param("userId") userId: string) {
    return this.adminConsole.getCompanyUserAccess(companyId, userId);
  }

  @Get("companies/:id/applications")
  @AdminConsolePolicy({ companyParam: "id", permissionKey: "admin.modules.manage" })
  listCompanyApplications(@Param("id") id: string) {
    return this.adminConsole.listCompanyApplications(id);
  }

  @Post("companies")
  @AdminConsoleSuperAdminOnly()
  createCompany(
    @Body() input: CreateAdminCompanyInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.createCompany(input, readInternalApiContext(headers));
  }

  @Patch("companies/:id")
  @AdminConsolePolicy({ companyParam: "id", permissionKey: "admin.companies.manage" })
  updateCompany(
    @Param("id") id: string,
    @Body() input: UpdateAdminCompanyInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.updateCompany(id, input, readInternalApiContext(headers));
  }

  @Post("companies/:id/applications")
  @AdminConsolePolicy({ companyParam: "id", permissionKey: "admin.modules.manage" })
  updateCompanyApplication(
    @Param("id") id: string,
    @Body() input: UpdateAdminCompanyApplicationInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.updateCompanyApplication(id, input, readInternalApiContext(headers));
  }

  @Post("companies/:id/applications/bulk")
  @AdminConsolePolicy({ companyParam: "id", permissionKey: "admin.modules.manage" })
  bulkUpdateCompanyApplications(
    @Param("id") id: string,
    @Body() input: BulkUpdateAdminCompanyApplicationsInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.bulkUpdateCompanyApplications(
      id,
      input,
      readInternalApiContext(headers)
    );
  }

  @Post("companies/:id/support")
  @AdminConsolePolicy({ companyParam: "id", permissionKey: "admin.users.manage" })
  linkCompanySupport(
    @Param("id") id: string,
    @Body() input: LinkAdminCompanySupportInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.linkCompanySupport(id, input, readInternalApiContext(headers));
  }

  @Get("users")
  @AdminConsoleSuperAdminOnly()
  listUsers(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("scope") scope?: string
  ) {
    return this.adminConsole.listUsers({ page, pageSize, scope });
  }

  @Get("users/:id")
  @AdminConsoleSuperAdminOnly()
  getUser(@Param("id") id: string) {
    return this.adminConsole.getUser(id);
  }

  @Post("users")
  @AdminConsolePolicy({ companyBody: "companyId", permissionKey: "admin.users.manage" })
  createUser(
    @Body() input: CreateAdminUserInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.createUser(input, readInternalApiContext(headers));
  }

  @Post("users/console")
  @AdminConsolePolicy({ platformRoles: ["fp_admin"] })
  createConsoleUser(
    @Body() input: CreateAdminConsoleUserInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.createConsoleUser(input, readInternalApiContext(headers));
  }

  @Post("companies/:companyId/users/:userId/invite")
  @AdminConsolePolicy({ companyParam: "companyId", permissionKey: "admin.users.manage" })
  resendUserInvite(
    @Param("companyId") companyId: string,
    @Param("userId") userId: string,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.resendUserInvite(companyId, userId, readInternalApiContext(headers));
  }

  @Patch("companies/:companyId/users/:userId/membership")
  @AdminConsolePolicy({ companyParam: "companyId", permissionKey: "admin.users.manage" })
  updateCompanyUserMembership(
    @Param("companyId") companyId: string,
    @Param("userId") userId: string,
    @Body() input: UpdateAdminCompanyUserInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.updateCompanyUserMembership(
      companyId,
      userId,
      input,
      readInternalApiContext(headers)
    );
  }

  @Patch("users/:id")
  @AdminConsoleSuperAdminOnly()
  updateUser(
    @Param("id") id: string,
    @Body() input: UpdateAdminUserInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.updateUser(id, input, readInternalApiContext(headers));
  }

  @Post("companies/:companyId/users/:userId/roles")
  @AdminConsolePolicy({ companyParam: "companyId", permissionKey: "admin.users.manage" })
  grantUserRole(
    @Param("companyId") companyId: string,
    @Param("userId") userId: string,
    @Body() input: GrantAdminUserRoleInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.grantUserRole(companyId, userId, input, readInternalApiContext(headers));
  }

  @Post("companies/:companyId/users/:userId/roles/bulk")
  @AdminConsolePolicy({ companyParam: "companyId", permissionKey: "admin.users.manage" })
  bulkGrantUserRoles(
    @Param("companyId") companyId: string,
    @Param("userId") userId: string,
    @Body() input: BulkGrantAdminUserRolesInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.bulkGrantUserRoles(
      companyId,
      userId,
      input,
      readInternalApiContext(headers)
    );
  }

  @Post("companies/:companyId/users/:userId/roles/revoke")
  @AdminConsolePolicy({ companyParam: "companyId", permissionKey: "admin.users.manage" })
  revokeUserRole(
    @Param("companyId") companyId: string,
    @Param("userId") userId: string,
    @Body() input: RevokeAdminUserRoleInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.revokeUserRole(
      companyId,
      userId,
      input,
      readInternalApiContext(headers)
    );
  }

  @Post("companies/:companyId/users/:userId/roles/revoke-bulk")
  @AdminConsolePolicy({ companyParam: "companyId", permissionKey: "admin.users.manage" })
  bulkRevokeUserRoles(
    @Param("companyId") companyId: string,
    @Param("userId") userId: string,
    @Body() input: BulkRevokeAdminUserRolesInput,
    @Headers() headers: Record<string, string | string[] | undefined>
  ) {
    return this.adminConsole.bulkRevokeUserRoles(
      companyId,
      userId,
      input,
      readInternalApiContext(headers)
    );
  }
}
