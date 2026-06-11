import Image from "next/image";

const modules = [
  {
    name: "Admin Console",
    description: "Empresas, usuários, permissões, módulos contratados e auditoria.",
    status: "Fundação",
    tone: "Ativo"
  },
  {
    name: "FP Robots",
    description: "Eventos, automações, webhooks, logs, retries e reprocessamento.",
    status: "Planejado",
    tone: "Base"
  },
  {
    name: "FP Food",
    description: "Loja, vitrine, cardápio, pedidos, cozinha e entrega simples.",
    status: "Frontend próprio futuro",
    tone: "Produto"
  },
  {
    name: "FP Tracking",
    description: "Entregas, entregadores, localização, ocorrências e rastreamento.",
    status: "Frontend próprio futuro",
    tone: "Produto"
  },
  {
    name: "FP Marketing",
    description: "Campanhas, canais, leads, qualificação e conversão para Sales.",
    status: "Futuro",
    tone: "Crescimento"
  },
  {
    name: "FP Sales",
    description: "Clientes, oportunidades, propostas, pipeline e visão 360.",
    status: "Futuro",
    tone: "Comercial"
  },
  {
    name: "FP Tickets",
    description: "Chamados, atendimento, implantação, anexos e SLA visual.",
    status: "Futuro",
    tone: "Suporte"
  },
  {
    name: "FP Billing",
    description: "Planos, assinaturas, cobranças manuais e status financeiro.",
    status: "Futuro",
    tone: "Financeiro"
  }
];

const foundationItems = [
  "Banco único Supabase por schemas",
  "Auth centralizado no core",
  "APIs internas por domínio",
  "Frontends separados quando necessário"
];

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegação principal">
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
            Módulos
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
            <strong>Empresa atual: FP WebTech</strong>
          </div>
          <div className="status-pill">Fundação em construção</div>
        </header>

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
              Uma base comum para administrar empresas, liberar módulos, controlar
              permissões e preparar integrações entre produtos SaaS.
            </p>
          </div>
          <div className="foundation-panel" aria-label="Contratos da fundação">
            <span>Contratos de arquitetura</span>
            {foundationItems.map((item) => (
              <div className="foundation-item" key={item}>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="section-heading">
          <div>
            <div className="eyebrow">Meus sistemas</div>
            <h2>Módulos do ecossistema</h2>
          </div>
          <span className="muted">Modelo visual para os próximos produtos</span>
        </section>

        <section className="module-grid" aria-label="Módulos do ecossistema">
          {modules.map((module) => (
            <article className="module-card" key={module.name}>
              <div className="module-card-top">
                <span>{module.tone}</span>
                <small>{module.status}</small>
              </div>
              <h3>{module.name}</h3>
              <p>{module.description}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
