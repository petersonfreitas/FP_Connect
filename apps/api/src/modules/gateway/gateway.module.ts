import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { RobotsModule } from "../robots/robots.module";
import { GatewayController } from "./gateway.controller";
import { GatewayWebhookController } from "./gateway-webhook.controller";
import { GatewayService } from "./gateway.service";

@Module({
  imports: [RobotsModule],
  controllers: [GatewayController, GatewayWebhookController],
  providers: [GatewayService, InternalApiGuard, ModuleAccessGuard],
  exports: [GatewayService]
})
export class GatewayModule {}
