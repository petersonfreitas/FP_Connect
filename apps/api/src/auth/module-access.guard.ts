import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SupabaseService } from "../supabase/supabase.service";
import {
  MODULE_ACCESS_POLICY_KEY,
  type ModuleAccessPolicy
} from "./module-access-policy.decorator";

type RequestWithModuleContext = {
  body?: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, string | undefined>;
};

type AccessProfileRow = {
  global_role: string;
  id: string;
  status: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithModuleContext>();
    const policy = this.reflector.getAllAndOverride<ModuleAccessPolicy | undefined>(
      MODULE_ACCESS_POLICY_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!policy) {
      throw new ForbiddenException("Module route policy is required");
    }

    const actorUserId = readSingleHeader(request.headers["x-fp-actor-user-id"]);

    if (!actorUserId || !uuidPattern.test(actorUserId)) {
      throw new UnauthorizedException("Authenticated actor is required");
    }

    const companyId = resolveCompanyId(request, policy);

    if (!companyId || !uuidPattern.test(companyId)) {
      throw new ForbiddenException("Module company context is required");
    }

    const profile = await this.getActiveProfile(actorUserId);
    await this.ensureCompanyHasModule(companyId, policy.applicationKey);

    if (profile.global_role === "super_admin") {
      return true;
    }

    const { data: hasPermission, error } = await this.supabase.core.rpc("user_has_permission", {
      target_application_key: policy.applicationKey,
      target_company_id: companyId,
      target_permission_key: policy.permissionKey,
      target_user_id: actorUserId
    });

    if (error || hasPermission !== true) {
      throw new ForbiddenException("Module permission denied");
    }

    return true;
  }

  private async getActiveProfile(actorUserId: string): Promise<AccessProfileRow> {
    const { data, error } = await this.supabase.core
      .from("profiles")
      .select("id,global_role,status")
      .eq("id", actorUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new ForbiddenException("Could not validate module access");
    }

    const profile = data as AccessProfileRow | null;

    if (!profile || profile.status !== "active") {
      throw new ForbiddenException("Module access requires an active user");
    }

    return profile;
  }

  private async ensureCompanyHasModule(companyId: string, applicationKey: string): Promise<void> {
    const { data: hasModule, error } = await this.supabase.core.rpc("company_has_module", {
      target_application_key: applicationKey,
      target_company_id: companyId
    });

    if (error || hasModule !== true) {
      throw new ForbiddenException(
        "Company does not have an implementation or active contracted module"
      );
    }
  }
}

function resolveCompanyId(
  request: RequestWithModuleContext,
  policy: ModuleAccessPolicy
): string | undefined {
  if (policy.companyParam) {
    return request.params?.[policy.companyParam];
  }

  if (policy.companyHeader) {
    return readSingleHeader(request.headers[policy.companyHeader.toLowerCase()]);
  }

  if (policy.companyBody) {
    return readStringBodyValue(request.body?.[policy.companyBody]);
  }

  return undefined;
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
