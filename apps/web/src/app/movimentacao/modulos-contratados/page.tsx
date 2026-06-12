import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { listAdminContractedModules } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

const statusLabels = {
  active: "Ativo",
  cancelled: "Cancelado",
  implementation: "Em implantacao",
  suspended: "Suspenso"
};

export default async function ContractedModulesPage() {
  const modulesResult = await listAdminContractedModules();
  const modules = modulesResult.data ?? [];

  return (
    <AppShell activePath="/movimentacao/modulos-contratados">
      <header className="topbar">
        <div>
          <div className="eyebrow">Movimentacao</div>
          <strong>Modulos contratados</strong>
        </div>
        <span className="status-pill">{modules.length} contrato(s)</span>
      </header>

      {modulesResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar modulos contratados.</strong>
          <span>{modulesResult.error}</span>
        </section>
      ) : null}

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>Contratos por empresa</h1>
            <p>Visao operacional dos modulos liberados, suspensos ou cancelados por empresa.</p>
          </div>
          <span>{countActiveModules(modules)} ativo(s)</span>
        </div>

        {modules.length > 0 ? (
          <div className="contracted-module-list">
            {modules.map((module) => (
              <article className="contracted-module-row" key={module.id}>
                <div>
                  <strong>{module.companyName}</strong>
                  <small>{module.companyId}</small>
                </div>
                <div>
                  <strong>{module.applicationName}</strong>
                  <small>{module.applicationKey}</small>
                </div>
                <div>
                  <span>{statusLabels[module.status]}</span>
                  <small>{getStatusDate(module)}</small>
                </div>
                <p>{module.implementationNotes ?? "Sem observacoes."}</p>
                <Link href={`/cadastro/empresas/${module.companyId}`}>Ajustar</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            Nenhum modulo contratado ainda. Abra o detalhe de uma empresa para liberar modulos.
          </div>
        )}
      </section>
    </AppShell>
  );
}

function countActiveModules(modules: { status: string }[]): number {
  return modules.filter((module) => module.status === "active").length;
}

function getStatusDate(module: {
  activatedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  status: string;
  suspendedAt: string | null;
}): string {
  if (module.status === "active" && module.activatedAt) {
    return `Ativado em ${formatDate(module.activatedAt)}`;
  }

  if (module.status === "suspended" && module.suspendedAt) {
    return `Suspenso em ${formatDate(module.suspendedAt)}`;
  }

  if (module.status === "cancelled" && module.cancelledAt) {
    return `Cancelado em ${formatDate(module.cancelledAt)}`;
  }

  return `Criado em ${formatDate(module.createdAt)}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}
