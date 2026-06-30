import type { FoodOrderContract } from "@fp/types";

export function canAdvanceFoodOrderOperationally(order: FoodOrderContract): boolean {
  return order.paymentStatus === "paid" || isInternalManualFoodOrder(order);
}

function isInternalManualFoodOrder(order: FoodOrderContract): boolean {
  return (
    !order.customerAccountId &&
    !order.customerId &&
    !order.customerStoreAccessId
  );
}
