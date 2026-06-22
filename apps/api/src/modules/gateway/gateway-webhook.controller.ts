import { Body, Controller, Headers, HttpCode, Post, Query } from "@nestjs/common";
import { GatewayService } from "./gateway.service";

@Controller("gateway/webhooks")
export class GatewayWebhookController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post("mercado-pago")
  @HttpCode(200)
  handleMercadoPagoWebhook(
    @Body() body: Record<string, unknown>,
    @Headers("x-request-id") xRequestId: string | undefined,
    @Headers("x-signature") signature: string | undefined,
    @Query("data.id") dataId: string | undefined,
    @Query("type") type: string | undefined
  ) {
    return this.gatewayService.handleMercadoPagoWebhook({
      body,
      dataId: dataId ?? null,
      signature: signature ?? null,
      type: type ?? null,
      xRequestId: xRequestId ?? null
    });
  }
}
