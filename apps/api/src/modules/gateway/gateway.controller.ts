import { Controller, Get, Headers, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { ModuleAccessPolicy } from "../../auth/module-access-policy.decorator";
import { buildModuleAccessResponse } from "../../auth/module-access-response";

@Controller("gateway")
@UseGuards(InternalApiGuard, ModuleAccessGuard)
export class GatewayController {
  @Get("access")
  @ModuleAccessPolicy({
    applicationKey: "gateway",
    companyHeader: "x-fp-company-id",
    permissionKey: "gateway.access"
  })
  getAccess(
    @Headers("x-fp-company-id") companyId: string | undefined,
    @Headers("x-fp-actor-user-id") actorUserId: string | undefined
  ) {
    return buildModuleAccessResponse("gateway", companyId, actorUserId);
  }
}
