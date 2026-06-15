import { Logger } from "@nestjs/common";

type RequestWithMetrics = {
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  originalUrl?: string;
  url?: string;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
};

type ResponseWithMetrics = {
  statusCode: number;
  getHeader(name: string): number | string | string[] | undefined;
  on(event: "finish", listener: () => void): void;
};

type NextFunction = () => void;

const SLOW_REQUEST_MS = 1_000;
const logger = new Logger("RequestMetricsMiddleware");

export function requestMetricsMiddleware(
  request: RequestWithMetrics,
  response: ResponseWithMetrics,
  next: NextFunction
): void {
  const startedAt = Date.now();

  response.on("finish", () => {
    logRequest({
      request,
      response,
      startedAt
    });
  });

  next();
}

function logRequest(input: {
  request: RequestWithMetrics;
  response: ResponseWithMetrics;
  startedAt: number;
}): void {
  const durationMs = Date.now() - input.startedAt;
  const path = getPath(input.request);
  const statusCode = input.response.statusCode;

  const metric = {
    event: "api.request",
    outcome: statusCode >= 400 ? "error" : "ok",
    method: (input.request.method ?? "GET").toUpperCase(),
    path,
    module: getModuleKey(path),
    statusCode,
    durationMs,
    slow: durationMs >= SLOW_REQUEST_MS,
    actorUserId: readSingleHeader(input.request.headers["x-fp-actor-user-id"]),
    companyId: readSingleHeader(input.request.headers["x-fp-company-id"]),
    clientIp: getClientIp(input.request),
    rateLimit: {
      limit: readResponseHeader(input.response, "X-RateLimit-Limit"),
      remaining: readResponseHeader(input.response, "X-RateLimit-Remaining"),
      reset: readResponseHeader(input.response, "X-RateLimit-Reset"),
      retryAfter: readResponseHeader(input.response, "Retry-After")
    }
  };

  const serializedMetric = JSON.stringify(metric);

  if (statusCode >= 500) {
    logger.error(serializedMetric);
    return;
  }

  if (statusCode >= 400 || metric.slow) {
    logger.warn(serializedMetric);
    return;
  }

  logger.log(serializedMetric);
}

function getPath(request: RequestWithMetrics): string {
  return (request.originalUrl ?? request.url ?? "/").split("?")[0] || "/";
}

function getModuleKey(path: string): string {
  const segments = path.replace(/^\/+/, "").split("/");

  if (segments[0] === "api") {
    return segments[1] || "root";
  }

  return segments[0] || "root";
}

function getClientIp(request: RequestWithMetrics): string | undefined {
  const forwardedFor = readSingleHeader(request.headers["x-forwarded-for"]);
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();

  return forwardedIp || request.ip || request.socket?.remoteAddress;
}

function readResponseHeader(response: ResponseWithMetrics, name: string): string | number | undefined {
  const value = response.getHeader(name);

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function readSingleHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
