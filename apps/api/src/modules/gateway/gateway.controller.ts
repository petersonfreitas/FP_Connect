import { Body, Controller, Get, Headers, Param, Post, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { ModuleAccessPolicy } from "../../auth/module-access-policy.decorator";
import { buildModuleAccessResponse } from "../../auth/module-access-response";
import type {
  CompleteGatewayMercadoPagoOAuthInput,
  CreateGatewayPaymentRequestInput,
  SendGatewaySmtpTestEmailInput,
  UpsertGatewayMercadoPagoManualConfigInput,
  UpsertGatewaySmtpConfigInput
} from "./gateway.contracts";
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

  @Post("providers/mercado-pago/oauth/start")
  @ModuleAccessPolicy({
    applicationKey: "gateway",
    companyHeader: "x-fp-company-id",
    permissionKey: "gateway.access"
  })
  startMercadoPagoOAuth(
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string
  ) {
    return this.gatewayService.startMercadoPagoOAuth(companyId, actorUserId);
  }

  @Post("providers/mercado-pago/oauth/callback")
  @ModuleAccessPolicy({
    applicationKey: "gateway",
    companyHeader: "x-fp-company-id",
    permissionKey: "gateway.access"
  })
  completeMercadoPagoOAuth(
    @Body() input: CompleteGatewayMercadoPagoOAuthInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string
  ) {
    return this.gatewayService.completeMercadoPagoOAuth(companyId, actorUserId, input);
  }

  @Post("providers/mercado-pago/manual-config")
  @ModuleAccessPolicy({
    applicationKey: "gateway",
    companyHeader: "x-fp-company-id",
    permissionKey: "gateway.access"
  })
  upsertMercadoPagoManualConfig(
    @Body() input: UpsertGatewayMercadoPagoManualConfigInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string
  ) {
    return this.gatewayService.upsertMercadoPagoManualConfig(companyId, actorUserId, input);
  }

  @Get("payments/requests")
  @ModuleAccessPolicy({
    applicationKey: "gateway",
    companyHeader: "x-fp-company-id",
    permissionKey: "gateway.access"
  })
  listPaymentRequests(@Headers("x-fp-company-id") companyId: string) {
    return this.gatewayService.listPaymentRequests(companyId);
  }

  @Post("payments/requests")
  @ModuleAccessPolicy({
    applicationKey: "gateway",
    companyHeader: "x-fp-company-id",
    permissionKey: "gateway.access"
  })
  createPaymentRequest(
    @Body() input: CreateGatewayPaymentRequestInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string
  ) {
    return this.gatewayService.createPaymentRequest(companyId, actorUserId, input);
  }

  @Post("payments/requests/:paymentRequestId/sync")
  @ModuleAccessPolicy({
    applicationKey: "gateway",
    companyHeader: "x-fp-company-id",
    permissionKey: "gateway.access"
  })
  syncPaymentRequestStatus(
    @Param("paymentRequestId") paymentRequestId: string,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string
  ) {
    return this.gatewayService.syncPaymentRequestStatus(
      companyId,
      actorUserId,
      paymentRequestId
    );
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

  @Post("providers/smtp/test-email")
  @ModuleAccessPolicy({
    applicationKey: "gateway",
    companyHeader: "x-fp-company-id",
    permissionKey: "gateway.access"
  })
  sendSmtpTestEmail(
    @Body() input: SendGatewaySmtpTestEmailInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string
  ) {
    return this.gatewayService.sendSmtpTestEmail(companyId, actorUserId, input);
  }
}
