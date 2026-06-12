import { AuditLogView } from "@/components/audit-log-view";

export const dynamic = "force-dynamic";

export default function CompanyAuditLogsPage() {
  return (
    <AuditLogView
      activePath="/auditoria/empresas"
      description="Eventos ligados ao cadastro, status e evolucao administrativa das empresas."
      emptyMessage="Nenhum evento de auditoria de empresas registrado ainda."
      scope="companies"
      title="Empresas"
    />
  );
}
