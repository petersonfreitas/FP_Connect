import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import type { CreateAdminCompanyInput } from "./admin-console.contracts";
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

  @Post("companies")
  createCompany(@Body() input: CreateAdminCompanyInput) {
    return this.adminConsole.createCompany(input);
  }
}
