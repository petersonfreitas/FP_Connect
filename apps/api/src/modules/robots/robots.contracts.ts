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

export type PaginatedContract<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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
