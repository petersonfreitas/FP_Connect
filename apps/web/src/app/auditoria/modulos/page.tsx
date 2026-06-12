import { AuditLogView } from "@/components/audit-log-view";

export const dynamic = "force-dynamic";

export default function ModuleAuditLogsPage() {
  return (
    <AuditLogView
      activePath="/auditoria/modulos"
      description="Liberacao de modulos, status contratual e papeis relacionados a permissoes."
      emptyMessage="Nenhum evento de auditoria de modulos ou permissoes registrado ainda."
      scope="modules"
      title="Modulos e permissoes"
    />
  );
}
