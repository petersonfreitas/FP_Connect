import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { FoodController } from "./food.controller";

@Module({
  controllers: [FoodController],
  providers: [InternalApiGuard, ModuleAccessGuard]
})
export class FoodModule {}
