"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FoodOrderStatus } from "@fp/types";
import { updateFoodOrderStatusInlineAction } from "@/app/actions";

type OrderStatusActionsProps = {
  actions: Array<[FoodOrderStatus, string]>;
  companyId: string;
  orderId: string;
};

export function OrderStatusActions({
  actions,
  companyId,
  orderId
}: OrderStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<FoodOrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submitStatus(status: FoodOrderStatus) {
    setError(null);
    setPendingStatus(status);

    startTransition(async () => {
      const result = await updateFoodOrderStatusInlineAction({
        companyId,
        orderId,
        status
      });

      if (result.error) {
        setError(result.error);
        setPendingStatus(null);
        return;
      }

      router.refresh();
      setPendingStatus(null);
    });
  }

  return (
    <div className="quick-status-actions">
      {actions.map(([status, label]) => (
        <button
          className={
            status === "cancelled"
              ? "secondary-action compact-action danger-action"
              : "secondary-action compact-action"
          }
          disabled={isPending}
          key={status}
          onClick={() => submitStatus(status)}
          type="button"
        >
          {pendingStatus === status ? "Salvando..." : label}
        </button>
      ))}
      {error ? <span className="inline-action-error">{error}</span> : null}
    </div>
  );
}
