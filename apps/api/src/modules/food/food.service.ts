import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { GatewayService } from "../gateway/gateway.service";
import { RobotsService } from "../robots/robots.service";
import { SupabaseService } from "../../supabase/supabase.service";
import type {
  CreatePublicFoodCheckoutContract,
  CreatePublicFoodCheckoutInput,
  CreateFoodOrderInput,
  FoodCategoryContract,
  FoodCategoryStatus,
  FoodDashboardContract,
  FoodOrderDetailContract,
  FoodMenuContract,
  FoodOrderContract,
  FoodOrderItemContract,
  FoodOrderStatusHistoryContract,
  FoodOrderStatus,
  FoodPaymentMethod,
  FoodPaymentStatus,
  FoodProductContract,
  FoodProductStatus,
  FoodPublicCheckoutContract,
  FoodStoreContract,
  FoodStoreHourContract,
  FoodStoreHourKind,
  FoodStoreStatus,
  PaginatedContract,
  RetryPublicFoodPaymentInput,
  UpdateFoodOrderPaymentInput,
  UpdateFoodOrderStatusInput,
  UpsertFoodCategoryInput,
  UpsertFoodProductInput,
  UpsertFoodStoreHoursInput,
  UpsertFoodStoreInput
} from "./food.contracts";

type FoodStoreRow = {
  id: string;
  company_id: string;
  display_name: string;
  public_slug: string;
  status: FoodStoreStatus;
  contact_phone: string | null;
  preparation_time_minutes: number | null;
  delivery_notes: string | null;
  created_at: string;
  updated_at: string;
};

type FoodStoreHourRow = {
  id: string;
  company_id: string;
  store_id: string;
  kind: FoodStoreHourKind;
  weekday: number;
  opens_at: string;
  closes_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type FoodCategoryRow = {
  id: string;
  company_id: string;
  store_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: FoodCategoryStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type FoodProductRow = {
  id: string;
  company_id: string;
  store_id: string | null;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  status: FoodProductStatus;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type FoodOrderRow = {
  id: string;
  company_id: string;
  store_id: string | null;
  order_number: string;
  status: FoodOrderStatus;
  customer_name: string | null;
  customer_phone: string | null;
  customer_note: string | null;
  paid_at: string | null;
  paid_by: string | null;
  payment_method: FoodPaymentMethod | null;
  payment_note: string | null;
  payment_status: FoodPaymentStatus;
  subtotal_cents: number;
  total_cents: number;
  created_at: string;
  updated_at: string;
};

type FoodOrderItemRow = {
  id: string;
  company_id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  total_price_cents: number;
};

type FoodOrderStatusHistoryRow = {
  id: string;
  company_id: string;
  order_id: string;
  previous_status: FoodOrderStatus | null;
  status: FoodOrderStatus;
  actor_user_id: string | null;
  changed_at: string;
};

type FoodDashboardOrderRow = {
  id: string;
  status: FoodOrderStatus;
  payment_status: FoodPaymentStatus;
  total_cents: number;
  created_at: string;
};

type MercadoPagoCompanyConfigRow = {
  public_config: {
    mode?: "manual_sandbox" | "oauth";
  } | null;
  secret_config: {
    publicKey?: string | null;
  } | null;
  status: "active" | "configured" | "error" | "inactive" | "not_configured";
};

type PublicCheckoutPaymentInput = {
  cardToken: string;
  customerEmail: string;
  installments: number;
  paymentMethodId: string;
  paymentMethodType: "credit_card" | "debit_card";
};

type PaginationOptions = {
  page: number;
  pageSize: number;
};

type OrderListOptions = PaginationOptions & {
  status?: FoodOrderStatus;
};

type CreateOrderOptions = {
  eventSource: "internal-order-v0" | "public-store-v0";
};

const storeSelect = [
  "id",
  "company_id",
  "display_name",
  "public_slug",
  "status",
  "contact_phone",
  "preparation_time_minutes",
  "delivery_notes",
  "created_at",
  "updated_at"
].join(",");

const storeHourSelect = [
  "id",
  "company_id",
  "store_id",
  "kind",
  "weekday",
  "opens_at",
  "closes_at",
  "is_active",
  "created_at",
  "updated_at"
].join(",");

const categorySelect = [
  "id",
  "company_id",
  "store_id",
  "name",
  "slug",
  "description",
  "status",
  "sort_order",
  "created_at",
  "updated_at"
].join(",");

const productSelect = [
  "id",
  "company_id",
  "store_id",
  "category_id",
  "name",
  "slug",
  "description",
  "price_cents",
  "status",
  "image_url",
  "sort_order",
  "created_at",
  "updated_at"
].join(",");

const orderSelect = [
  "id",
  "company_id",
  "store_id",
  "order_number",
  "status",
  "customer_name",
  "customer_phone",
  "customer_note",
  "paid_at",
  "paid_by",
  "payment_method",
  "payment_note",
  "payment_status",
  "subtotal_cents",
  "total_cents",
  "created_at",
  "updated_at"
].join(",");

const orderItemSelect = [
  "id",
  "company_id",
  "order_id",
  "product_id",
  "product_name",
  "unit_price_cents",
  "quantity",
  "total_price_cents"
].join(",");

const orderStatusHistorySelect = [
  "id",
  "company_id",
  "order_id",
  "previous_status",
  "status",
  "actor_user_id",
  "changed_at"
].join(",");

const validStatuses = new Set<FoodStoreStatus>([
  "closed",
  "implementation",
  "open",
  "suspended"
]);
const validCategoryStatuses = new Set<FoodCategoryStatus>(["active", "inactive"]);
const validProductStatuses = new Set<FoodProductStatus>([
  "available",
  "hidden",
  "unavailable"
]);
const validOrderStatuses = new Set<FoodOrderStatus>([
  "accepted",
  "cancelled",
  "created",
  "delivered",
  "out_for_delivery",
  "preparing",
  "ready"
]);
const validPaymentMethods = new Set<FoodPaymentMethod>(["card", "cash", "other", "pix"]);
const validPaymentStatuses = new Set<FoodPaymentStatus>([
  "cancelled",
  "paid",
  "pending"
]);
const validStoreHourKinds = new Set<FoodStoreHourKind>(["delivery", "ordering"]);
const saoPauloTimeZone = "America/Sao_Paulo";

@Injectable()
export class FoodService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly supabase: SupabaseService,
    private readonly robots: RobotsService
  ) {}

  async getStore(companyId: string): Promise<FoodStoreContract> {
    const { data, error } = await this.supabase.food
      .from("stores")
      .select(storeSelect)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("Loja Food ainda nao configurada");
    }

    return mapStore(data as unknown as FoodStoreRow);
  }

  async upsertStore(
    companyId: string,
    actorUserId: string,
    input: UpsertFoodStoreInput
  ): Promise<FoodStoreContract> {
    const normalized = normalizeStoreInput(input);
    const current = await this.findStore(companyId);
    const row = {
      company_id: companyId,
      contact_phone: normalized.contactPhone,
      delivery_notes: normalized.deliveryNotes,
      display_name: normalized.displayName,
      preparation_time_minutes: normalized.preparationTimeMinutes,
      public_slug: normalized.publicSlug,
      status: normalized.status,
      updated_by: actorUserId
    };

    const { data, error } = current
      ? await this.supabase.food
          .from("stores")
          .update(row)
          .eq("id", current.id)
          .eq("company_id", companyId)
          .select(storeSelect)
          .single()
      : await this.supabase.food
          .from("stores")
          .insert({
            ...row,
            created_by: actorUserId
          })
          .select(storeSelect)
          .single();

    if (error) {
      throwSupabaseError(error);
    }

    const store = mapStore(data as unknown as FoodStoreRow);
    await this.emitStoreConfigured(companyId, actorUserId, store);

    return store;
  }

  async listStoreHours(companyId: string): Promise<FoodStoreHourContract[]> {
    const store = await this.findStore(companyId);

    if (!store) {
      return [];
    }

    return this.listStoreHoursByStore(companyId, store.id);
  }

  async replaceStoreHours(
    companyId: string,
    actorUserId: string,
    input: UpsertFoodStoreHoursInput
  ): Promise<FoodStoreHourContract[]> {
    const store = await this.findStore(companyId);

    if (!store) {
      throw new NotFoundException("Loja Food ainda nao configurada");
    }

    const normalized = normalizeStoreHoursInput(input);
    const now = new Date().toISOString();

    const { error: updateError } = await this.supabase.food
      .from("store_hours")
      .update({
        deleted_at: now,
        updated_by: actorUserId
      })
      .eq("company_id", companyId)
      .eq("store_id", store.id)
      .is("deleted_at", null);

    if (updateError) {
      throwSupabaseError(updateError);
    }

    if (normalized.length > 0) {
      const { error: insertError } = await this.supabase.food
        .from("store_hours")
        .insert(
          normalized.map((hour) => ({
            closes_at: hour.closesAt,
            company_id: companyId,
            created_by: actorUserId,
            is_active: hour.isActive,
            kind: hour.kind,
            opens_at: hour.opensAt,
            store_id: store.id,
            updated_by: actorUserId,
            weekday: hour.weekday
          }))
        );

      if (insertError) {
        throwSupabaseError(insertError);
      }
    }

    const hours = await this.listStoreHoursByStore(companyId, store.id);
    await this.emitStoreHoursUpdated(companyId, actorUserId, store, hours);

    return hours;
  }

  async listCategories(
    companyId: string,
    pagination: PaginationOptions
  ): Promise<PaginatedContract<FoodCategoryContract>> {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    const { count, data, error } = await this.supabase.food
      .from("categories")
      .select(categorySelect, { count: "exact" })
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .range(from, to);

    if (error) {
      throwSupabaseError(error);
    }

    return toPaginated(
      ((data ?? []) as unknown as FoodCategoryRow[]).map(mapCategory),
      pagination,
      count ?? 0
    );
  }

  async upsertCategory(
    companyId: string,
    actorUserId: string,
    input: UpsertFoodCategoryInput,
    categoryId?: string
  ): Promise<FoodCategoryContract> {
    const store = await this.findStore(companyId);
    const normalized = normalizeCategoryInput(input);
    const row = {
      company_id: companyId,
      description: normalized.description,
      name: normalized.name,
      slug: normalized.slug,
      sort_order: normalized.sortOrder,
      status: normalized.status,
      store_id: store?.id ?? null,
      updated_by: actorUserId
    };

    const { data, error } = categoryId
      ? await this.supabase.food
          .from("categories")
          .update(row)
          .eq("id", categoryId)
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .select(categorySelect)
          .single()
      : await this.supabase.food
          .from("categories")
          .insert({
            ...row,
            created_by: actorUserId
          })
          .select(categorySelect)
          .single();

    if (error) {
      throwSupabaseError(error);
    }

    const category = mapCategory(data as unknown as FoodCategoryRow);
    await this.emitMenuUpdated(companyId, actorUserId, "category", category.id);

    return category;
  }

  async listProducts(
    companyId: string,
    pagination: PaginationOptions
  ): Promise<PaginatedContract<FoodProductContract>> {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    const { count, data, error } = await this.supabase.food
      .from("products")
      .select(productSelect, { count: "exact" })
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .range(from, to);

    if (error) {
      throwSupabaseError(error);
    }

    return toPaginated(
      ((data ?? []) as unknown as FoodProductRow[]).map(mapProduct),
      pagination,
      count ?? 0
    );
  }

  async upsertProduct(
    companyId: string,
    actorUserId: string,
    input: UpsertFoodProductInput,
    productId?: string
  ): Promise<FoodProductContract> {
    const store = await this.findStore(companyId);
    const normalized = await this.normalizeProductInput(companyId, input);
    const row = {
      category_id: normalized.categoryId,
      company_id: companyId,
      description: normalized.description,
      image_url: normalized.imageUrl,
      name: normalized.name,
      price_cents: normalized.priceCents,
      slug: normalized.slug,
      sort_order: normalized.sortOrder,
      status: normalized.status,
      store_id: store?.id ?? null,
      updated_by: actorUserId
    };

    const { data, error } = productId
      ? await this.supabase.food
          .from("products")
          .update(row)
          .eq("id", productId)
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .select(productSelect)
          .single()
      : await this.supabase.food
          .from("products")
          .insert({
            ...row,
            created_by: actorUserId
          })
          .select(productSelect)
          .single();

    if (error) {
      throwSupabaseError(error);
    }

    const product = mapProduct(data as unknown as FoodProductRow);
    await this.emitMenuUpdated(companyId, actorUserId, "product", product.id);

    return product;
  }

  async getMenu(companyId: string): Promise<FoodMenuContract> {
    const store = await this.getStore(companyId);
    return this.buildMenu(store);
  }

  async getDashboard(companyId: string): Promise<FoodDashboardContract> {
    const { periodStart, periodEnd } = getCurrentDayPeriod();
    const [periodRows, activeRows] = await Promise.all([
      this.listDashboardOrders(companyId, {
        periodEnd,
        periodStart
      }),
      this.listDashboardOrders(companyId, {
        statuses: ["accepted", "preparing", "ready", "out_for_delivery"]
      })
    ]);
    const orderStatusCounts = createOrderStatusCount();
    const paymentStatusCounts = createPaymentStatusCount();
    let totalCents = 0;
    let paidCents = 0;
    let pendingPaymentCents = 0;

    for (const order of periodRows) {
      orderStatusCounts[order.status] += 1;
      paymentStatusCounts[order.payment_status] += 1;
      totalCents += order.total_cents;

      if (order.payment_status === "paid") {
        paidCents += order.total_cents;
      }

      if (order.payment_status === "pending") {
        pendingPaymentCents += order.total_cents;
      }
    }

    return {
      activeDeliveryCount: activeRows.filter(
        (order) => order.status === "ready" || order.status === "out_for_delivery"
      ).length,
      activeKitchenCount: activeRows.filter(
        (order) => order.status === "accepted" || order.status === "preparing"
      ).length,
      generatedAt: new Date().toISOString(),
      orderStatusCounts,
      paidCents,
      paymentStatusCounts,
      pendingPaymentCents,
      periodEnd: periodEnd.toISOString(),
      periodStart: periodStart.toISOString(),
      totalCents,
      totalOrders: periodRows.length
    };
  }

  async getPublicMenu(publicSlug: string): Promise<FoodMenuContract> {
    const store = await this.getStoreByPublicSlug(publicSlug);
    await this.ensurePublicStoreAvailable(store);
    return this.buildMenu(store);
  }

  async getPublicCheckout(publicSlug: string): Promise<FoodPublicCheckoutContract> {
    const store = await this.getStoreByPublicSlug(publicSlug);
    await this.ensurePublicStoreAvailable(store);
    return this.getPublicCheckoutForCompany(store.company_id);
  }

  async createPublicOrder(
    publicSlug: string,
    input: CreateFoodOrderInput
  ): Promise<FoodOrderContract> {
    const store = await this.getStoreByPublicSlug(publicSlug);
    await this.ensurePublicStoreAvailable(store);
    await this.ensureOrderingOpen(store);

    return this.createOrder(store.company_id, null, input, {
      eventSource: "public-store-v0"
    });
  }

  async createPublicCheckout(
    publicSlug: string,
    input: CreatePublicFoodCheckoutInput
  ): Promise<CreatePublicFoodCheckoutContract> {
    const store = await this.getStoreByPublicSlug(publicSlug);
    await this.ensurePublicStoreAvailable(store);
    await this.ensureOrderingOpen(store);
    const payment = normalizePublicCheckoutPayment(input.payment);
    const order = await this.createOrder(store.company_id, null, input, {
      eventSource: "public-store-v0"
    });

    if (!payment) {
      return {
        order,
        paymentRequestId: null,
        paymentStatus: "pending",
        paymentUrl: null
      };
    }

    const paymentRequest = await this.gateway.createPaymentRequest(store.company_id, null, {
      amountCents: order.totalCents,
      cardToken: payment.cardToken,
      customerEmail: payment.customerEmail,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      description: `Pedido ${order.orderNumber} - ${store.display_name}`,
      idempotencyKey: `food-public-checkout:${order.id}:${payment.paymentMethodType}`,
      installments: payment.installments,
      paymentMethodId: payment.paymentMethodId,
      paymentMethodType: payment.paymentMethodType,
      providerKey: "mercado_pago",
      sourceApplicationKey: "food",
      sourceReferenceId: order.id,
      sourceReferenceType: "food_order"
    });

    if (paymentRequest.status === "paid") {
      const paidOrder = await this.markOrderPaymentFromGateway(
        store.company_id,
        order.id,
        "card",
        "Pagamento aprovado pelo FP Gateway/Mercado Pago."
      );

      return {
        order: paidOrder,
        paymentRequestId: paymentRequest.id,
        paymentStatus: "paid",
        paymentUrl: paymentRequest.paymentUrl
      };
    }

    return {
      order,
      paymentRequestId: paymentRequest.id,
      paymentStatus: paymentRequest.status === "failed" ? "failed" : "pending",
      paymentUrl: paymentRequest.paymentUrl
    };
  }

  async retryPublicOrderPayment(
    publicSlug: string,
    orderNumber: string,
    input: RetryPublicFoodPaymentInput
  ): Promise<CreatePublicFoodCheckoutContract> {
    const store = await this.getStoreByPublicSlug(publicSlug);
    await this.ensurePublicStoreReadable(store);
    await this.ensureOrderingOpen(store);
    const order = await this.getPublicOrderFromStore(store, orderNumber);
    const payment = normalizePublicCheckoutPayment(input.payment);

    if (order.paymentStatus === "paid") {
      throw new BadRequestException("Pedido ja esta pago");
    }

    if (order.status === "cancelled") {
      throw new BadRequestException("Pedido cancelado nao aceita novo pagamento");
    }

    if (!payment) {
      throw new BadRequestException("Dados de pagamento sao obrigatorios");
    }

    const paymentRequest = await this.gateway.createPaymentRequest(store.company_id, null, {
      amountCents: order.totalCents,
      cardToken: payment.cardToken,
      customerEmail: payment.customerEmail,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      description: `Retentativa ${order.orderNumber} - ${store.display_name}`,
      idempotencyKey: `food-public-checkout-retry:${order.id}:${randomUUID()}`,
      installments: payment.installments,
      paymentMethodId: payment.paymentMethodId,
      paymentMethodType: payment.paymentMethodType,
      providerKey: "mercado_pago",
      sourceApplicationKey: "food",
      sourceReferenceId: order.id,
      sourceReferenceType: "food_order"
    });

    if (paymentRequest.status === "paid") {
      const paidOrder = await this.markOrderPaymentFromGateway(
        store.company_id,
        order.id,
        "card",
        "Pagamento aprovado pelo FP Gateway/Mercado Pago em retentativa."
      );

      return {
        order: paidOrder,
        paymentRequestId: paymentRequest.id,
        paymentStatus: "paid",
        paymentUrl: paymentRequest.paymentUrl
      };
    }

    return {
      order,
      paymentRequestId: paymentRequest.id,
      paymentStatus: paymentRequest.status === "failed" ? "failed" : "pending",
      paymentUrl: paymentRequest.paymentUrl
    };
  }

  async getPublicOrder(
    publicSlug: string,
    orderNumber: string
  ): Promise<FoodOrderContract> {
    const store = await this.getStoreByPublicSlug(publicSlug);
    await this.ensurePublicStoreReadable(store);
    return this.getPublicOrderFromStore(store, orderNumber);
  }

  private async buildMenu(store: FoodStoreRow | FoodStoreContract): Promise<FoodMenuContract> {
    const companyId = "company_id" in store ? store.company_id : store.companyId;
    const storeId = store.id;
    const mappedStore = "company_id" in store ? mapStore(store) : store;
    const [categories, hours, products] = await Promise.all([
      this.listAllCategories(companyId),
      this.listStoreHoursByStore(companyId, storeId),
      this.listAllProducts(companyId)
    ]);
    const availability = calculateStoreAvailability(hours);
    const visibleCategories = categories.filter((category) => category.status === "active");
    const visibleProducts = products.filter((product) => product.status === "available");
    const productsByCategoryId = new Map<string, FoodProductContract[]>();
    const uncategorizedProducts: FoodProductContract[] = [];

    for (const product of visibleProducts) {
      if (!product.categoryId) {
        uncategorizedProducts.push(product);
        continue;
      }

      const grouped = productsByCategoryId.get(product.categoryId) ?? [];
      grouped.push(product);
      productsByCategoryId.set(product.categoryId, grouped);
    }

    return {
      availability,
      categories: visibleCategories.map((category) => ({
        ...category,
        products: productsByCategoryId.get(category.id) ?? []
      })),
      hours,
      store: mappedStore,
      uncategorizedProducts
    };
  }

  async listOrders(
    companyId: string,
    pagination: OrderListOptions
  ): Promise<PaginatedContract<FoodOrderContract>> {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    let query = this.supabase.food
      .from("orders")
      .select(orderSelect, { count: "exact" })
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (pagination.status) {
      query = query.eq("status", pagination.status);
    }

    const { count, data, error } = await query
      .range(from, to);

    if (error) {
      throwSupabaseError(error);
    }

    const rows = (data ?? []) as unknown as FoodOrderRow[];
    const itemsByOrderId = await this.listOrderItemsByOrderIds(
      companyId,
      rows.map((order) => order.id)
    );

    return toPaginated(
      rows.map((order) => mapOrder(order, itemsByOrderId.get(order.id) ?? [])),
      pagination,
      count ?? 0
    );
  }

  async getOrderDetail(companyId: string, orderId: string): Promise<FoodOrderDetailContract> {
    const orderRow = await this.getOrderRow(companyId, orderId);
    const [items, statusHistory] = await Promise.all([
      this.listOrderItemsByOrderIds(companyId, [orderRow.id]),
      this.listOrderStatusHistory(companyId, orderRow.id)
    ]);

    return {
      ...mapOrder(orderRow, items.get(orderRow.id) ?? []),
      statusHistory
    };
  }

  async createOrder(
    companyId: string,
    actorUserId: string | null,
    input: CreateFoodOrderInput,
    options: CreateOrderOptions = { eventSource: "internal-order-v0" }
  ): Promise<FoodOrderContract> {
    const store = await this.getStore(companyId);
    const normalized = await this.normalizeCreateOrderInput(companyId, input);
    const subtotalCents = normalized.items.reduce((sum, item) => sum + item.totalPriceCents, 0);
    const orderNumber = buildOrderNumber();
    const { data: orderData, error: orderError } = await this.supabase.food
      .from("orders")
      .insert({
        company_id: companyId,
        created_by: actorUserId,
        customer_name: normalized.customerName,
        customer_note: normalized.customerNote,
        customer_phone: normalized.customerPhone,
        order_number: orderNumber,
        status: "created",
        store_id: store.id,
        subtotal_cents: subtotalCents,
        total_cents: subtotalCents,
        updated_by: actorUserId
      })
      .select(orderSelect)
      .single();

    if (orderError) {
      throwSupabaseError(orderError);
    }

    const orderRow = orderData as unknown as FoodOrderRow;
    const { data: itemData, error: itemError } = await this.supabase.food
      .from("order_items")
      .insert(
        normalized.items.map((item) => ({
          company_id: companyId,
          order_id: orderRow.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          total_price_cents: item.totalPriceCents,
          unit_price_cents: item.unitPriceCents
        }))
      )
      .select(orderItemSelect);

    if (itemError) {
      throwSupabaseError(itemError);
    }

    const order = mapOrder(
      orderRow,
      ((itemData ?? []) as unknown as FoodOrderItemRow[]).map(mapOrderItem)
    );
    await this.insertOrderStatusHistory(companyId, order.id, null, order.status, actorUserId);
    await this.emitOrderCreated(companyId, actorUserId, order, options.eventSource);

    return order;
  }

  async updateOrderStatus(
    companyId: string,
    actorUserId: string,
    orderId: string,
    input: UpdateFoodOrderStatusInput
  ): Promise<FoodOrderContract> {
    const status = normalizeOrderStatus(input.status);
    const current = await this.getOrderRow(companyId, orderId);

    if (current.status === status) {
      const items = await this.listOrderItemsByOrderIds(companyId, [current.id]);
      return mapOrder(current, items.get(current.id) ?? []);
    }

    const { data, error } = await this.supabase.food
      .from("orders")
      .update({
        status,
        updated_by: actorUserId
      })
      .eq("id", orderId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .select(orderSelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const orderRow = data as unknown as FoodOrderRow;
    const items = await this.listOrderItemsByOrderIds(companyId, [orderRow.id]);
    const order = mapOrder(orderRow, items.get(orderRow.id) ?? []);

    await this.insertOrderStatusHistory(companyId, order.id, current.status, order.status, actorUserId);
    await this.emitOrderStatusChanged(companyId, actorUserId, order, current.status);

    return order;
  }

  async updateOrderPayment(
    companyId: string,
    actorUserId: string,
    orderId: string,
    input: UpdateFoodOrderPaymentInput
  ): Promise<FoodOrderContract> {
    const normalized = normalizePaymentInput(input);
    const current = await this.getOrderRow(companyId, orderId);
    const paidAt =
      normalized.paymentStatus === "paid"
        ? current.paid_at ?? new Date().toISOString()
        : null;
    const paidBy = normalized.paymentStatus === "paid" ? current.paid_by ?? actorUserId : null;

    const { data, error } = await this.supabase.food
      .from("orders")
      .update({
        paid_at: paidAt,
        paid_by: paidBy,
        payment_method: normalized.paymentMethod,
        payment_note: normalized.paymentNote,
        payment_status: normalized.paymentStatus,
        updated_by: actorUserId
      })
      .eq("id", orderId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .select(orderSelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const orderRow = data as unknown as FoodOrderRow;
    const items = await this.listOrderItemsByOrderIds(companyId, [orderRow.id]);
    const order = mapOrder(orderRow, items.get(orderRow.id) ?? []);

    if (current.payment_status !== "paid" && order.paymentStatus === "paid") {
      await this.emitPaymentMarkedAsPaid(companyId, actorUserId, order);
    }

    return order;
  }

  private async getPublicCheckoutForCompany(
    companyId: string
  ): Promise<FoodPublicCheckoutContract> {
    const disabled: FoodPublicCheckoutContract = {
      mercadoPago: {
        enabled: false,
        mode: null,
        publicKey: null
      }
    };
    const { data: provider, error: providerError } = await this.supabase.gateway
      .from("provider_catalog")
      .select("id")
      .eq("key", "mercado_pago")
      .is("deleted_at", null)
      .maybeSingle();

    if (providerError) {
      throwSupabaseError(providerError);
    }

    if (!provider) {
      return disabled;
    }

    const { data: config, error: configError } = await this.supabase.gateway
      .from("company_provider_configs")
      .select("status,public_config,secret_config")
      .eq("company_id", companyId)
      .eq("provider_id", (provider as { id: string }).id)
      .is("deleted_at", null)
      .maybeSingle();

    if (configError) {
      throwSupabaseError(configError);
    }

    if (!config) {
      return disabled;
    }

    const mercadoPagoConfig = config as unknown as MercadoPagoCompanyConfigRow;
    const publicKey = mercadoPagoConfig.secret_config?.publicKey?.trim() ?? null;
    const mode = mercadoPagoConfig.public_config?.mode ?? null;
    const enabled =
      Boolean(publicKey) &&
      (mercadoPagoConfig.status === "active" || mercadoPagoConfig.status === "configured");

    return {
      mercadoPago: {
        enabled,
        mode,
        publicKey: enabled ? publicKey : null
      }
    };
  }

  private async markOrderPaymentFromGateway(
    companyId: string,
    orderId: string,
    paymentMethod: FoodPaymentMethod,
    paymentNote: string
  ): Promise<FoodOrderContract> {
    const current = await this.getOrderRow(companyId, orderId);

    if (current.payment_status === "paid") {
      const items = await this.listOrderItemsByOrderIds(companyId, [current.id]);
      return mapOrder(current, items.get(current.id) ?? []);
    }

    const { data, error } = await this.supabase.food
      .from("orders")
      .update({
        paid_at: new Date().toISOString(),
        paid_by: null,
        payment_method: paymentMethod,
        payment_note: paymentNote,
        payment_status: "paid",
        updated_by: null
      })
      .eq("id", orderId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .select(orderSelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const orderRow = data as unknown as FoodOrderRow;
    const items = await this.listOrderItemsByOrderIds(companyId, [orderRow.id]);
    const order = mapOrder(orderRow, items.get(orderRow.id) ?? []);
    await this.emitPaymentMarkedAsPaid(companyId, null, order);

    return order;
  }

  private async findStore(companyId: string): Promise<FoodStoreRow | null> {
    const { data, error } = await this.supabase.food
      .from("stores")
      .select(storeSelect)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    return (data as unknown as FoodStoreRow | null) ?? null;
  }

  private async listStoreHoursByStore(
    companyId: string,
    storeId: string
  ): Promise<FoodStoreHourContract[]> {
    const { data, error } = await this.supabase.food
      .from("store_hours")
      .select(storeHourSelect)
      .eq("company_id", companyId)
      .eq("store_id", storeId)
      .is("deleted_at", null)
      .order("kind", { ascending: false })
      .order("weekday", { ascending: true })
      .order("opens_at", { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as unknown as FoodStoreHourRow[]).map(mapStoreHour);
  }

  private async getStoreByPublicSlug(publicSlug: string): Promise<FoodStoreRow> {
    const slug = normalizeSlug(publicSlug);
    const { data, error } = await this.supabase.food
      .from("stores")
      .select(storeSelect)
      .eq("public_slug", slug)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("Loja Food publica nao encontrada");
    }

    return data as unknown as FoodStoreRow;
  }

  private async ensurePublicStoreAvailable(store: FoodStoreRow): Promise<void> {
    await this.ensurePublicStoreReadable(store);

    if (store.status !== "open") {
      throw new ForbiddenException("Loja Food publica nao esta aberta");
    }
  }

  private async ensureOrderingOpen(store: FoodStoreRow): Promise<void> {
    const hours = await this.listStoreHoursByStore(store.company_id, store.id);
    const availability = calculateStoreAvailability(hours);

    if (!availability.isOrderingOpen) {
      throw new BadRequestException(availability.message);
    }
  }

  private async ensurePublicStoreReadable(store: FoodStoreRow): Promise<void> {
    if (store.status === "suspended") {
      throw new ForbiddenException("Loja Food publica esta suspensa");
    }

    const { data: company, error: companyError } = await this.supabase.core
      .from("companies")
      .select("id,status")
      .eq("id", store.company_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (companyError) {
      throwSupabaseError(companyError);
    }

    if (!company || company.status !== "active") {
      throw new ForbiddenException("Empresa da loja Food nao esta ativa");
    }

    const { data: hasModule, error: moduleError } = await this.supabase.core.rpc(
      "company_has_module",
      {
        target_application_key: "food",
        target_company_id: store.company_id
      }
    );

    if (moduleError || hasModule !== true) {
      throw new ForbiddenException("Empresa nao possui FP Food liberado");
    }
  }

  private async getPublicOrderFromStore(
    store: FoodStoreRow,
    orderNumber: string
  ): Promise<FoodOrderContract> {
    const normalizedOrderNumber = normalizeRequiredText(orderNumber, "orderNumber", 40);
    const { data, error } = await this.supabase.food
      .from("orders")
      .select(orderSelect)
      .eq("company_id", store.company_id)
      .eq("store_id", store.id)
      .eq("order_number", normalizedOrderNumber)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("Pedido publico Food nao encontrado");
    }

    const orderRow = data as unknown as FoodOrderRow;
    const items = await this.listOrderItemsByOrderIds(store.company_id, [orderRow.id]);
    return mapOrder(orderRow, items.get(orderRow.id) ?? []);
  }

  private async listAllCategories(companyId: string): Promise<FoodCategoryContract[]> {
    const { data, error } = await this.supabase.food
      .from("categories")
      .select(categorySelect)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as unknown as FoodCategoryRow[]).map(mapCategory);
  }

  private async listAllProducts(companyId: string): Promise<FoodProductContract[]> {
    const { data, error } = await this.supabase.food
      .from("products")
      .select(productSelect)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as unknown as FoodProductRow[]).map(mapProduct);
  }

  private async listDashboardOrders(
    companyId: string,
    options: {
      periodEnd?: Date;
      periodStart?: Date;
      statuses?: FoodOrderStatus[];
    }
  ): Promise<FoodDashboardOrderRow[]> {
    let query = this.supabase.food
      .from("orders")
      .select("id,status,payment_status,total_cents,created_at")
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (options.periodStart) {
      query = query.gte("created_at", options.periodStart.toISOString());
    }

    if (options.periodEnd) {
      query = query.lt("created_at", options.periodEnd.toISOString());
    }

    if (options.statuses?.length) {
      query = query.in("status", options.statuses);
    }

    const { data, error } = await query;

    if (error) {
      throwSupabaseError(error);
    }

    return (data ?? []) as unknown as FoodDashboardOrderRow[];
  }

  private async normalizeProductInput(companyId: string, input: UpsertFoodProductInput) {
    const categoryId = normalizeOptionalText(input.categoryId, "categoryId", 80);

    if (categoryId) {
      await this.ensureCategoryExists(companyId, categoryId);
    }

    const name = normalizeRequiredText(input.name, "name", 140);

    return {
      categoryId,
      description: normalizeOptionalText(input.description, "description", 800),
      imageUrl: normalizeOptionalUrl(input.imageUrl, "imageUrl", 500),
      name,
      priceCents: normalizePriceCents(input.priceCents),
      slug: normalizeOptionalSlug(input.slug, name),
      sortOrder: normalizeSortOrder(input.sortOrder),
      status: normalizeProductStatus(input.status)
    };
  }

  private async ensureCategoryExists(companyId: string, categoryId: string): Promise<void> {
    const { data, error } = await this.supabase.food
      .from("categories")
      .select("id")
      .eq("company_id", companyId)
      .eq("id", categoryId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new BadRequestException("Categoria Food nao encontrada");
    }
  }

  private async normalizeCreateOrderInput(companyId: string, input: CreateFoodOrderInput) {
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestException("Pedido precisa ter ao menos um item");
    }

    if (input.items.length > 50) {
      throw new BadRequestException("Pedido excede 50 itens");
    }

    const normalizedItems = input.items.map((item) => ({
      productId: normalizeRequiredText(item.productId, "productId", 80),
      quantity: normalizeQuantity(item.quantity)
    }));
    const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
    const productsById = await this.listProductsByIds(companyId, productIds);

    return {
      customerName: normalizeOptionalText(input.customerName, "customerName", 120),
      customerNote: normalizeOptionalText(input.customerNote, "customerNote", 600),
      customerPhone: normalizeOptionalText(input.customerPhone, "customerPhone", 40),
      items: normalizedItems.map((item) => {
        const product = productsById.get(item.productId);

        if (!product) {
          throw new BadRequestException("Produto do pedido nao encontrado");
        }

        if (product.status !== "available") {
          throw new BadRequestException(`Produto indisponivel: ${product.name}`);
        }

        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          totalPriceCents: product.priceCents * item.quantity,
          unitPriceCents: product.priceCents
        };
      })
    };
  }

  private async listProductsByIds(
    companyId: string,
    productIds: string[]
  ): Promise<Map<string, FoodProductContract>> {
    const { data, error } = await this.supabase.food
      .from("products")
      .select(productSelect)
      .eq("company_id", companyId)
      .in("id", productIds)
      .is("deleted_at", null);

    if (error) {
      throwSupabaseError(error);
    }

    return new Map(
      ((data ?? []) as unknown as FoodProductRow[]).map((row) => {
        const product = mapProduct(row);
        return [product.id, product];
      })
    );
  }

  private async getOrderRow(companyId: string, orderId: string): Promise<FoodOrderRow> {
    const { data, error } = await this.supabase.food
      .from("orders")
      .select(orderSelect)
      .eq("company_id", companyId)
      .eq("id", orderId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("Pedido Food nao encontrado");
    }

    return data as unknown as FoodOrderRow;
  }

  private async listOrderStatusHistory(
    companyId: string,
    orderId: string
  ): Promise<FoodOrderStatusHistoryContract[]> {
    const { data, error } = await this.supabase.food
      .from("order_status_history")
      .select(orderStatusHistorySelect)
      .eq("company_id", companyId)
      .eq("order_id", orderId)
      .order("changed_at", { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as unknown as FoodOrderStatusHistoryRow[]).map(mapOrderStatusHistory);
  }

  private async insertOrderStatusHistory(
    companyId: string,
    orderId: string,
    previousStatus: FoodOrderStatus | null,
    status: FoodOrderStatus,
    actorUserId: string | null
  ): Promise<void> {
    const { error } = await this.supabase.food
      .from("order_status_history")
      .insert({
        actor_user_id: actorUserId,
        company_id: companyId,
        order_id: orderId,
        previous_status: previousStatus,
        status
      });

    if (error) {
      throwSupabaseError(error);
    }
  }

  private async listOrderItemsByOrderIds(
    companyId: string,
    orderIds: string[]
  ): Promise<Map<string, FoodOrderItemContract[]>> {
    if (orderIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabase.food
      .from("order_items")
      .select(orderItemSelect)
      .eq("company_id", companyId)
      .in("order_id", orderIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    const grouped = new Map<string, FoodOrderItemContract[]>();

    for (const row of (data ?? []) as unknown as FoodOrderItemRow[]) {
      const item = mapOrderItem(row);
      const items = grouped.get(item.orderId) ?? [];
      items.push(item);
      grouped.set(item.orderId, items);
    }

    return grouped;
  }

  private async emitStoreConfigured(
    companyId: string,
    actorUserId: string,
    store: FoodStoreContract
  ): Promise<void> {
    await this.robots.createEvent(companyId, actorUserId, {
      eventCode: "food.store.configured",
      idempotencyKey: `food-store-configured:${store.id}:${Date.now()}`,
      originMetadata: {
        generatedBy: "fp-food",
        source: "store-foundation"
      },
      payload: {
        displayName: store.displayName,
        publicSlug: store.publicSlug,
        status: store.status
      },
      sourceApplicationKey: "food",
      sourceEventId: store.id
    });
  }

  private async emitStoreHoursUpdated(
    companyId: string,
    actorUserId: string,
    store: FoodStoreRow,
    hours: FoodStoreHourContract[]
  ): Promise<void> {
    await this.robots.createEvent(companyId, actorUserId, {
      eventCode: "food.store.hours.updated",
      idempotencyKey: `food-store-hours-updated:${store.id}:${Date.now()}`,
      originMetadata: {
        generatedBy: "fp-food",
        source: "store-hours-v0"
      },
      payload: {
        deliveryWindows: hours.filter((hour) => hour.kind === "delivery" && hour.isActive).length,
        orderingWindows: hours.filter((hour) => hour.kind === "ordering" && hour.isActive).length,
        storeId: store.id
      },
      sourceApplicationKey: "food",
      sourceEventId: store.id
    });
  }

  private async emitMenuUpdated(
    companyId: string,
    actorUserId: string,
    entityType: "category" | "product",
    entityId: string
  ): Promise<void> {
    await this.robots.createEvent(companyId, actorUserId, {
      eventCode: "food.menu.updated",
      idempotencyKey: `food-menu-updated:${entityType}:${entityId}:${Date.now()}`,
      originMetadata: {
        entityId,
        entityType,
        generatedBy: "fp-food"
      },
      payload: {
        entityId,
        entityType
      },
      sourceApplicationKey: "food",
      sourceEventId: entityId
    });
  }

  private async emitOrderCreated(
    companyId: string,
    actorUserId: string | null,
    order: FoodOrderContract,
    source: "internal-order-v0" | "public-store-v0"
  ): Promise<void> {
    await this.robots.createEvent(companyId, actorUserId, {
      eventCode: "food.order.created",
      idempotencyKey: `food-order-created:${order.id}`,
      originMetadata: {
        generatedBy: "fp-food",
        source
      },
      payload: {
        itemCount: order.items.length,
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalCents: order.totalCents
      },
      sourceApplicationKey: "food",
      sourceEventId: order.id
    });
  }

  private async emitOrderStatusChanged(
    companyId: string,
    actorUserId: string,
    order: FoodOrderContract,
    previousStatus: FoodOrderStatus
  ): Promise<void> {
    await this.robots.createEvent(companyId, actorUserId, {
      eventCode: "food.order.status_changed",
      idempotencyKey: `food-order-status:${order.id}:${previousStatus}:${order.status}:${Date.now()}`,
      originMetadata: {
        generatedBy: "fp-food",
        source: "internal-order-v0"
      },
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        previousStatus,
        status: order.status
      },
      sourceApplicationKey: "food",
      sourceEventId: order.id
    });
  }

  private async emitPaymentMarkedAsPaid(
    companyId: string,
    actorUserId: string | null,
    order: FoodOrderContract
  ): Promise<void> {
    await this.robots.createEvent(companyId, actorUserId, {
      eventCode: "food.payment.marked_as_paid",
      idempotencyKey: `food-payment-paid:${order.id}:${order.paidAt ?? Date.now()}`,
      originMetadata: {
        generatedBy: "fp-food",
        source: "manual-payment-v0"
      },
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalCents: order.totalCents
      },
      sourceApplicationKey: "food",
      sourceEventId: order.id
    });
  }
}

function normalizeStoreInput(input: UpsertFoodStoreInput) {
  const displayName = normalizeRequiredText(input.displayName, "displayName", 120);
  const publicSlug = normalizeSlug(input.publicSlug);
  const status = normalizeStatus(input.status);

  return {
    contactPhone: normalizeOptionalText(input.contactPhone, "contactPhone", 40),
    deliveryNotes: normalizeOptionalText(input.deliveryNotes, "deliveryNotes", 600),
    displayName,
    preparationTimeMinutes: normalizePreparationTime(input.preparationTimeMinutes),
    publicSlug,
    status
  };
}

function normalizeStoreHoursInput(input: UpsertFoodStoreHoursInput) {
  if (!input || !Array.isArray(input.hours)) {
    throw new BadRequestException("hours deve ser uma lista");
  }

  return input.hours
    .map((hour) => ({
      closesAt: normalizeStoreHourTime(hour.closesAt, "closesAt"),
      isActive: hour.isActive !== false,
      kind: normalizeStoreHourKind(hour.kind),
      opensAt: normalizeStoreHourTime(hour.opensAt, "opensAt"),
      weekday: normalizeWeekday(hour.weekday)
    }))
    .filter((hour) => hour.isActive)
    .map((hour) => {
      if (hour.opensAt === hour.closesAt) {
        throw new BadRequestException("opensAt e closesAt nao podem ser iguais");
      }

      return hour;
    });
}

function normalizeStoreHourKind(value: unknown): FoodStoreHourKind {
  if (typeof value !== "string" || !validStoreHourKinds.has(value as FoodStoreHourKind)) {
    throw new BadRequestException("kind do horario Food invalido");
  }

  return value as FoodStoreHourKind;
}

function normalizeWeekday(value: unknown): number {
  const parsed = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
    throw new BadRequestException("weekday deve estar entre 0 e 6");
  }

  return parsed;
}

function normalizeStoreHourTime(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) {
    throw new BadRequestException(`${field} deve estar no formato HH:mm`);
  }

  const [hour, minute] = value.split(":").map(Number);

  if (hour > 23 || minute > 59) {
    throw new BadRequestException(`${field} deve ser um horario valido`);
  }

  return `${value}:00`;
}

function normalizeCategoryInput(input: UpsertFoodCategoryInput) {
  const name = normalizeRequiredText(input.name, "name", 120);

  return {
    description: normalizeOptionalText(input.description, "description", 500),
    name,
    slug: normalizeOptionalSlug(input.slug, name),
    sortOrder: normalizeSortOrder(input.sortOrder),
    status: normalizeCategoryStatus(input.status)
  };
}

function normalizeRequiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new BadRequestException(`${field} e obrigatorio`);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new BadRequestException(`${field} e obrigatorio`);
  }

  if (normalized.length > maxLength) {
    throw new BadRequestException(`${field} excede ${maxLength} caracteres`);
  }

  return normalized;
}

function normalizePublicCheckoutPayment(
  value: CreatePublicFoodCheckoutInput["payment"]
): PublicCheckoutPaymentInput | null {
  if (!value) {
    return null;
  }

  const cardToken = normalizeRequiredText(value.cardToken, "payment.cardToken", 300);
  const customerEmail = normalizeEmail(value.customerEmail, "payment.customerEmail");
  const installments = normalizeInstallments(value.installments);
  const paymentMethodId = normalizeRequiredText(
    value.paymentMethodId,
    "payment.paymentMethodId",
    80
  );

  if (value.paymentMethodType !== "credit_card" && value.paymentMethodType !== "debit_card") {
    throw new BadRequestException("payment.paymentMethodType deve ser credit_card ou debit_card");
  }

  return {
    cardToken,
    customerEmail,
    installments,
    paymentMethodId,
    paymentMethodType: value.paymentMethodType
  };
}

function normalizeEmail(value: unknown, field: string): string {
  const normalized = normalizeRequiredText(value, field, 180).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new BadRequestException(`${field} invalido`);
  }

  return normalized;
}

function normalizeInstallments(value: unknown): number {
  const numberValue = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;

  if (!Number.isInteger(numberValue) || numberValue < 1 || numberValue > 24) {
    throw new BadRequestException("payment.installments deve estar entre 1 e 24");
  }

  return numberValue;
}

function normalizeOptionalText(
  value: unknown,
  field: string,
  maxLength: number
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new BadRequestException(`${field} deve ser texto`);
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw new BadRequestException(`${field} excede ${maxLength} caracteres`);
  }

  return normalized;
}

function normalizeSlug(value: unknown): string {
  const normalized = normalizeRequiredText(value, "publicSlug", 80).toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new BadRequestException("publicSlug deve conter letras minusculas, numeros e hifens");
  }

  return normalized;
}

function normalizeOptionalSlug(value: unknown, fallback: string): string {
  if (value === undefined || value === null || value === "") {
    return slugify(fallback);
  }

  return normalizeSlug(value);
}

function slugify(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  if (!slug) {
    throw new BadRequestException("slug nao pode ser gerado automaticamente");
  }

  return slug;
}

function normalizeStatus(value: unknown): FoodStoreStatus {
  if (typeof value !== "string" || !validStatuses.has(value as FoodStoreStatus)) {
    throw new BadRequestException("status da loja Food invalido");
  }

  return value as FoodStoreStatus;
}

function normalizeCategoryStatus(value: unknown): FoodCategoryStatus {
  if (typeof value !== "string" || !validCategoryStatuses.has(value as FoodCategoryStatus)) {
    throw new BadRequestException("status da categoria Food invalido");
  }

  return value as FoodCategoryStatus;
}

function normalizeProductStatus(value: unknown): FoodProductStatus {
  if (typeof value !== "string" || !validProductStatuses.has(value as FoodProductStatus)) {
    throw new BadRequestException("status do produto Food invalido");
  }

  return value as FoodProductStatus;
}

function normalizeOrderStatus(value: unknown): FoodOrderStatus {
  if (typeof value !== "string" || !validOrderStatuses.has(value as FoodOrderStatus)) {
    throw new BadRequestException("status do pedido Food invalido");
  }

  return value as FoodOrderStatus;
}

function normalizePaymentInput(input: UpdateFoodOrderPaymentInput): {
  paymentMethod: FoodPaymentMethod | null;
  paymentNote: string | null;
  paymentStatus: FoodPaymentStatus;
} {
  const paymentStatus = normalizePaymentStatus(input.paymentStatus);
  const paymentMethod = normalizeOptionalPaymentMethod(input.paymentMethod);
  const paymentNote = normalizeOptionalText(input.paymentNote, "paymentNote", 600);

  if (paymentStatus === "paid" && !paymentMethod) {
    throw new BadRequestException("paymentMethod e obrigatorio para pagamento pago");
  }

  return {
    paymentMethod,
    paymentNote,
    paymentStatus
  };
}

function normalizePaymentStatus(value: unknown): FoodPaymentStatus {
  if (typeof value !== "string" || !validPaymentStatuses.has(value as FoodPaymentStatus)) {
    throw new BadRequestException("status do pagamento Food invalido");
  }

  return value as FoodPaymentStatus;
}

function normalizeOptionalPaymentMethod(value: unknown): FoodPaymentMethod | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || !validPaymentMethods.has(value as FoodPaymentMethod)) {
    throw new BadRequestException("forma de pagamento Food invalida");
  }

  return value as FoodPaymentMethod;
}

function getCurrentDayPeriod(): { periodEnd: Date; periodStart: Date } {
  const periodStart = new Date();
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodEnd.getDate() + 1);

  return {
    periodEnd,
    periodStart
  };
}

function calculateStoreAvailability(hours: FoodStoreHourContract[]): FoodMenuContract["availability"] {
  const checkedAt = new Date().toISOString();
  const orderingHours = hours.filter((hour) => hour.kind === "ordering" && hour.isActive);
  const deliveryHours = hours.filter((hour) => hour.kind === "delivery" && hour.isActive);
  const localNow = getLocalStoreTime();
  const isOrderingOpen =
    orderingHours.length === 0 || isWithinAnyStoreHour(orderingHours, localNow);
  const isDeliveryOpen =
    deliveryHours.length === 0 || isWithinAnyStoreHour(deliveryHours, localNow);

  return {
    checkedAt,
    isDeliveryOpen,
    isOrderingOpen,
    message: isOrderingOpen
      ? "Loja aberta para pedidos."
      : "Pedidos fora do horario de atendimento da loja."
  };
}

function getLocalStoreTime(): { minutes: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: saoPauloTimeZone,
    weekday: "short"
  }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const weekdayLabel = values.get("weekday") ?? "Sun";
  const hour = Number(values.get("hour") ?? 0);
  const minute = Number(values.get("minute") ?? 0);

  return {
    minutes: hour * 60 + minute,
    weekday: weekdayLabelToNumber(weekdayLabel)
  };
}

function isWithinAnyStoreHour(
  hours: FoodStoreHourContract[],
  localNow: { minutes: number; weekday: number }
): boolean {
  return hours.some((hour) => {
    const opensAt = timeToMinutes(hour.opensAt);
    const closesAt = timeToMinutes(hour.closesAt);

    if (opensAt < closesAt) {
      return hour.weekday === localNow.weekday
        && localNow.minutes >= opensAt
        && localNow.minutes < closesAt;
    }

    return (
      (hour.weekday === localNow.weekday && localNow.minutes >= opensAt) ||
      (nextWeekday(hour.weekday) === localNow.weekday && localNow.minutes < closesAt)
    );
  });
}

function timeToMinutes(value: string): number {
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  return hour * 60 + minute;
}

function nextWeekday(weekday: number): number {
  return weekday === 6 ? 0 : weekday + 1;
}

function weekdayLabelToNumber(value: string): number {
  const normalized = value.toLowerCase();

  if (normalized.startsWith("mon")) return 1;
  if (normalized.startsWith("tue")) return 2;
  if (normalized.startsWith("wed")) return 3;
  if (normalized.startsWith("thu")) return 4;
  if (normalized.startsWith("fri")) return 5;
  if (normalized.startsWith("sat")) return 6;

  return 0;
}

function createOrderStatusCount(): Record<FoodOrderStatus, number> {
  return {
    accepted: 0,
    cancelled: 0,
    created: 0,
    delivered: 0,
    out_for_delivery: 0,
    preparing: 0,
    ready: 0
  };
}

function createPaymentStatusCount(): Record<FoodPaymentStatus, number> {
  return {
    cancelled: 0,
    paid: 0,
    pending: 0
  };
}

function normalizePreparationTime(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 600) {
    throw new BadRequestException("preparationTimeMinutes deve estar entre 0 e 600");
  }

  return parsed;
}

function normalizeSortOrder(value: unknown): number {
  if (value === undefined || value === null || value === "") {
    return 100;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100000) {
    throw new BadRequestException("sortOrder deve estar entre 0 e 100000");
  }

  return parsed;
}

function normalizePriceCents(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100000000) {
    throw new BadRequestException("priceCents deve ser inteiro positivo em centavos");
  }

  return parsed;
}

function normalizeQuantity(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99) {
    throw new BadRequestException("quantity deve estar entre 1 e 99");
  }

  return parsed;
}

function normalizeOptionalUrl(value: unknown, field: string, maxLength: number): string | null {
  const normalized = normalizeOptionalText(value, field, maxLength);

  if (!normalized) {
    return null;
  }

  try {
    new URL(normalized);
  } catch {
    throw new BadRequestException(`${field} deve ser uma URL valida`);
  }

  return normalized;
}

function mapStore(row: FoodStoreRow): FoodStoreContract {
  return {
    companyId: row.company_id,
    contactPhone: row.contact_phone,
    createdAt: row.created_at,
    deliveryNotes: row.delivery_notes,
    displayName: row.display_name,
    id: row.id,
    preparationTimeMinutes: row.preparation_time_minutes,
    publicSlug: row.public_slug,
    status: row.status,
    updatedAt: row.updated_at
  };
}

function mapStoreHour(row: FoodStoreHourRow): FoodStoreHourContract {
  return {
    closesAt: row.closes_at.slice(0, 5),
    companyId: row.company_id,
    createdAt: row.created_at,
    id: row.id,
    isActive: row.is_active,
    kind: row.kind,
    opensAt: row.opens_at.slice(0, 5),
    storeId: row.store_id,
    updatedAt: row.updated_at,
    weekday: row.weekday
  };
}

function mapCategory(row: FoodCategoryRow): FoodCategoryContract {
  return {
    companyId: row.company_id,
    createdAt: row.created_at,
    description: row.description,
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sort_order,
    status: row.status,
    storeId: row.store_id,
    updatedAt: row.updated_at
  };
}

function mapProduct(row: FoodProductRow): FoodProductContract {
  return {
    categoryId: row.category_id,
    companyId: row.company_id,
    createdAt: row.created_at,
    description: row.description,
    id: row.id,
    imageUrl: row.image_url,
    name: row.name,
    priceCents: row.price_cents,
    slug: row.slug,
    sortOrder: row.sort_order,
    status: row.status,
    storeId: row.store_id,
    updatedAt: row.updated_at
  };
}

function mapOrder(row: FoodOrderRow, items: FoodOrderItemContract[]): FoodOrderContract {
  return {
    companyId: row.company_id,
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerNote: row.customer_note,
    customerPhone: row.customer_phone,
    id: row.id,
    items,
    orderNumber: row.order_number,
    paidAt: row.paid_at,
    paidBy: row.paid_by,
    paymentMethod: row.payment_method,
    paymentNote: row.payment_note,
    paymentStatus: row.payment_status,
    status: row.status,
    storeId: row.store_id,
    subtotalCents: row.subtotal_cents,
    totalCents: row.total_cents,
    updatedAt: row.updated_at
  };
}

function mapOrderItem(row: FoodOrderItemRow): FoodOrderItemContract {
  return {
    companyId: row.company_id,
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    totalPriceCents: row.total_price_cents,
    unitPriceCents: row.unit_price_cents
  };
}

function mapOrderStatusHistory(row: FoodOrderStatusHistoryRow): FoodOrderStatusHistoryContract {
  return {
    actorUserId: row.actor_user_id,
    changedAt: row.changed_at,
    companyId: row.company_id,
    id: row.id,
    orderId: row.order_id,
    previousStatus: row.previous_status,
    status: row.status
  };
}

function toPaginated<T>(
  items: T[],
  pagination: PaginationOptions,
  total: number
): PaginatedContract<T> {
  return {
    items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize))
  };
}

function buildOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = `${now.getTime()}`.slice(-6);

  return `PED-${date}-${suffix}`;
}

function throwSupabaseError(error: { message?: string }): never {
  throw new BadRequestException(error.message ?? "Erro ao consultar FP Food");
}
