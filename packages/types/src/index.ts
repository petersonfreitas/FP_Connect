export type CompanyStatus = "implementation" | "active" | "suspended" | "cancelled";
export type CompanyPersonType = "individual" | "legal_entity";
export type UserStatus = "invited" | "active" | "inactive";
export type ApplicationStatus = "active" | "inactive" | "hidden";
export type CompanyApplicationStatus = "implementation" | "active" | "suspended" | "cancelled";
export type BasicPlanStatus = "active" | "inactive";
export type AdminAuditScope = "all" | "companies" | "users" | "modules" | "system";
export type UserGlobalRole = "company_user" | "fp_admin" | "super_admin" | "support";
export type ModuleApplicationKey =
  | "billing"
  | "food"
  | "gateway"
  | "marketing"
  | "robots"
  | "sales"
  | "tickets"
  | "tracking";

export type ModuleAccessContract = {
  actorUserId: string | null;
  applicationKey: ModuleApplicationKey;
  companyId: string | null;
  granted: true;
};

export type RobotsEventStatus = "failed" | "ignored_duplicate" | "received";
export type RobotsCatalogStatus = "active" | "inactive";
export type RobotsRuleStatus = "active" | "inactive";
export type RobotsActionStatus = "active" | "inactive";
export type RobotsExecutionStatus = "cancelled" | "failed" | "pending" | "running" | "succeeded";
export type RobotsActionType =
  | "email"
  | "gateway_external_action"
  | "internal_api"
  | "internal_log"
  | "webhook";

export type GatewayProviderCategory = "ads" | "email" | "messaging" | "payment" | "social";
export type GatewayProviderAuthType = "api_key" | "manual" | "oauth" | "smtp_credentials";
export type GatewayProviderStatus = "active" | "inactive";
export type GatewayCompanyProviderStatus =
  | "active"
  | "configured"
  | "error"
  | "inactive"
  | "not_configured";
export type GatewayValidationStatus = "failed" | "succeeded" | "untested";

export type GatewayProviderContract = {
  authType: GatewayProviderAuthType;
  category: GatewayProviderCategory;
  description: string | null;
  id: string;
  key: string;
  name: string;
  sortOrder: number;
  status: GatewayProviderStatus;
};

export type GatewaySmtpPublicConfig = {
  fromEmail: string;
  fromName: string | null;
  host: string;
  port: number;
  secure: boolean;
  username: string | null;
};

export type GatewayCompanyProviderConfigContract = {
  companyId: string;
  id: string;
  lastValidatedAt: string | null;
  lastValidationMessage: string | null;
  lastValidationStatus: GatewayValidationStatus | null;
  passwordConfigured: boolean;
  providerAuthType: GatewayProviderAuthType;
  providerCategory: GatewayProviderCategory;
  providerKey: string;
  providerName: string;
  publicConfig: GatewaySmtpPublicConfig | Record<string, unknown>;
  status: GatewayCompanyProviderStatus;
  updatedAt: string;
};

export type UpsertGatewaySmtpConfigInput = {
  fromEmail: string;
  fromName?: string | null;
  host: string;
  password?: string | null;
  port: number;
  secure: boolean;
  status: Extract<GatewayCompanyProviderStatus, "active" | "configured" | "inactive">;
  username?: string | null;
};

export type GatewayProviderValidationContract = {
  config: GatewayCompanyProviderConfigContract;
  message: string;
  status: Extract<GatewayValidationStatus, "failed" | "succeeded">;
};

export type GatewayMercadoPagoPublicConfig = {
  appId: string | null;
  authorizedAt: string;
  expiresAt: string | null;
  liveMode: boolean | null;
  mode: "manual_sandbox" | "oauth";
  publicKeyConfigured: boolean;
  scope: string | null;
  tokenType: string | null;
  userId: number | string | null;
};

export type UpsertGatewayMercadoPagoManualConfigInput = {
  accessToken: string;
  appId?: string | null;
  publicKey?: string | null;
  userId?: string | null;
};

export type GatewayMercadoPagoOAuthStartContract = {
  authorizationUrl: string;
  redirectUri: string;
  state: string;
};

export type CompleteGatewayMercadoPagoOAuthInput = {
  code: string;
  state: string;
};

export type GatewayMercadoPagoOAuthContract = {
  config: GatewayCompanyProviderConfigContract;
  message: string;
};

export type GatewayPaymentRequestStatus =
  | "cancelled"
  | "expired"
  | "failed"
  | "paid"
  | "requested"
  | "requires_provider_config";

export type GatewayPaymentMethodType = "credit_card" | "debit_card" | "pix";

export type GatewayPaymentRequestContract = {
  amountCents: number;
  cardBrand: string | null;
  cardLast4: string | null;
  companyId: string;
  createdAt: string;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  description: string;
  errorMessage: string | null;
  id: string;
  paymentMethodId: string | null;
  paymentMethodType: GatewayPaymentMethodType;
  paymentTypeId: GatewayPaymentMethodType;
  paymentUrl: string | null;
  providerKey: string;
  providerName: string;
  providerCardId: string | null;
  providerCustomerId: string | null;
  providerReference: string | null;
  sourceApplicationKey: string;
  sourceReferenceId: string;
  sourceReferenceType: string;
  status: GatewayPaymentRequestStatus;
  updatedAt: string;
};

export type CreateGatewayPaymentRequestInput = {
  amountCents: number;
  cardToken?: string | null;
  currency?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  description: string;
  idempotencyKey?: string | null;
  installments?: number | null;
  paymentMethodId?: string | null;
  paymentMethodType?: GatewayPaymentMethodType | null;
  providerCardId?: string | null;
  providerCustomerId?: string | null;
  providerKey?: string | null;
  saveCardForFuture?: boolean | null;
  sourceApplicationKey: string;
  sourceReferenceId: string;
  sourceReferenceType: string;
};

export type SendGatewaySmtpTestEmailInput = {
  body?: string | null;
  subject?: string | null;
  toEmail: string;
};

export type GatewaySmtpTestEmailContract = {
  message: string;
  sent: true;
  toEmail: string;
};

export type FoodStoreStatus = "closed" | "implementation" | "open" | "suspended";
export type FoodCategoryStatus = "active" | "inactive";
export type FoodProductStatus = "available" | "hidden" | "unavailable";
export type FoodStockMovementType = "adjustment" | "entry" | "sale";
export type FoodPaymentMethod = "card" | "cash" | "other" | "pix";
export type FoodPaymentStatus = "cancelled" | "paid" | "pending";
export type FoodOrderFulfillmentMethod = "delivery" | "dine_in" | "pickup";
export type FoodOrderItemStatus = "cancelled" | "pending" | "preparing" | "ready";
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
  itemStatus: FoodOrderItemStatus;
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
  orderItemId?: string | null;
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

export type UpdateFoodOrderItemsInput = CreateFoodOrderInput;

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

export type RobotsEventCatalogContract = {
  id: string;
  code: string;
  sourceApplicationKey: string;
  name: string;
  description: string | null;
  version: number;
  status: RobotsCatalogStatus;
};

export type RobotsEventContract = {
  id: string;
  companyId: string;
  catalogEventId: string;
  eventCode: string;
  sourceApplicationKey: string;
  sourceEventId: string | null;
  idempotencyKey: string | null;
  status: RobotsEventStatus;
  payloadMasked: Record<string, unknown>;
  originMetadata: Record<string, unknown>;
  occurredAt: string;
  acceptedAt: string;
  createdAt: string;
  createdBy: string | null;
};

export type CreateRobotsEventInput = {
  eventCode: string;
  sourceApplicationKey: string;
  sourceEventId?: string | null;
  idempotencyKey?: string | null;
  payload?: Record<string, unknown>;
  occurredAt?: string | null;
  originMetadata?: Record<string, unknown>;
};

export type CreateRobotsEventContract = {
  duplicate: boolean;
  event: RobotsEventContract;
  executionsCreated: number;
};

export type RobotsRuleActionContract = {
  id: string;
  ruleId: string;
  companyId: string;
  actionType: RobotsActionType;
  name: string;
  actionConfig: Record<string, unknown>;
  sortOrder: number;
  status: RobotsActionStatus;
};

export type RobotsRuleContract = {
  id: string;
  companyId: string;
  eventCatalogId: string;
  eventCode: string;
  name: string;
  description: string | null;
  status: RobotsRuleStatus;
  actions: RobotsRuleActionContract[];
};

export type RobotsExecutionContract = {
  id: string;
  eventId: string;
  companyId: string;
  ruleId: string | null;
  ruleActionId: string | null;
  actionType: RobotsActionType;
  status: RobotsExecutionStatus;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt: string | null;
  lastError: string | null;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ReprocessRobotsExecutionContract = {
  reprocessed: true;
  execution: RobotsExecutionContract;
};

export type PaginatedContract<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminApplicationContract = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  entryPath: string | null;
  status: ApplicationStatus;
  sortOrder: number;
};

export type AdminBasicPlanContract = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: BasicPlanStatus;
};

export type AdminBasicPlanCatalogContract = AdminBasicPlanContract & {
  applications: AdminApplicationContract[];
};

export type AdminCatalogContract = {
  applications: AdminApplicationContract[];
  basicPlans: AdminBasicPlanCatalogContract[];
};

export type AdminCompanyContract = {
  id: string;
  personType: CompanyPersonType;
  legalName: string;
  tradeName: string | null;
  document: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  primaryMobilePhone: string | null;
  primaryResponsibleName: string;
  primaryResponsibleEmail: string | null;
  addressPostalCode: string | null;
  addressStreetType: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  addressCity: string | null;
  addressState: string | null;
  status: CompanyStatus;
  basicPlanId: string | null;
  implementationNotes: string | null;
  createdAt: string;
};

export type AdminConsoleOverviewContract = {
  applications: AdminApplicationContract[];
  basicPlans: AdminBasicPlanContract[];
  companies: AdminCompanyContract[];
};

export type AdminCompanyApplicationContract = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  entryPath: string | null;
  applicationStatus: ApplicationStatus;
  companyApplicationId: string | null;
  companyStatus: CompanyApplicationStatus | null;
  implementationNotes: string | null;
  activatedAt: string | null;
  suspendedAt: string | null;
  cancelledAt: string | null;
};

export type AdminContractedModuleContract = {
  id: string;
  companyId: string;
  companyName: string;
  applicationId: string;
  applicationKey: string;
  applicationName: string;
  applicationEntryPath: string | null;
  status: CompanyApplicationStatus;
  implementationNotes: string | null;
  activatedAt: string | null;
  suspendedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
};

export type AdminPermissionContract = {
  id: string;
  applicationId: string;
  key: string;
  name: string;
  description: string | null;
};

export type AdminRoleContract = {
  id: string;
  applicationId: string;
  applicationKey: string;
  applicationName: string;
  key: string;
  name: string;
  description: string | null;
  permissions: AdminPermissionContract[];
};

export type AdminUserApplicationRoleContract = {
  id: string;
  companyId: string;
  userId: string;
  applicationId: string;
  applicationKey: string;
  applicationName: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  createdAt: string;
};

export type AdminCompanyUserAccessContract = {
  user: AdminCompanyUserContract;
  applications: AdminCompanyApplicationContract[];
  availableRoles: AdminRoleContract[];
  grants: AdminUserApplicationRoleContract[];
};

export type AdminNavigationItemContract = {
  href: string;
  label: string;
};

export type AdminNavigationGroupContract = {
  label: string;
  items: AdminNavigationItemContract[];
};

export type AdminNavigationContract = {
  primary: AdminNavigationItemContract[];
  groups: AdminNavigationGroupContract[];
};

export type AdminCurrentUserModuleAccessContract = {
  applicationId: string;
  applicationKey: string;
  applicationName: string;
  companyId: string;
  companyName: string;
  entryPath: string | null;
  permissions: string[];
};

export type AdminCurrentUserCompanyAccessContract = {
  company: AdminCompanyContract;
  membershipId: string;
  membershipStatus: UserStatus;
  isPrimaryContact: boolean;
  adminPermissions: string[];
  modules: AdminCurrentUserModuleAccessContract[];
};

export type AdminCurrentUserAccessContract = {
  user: AdminUserContract & {
    globalRole: UserGlobalRole;
    isInternalUser: boolean;
  };
  isSuperAdmin: boolean;
  isPlatformUser: boolean;
  companies: AdminCurrentUserCompanyAccessContract[];
  navigation: AdminNavigationContract;
};

export type AdminAuditLogContract = {
  id: string;
  companyId: string | null;
  companyName: string | null;
  actorUserId: string | null;
  action: string;
  entitySchema: string;
  entityTable: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CreateAdminCompanyInput = {
  personType: CompanyPersonType;
  legalName: string;
  tradeName?: string | null;
  document?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  primaryMobilePhone?: string | null;
  primaryResponsibleName: string;
  primaryResponsibleEmail?: string | null;
  addressPostalCode?: string | null;
  addressStreetType?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  addressDistrict?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  basicPlanId?: string | null;
  implementationNotes?: string | null;
};

export type UpdateAdminCompanyInput = CreateAdminCompanyInput & {
  status: CompanyStatus;
};

export type CnpjLookupContract = {
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  addressPostalCode: string | null;
  addressStreetType: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  addressCity: string | null;
  addressState: string | null;
};

export type AdminUserContract = {
  id: string;
  fullName: string;
  email: string | null;
  status: UserStatus;
  globalRole: UserGlobalRole;
  isInternalUser: boolean;
  createdAt: string;
};

export type AdminCompanyUserContract = AdminUserContract & {
  membershipId: string;
  companyId: string;
  membershipStatus: UserStatus;
  isPrimaryContact: boolean;
};

export type CreateAdminUserInput = {
  fullName: string;
  email: string;
  companyId: string;
  isPrimaryContact?: boolean;
};

export type CreateAdminConsoleUserInput = {
  fullName: string;
  email: string;
  globalRole: Extract<UserGlobalRole, "super_admin" | "fp_admin" | "support">;
};

export type UpdateAdminCompanyUserInput = {
  status: UserStatus;
  isPrimaryContact: boolean;
};

export type LinkAdminCompanySupportInput = {
  userId: string;
};

export type UpdateAdminUserInput = {
  fullName: string;
  email: string;
  status: UserStatus;
  globalRole: UserGlobalRole;
};

export type UpdateAdminCompanyApplicationInput = {
  applicationId: string;
  status: CompanyApplicationStatus;
  implementationNotes?: string | null;
};

export type BulkUpdateAdminCompanyApplicationsInput = {
  applicationIds: string[];
  status: CompanyApplicationStatus;
  implementationNotes?: string | null;
};

export type BulkUpdateAdminCompanyApplicationsContract = {
  updated: AdminCompanyApplicationContract[];
};

export type GrantAdminUserRoleInput = {
  roleId: string;
};

export type BulkGrantAdminUserRolesInput = {
  roleIds: string[];
};

export type BulkGrantAdminUserRolesContract = {
  granted: AdminUserApplicationRoleContract[];
};

export type RevokeAdminUserRoleInput = {
  grantId: string;
};

export type RevokeAdminUserRoleContract = {
  revoked: true;
};

export type BulkRevokeAdminUserRolesInput = {
  grantIds: string[];
};

export type BulkRevokeAdminUserRolesContract = {
  revoked: true;
  count: number;
};

export type ResendAdminUserInviteContract = {
  sent: true;
};

export type ActivateAdminUserInviteContract = {
  activated: boolean;
};
