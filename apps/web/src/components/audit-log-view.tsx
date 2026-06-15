import type { AdminAuditScope } from "@fp/types";
import { AppShell } from "@/components/app-shell";
import { listAdminAuditLogs } from "@/lib/internal-api";

type AuditLogViewProps = {
  activePath: string;
  description: string;
  emptyMessage: string;
  scope: AdminAuditScope;
  title: string;
};

const actionLabels: Record<string, string> = {
  "core.company.created": "Empresa criada",
  "core.company.updated": "Empresa atualizada",
  "core.company_application.updated": "Modulo atualizado",
  "core.company_membership.updated": "Vinculo empresarial atualizado",
  "core.user.invite_accepted": "Convite aceito",
  "core.user.invite_resent": "Convite reenviado",
  "core.user.invited": "Usuario convidado",
  "core.user.updated": "Usuario atualizado",
  "core.user_application_role.granted": "Papel concedido",
  "core.user_application_role.revoked": "Papel revogado"
};

export async function AuditLogView({
  activePath,
  description,
  emptyMessage,
  scope,
  title
}: AuditLogViewProps) {
  const auditResult = await listAdminAuditLogs(scope);
  const logs = auditResult.data ?? [];

  return (
    <AppShell activePath={activePath}>
      <header className="topbar">
        <div>
          <div className="eyebrow">Auditoria</div>
          <strong>{title}</strong>
        </div>
        <span className="status-pill">{logs.length} evento(s)</span>
      </header>

      {auditResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar auditoria.</strong>
          <span>{auditResult.error}</span>
        </section>
      ) : null}

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <span>Ultimos 100</span>
        </div>

        {logs.length > 0 ? (
          <div className="audit-list">
            {logs.map((log) => (
              <article className="audit-row" key={log.id}>
                <div className="audit-main">
                  <strong>{actionLabels[log.action] ?? log.action}</strong>
                  <small>{log.action}</small>
                </div>
                <div>
                  <span>{log.companyName ?? "Sem empresa"}</span>
                  <small>{log.companyId ?? "Evento global"}</small>
                </div>
                <div>
                  <span>{formatEntity(log.entitySchema, log.entityTable)}</span>
                  <small>{log.entityId ?? "Sem entidade"}</small>
                </div>
                <time dateTime={log.createdAt}>{formatDate(log.createdAt)}</time>
                <details className="audit-metadata">
                  <summary>Metadados</summary>
                  <pre>{formatMetadata(log.metadata)}</pre>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">{emptyMessage}</div>
        )}
      </section>
    </AppShell>
  );
}

function formatEntity(schema: string, table: string): string {
  return `${schema}.${table}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function formatMetadata(metadata: Record<string, unknown>): string {
  return JSON.stringify(metadata, null, 2);
}
