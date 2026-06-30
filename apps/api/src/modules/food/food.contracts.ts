export type FoodStoreStatus = "closed" | "implementation" | "open" | "suspended";
export type FoodCategoryStatus = "active" | "inactive";
export type FoodProductStatus = "available" | "hidden" | "unavailable";
export type FoodStockMovementType = "entry";
export type FoodPaymentMethod = "card" | "cash" | "other" | "pix";
export type FoodPaymentStatus = "cancelled" | "paid" | "pending";
export type FoodOrderFulfillmentMethod = "delivery" | "pickup";
export type FoodCustomerStatus = "active" | "blocked" | "inactive";
export type FoodCustomerOrigin = "counter" | "online" | "phone";
export type FoodCustomerPreferredContactMethod =
  | "cellphone"
  | "email"
  | "landline"
  | "whatsapp";
export type FoodStoreHourKind = "delivery" | "ordering";
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

export type FoodStoreHourContract = {
  id: string;
  companyId: string;
  storeId: string;
  kind: FoodStoreHourKind;
  weekday: number;
  opensAt: string;
  closesAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpsertFoodStoreHoursInput = {
  hours: Array<{
    kind: FoodStoreHourKind;
    weekday: number;
    opensAt: string;
    closesAt: string;
    isActive?: boolean | null;
  }>;
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
  kitchenRequired: boolean;
  stockControlEnabled: boolean;
  stockMinQuantity: number;
  stockQuantity: number;
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
  kitchenRequired?: boolean | null;
  stockControlEnabled?: boolean | null;
  stockMinQuantity?: number | null;
  sortOrder?: number | null;
};

export type UploadFoodProductImageInput = {
  contentBase64: string;
  contentType: string;
  fileName: string;
};

export type UploadFoodProductImageContract = {
  imageUrl: string;
  path: string;
};

export type FoodStockMovementContract = {
  batchCode: string | null;
  companyId: string;
  createdAt: string;
  createdBy: string | null;
  expiresAt: string | null;
  id: string;
  invoiceNumber: string | null;
  movementType: FoodStockMovementType;
  newQuantity: number;
  notes: string | null;
  previousQuantity: number;
  productId: string;
  productName: string | null;
  quantity: number;
  storeId: string | null;
};

export type CreateFoodStockEntryInput = {
  batchCode?: string | null;
  expiresAt?: string | null;
  invoiceNumber?: string | null;
  notes?: string | null;
  productId: string;
  quantity: number;
};

export type FoodMenuCategoryContract = FoodCategoryContract & {
  products: FoodProductContract[];
};

export type FoodMenuContract = {
  store: FoodStoreContract;
  availability: {
    checkedAt: string;
    isDeliveryOpen: boolean;
    isOrderingOpen: boolean;
    message: string;
  };
  categories: FoodMenuCategoryContract[];
  hours: FoodStoreHourContract[];
  uncategorizedProducts: FoodProductContract[];
};

export type FoodPublicCheckoutContract = {
  mercadoPago: {
    enabled: boolean;
    mode: "manual_sandbox" | "oauth" | null;
    publicKey: string | null;
  };
};

export type FoodPublicCustomerAccountContract = {
  authUserId: string;
  emailConfirmedAt: string | null;
  id: string;
  phoneConfirmedAt: string | null;
  privacyAcceptedAt: string | null;
  status: FoodCustomerStatus;
  termsAcceptedAt: string | null;
};

export type FoodPublicCustomerContract = {
  accountId: string | null;
  companyId: string;
  cpfLast4: string | null;
  fullName: string | null;
  id: string;
  origin: FoodCustomerOrigin;
  preferredContactMethod: FoodCustomerPreferredContactMethod | null;
  status: FoodCustomerStatus;
};

export type FoodPublicCustomerStoreAccessContract = {
  companyId: string;
  customerId: string;
  id: string;
  lastAccessAt: string | null;
  registeredAt: string;
  status: FoodCustomerStatus;
  storeId: string;
};

export type FoodPublicCustomerPhoneContract = {
  customerId: string;
  id: string;
  isPreferred: boolean;
  isPrimary: boolean;
  phoneE164: string;
  storeId: string | null;
  type: "cellphone" | "landline" | "other" | "whatsapp";
};

export type FoodPublicCustomerAddressContract = {
  city: string;
  complement: string | null;
  customerId: string;
  district: string | null;
  id: string;
  isPrimary: boolean;
  label: string | null;
  number: string;
  postalCode: string | null;
  reference: string | null;
  state: string;
  storeId: string | null;
  street: string;
};

export type FoodPublicCustomerPaymentMethodStatus =
  | "active"
  | "inactive"
  | "pending_tokenization";

export type FoodPublicCustomerPaymentMethodContract = {
  cardBrand: string | null;
  cardLast4: string | null;
  customerId: string;
  id: string;
  isDefault: boolean;
  paymentMethodId: string | null;
  paymentMethodType: "credit_card" | "debit_card";
  providerCardId: string | null;
  providerKey: "mercado_pago";
  status: FoodPublicCustomerPaymentMethodStatus;
  storeId: string | null;
};

export type FoodPublicCustomerSessionContract = {
  account: FoodPublicCustomerAccountContract;
  addresses: FoodPublicCustomerAddressContract[];
  customer: FoodPublicCustomerContract;
  isCompleteForCheckout: boolean;
  paymentMethods: FoodPublicCustomerPaymentMethodContract[];
  primaryAddress: FoodPublicCustomerAddressContract | null;
  primaryPaymentMethod: FoodPublicCustomerPaymentMethodContract | null;
  primaryPhone: FoodPublicCustomerPhoneContract | null;
  storeAccess: FoodPublicCustomerStoreAccessContract;
};

export type FoodOrderDeliveryAddressContract = {
  city: string;
  complement: string | null;
  customerAddressId: string | null;
  district: string | null;
  label: string | null;
  number: string;
  postalCode: string | null;
  reference: string | null;
  state: string;
  street: string;
};

export type FoodOrderItemContract = {
  id: string;
  companyId: string;
  orderId: string;
  productId: string | null;
  productName: string;
  itemNote: string | null;
  kitchenRequired: boolean;
  unitPriceCents: number;
  quantity: number;
  totalPriceCents: number;
};

export type FoodOrderStatusHistoryContract = {
  id: string;
  companyId: string;
  orderId: string;
  previousStatus: FoodOrderStatus | null;
  status: FoodOrderStatus;
  actorUserId: string | null;
  changedAt: string;
};

export type FoodOrderContract = {
  id: string;
  companyId: string;
  storeId: string | null;
  customerAccountId: string | null;
  customerId: string | null;
  customerStoreAccessId: string | null;
  deliveryAddress: FoodOrderDeliveryAddressContract | null;
  fulfillmentMethod: FoodOrderFulfillmentMethod;
  orderNumber: string;
  status: FoodOrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerNote: string | null;
  paidAt: string | null;
  paidBy: string | null;
  paymentMethod: FoodPaymentMethod | null;
  paymentNote: string | null;
  paymentStatus: FoodPaymentStatus;
  subtotalCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  items: FoodOrderItemContract[];
};

export type FoodOrderDetailContract = FoodOrderContract & {
  statusHistory: FoodOrderStatusHistoryContract[];
};

export type FoodDashboardContract = {
  activeDeliveryCount: number;
  activeKitchenCount: number;
  generatedAt: string;
  orderStatusCounts: Record<FoodOrderStatus, number>;
  paidCents: number;
  paymentStatusCounts: Record<FoodPaymentStatus, number>;
  pendingPaymentCents: number;
  periodEnd: string;
  periodStart: string;
  totalCents: number;
  totalOrders: number;
};

export type CreateFoodOrderItemInput = {
  itemNote?: string | null;
  productId: string;
  quantity: number;
};

export type CreateFoodOrderInput = {
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddressId?: string | null;
  fulfillmentMethod?: FoodOrderFulfillmentMethod | null;
  customerNote?: string | null;
  items: CreateFoodOrderItemInput[];
};

export type EnsureFoodPublicCustomerInput = {
  authUserId: string;
  email?: string | null;
};

export type CreatePublicFoodOrderInput = CreateFoodOrderInput & EnsureFoodPublicCustomerInput;

export type CreatePublicFoodCheckoutInput = CreatePublicFoodOrderInput & {
  payment?: {
    cardToken?: string | null;
    customerEmail?: string | null;
    installments?: number | null;
    paymentMethodId?: string | null;
    paymentMethodType?: "credit_card" | "debit_card" | "pix" | null;
    saveForFuture?: boolean | null;
  } | null;
};

export type ValidatePublicFoodCartInput = {
  items: CreateFoodOrderItemInput[];
};

export type FoodPublicCartValidationItemStatus =
  | "available"
  | "insufficient_stock"
  | "missing"
  | "unavailable";

export type FoodPublicCartValidationItemContract = {
  issue: string | null;
  productId: string;
  productName: string | null;
  quantity: number;
  status: FoodPublicCartValidationItemStatus;
  totalPriceCents: number;
  unitPriceCents: number;
};

export type FoodPublicCartValidationContract = {
  checkedAt: string;
  isValidForCheckout: boolean;
  issues: string[];
  items: FoodPublicCartValidationItemContract[];
  subtotalCents: number;
  totalCents: number;
};

export type UpdateFoodPublicCustomerProfileInput = EnsureFoodPublicCustomerInput & {
  acceptedPrivacy: boolean;
  acceptedTerms: boolean;
  fullName: string;
  phone: string;
  preferredContactMethod: FoodCustomerPreferredContactMethod;
};

export type UpsertFoodPublicCustomerAddressInput = EnsureFoodPublicCustomerInput & {
  city: string;
  complement?: string | null;
  district?: string | null;
  isPrimary?: boolean | null;
  label?: string | null;
  number: string;
  postalCode?: string | null;
  reference?: string | null;
  state: string;
  street: string;
};

export type SetFoodPublicCustomerPrimaryAddressInput = EnsureFoodPublicCustomerInput;

export type ListPublicFoodCustomerOrdersInput = EnsureFoodPublicCustomerInput;

export type CreatePublicFoodCheckoutContract = {
  order: FoodOrderContract;
  paymentRequestId: string | null;
  paymentStatus: "failed" | "paid" | "pending";
  paymentUrl: string | null;
};

export type RetryPublicFoodPaymentInput = {
  authUserId: string;
  email?: string | null;
  payment?: CreatePublicFoodCheckoutInput["payment"];
};

export type UpdateFoodOrderStatusInput = {
  status: FoodOrderStatus;
};

export type UpdateFoodOrderPaymentInput = {
  paymentMethod?: FoodPaymentMethod | null;
  paymentNote?: string | null;
  paymentStatus: FoodPaymentStatus;
};

export type PaginatedContract<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
