import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { BillingController } from "./billing.controller";

@Module({
  controllers: [BillingController],
  providers: [InternalApiGuard, ModuleAccessGuard]
})
export class BillingModule {}
