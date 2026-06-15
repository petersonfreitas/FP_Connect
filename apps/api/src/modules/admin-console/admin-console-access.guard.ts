import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SupabaseService } from "../../supabase/supabase.service";
import {
  ADMIN_CONSOLE_POLICY_KEY,
  type AdminConsolePolicy
} from "./admin-console-policy.decorator";

type RequestWithHeaders = {
  body?: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, string | undefined>;
};

type AdminProfileRow = {
  id: string;
  global_role: string;
  status: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class AdminConsoleAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithHeaders>();
    const actorUserId = readSingleHeader(request.headers["x-fp-actor-user-id"]);

    if (!actorUserId || !uuidPattern.test(actorUserId)) {
      throw new UnauthorizedException("Authenticated actor is required");
    }

    const { data, error } = await this.supabase.core
      .from("profiles")
      .select("id,global_role,status")
      .eq("id", actorUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new ForbiddenException("Could not validate Admin Console access");
    }

    const profile = data as AdminProfileRow | null;

    if (!profile || profile.status !== "active") {
      throw new ForbiddenException("Admin Console requires an active user");
    }

    if (profile.global_role === "super_admin") {
      return true;
    }

    const policy = this.reflector.getAllAndOverride<AdminConsolePolicy | undefined>(
      ADMIN_CONSOLE_POLICY_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (policy?.authenticatedOnly) {
      return true;
    }

    if (policy?.superAdminOnly) {
      throw new ForbiddenException("Admin Console requires an active super-admin user");
    }

    if (!policy?.permissionKey || (!policy.companyParam && !policy.companyBody)) {
      throw new ForbiddenException("Admin Console route policy is incomplete");
    }

    const companyId = policy.companyParam
      ? request.params?.[policy.companyParam]
      : readStringBodyValue(request.body?.[policy.companyBody ?? ""]);

    if (!companyId || !uuidPattern.test(companyId)) {
      throw new ForbiddenException("Admin Console company context is required");
    }

    const { data: hasPermission, error: permissionError } = await this.supabase.core.rpc(
      "user_has_permission",
      {
        target_company_id: companyId,
        target_application_key: "admin-console",
        target_permission_key: policy.permissionKey,
        target_user_id: actorUserId
      }
    );

    if (permissionError || hasPermission !== true) {
      throw new ForbiddenException("Admin Console permission denied");
    }

    return true;
  }
}

function readSingleHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function readStringBodyValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
