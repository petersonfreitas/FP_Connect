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

export type GatewayPaymentRequestStatus =
  | "cancelled"
  | "expired"
  | "failed"
  | "paid"
  | "requested"
  | "requires_provider_config";

export type GatewayPaymentRequestContract = {
  amountCents: number;
  companyId: string;
  createdAt: string;
  currency: string;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  description: string;
  errorMessage: string | null;
  id: string;
  paymentUrl: string | null;
  providerKey: string;
  providerName: string;
  providerReference: string | null;
  sourceApplicationKey: string;
  sourceReferenceId: string;
  sourceReferenceType: string;
  status: GatewayPaymentRequestStatus;
  updatedAt: string;
};

export type CreateGatewayPaymentRequestInput = {
  amountCents: number;
  currency?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  description: string;
  idempotencyKey?: string | null;
  providerKey?: string | null;
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
