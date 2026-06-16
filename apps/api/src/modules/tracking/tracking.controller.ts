import { Controller, Get, Headers, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { ModuleAccessPolicy } from "../../auth/module-access-policy.decorator";
import { buildModuleAccessResponse } from "../../auth/module-access-response";

@Controller("tracking")
@UseGuards(InternalApiGuard, ModuleAccessGuard)
export class TrackingController {
  @Get("access")
  @ModuleAccessPolicy({
    applicationKey: "tracking",
    companyHeader: "x-fp-company-id",
    permissionKey: "tracking.access"
  })
  getAccess(
    @Headers("x-fp-company-id") companyId: string | undefined,
    @Headers("x-fp-actor-user-id") actorUserId: string | undefined
  ) {
    return buildModuleAccessResponse("tracking", companyId, actorUserId);
  }
}
