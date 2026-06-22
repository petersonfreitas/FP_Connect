import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { InternalApiGuard } from "../../auth/internal-api.guard";
import type { CreateFoodOrderInput, CreatePublicFoodCheckoutInput } from "./food.contracts";
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

  @Get("stores/:publicSlug/orders/:orderNumber")
  getPublicOrder(
    @Param("orderNumber") orderNumber: string,
    @Param("publicSlug") publicSlug: string
  ) {
    return this.foodService.getPublicOrder(publicSlug, orderNumber);
  }

  @Post("stores/:publicSlug/orders")
  createPublicOrder(
    @Body() input: CreateFoodOrderInput,
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
}
