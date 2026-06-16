import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { RobotsController } from "./robots.controller";
import { RobotsService } from "./robots.service";

@Module({
  controllers: [RobotsController],
  providers: [RobotsService, InternalApiGuard, ModuleAccessGuard],
  exports: [RobotsService]
})
export class RobotsModule {}
