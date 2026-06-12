import { AuditLogView } from "@/components/audit-log-view";

export const dynamic = "force-dynamic";

export default function SystemAuditLogsPage() {
  return (
    <AuditLogView
      activePath="/auditoria/sistema"
      description="Eventos internos de plataforma, integracoes, jobs e monitoramento futuro."
      emptyMessage="Nenhum evento de auditoria de sistema registrado ainda."
      scope="system"
      title="Sistema"
    />
  );
}
