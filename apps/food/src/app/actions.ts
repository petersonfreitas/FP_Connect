"use server";

import { redirect } from "next/navigation";
import type { FoodStoreStatus, UpsertFoodStoreInput } from "@fp/types";
import { upsertFoodStore } from "@/lib/internal-api";

const validStatuses = new Set<FoodStoreStatus>([
  "closed",
  "implementation",
  "open",
  "suspended"
]);

export async function saveFoodStoreAction(formData: FormData): Promise<void> {
  const companyId = String(formData.get("companyId") ?? "").trim();

  if (!companyId) {
    redirect("/?error=Empresa%20nao%20informada.");
  }

  const input: UpsertFoodStoreInput = {
    contactPhone: optionalText(formData.get("contactPhone")),
    deliveryNotes: optionalText(formData.get("deliveryNotes")),
    displayName: String(formData.get("displayName") ?? ""),
    preparationTimeMinutes: optionalInteger(formData.get("preparationTimeMinutes")),
    publicSlug: String(formData.get("publicSlug") ?? ""),
    status: normalizeStatus(formData.get("status"))
  };
  const result = await upsertFoodStore(companyId, input);
  const searchCompany = `companyId=${encodeURIComponent(companyId)}`;

  if (result.error) {
    redirect(`/?${searchCompany}&error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/?${searchCompany}&saved=1`);
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

function optionalInteger(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  return Number.parseInt(text, 10);
}

function normalizeStatus(value: FormDataEntryValue | null): FoodStoreStatus {
  const status = String(value ?? "");

  if (!validStatuses.has(status as FoodStoreStatus)) {
    return "implementation";
  }

  return status as FoodStoreStatus;
}
