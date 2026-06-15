import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { TrackingController } from "./tracking.controller";

@Module({
  controllers: [TrackingController],
  providers: [InternalApiGuard, ModuleAccessGuard]
})
export class TrackingModule {}
