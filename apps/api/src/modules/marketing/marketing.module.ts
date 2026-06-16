import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { MarketingController } from "./marketing.controller";

@Module({
  controllers: [MarketingController],
  providers: [InternalApiGuard, ModuleAccessGuard]
})
export class MarketingModule {}
