import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import type { CreateAdminCompanyInput, CreateAdminUserInput } from "./admin-console.contracts";
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

  @Post("companies")
  createCompany(@Body() input: CreateAdminCompanyInput) {
    return this.adminConsole.createCompany(input);
  }

  @Get("users")
  listUsers() {
    return this.adminConsole.listUsers();
  }

  @Post("users")
  createUser(@Body() input: CreateAdminUserInput) {
    return this.adminConsole.createUser(input);
  }
}
