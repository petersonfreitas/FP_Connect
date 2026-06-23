import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { SupabaseService } from "../../supabase/supabase.service";
import type {
  CreateRobotsEventContract,
  CreateRobotsEventInput,
  ReprocessRobotsExecutionContract,
  RobotsActionStatus,
  RobotsActionType,
  RobotsCatalogStatus,
  RobotsExecutionContract,
  RobotsExecutionStatus,
  RobotsEventCatalogContract,
  RobotsEventContract,
  RobotsEventStatus,
  RobotsRuleActionContract,
  RobotsRuleContract,
  RobotsRuleStatus
} from "./robots.contracts";

type RobotCatalogRow = {
  code: string;
  description: string | null;
  id: string;
  name: string;
  source_application_key: string;
  status: RobotsCatalogStatus;
  version: number;
};

type RobotEventRow = {
  accepted_at: string;
  catalog_event_id: string;
  company_id: string;
  created_at: string;
  created_by: string | null;
  event_code: string;
  id: string;
  idempotency_key: string | null;
  occurred_at: string;
  origin_metadata: Record<string, unknown>;
  payload_masked: Record<string, unknown>;
  source_application_key: string;
  source_event_id: string | null;
  status: RobotsEventStatus;
};

type RobotRuleRow = {
  company_id: string;
  description: string | null;
  event_catalog_id: string;
  event_code: string;
  id: string;
  name: string;
  status: RobotsRuleStatus;
};

type RobotRuleActionRow = {
  action_config: Record<string, unknown>;
  action_type: RobotsActionType;
  company_id: string;
  id: string;
  name: string;
  rule_id: string;
  sort_order: number;
  status: RobotsActionStatus;
};

type RobotExecutionRow = {
  action_type: RobotsActionType;
  attempt_count: number;
  company_id: string;
  created_at: string;
  event_id: string;
  id: string;
  last_error: string | null;
  max_attempts: number;
  next_attempt_at: string | null;
  request_payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  rule_action_id: string | null;
  rule_id: string | null;
  status: RobotsExecutionStatus;
  updated_at: string;
};

const maxEventCodeLength = 160;
const maxSourceKeyLength = 80;
const maxIdempotencyLength = 160;
const sensitiveKeys = new Set([
  "access_token",
  "authorization",
  "card",
  "document",
  "email",
  "password",
  "phone",
  "refresh_token",
  "secret",
  "token"
]);

@Injectable()
export class RobotsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listCatalog(): Promise<RobotsEventCatalogContract[]> {
    const { data, error } = await this.supabase.robots
      .from("event_catalog")
      .select("id,code,source_application_key,name,description,version,status")
      .is("deleted_at", null)
      .order("source_application_key", { ascending: true })
      .order("code", { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as RobotCatalogRow[]).map(mapCatalog);
  }

  async listEvents(companyId: string): Promise<RobotsEventContract[]> {
    const { data, error } = await this.supabase.robots
      .from("events")
      .select(eventSelect)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as unknown as RobotEventRow[]).map(mapEvent);
  }

  async getEvent(companyId: string, eventId: string): Promise<RobotsEventContract> {
    const { data, error } = await this.supabase.robots
      .from("events")
      .select(eventSelect)
      .eq("company_id", companyId)
      .eq("id", eventId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    const row = data as unknown as RobotEventRow | null;

    if (!row) {
      throw new NotFoundException("Evento do FP Robots nao encontrado");
    }

    return mapEvent(row);
  }

  async listRules(companyId: string): Promise<RobotsRuleContract[]> {
    const { data: rulesData, error: rulesError } = await this.supabase.robots
      .from("automation_rules")
      .select(ruleSelect)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (rulesError) {
      throwSupabaseError(rulesError);
    }

    const rules = (rulesData ?? []) as unknown as RobotRuleRow[];
    const actionsByRuleId = await this.listActionsByRuleIds(rules.map((rule) => rule.id));

    return rules.map((rule) => mapRule(rule, actionsByRuleId.get(rule.id) ?? []));
  }

  async listExecutions(companyId: string): Promise<RobotsExecutionContract[]> {
    const { data, error } = await this.supabase.robots
      .from("event_executions")
      .select(executionSelect)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as unknown as RobotExecutionRow[]).map(mapExecution);
  }

  async createEvent(
    companyId: string,
    actorUserId: string | null,
    input: CreateRobotsEventInput
  ): Promise<CreateRobotsEventContract> {
    const normalized = normalizeCreateEventInput(input);
    const catalog = await this.getActiveCatalogEvent(
      normalized.eventCode,
      normalized.sourceApplicationKey
    );
    const idempotencyKey =
      normalized.idempotencyKey ?? buildDefaultIdempotencyKey(normalized.sourceEventId);

    if (idempotencyKey) {
      const existing = await this.findByIdempotencyKey(
        companyId,
        normalized.sourceApplicationKey,
        idempotencyKey
      );

      if (existing) {
        return {
          duplicate: true,
          event: existing,
          executionsCreated: 0
        };
      }
    }

    const { data, error } = await this.supabase.robots
      .from("events")
      .insert({
        catalog_event_id: catalog.id,
        company_id: companyId,
        created_by: actorUserId,
        event_code: normalized.eventCode,
        idempotency_key: idempotencyKey,
        occurred_at: normalized.occurredAt ?? new Date().toISOString(),
        origin_metadata: normalized.originMetadata,
        payload: normalized.payload,
        payload_masked: maskPayload(normalized.payload),
        source_application_key: normalized.sourceApplicationKey,
        source_event_id: normalized.sourceEventId,
        status: "received"
      })
      .select(eventSelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const event = mapEvent(data as unknown as RobotEventRow);
    const executionsCreated = await this.createExecutionsForEvent(event, actorUserId);

    return {
      duplicate: false,
      event,
      executionsCreated
    };
  }

  async reprocessExecution(
    companyId: string,
    actorUserId: string,
    executionId: string
  ): Promise<ReprocessRobotsExecutionContract> {
    const execution = await this.getExecutionRow(companyId, executionId);

    if (execution.status !== "failed") {
      throw new BadRequestException("Apenas execucoes com falha podem ser reprocessadas");
    }

    if (execution.action_type !== "internal_log") {
      throw new BadRequestException("Reprocessamento atual suporta apenas internal_log");
    }

    const { data, error } = await this.supabase.robots
      .from("event_executions")
      .update({
        attempt_count: execution.attempt_count + 1,
        last_error: null,
        response_payload: {
          message: "Falha reprocessada pelo FP Robots.",
          reprocessedAt: new Date().toISOString(),
          reprocessedBy: actorUserId
        },
        status: "succeeded"
      })
      .eq("id", execution.id)
      .eq("company_id", companyId)
      .select(executionSelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    return {
      execution: mapExecution(data as unknown as RobotExecutionRow),
      reprocessed: true
    };
  }

  private async getActiveCatalogEvent(
    eventCode: string,
    sourceApplicationKey: string
  ): Promise<RobotCatalogRow> {
    const { data, error } = await this.supabase.robots
      .from("event_catalog")
      .select("id,code,source_application_key,name,description,version,status")
      .eq("code", eventCode)
      .eq("source_application_key", sourceApplicationKey)
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    const catalog = data as unknown as RobotCatalogRow | null;

    if (!catalog) {
      throw new BadRequestException("Evento nao esta ativo no catalogo do FP Robots");
    }

    return catalog;
  }

  private async findByIdempotencyKey(
    companyId: string,
    sourceApplicationKey: string,
    idempotencyKey: string
  ): Promise<RobotsEventContract | null> {
    const { data, error } = await this.supabase.robots
      .from("events")
      .select(eventSelect)
      .eq("company_id", companyId)
      .eq("source_application_key", sourceApplicationKey)
      .eq("idempotency_key", idempotencyKey)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    return data ? mapEvent(data as unknown as RobotEventRow) : null;
  }

  private async getExecutionRow(companyId: string, executionId: string): Promise<RobotExecutionRow> {
    const { data, error } = await this.supabase.robots
      .from("event_executions")
      .select(executionSelect)
      .eq("company_id", companyId)
      .eq("id", executionId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    const execution = data as unknown as RobotExecutionRow | null;

    if (!execution) {
      throw new NotFoundException("Execucao do FP Robots nao encontrada");
    }

    return execution;
  }

  private async createExecutionsForEvent(
    event: RobotsEventContract,
    actorUserId: string | null
  ): Promise<number> {
    const { data: rulesData, error: rulesError } = await this.supabase.robots
      .from("automation_rules")
      .select(ruleSelect)
      .eq("company_id", event.companyId)
      .eq("event_code", event.eventCode)
      .eq("status", "active")
      .is("deleted_at", null);

    if (rulesError) {
      throwSupabaseError(rulesError);
    }

    const rules = (rulesData ?? []) as unknown as RobotRuleRow[];
    const actionsByRuleId = await this.listActionsByRuleIds(rules.map((rule) => rule.id), true);
    const rows = rules.flatMap((rule) =>
      (actionsByRuleId.get(rule.id) ?? []).map((action) => {
        const isInternalLog = action.action_type === "internal_log";

        return {
          action_type: action.action_type,
          attempt_count: isInternalLog ? 1 : 0,
          company_id: event.companyId,
          created_by: actorUserId,
          event_id: event.id,
          last_error: null,
          max_attempts: 3,
          request_payload: {
            actionConfig: action.action_config,
            actionName: action.name,
            eventCode: event.eventCode,
            ruleName: rule.name
          },
          response_payload: isInternalLog ? { message: "Log interno registrado pelo FP Robots." } : {},
          rule_action_id: action.id,
          rule_id: rule.id,
          status: isInternalLog ? "succeeded" : "pending"
        };
      })
    );

    if (rows.length === 0) {
      return 0;
    }

    const { error } = await this.supabase.robots.from("event_executions").insert(rows);

    if (error) {
      throwSupabaseError(error);
    }

    return rows.length;
  }

  private async listActionsByRuleIds(
    ruleIds: string[],
    activeOnly = false
  ): Promise<Map<string, RobotRuleActionRow[]>> {
    if (ruleIds.length === 0) {
      return new Map();
    }

    let query = this.supabase.robots
      .from("automation_rule_actions")
      .select(actionSelect)
      .in("rule_id", ruleIds)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (activeOnly) {
      query = query.eq("status", "active");
    }

    const { data, error } = await query;

    if (error) {
      throwSupabaseError(error);
    }

    const grouped = new Map<string, RobotRuleActionRow[]>();

    for (const action of (data ?? []) as unknown as RobotRuleActionRow[]) {
      const actions = grouped.get(action.rule_id) ?? [];
      actions.push(action);
      grouped.set(action.rule_id, actions);
    }

    return grouped;
  }
}

const ruleSelect = [
  "id",
  "company_id",
  "event_catalog_id",
  "event_code",
  "name",
  "description",
  "status"
].join(",");

const actionSelect = [
  "id",
  "rule_id",
  "company_id",
  "action_type",
  "name",
  "action_config",
  "sort_order",
  "status"
].join(",");

const executionSelect = [
  "id",
  "event_id",
  "company_id",
  "rule_id",
  "rule_action_id",
  "action_type",
  "status",
  "attempt_count",
  "max_attempts",
  "next_attempt_at",
  "last_error",
  "request_payload",
  "response_payload",
  "created_at",
  "updated_at"
].join(",");

const eventSelect = [
  "id",
  "company_id",
  "catalog_event_id",
  "event_code",
  "source_application_key",
  "source_event_id",
  "idempotency_key",
  "status",
  "payload_masked",
  "origin_metadata",
  "occurred_at",
  "accepted_at",
  "created_at",
  "created_by"
].join(",");

function normalizeCreateEventInput(input: CreateRobotsEventInput) {
  const eventCode = normalizeRequiredText(input.eventCode, "eventCode", maxEventCodeLength);
  const sourceApplicationKey = normalizeRequiredText(
    input.sourceApplicationKey,
    "sourceApplicationKey",
    maxSourceKeyLength
  );
  const sourceEventId = normalizeOptionalText(input.sourceEventId, "sourceEventId", 160);
  const idempotencyKey = normalizeOptionalText(
    input.idempotencyKey,
    "idempotencyKey",
    maxIdempotencyLength
  );
  const occurredAt = normalizeOptionalDate(input.occurredAt, "occurredAt");

  return {
    eventCode,
    idempotencyKey,
    occurredAt,
    originMetadata: normalizeObject(input.originMetadata, "originMetadata"),
    payload: normalizeObject(input.payload, "payload"),
    sourceApplicationKey,
    sourceEventId
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

function normalizeOptionalDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new BadRequestException(`${field} deve ser uma data em texto`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} invalido`);
  }

  return date.toISOString();
}

function normalizeObject(value: unknown, field: string): Record<string, unknown> {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new BadRequestException(`${field} deve ser um objeto`);
  }

  return value as Record<string, unknown>;
}

function buildDefaultIdempotencyKey(sourceEventId: string | null): string | null {
  return sourceEventId ? `source:${sourceEventId}` : null;
}

function maskPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      sensitiveKeys.has(key.toLowerCase()) ? "[mascarado]" : value
    ])
  );
}

function mapCatalog(row: RobotCatalogRow): RobotsEventCatalogContract {
  return {
    code: row.code,
    description: row.description,
    id: row.id,
    name: row.name,
    sourceApplicationKey: row.source_application_key,
    status: row.status,
    version: row.version
  };
}

function mapEvent(row: RobotEventRow): RobotsEventContract {
  return {
    acceptedAt: row.accepted_at,
    catalogEventId: row.catalog_event_id,
    companyId: row.company_id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    eventCode: row.event_code,
    id: row.id,
    idempotencyKey: row.idempotency_key,
    occurredAt: row.occurred_at,
    originMetadata: row.origin_metadata ?? {},
    payloadMasked: row.payload_masked ?? {},
    sourceApplicationKey: row.source_application_key,
    sourceEventId: row.source_event_id,
    status: row.status
  };
}

function mapRule(rule: RobotRuleRow, actions: RobotRuleActionRow[]): RobotsRuleContract {
  return {
    actions: actions.map(mapRuleAction),
    companyId: rule.company_id,
    description: rule.description,
    eventCatalogId: rule.event_catalog_id,
    eventCode: rule.event_code,
    id: rule.id,
    name: rule.name,
    status: rule.status
  };
}

function mapRuleAction(row: RobotRuleActionRow): RobotsRuleActionContract {
  return {
    actionConfig: row.action_config ?? {},
    actionType: row.action_type,
    companyId: row.company_id,
    id: row.id,
    name: row.name,
    ruleId: row.rule_id,
    sortOrder: row.sort_order,
    status: row.status
  };
}

function mapExecution(row: RobotExecutionRow): RobotsExecutionContract {
  return {
    actionType: row.action_type,
    attemptCount: row.attempt_count,
    companyId: row.company_id,
    createdAt: row.created_at,
    eventId: row.event_id,
    id: row.id,
    lastError: row.last_error,
    maxAttempts: row.max_attempts,
    nextAttemptAt: row.next_attempt_at,
    requestPayload: row.request_payload ?? {},
    responsePayload: row.response_payload ?? {},
    ruleActionId: row.rule_action_id,
    ruleId: row.rule_id,
    status: row.status,
    updatedAt: row.updated_at
  };
}

function throwSupabaseError(error: { message?: string }): never {
  throw new BadRequestException(error.message ?? "Erro ao consultar FP Robots");
}
