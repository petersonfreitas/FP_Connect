import { AppShell } from "@/components/app-shell";
import { listAdminAuditLogs } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

const actionLabels: Record<string, string> = {
  "core.company.created": "Empresa criada",
  "core.company_application.updated": "Modulo atualizado",
  "core.user.invited": "Usuario convidado",
  "core.user_application_role.granted": "Papel concedido",
  "core.user_application_role.revoked": "Papel revogado"
};

export default async function AuditLogsPage() {
  const auditResult = await listAdminAuditLogs();
  const logs = auditResult.data ?? [];

  return (
    <AppShell activePath="/movimentacao/auditoria">
      <header className="topbar">
        <div>
          <div className="eyebrow">Movimentacao</div>
          <strong>Auditoria</strong>
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
            <h1>Eventos administrativos</h1>
            <p>Ultimos registros gerados pelo Admin Console no schema core.</p>
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
          <div className="empty-state">Nenhum evento de auditoria registrado ainda.</div>
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
