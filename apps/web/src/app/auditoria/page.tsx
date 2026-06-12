import { AuditLogView } from "@/components/audit-log-view";

export const dynamic = "force-dynamic";

export default function AuditLogsPage() {
  return (
    <AuditLogView
      activePath="/auditoria"
      description="Ultimos registros administrativos gerados pelo Admin Console no schema core."
      emptyMessage="Nenhum evento de auditoria registrado ainda."
      scope="all"
      title="Visao geral"
    />
  );
}
