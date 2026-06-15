import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { RobotsController } from "./robots.controller";

@Module({
  controllers: [RobotsController],
  providers: [InternalApiGuard, ModuleAccessGuard]
})
export class RobotsModule {}
