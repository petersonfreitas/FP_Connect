import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { SalesController } from "./sales.controller";

@Module({
  controllers: [SalesController],
  providers: [InternalApiGuard, ModuleAccessGuard]
})
export class SalesModule {}
