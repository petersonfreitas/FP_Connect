import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from "@nestjs/common";
import type {
  AdminApplicationContract,
  AdminBasicPlanContract,
  AdminCompanyContract,
  AdminConsoleOverviewContract,
  CreateAdminCompanyInput
} from "./admin-console.contracts";
import { SupabaseService } from "../../supabase/supabase.service";

type SupabaseFailure = {
  message: string;
};

type ApplicationRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  entry_path: string | null;
  status: AdminApplicationContract["status"];
  sort_order: number;
};

type BasicPlanRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: AdminBasicPlanContract["status"];
};

type CompanyRow = {
  id: string;
  legal_name: string;
  trade_name: string | null;
  document: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  primary_responsible_name: string;
  primary_responsible_email: string | null;
  status: AdminCompanyContract["status"];
  basic_plan_id: string | null;
  implementation_notes: string | null;
  created_at: string;
};

const companySelect =
  "id,legal_name,trade_name,document,primary_email,primary_phone,primary_responsible_name,primary_responsible_email,status,basic_plan_id,implementation_notes,created_at";

@Injectable()
export class AdminConsoleService {
  constructor(private readonly supabase: SupabaseService) {}

  async getOverview(): Promise<AdminConsoleOverviewContract> {
    const [applications, basicPlans, companies] = await Promise.all([
      this.listApplications(),
      this.listBasicPlans(),
      this.listCompanies()
    ]);

    return {
      applications,
      basicPlans,
      companies
    };
  }

  async listApplications(): Promise<AdminApplicationContract[]> {
    const { data, error } = await this.supabase.core
      .from("applications")
      .select("id,key,name,description,entry_path,status,sort_order")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as ApplicationRow[]).map(mapApplication);
  }

  async listBasicPlans(): Promise<AdminBasicPlanContract[]> {
    const { data, error } = await this.supabase.core
      .from("basic_plans")
      .select("id,key,name,description,status")
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as BasicPlanRow[]).map(mapBasicPlan);
  }

  async listCompanies(): Promise<AdminCompanyContract[]> {
    const { data, error } = await this.supabase.core
      .from("companies")
      .select(companySelect)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as CompanyRow[]).map(mapCompany);
  }

  async getCompany(id: string): Promise<AdminCompanyContract> {
    if (!isUuid(id)) {
      throw new BadRequestException("Invalid company id");
    }

    const { data, error } = await this.supabase.core
      .from("companies")
      .select(companySelect)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throwSupabaseError(error);
    }

    if (!data) {
      throw new NotFoundException("Company not found");
    }

    return mapCompany(data as CompanyRow);
  }

  async createCompany(input: CreateAdminCompanyInput): Promise<AdminCompanyContract> {
    const company = normalizeCreateCompanyInput(input);

    const { data, error } = await this.supabase.core
      .from("companies")
      .insert({
        legal_name: company.legalName,
        trade_name: company.tradeName,
        document: company.document,
        primary_email: company.primaryEmail,
        primary_phone: company.primaryPhone,
        primary_responsible_name: company.primaryResponsibleName,
        primary_responsible_email: company.primaryResponsibleEmail,
        basic_plan_id: company.basicPlanId,
        implementation_notes: company.implementationNotes
      })
      .select(companySelect)
      .single();

    if (error) {
      throwSupabaseError(error);
    }

    const createdCompany = mapCompany(data as CompanyRow);
    await this.createAuditLog(createdCompany.id, "core.company.created", "companies", createdCompany.id, {
      legalName: createdCompany.legalName,
      status: createdCompany.status
    });

    return createdCompany;
  }

  private async createAuditLog(
    companyId: string,
    action: string,
    entityTable: string,
    entityId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const { error } = await this.supabase.core.from("audit_logs").insert({
      company_id: companyId,
      action,
      entity_table: entityTable,
      entity_id: entityId,
      metadata
    });

    if (error) {
      throwSupabaseError(error);
    }
  }
}

function throwSupabaseError(error: SupabaseFailure): never {
  throw new InternalServerErrorException({
    message: "Supabase query failed",
    detail: error.message
  });
}

function mapApplication(row: ApplicationRow): AdminApplicationContract {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    entryPath: row.entry_path,
    status: row.status,
    sortOrder: row.sort_order
  };
}

function mapBasicPlan(row: BasicPlanRow): AdminBasicPlanContract {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    status: row.status
  };
}

function mapCompany(row: CompanyRow): AdminCompanyContract {
  return {
    id: row.id,
    legalName: row.legal_name,
    tradeName: row.trade_name,
    document: row.document,
    primaryEmail: row.primary_email,
    primaryPhone: row.primary_phone,
    primaryResponsibleName: row.primary_responsible_name,
    primaryResponsibleEmail: row.primary_responsible_email,
    status: row.status,
    basicPlanId: row.basic_plan_id,
    implementationNotes: row.implementation_notes,
    createdAt: row.created_at
  };
}

function normalizeCreateCompanyInput(input: CreateAdminCompanyInput): CreateAdminCompanyInput {
  const legalName = normalizeRequired(input.legalName, "legalName");
  const primaryResponsibleName = normalizeRequired(
    input.primaryResponsibleName,
    "primaryResponsibleName"
  );

  return {
    legalName,
    primaryResponsibleName,
    tradeName: normalizeOptional(input.tradeName),
    document: normalizeOptional(input.document),
    primaryEmail: normalizeOptional(input.primaryEmail),
    primaryPhone: normalizeOptional(input.primaryPhone),
    primaryResponsibleEmail: normalizeOptional(input.primaryResponsibleEmail),
    basicPlanId: normalizeOptional(input.basicPlanId),
    implementationNotes: normalizeOptional(input.implementationNotes)
  };
}

function normalizeRequired(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestException(`${field} is required`);
  }

  return value.trim();
}

function normalizeOptional(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
