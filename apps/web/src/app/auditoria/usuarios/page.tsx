import { AuditLogView } from "@/components/audit-log-view";

export const dynamic = "force-dynamic";

export default function UserAuditLogsPage() {
  return (
    <AuditLogView
      activePath="/auditoria/usuarios"
      description="Convites, vinculos, papeis concedidos e papeis revogados por usuario."
      emptyMessage="Nenhum evento de auditoria de usuarios registrado ainda."
      scope="users"
      title="Usuarios"
    />
  );
}
