import { Controller, Get, Headers, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { ModuleAccessPolicy } from "../../auth/module-access-policy.decorator";
import { buildModuleAccessResponse } from "../../auth/module-access-response";

@Controller("marketing")
@UseGuards(InternalApiGuard, ModuleAccessGuard)
export class MarketingController {
  @Get("access")
  @ModuleAccessPolicy({
    applicationKey: "marketing",
    companyHeader: "x-fp-company-id",
    permissionKey: "marketing.access"
  })
  getAccess(
    @Headers("x-fp-company-id") companyId: string | undefined,
    @Headers("x-fp-actor-user-id") actorUserId: string | undefined
  ) {
    return buildModuleAccessResponse("marketing", companyId, actorUserId);
  }
}
