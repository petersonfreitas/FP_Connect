import { Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppConfigService } from "../config/app-config.service";

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor(config: AppConfigService) {
    this.client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      },
      global: {
        headers: {
          "X-Client-Info": "fp-connect-api"
        }
      }
    });
  }

  get admin(): SupabaseClient {
    return this.client;
  }

  get core() {
    return this.client.schema("core");
  }

  get robots() {
    return this.client.schema("robots");
  }

  get food() {
    return this.client.schema("food");
  }

  get gateway() {
    return this.client.schema("gateway");
  }
}
