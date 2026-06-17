import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import { ModuleAccessGuard } from "../../auth/module-access.guard";
import { ModuleAccessPolicy } from "../../auth/module-access-policy.decorator";
import { buildModuleAccessResponse } from "../../auth/module-access-response";
import type {
  CreateFoodOrderInput,
  FoodOrderStatus,
  UpdateFoodOrderPaymentInput,
  UpdateFoodOrderStatusInput,
  UpsertFoodCategoryInput,
  UpsertFoodProductInput,
  UpsertFoodStoreInput
} from "./food.contracts";
import { FoodService } from "./food.service";

const validOrderStatuses = new Set<FoodOrderStatus>([
  "accepted",
  "cancelled",
  "created",
  "delivered",
  "out_for_delivery",
  "preparing",
  "ready"
]);

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

  @Get("categories")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  listCategories(
    @Headers("x-fp-company-id") companyId: string,
    @Query("page") page: string | undefined,
    @Query("pageSize") pageSize: string | undefined
  ) {
    return this.foodService.listCategories(companyId, {
      page: normalizePage(page),
      pageSize: normalizePageSize(pageSize)
    });
  }

  @Post("categories")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  createCategory(
    @Body() input: UpsertFoodCategoryInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string
  ) {
    return this.foodService.upsertCategory(companyId, actorUserId, input);
  }

  @Patch("categories/:categoryId")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  updateCategory(
    @Body() input: UpsertFoodCategoryInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string,
    @Param("categoryId") categoryId: string
  ) {
    return this.foodService.upsertCategory(companyId, actorUserId, input, categoryId);
  }

  @Get("products")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  listProducts(
    @Headers("x-fp-company-id") companyId: string,
    @Query("page") page: string | undefined,
    @Query("pageSize") pageSize: string | undefined
  ) {
    return this.foodService.listProducts(companyId, {
      page: normalizePage(page),
      pageSize: normalizePageSize(pageSize)
    });
  }

  @Post("products")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  createProduct(
    @Body() input: UpsertFoodProductInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string
  ) {
    return this.foodService.upsertProduct(companyId, actorUserId, input);
  }

  @Patch("products/:productId")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  updateProduct(
    @Body() input: UpsertFoodProductInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string,
    @Param("productId") productId: string
  ) {
    return this.foodService.upsertProduct(companyId, actorUserId, input, productId);
  }

  @Get("menu")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  getMenu(@Headers("x-fp-company-id") companyId: string) {
    return this.foodService.getMenu(companyId);
  }

  @Get("dashboard")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  getDashboard(@Headers("x-fp-company-id") companyId: string) {
    return this.foodService.getDashboard(companyId);
  }

  @Get("orders")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  listOrders(
    @Headers("x-fp-company-id") companyId: string,
    @Query("page") page: string | undefined,
    @Query("pageSize") pageSize: string | undefined,
    @Query("status") status: string | undefined
  ) {
    return this.foodService.listOrders(companyId, {
      page: normalizePage(page),
      pageSize: normalizePageSize(pageSize),
      status: normalizeOptionalOrderStatus(status)
    });
  }

  @Post("orders")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  createOrder(
    @Body() input: CreateFoodOrderInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string
  ) {
    return this.foodService.createOrder(companyId, actorUserId, input);
  }

  @Get("orders/:orderId")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  getOrderDetail(
    @Headers("x-fp-company-id") companyId: string,
    @Param("orderId") orderId: string
  ) {
    return this.foodService.getOrderDetail(companyId, orderId);
  }

  @Patch("orders/:orderId/payment")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  updateOrderPayment(
    @Body() input: UpdateFoodOrderPaymentInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string,
    @Param("orderId") orderId: string
  ) {
    return this.foodService.updateOrderPayment(companyId, actorUserId, orderId, input);
  }

  @Patch("orders/:orderId/status")
  @ModuleAccessPolicy({
    applicationKey: "food",
    companyHeader: "x-fp-company-id",
    permissionKey: "food.access"
  })
  updateOrderStatus(
    @Body() input: UpdateFoodOrderStatusInput,
    @Headers("x-fp-company-id") companyId: string,
    @Headers("x-fp-actor-user-id") actorUserId: string,
    @Param("orderId") orderId: string
  ) {
    return this.foodService.updateOrderStatus(companyId, actorUserId, orderId, input);
  }
}

function normalizePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function normalizePageSize(value: string | undefined): number {
  const pageSize = Number(value);

  if (!Number.isInteger(pageSize) || pageSize < 1) {
    return 20;
  }

  return Math.min(pageSize, 100);
}

function normalizeOptionalOrderStatus(value: string | undefined): FoodOrderStatus | undefined {
  if (!value) {
    return undefined;
  }

  if (!validOrderStatuses.has(value as FoodOrderStatus)) {
    throw new BadRequestException("status do pedido Food invalido");
  }

  return value as FoodOrderStatus;
}
