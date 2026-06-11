import Image from "next/image";
import type { AdminApplicationContract } from "@fp/types";
import { getAdminConsoleOverview } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

const foundationItems = [
  "Banco unico Supabase por schemas",
  "Auth centralizado no core",
  "APIs internas por dominio",
  "Frontends separados quando necessario"
];

const applicationStatusLabels: Record<AdminApplicationContract["status"], string> = {
  active: "Ativo",
  hidden: "Oculto",
  inactive: "Inativo"
};

const applicationToneByKey: Record<string, string> = {
  "admin-console": "Core",
  billing: "Financeiro",
  food: "Produto",
  marketing: "Crescimento",
  robots: "Automacao",
  sales: "Comercial",
  tickets: "Suporte",
  tracking: "Produto"
};

export default async function Home() {
  const overviewResult = await getAdminConsoleOverview();
  const overview = overviewResult.data;
  const applications = overview?.applications ?? [];
  const basicPlans = overview?.basicPlans ?? [];
  const companies = overview?.companies ?? [];

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <div className="sidebar-brand">
          <Image
            src="/brand/logo-b.png"
            alt="FP WebTech"
            width={270}
            height={95}
            priority
          />
        </div>
        <nav className="nav-list">
          <a className="nav-item active" href="/">
            Portal
          </a>
          <a className="nav-item" href="/">
            Admin Console
          </a>
          <a className="nav-item" href="/">
            Modulos
          </a>
          <a className="nav-item" href="/">
            Auditoria
          </a>
        </nav>
        <div className="sidebar-foot">
          <Image src="/brand/icon.png" alt="" width={40} height={40} />
          <span>FP Connect Foundation</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <div className="eyebrow">Portal principal</div>
            <strong>Empresas cadastradas: {companies.length}</strong>
          </div>
          <div className="status-pill">
            {overviewResult.error ? "API interna indisponivel" : "Core conectado"}
          </div>
        </header>

        {overviewResult.error ? (
          <section className="data-alert" role="status">
            <strong>Nao foi possivel carregar dados reais do core.</strong>
            <span>{overviewResult.error}</span>
          </section>
        ) : null}

        <section className="hero">
          <div className="hero-copy">
            <Image
              src="/brand/logo.png"
              alt="FP WebTech"
              width={270}
              height={95}
              priority
            />
            <h1>Centro operacional do ecossistema FP WebTech.</h1>
            <p>
              Uma base comum para administrar empresas, liberar modulos, controlar
              permissoes e preparar integracoes entre produtos SaaS.
            </p>
          </div>
          <div className="foundation-panel" aria-label="Contratos da fundacao">
            <span>Contratos de arquitetura</span>
            {foundationItems.map((item) => (
              <div className="foundation-item" key={item}>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="summary-strip" aria-label="Resumo do core">
          <div className="summary-item">
            <span>Modulos no core</span>
            <strong>{applications.length}</strong>
          </div>
          <div className="summary-item">
            <span>Planos base</span>
            <strong>{basicPlans.length}</strong>
          </div>
          <div className="summary-item">
            <span>Empresas</span>
            <strong>{companies.length}</strong>
          </div>
        </section>

        <section className="section-heading">
          <div>
            <div className="eyebrow">Meus sistemas</div>
            <h2>Modulos do ecossistema</h2>
          </div>
          <span className="muted">Dados carregados do schema core</span>
        </section>

        <section className="module-grid" aria-label="Modulos do ecossistema">
          {applications.length > 0 ? (
            applications.map((application) => (
              <article className="module-card" key={application.id}>
                <div className="module-card-top">
                  <span>{applicationToneByKey[application.key] ?? "Modulo"}</span>
                  <small>{applicationStatusLabels[application.status]}</small>
                </div>
                <h3>{application.name}</h3>
                <p>{application.description ?? "Descricao pendente no catalogo do core."}</p>
              </article>
            ))
          ) : (
            <div className="empty-state">
              Nenhum modulo retornado pela API interna ate o momento.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
