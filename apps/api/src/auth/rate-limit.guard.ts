import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { timingSafeEqual } from "crypto";
import { AppConfigService } from "../config/app-config.service";

type RateLimitRequest = {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  method?: string;
  originalUrl?: string;
  url?: string;
  socket?: {
    remoteAddress?: string;
  };
};

type RateLimitResponse = {
  setHeader(name: string, value: string | number): void;
};

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitProfile = {
  key: string;
  limit: number;
  scope: "actor" | "ip";
};

const WINDOW_MS = 60_000;
const CLEANUP_INTERVAL_MS = 300_000;

const AUTHENTICATED_READ_LIMIT = 120;
const AUTHENTICATED_WRITE_LIMIT = 20;
const IP_READ_LIMIT = 60;
const IP_WRITE_LIMIT = 15;

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();
  private lastCleanupAt = Date.now();

  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const response = context.switchToHttp().getResponse<RateLimitResponse>();

    if (isHealthCheck(request)) {
      return true;
    }

    const now = Date.now();
    this.cleanupExpiredBuckets(now);

    const profile = this.getProfile(request);
    const bucket = this.getBucket(profile.key, now);
    const remaining = Math.max(profile.limit - bucket.count - 1, 0);

    response.setHeader("X-RateLimit-Limit", profile.limit);
    response.setHeader("X-RateLimit-Remaining", remaining);
    response.setHeader("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));

    if (bucket.count >= profile.limit) {
      const retryAfter = Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1);
      response.setHeader("Retry-After", retryAfter);

      throw new HttpException(
        {
          message: "Rate limit exceeded",
          limit: profile.limit,
          scope: profile.scope,
          retryAfterSeconds: retryAfter
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    bucket.count += 1;
    return true;
  }

  private getProfile(request: RateLimitRequest): RateLimitProfile {
    const method = (request.method ?? "GET").toUpperCase();
    const isRead = method === "GET" || method === "HEAD" || method === "OPTIONS";
    const isTrustedInternalRequest = this.hasValidInternalToken(request);
    const actorUserId = normalizeIdentifier(readSingleHeader(request.headers["x-fp-actor-user-id"]));
    const companyId = normalizeIdentifier(readSingleHeader(request.headers["x-fp-company-id"]));

    if (isTrustedInternalRequest && actorUserId) {
      const companySegment = companyId ? `company:${companyId}` : "global";

      return {
        key: `actor:${actorUserId}:${companySegment}:${method}`,
        limit: isRead ? AUTHENTICATED_READ_LIMIT : AUTHENTICATED_WRITE_LIMIT,
        scope: "actor"
      };
    }

    return {
      key: `ip:${getClientIp(request)}:${method}`,
      limit: isRead ? IP_READ_LIMIT : IP_WRITE_LIMIT,
      scope: "ip"
    };
  }

  private getBucket(key: string, now: number): Bucket {
    const current = this.buckets.get(key);

    if (current && current.resetAt > now) {
      return current;
    }

    const next = {
      count: 0,
      resetAt: now + WINDOW_MS
    };

    this.buckets.set(key, next);
    return next;
  }

  private cleanupExpiredBuckets(now: number): void {
    if (now - this.lastCleanupAt < CLEANUP_INTERVAL_MS) {
      return;
    }

    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }

    this.lastCleanupAt = now;
  }

  private hasValidInternalToken(request: RateLimitRequest): boolean {
    const token = readSingleHeader(request.headers["x-fp-internal-token"]);
    return Boolean(token && safeEquals(token, this.config.internalApiToken));
  }
}

function isHealthCheck(request: RateLimitRequest): boolean {
  const path = (request.originalUrl ?? request.url ?? "").split("?")[0];
  return path === "/api/health" || path === "/health";
}

function getClientIp(request: RateLimitRequest): string {
  const forwardedFor = readSingleHeader(request.headers["x-forwarded-for"]);
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();

  return forwardedIp || request.ip || request.socket?.remoteAddress || "unknown";
}

function normalizeIdentifier(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  if (!normalized || normalized.length > 128) {
    return undefined;
  }

  return normalized;
}

function readSingleHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function safeEquals(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
}
