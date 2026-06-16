import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { RobotsModule } from "../robots/robots.module";
import { FoodController } from "./food.controller";
import { FoodService } from "./food.service";

@Module({
  imports: [RobotsModule],
  controllers: [FoodController],
  providers: [FoodService, InternalApiGuard, ModuleAccessGuard]
})
export class FoodModule {}
