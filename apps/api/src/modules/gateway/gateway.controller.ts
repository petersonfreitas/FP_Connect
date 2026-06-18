import { Body, Controller, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { ModuleAccessPolicy } from "../../auth/module-access-policy.decorator";
import { buildModuleAccessResponse } from "../../auth/module-access-response";
import type { UpsertGatewaySmtpConfigInput } from "./gateway.contracts";
import { GatewayService } from "./gateway.service";

@Controller("gateway")
@UseGuards(InternalApiGuard, ModuleAccessGuard)
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

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

  @Get("providers")
  @ModuleAccessPolicy({
    applicationKey: "gateway",
    companyHeader: "x-fp-company-id",
    permissionKey: "gateway.access"
  })
  listProviders() {
    return this.gatewayService.listProviders();
  }

  @Get("providers/configs")
  @ModuleAccessPolicy({
    applicationKey: "gateway",
    companyHeader: "x-fp-company-id",
    permissionKey: "gateway.access"
  })
  listProviderConfigs(@Headers("x-fp-company-id") companyId: string) {
    return this.gatewayService.listCompanyProviderConfigs(companyId);
  }

  @Post("providers/smtp/config")
  @ModuleAccessPolicy({
    applicationKey: "gateway",
    companyHeader: "x-fp-company-id",
    permissionKey: "gateway.access"
  })
  upsertSmtpConfig(
    @Body() input: UpsertGatewaySmtpConfigInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string
  ) {
    return this.gatewayService.upsertSmtpConfig(companyId, actorUserId, input);
  }

  @Post("providers/smtp/test")
  @ModuleAccessPolicy({
    applicationKey: "gateway",
    companyHeader: "x-fp-company-id",
    permissionKey: "gateway.access"
  })
  testSmtpConfig(
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string
  ) {
    return this.gatewayService.validateSmtpConfig(companyId, actorUserId);
  }
}
