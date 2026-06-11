import { Injectable } from "@nestjs/common";

@Injectable()
export class AppConfigService {
  readonly nodeEnv: string;
  readonly port: number;
  readonly internalApiToken: string;
  readonly supabaseUrl: string;
  readonly supabaseServiceRoleKey: string;
  readonly supabaseAnonKey?: string;

  constructor() {
    const env = process.env;

    this.nodeEnv = env.NODE_ENV ?? "development";
    this.port = parsePort(env.PORT);
    this.internalApiToken = readRequired(env, "FP_INTERNAL_API_TOKEN");
    this.supabaseUrl = readRequiredUrl(env, "SUPABASE_URL");
    this.supabaseServiceRoleKey = readRequired(env, "SUPABASE_SERVICE_ROLE_KEY");
    this.supabaseAnonKey = readOptional(env, "SUPABASE_ANON_KEY");
  }
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return 3001;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

function readRequired(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readOptional(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value || undefined;
}

function readRequiredUrl(env: NodeJS.ProcessEnv, key: string): string {
  const value = readRequired(env, key);

  try {
    new URL(value);
  } catch {
    throw new Error(`Invalid URL in environment variable: ${key}`);
  }

  return value;
}
