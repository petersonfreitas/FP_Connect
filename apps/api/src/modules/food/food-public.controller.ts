import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import type {
  CreatePublicFoodCheckoutInput,
  CreatePublicFoodOrderInput,
  EnsureFoodPublicCustomerInput,
  RetryPublicFoodPaymentInput,
  UpdateFoodPublicCustomerProfileInput,
  ValidatePublicFoodCartInput
} from "./food.contracts";
import { FoodService } from "./food.service";

@Controller("food/public")
@UseGuards(InternalApiGuard)
export class FoodPublicController {
  constructor(private readonly foodService: FoodService) {}

  @Get("stores/:publicSlug/menu")
  getPublicMenu(@Param("publicSlug") publicSlug: string) {
    return this.foodService.getPublicMenu(publicSlug);
  }

  @Get("stores/:publicSlug/checkout")
  getPublicCheckout(@Param("publicSlug") publicSlug: string) {
    return this.foodService.getPublicCheckout(publicSlug);
  }

  @Post("stores/:publicSlug/cart/validate")
  validatePublicCart(
    @Body() input: ValidatePublicFoodCartInput,
    @Param("publicSlug") publicSlug: string
  ) {
    return this.foodService.validatePublicCart(publicSlug, input);
  }

  @Post("stores/:publicSlug/customers/me")
  ensurePublicCustomerStoreAccess(
    @Body() input: EnsureFoodPublicCustomerInput,
    @Param("publicSlug") publicSlug: string
  ) {
    return this.foodService.ensurePublicCustomerStoreAccess(publicSlug, input);
  }

  @Patch("stores/:publicSlug/customers/me/profile")
  updatePublicCustomerProfile(
    @Body() input: UpdateFoodPublicCustomerProfileInput,
    @Param("publicSlug") publicSlug: string
  ) {
    return this.foodService.updatePublicCustomerProfile(publicSlug, input);
  }

  @Get("stores/:publicSlug/orders/:orderNumber")
  getPublicOrder(
    @Param("orderNumber") orderNumber: string,
    @Param("publicSlug") publicSlug: string
  ) {
    return this.foodService.getPublicOrder(publicSlug, orderNumber);
  }

  @Post("stores/:publicSlug/orders")
  createPublicOrder(
    @Body() input: CreatePublicFoodOrderInput,
    @Param("publicSlug") publicSlug: string
  ) {
    return this.foodService.createPublicOrder(publicSlug, input);
  }

  @Post("stores/:publicSlug/checkout")
  createPublicCheckout(
    @Body() input: CreatePublicFoodCheckoutInput,
    @Param("publicSlug") publicSlug: string
  ) {
    return this.foodService.createPublicCheckout(publicSlug, input);
  }

  @Post("stores/:publicSlug/orders/:orderNumber/checkout")
  retryPublicOrderPayment(
    @Body() input: RetryPublicFoodPaymentInput,
    @Param("orderNumber") orderNumber: string,
    @Param("publicSlug") publicSlug: string
  ) {
    return this.foodService.retryPublicOrderPayment(publicSlug, orderNumber, input);
  }
}
