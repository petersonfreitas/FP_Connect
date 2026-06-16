import { Body, Controller, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { ModuleAccessPolicy } from "../../auth/module-access-policy.decorator";
import { buildModuleAccessResponse } from "../../auth/module-access-response";
import type { UpsertFoodStoreInput } from "./food.contracts";
import { FoodService } from "./food.service";

@Controller("food")
@UseGuards(InternalApiGuard, ModuleAccessGuard)
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get("access")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  getAccess(
    @Headers("x-fp-company-id") companyId: string | undefined,
    @Headers("x-fp-actor-user-id") actorUserId: string | undefined
  ) {
    return buildModuleAccessResponse("food", companyId, actorUserId);
  }

  @Get("store")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  getStore(@Headers("x-fp-company-id") companyId: string) {
    return this.foodService.getStore(companyId);
  }

  @Post("store")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  upsertStore(
    @Body() input: UpsertFoodStoreInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string
  ) {
    return this.foodService.upsertStore(companyId, actorUserId, input);
  }
}
