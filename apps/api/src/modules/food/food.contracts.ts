export type FoodStoreStatus = "closed" | "implementation" | "open" | "suspended";

export type FoodStoreContract = {
  id: string;
  companyId: string;
  displayName: string;
  publicSlug: string;
  status: FoodStoreStatus;
  contactPhone: string | null;
  preparationTimeMinutes: number | null;
  deliveryNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertFoodStoreInput = {
  displayName: string;
  publicSlug: string;
  status: FoodStoreStatus;
  contactPhone?: string | null;
  preparationTimeMinutes?: number | null;
  deliveryNotes?: string | null;
};
