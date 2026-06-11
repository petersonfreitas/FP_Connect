import { Module } from "@nestjs/common";
import { AppConfigModule } from "./config/app-config.module";
import { AdminConsoleModule } from "./modules/admin-console/admin-console.module";
import { BillingModule } from "./modules/billing/billing.module";
import { FoodModule } from "./modules/food/food.module";
import { HealthModule } from "./modules/health/health.module";
import { MarketingModule } from "./modules/marketing/marketing.module";
import { RobotsModule } from "./modules/robots/robots.module";
import { SalesModule } from "./modules/sales/sales.module";
import { TicketsModule } from "./modules/tickets/tickets.module";
import { TrackingModule } from "./modules/tracking/tracking.module";
import { SupabaseModule } from "./supabase/supabase.module";

@Module({
  imports: [
    AppConfigModule,
    SupabaseModule,
    HealthModule,
    AdminConsoleModule,
    RobotsModule,
    FoodModule,
    TrackingModule,
    MarketingModule,
    SalesModule,
    TicketsModule,
    BillingModule
  ]
})
export class AppModule {}
