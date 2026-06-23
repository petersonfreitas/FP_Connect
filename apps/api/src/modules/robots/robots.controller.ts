import { Body, Controller, Get, Headers, Param, Post, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { ModuleAccessPolicy } from "../../auth/module-access-policy.decorator";
import { buildModuleAccessResponse } from "../../auth/module-access-response";
import type { CreateRobotsEventInput } from "./robots.contracts";
import { RobotsService } from "./robots.service";

@Controller("robots")
@UseGuards(InternalApiGuard, ModuleAccessGuard)
export class RobotsController {
  constructor(private readonly robots: RobotsService) {}

  @Get("access")
  @ModuleAccessPolicy({
    applicationKey: "robots",
    companyHeader: "x-fp-company-id",
    permissionKey: "robots.events.read"
  })
  getAccess(
    @Headers("x-fp-company-id") companyId: string | undefined,
    @Headers("x-fp-actor-user-id") actorUserId: string | undefined
  ) {
    return buildModuleAccessResponse("robots", companyId, actorUserId);
  }

  @Get("events/catalog")
  @ModuleAccessPolicy({
    applicationKey: "robots",
    companyHeader: "x-fp-company-id",
    permissionKey: "robots.events.read"
  })
  listCatalog() {
    return this.robots.listCatalog();
  }

  @Get("events")
  @ModuleAccessPolicy({
    applicationKey: "robots",
    companyHeader: "x-fp-company-id",
    permissionKey: "robots.events.read"
  })
  listEvents(@Headers("x-fp-company-id") companyId: string) {
    return this.robots.listEvents(companyId);
  }

  @Get("rules")
  @ModuleAccessPolicy({
    applicationKey: "robots",
    companyHeader: "x-fp-company-id",
    permissionKey: "robots.events.read"
  })
  listRules(@Headers("x-fp-company-id") companyId: string) {
    return this.robots.listRules(companyId);
  }

  @Get("executions")
  @ModuleAccessPolicy({
    applicationKey: "robots",
    companyHeader: "x-fp-company-id",
    permissionKey: "robots.events.read"
  })
  listExecutions(@Headers("x-fp-company-id") companyId: string) {
    return this.robots.listExecutions(companyId);
  }

  @Get("events/:id")
  @ModuleAccessPolicy({
    applicationKey: "robots",
    companyHeader: "x-fp-company-id",
    permissionKey: "robots.events.read"
  })
  getEvent(@Headers("x-fp-company-id") companyId: string, @Param("id") id: string) {
    return this.robots.getEvent(companyId, id);
  }

  @Post("events")
  @ModuleAccessPolicy({
    applicationKey: "robots",
    companyHeader: "x-fp-company-id",
    permissionKey: "robots.events.write"
  })
  createEvent(
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string,
    @Body() input: CreateRobotsEventInput
  ) {
    return this.robots.createEvent(companyId, actorUserId, input);
  }

  @Post("executions/:id/reprocess")
  @ModuleAccessPolicy({
    applicationKey: "robots",
    companyHeader: "x-fp-company-id",
    permissionKey: "robots.failures.reprocess"
  })
  reprocessExecution(
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string,
    @Param("id") id: string
  ) {
    return this.robots.reprocessExecution(companyId, actorUserId, id);
  }
}
