import { Body, Controller, Headers, HttpCode, Post, Query } from "@nestjs/common";
import { GatewayService } from "./gateway.service";

@Controller("gateway/webhooks")
export class GatewayWebhookController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post("mercado-pago")
  @HttpCode(200)
  handleMercadoPagoWebhook(
    @Body() body: Record<string, unknown>,
    @Query() query: Record<string, unknown>,
    @Headers("x-request-id") xRequestId: string | undefined,
    @Headers("x-signature") signature: string | undefined,
    @Query("data.id") dataId: string | undefined,
    @Query("type") type: string | undefined
  ) {
    return this.gatewayService.handleMercadoPagoWebhook({
      body,
      dataId: dataId ?? readMercadoPagoQueryDataId(query),
      signature: signature ?? null,
      type: type ?? readMercadoPagoQueryType(query),
      xRequestId: xRequestId ?? null
    });
  }
}

function readMercadoPagoQueryDataId(query: Record<string, unknown>): string | null {
  const flatDataId = readQueryString(query, "data.id");

  if (flatDataId) {
    return flatDataId;
  }

  const snakeDataId = readQueryString(query, "data_id");

  if (snakeDataId) {
    return snakeDataId;
  }

  const data = query.data;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    return readQueryString(data as Record<string, unknown>, "id");
  }

  return null;
}

function readMercadoPagoQueryType(query: Record<string, unknown>): string | null {
  return readQueryString(query, "type");
}

function readQueryString(query: Record<string, unknown>, key: string): string | null {
  const value = query[key];

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const first = value.find((item): item is string => typeof item === "string" && item.trim().length > 0);
    return first?.trim() ?? null;
  }

  return null;
}
