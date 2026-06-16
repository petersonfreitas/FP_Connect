import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { TicketsController } from "./tickets.controller";

@Module({
  controllers: [TicketsController],
  providers: [InternalApiGuard, ModuleAccessGuard]
})
export class TicketsModule {}
