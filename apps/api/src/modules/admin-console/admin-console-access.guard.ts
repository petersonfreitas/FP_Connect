import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { SupabaseService } from "../../supabase/supabase.service";

type RequestWithHeaders = {
  headers: Record<string, string | string[] | undefined>;
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
  constructor(private readonly supabase: SupabaseService) {}

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

    if (!profile || profile.global_role !== "super_admin" || profile.status !== "active") {
      throw new ForbiddenException("Admin Console requires an active super-admin user");
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
