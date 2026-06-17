export type FoodStoreStatus = "closed" | "implementation" | "open" | "suspended";
export type FoodCategoryStatus = "active" | "inactive";
export type FoodProductStatus = "available" | "hidden" | "unavailable";
export type FoodOrderStatus =
  | "accepted"
  | "cancelled"
  | "created"
  | "delivered"
  | "out_for_delivery"
  | "preparing"
  | "ready";

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

export type FoodCategoryContract = {
  id: string;
  companyId: string;
  storeId: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: FoodCategoryStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type UpsertFoodCategoryInput = {
  name: string;
  slug?: string | null;
  description?: string | null;
  status: FoodCategoryStatus;
  sortOrder?: number | null;
};

export type FoodProductContract = {
  id: string;
  companyId: string;
  storeId: string | null;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  status: FoodProductStatus;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type UpsertFoodProductInput = {
  categoryId?: string | null;
  name: string;
  slug?: string | null;
  description?: string | null;
  priceCents: number;
  status: FoodProductStatus;
  imageUrl?: string | null;
  sortOrder?: number | null;
};

export type FoodMenuCategoryContract = FoodCategoryContract & {
  products: FoodProductContract[];
};

export type FoodMenuContract = {
  store: FoodStoreContract;
  categories: FoodMenuCategoryContract[];
  uncategorizedProducts: FoodProductContract[];
};

export type FoodOrderItemContract = {
  id: string;
  companyId: string;
  orderId: string;
  productId: string | null;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  totalPriceCents: number;
};

export type FoodOrderContract = {
  id: string;
  companyId: string;
  storeId: string | null;
  orderNumber: string;
  status: FoodOrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerNote: string | null;
  subtotalCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  items: FoodOrderItemContract[];
};

export type CreateFoodOrderItemInput = {
  productId: string;
  quantity: number;
};

export type CreateFoodOrderInput = {
  customerName?: string | null;
  customerPhone?: string | null;
  customerNote?: string | null;
  items: CreateFoodOrderItemInput[];
};

export type UpdateFoodOrderStatusInput = {
  status: FoodOrderStatus;
};

export type PaginatedContract<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
