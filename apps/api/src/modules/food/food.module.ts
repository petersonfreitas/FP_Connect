import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { GatewayModule } from "../gateway/gateway.module";
import { RobotsModule } from "../robots/robots.module";
import { FoodController } from "./food.controller";
import { FoodPublicController } from "./food-public.controller";
import { FoodService } from "./food.service";

@Module({
  imports: [GatewayModule, RobotsModule],
  controllers: [FoodController, FoodPublicController],
  providers: [FoodService, InternalApiGuard, ModuleAccessGuard]
})
export class FoodModule {}
