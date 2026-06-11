import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { SupabaseService } from "../../supabase/supabase.service";
import {
  AdminApplicationContract,
  AdminBasicPlanContract,
  AdminCompanyContract,
  AdminConsoleOverviewContract
} from "./admin-console.contracts";

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
  primary_responsible_name: string;
  status: AdminCompanyContract["status"];
  basic_plan_id: string | null;
  created_at: string;
};

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
      .select("id,legal_name,trade_name,document,primary_responsible_name,status,basic_plan_id,created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throwSupabaseError(error);
    }

    return ((data ?? []) as CompanyRow[]).map(mapCompany);
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
    primaryResponsibleName: row.primary_responsible_name,
    status: row.status,
    basicPlanId: row.basic_plan_id,
    createdAt: row.created_at
  };
}
