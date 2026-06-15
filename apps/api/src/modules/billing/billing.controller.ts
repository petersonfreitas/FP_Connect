import { Controller, Get, Headers, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { ModuleAccessPolicy } from "../../auth/module-access-policy.decorator";
import { buildModuleAccessResponse } from "../../auth/module-access-response";

@Controller("billing")
@UseGuards(InternalApiGuard, ModuleAccessGuard)
export class BillingController {
  @Get("access")
  @ModuleAccessPolicy({
    applicationKey: "billing",
    companyHeader: "x-fp-company-id",
    permissionKey: "billing.access"
  })
  getAccess(
    @Headers("x-fp-company-id") companyId: string | undefined,
    @Headers("x-fp-actor-user-id") actorUserId: string | undefined
  ) {
    return buildModuleAccessResponse("billing", companyId, actorUserId);
  }
}
