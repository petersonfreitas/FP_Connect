import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import type {
  AdminAuditScope,
  CreateAdminCompanyInput,
  CreateAdminUserInput,
  GrantAdminUserRoleInput,
  RevokeAdminUserRoleInput,
  UpdateAdminCompanyInput,
  UpdateAdminUserInput,
  UpdateAdminCompanyApplicationInput
} from "./admin-console.contracts";
import { AdminConsoleService } from "./admin-console.service";

@Controller("admin-console")
@UseGuards(InternalApiGuard)
export class AdminConsoleController {
  constructor(private readonly adminConsole: AdminConsoleService) {}

  @Get("overview")
  getOverview() {
    return this.adminConsole.getOverview();
  }

  @Get("applications")
  listApplications() {
    return this.adminConsole.listApplications();
  }

  @Get("basic-plans")
  listBasicPlans() {
    return this.adminConsole.listBasicPlans();
  }

  @Get("catalog")
  getCatalog() {
    return this.adminConsole.getCatalog();
  }

  @Get("contracted-modules")
  listContractedModules() {
    return this.adminConsole.listContractedModules();
  }

  @Get("audit-logs")
  listAuditLogs(@Query("scope") scope?: AdminAuditScope) {
    return this.adminConsole.listAuditLogs(scope);
  }

  @Get("companies")
  listCompanies() {
    return this.adminConsole.listCompanies();
  }

  @Get("companies/:id")
  getCompany(@Param("id") id: string) {
    return this.adminConsole.getCompany(id);
  }

  @Get("companies/:id/users")
  listCompanyUsers(@Param("id") id: string) {
    return this.adminConsole.listCompanyUsers(id);
  }

  @Get("companies/:companyId/users/:userId/access")
  getCompanyUserAccess(@Param("companyId") companyId: string, @Param("userId") userId: string) {
    return this.adminConsole.getCompanyUserAccess(companyId, userId);
  }

  @Get("companies/:id/applications")
  listCompanyApplications(@Param("id") id: string) {
    return this.adminConsole.listCompanyApplications(id);
  }

  @Post("companies")
  createCompany(@Body() input: CreateAdminCompanyInput) {
    return this.adminConsole.createCompany(input);
  }

  @Patch("companies/:id")
  updateCompany(@Param("id") id: string, @Body() input: UpdateAdminCompanyInput) {
    return this.adminConsole.updateCompany(id, input);
  }

  @Post("companies/:id/applications")
  updateCompanyApplication(
    @Param("id") id: string,
    @Body() input: UpdateAdminCompanyApplicationInput
  ) {
    return this.adminConsole.updateCompanyApplication(id, input);
  }

  @Get("users")
  listUsers() {
    return this.adminConsole.listUsers();
  }

  @Get("users/:id")
  getUser(@Param("id") id: string) {
    return this.adminConsole.getUser(id);
  }

  @Post("users")
  createUser(@Body() input: CreateAdminUserInput) {
    return this.adminConsole.createUser(input);
  }

  @Patch("users/:id")
  updateUser(@Param("id") id: string, @Body() input: UpdateAdminUserInput) {
    return this.adminConsole.updateUser(id, input);
  }

  @Post("companies/:companyId/users/:userId/roles")
  grantUserRole(
    @Param("companyId") companyId: string,
    @Param("userId") userId: string,
    @Body() input: GrantAdminUserRoleInput
  ) {
    return this.adminConsole.grantUserRole(companyId, userId, input);
  }

  @Post("companies/:companyId/users/:userId/roles/revoke")
  revokeUserRole(
    @Param("companyId") companyId: string,
    @Param("userId") userId: string,
    @Body() input: RevokeAdminUserRoleInput
  ) {
    return this.adminConsole.revokeUserRole(companyId, userId, input);
  }
}
