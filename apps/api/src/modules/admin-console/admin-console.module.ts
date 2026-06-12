import { Module } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { AdminConsoleAccessGuard } from "./admin-console-access.guard";
import { AdminConsoleController } from "./admin-console.controller";
import { AdminConsoleService } from "./admin-console.service";

@Module({
  controllers: [AdminConsoleController],
  providers: [AdminConsoleService, AdminConsoleAccessGuard, InternalApiGuard]
})
export class AdminConsoleModule {}
