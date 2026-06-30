import type { FoodOrderContract } from "@fp/types";

export type FoodOrderOrigin = "counter" | "online";

export function canAdvanceFoodOrderOperationally(order: FoodOrderContract): boolean {
  return order.paymentStatus === "paid" || isInternalManualFoodOrder(order);
}

export function getFoodOrderOrigin(order: FoodOrderContract): FoodOrderOrigin {
  return isInternalManualFoodOrder(order) ? "counter" : "online";
}

export function isInternalManualFoodOrder(order: FoodOrderContract): boolean {
  return (
    !order.customerAccountId &&
    !order.customerId &&
    !order.customerStoreAccessId
  );
}
