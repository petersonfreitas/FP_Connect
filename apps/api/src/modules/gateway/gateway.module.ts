import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { GatewayController } from "./gateway.controller";

@Module({
  controllers: [GatewayController],
  providers: [InternalApiGuard, ModuleAccessGuard]
})
export class GatewayModule {}
