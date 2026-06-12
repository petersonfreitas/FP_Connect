import { Controller, Headers, Post, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { readInternalApiContext } from "../../auth/internal-api-context";
import { AdminConsoleService } from "./admin-console.service";

@Controller("admin-console")
@UseGuards(InternalApiGuard)
export class AdminConsoleActivationController {
  constructor(private readonly adminConsole: AdminConsoleService) {}

  @Post("users/me/activate-invite")
  activateCurrentUserInvite(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.adminConsole.activateCurrentUserInvite(readInternalApiContext(headers));
  }
}
