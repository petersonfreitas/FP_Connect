import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { RobotsService } from "../robots/robots.service";
import { SupabaseService } from "../../supabase/supabase.service";
import type { FoodStoreContract, FoodStoreStatus, UpsertFoodStoreInput } from "./food.contracts";

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

const validStatuses = new Set<FoodStoreStatus>([
  "closed",
  "implementation",
  "open",
  "suspended"
]);

@Injectable()
export class FoodService {
  constructor(
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

function normalizeStatus(value: unknown): FoodStoreStatus {
  if (typeof value !== "string" || !validStatuses.has(value as FoodStoreStatus)) {
    throw new BadRequestException("status da loja Food invalido");
  }

  return value as FoodStoreStatus;
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

function throwSupabaseError(error: { message?: string }): never {
  throw new BadRequestException(error.message ?? "Erro ao consultar FP Food");
}
