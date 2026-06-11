const modules = [
  {
    name: "Admin Console",
    description: "Empresas, usuários, permissões, módulos contratados e auditoria.",
    status: "Fundação"
  },
  {
    name: "FP Robots",
    description: "Eventos, automações, webhooks, logs, retries e reprocessamento.",
    status: "Planejado"
  },
  {
    name: "FP Food",
    description: "Loja, vitrine, cardápio, pedidos, cozinha e entrega simples.",
    status: "Frontend próprio futuro"
  },
  {
    name: "FP Tracking",
    description: "Entregas, entregadores, localização, ocorrências e rastreamento.",
    status: "Frontend próprio futuro"
  },
  {
    name: "FP Marketing",
    description: "Campanhas, canais, leads, qualificação e conversão para Sales.",
    status: "Futuro"
  },
  {
    name: "FP Sales",
    description: "Clientes, oportunidades, propostas, pipeline e visão 360.",
    status: "Futuro"
  },
  {
    name: "FP Tickets",
    description: "Chamados, atendimento, implantação, anexos e SLA visual.",
    status: "Futuro"
  },
  {
    name: "FP Billing",
    description: "Planos, assinaturas, cobranças manuais e status financeiro.",
    status: "Futuro"
  }
];

export default function Home() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>FP Connect</strong>
          <span>Ecossistema SaaS FP WebTech</span>
        </div>
        <div className="status-pill">Fundação em construção</div>
      </header>

      <section className="hero">
        <div className="eyebrow">Portal principal</div>
        <h1>Base comum para operar, integrar e escalar os módulos da FP WebTech.</h1>
        <p>
          Este shell inicial concentra o Admin Console e prepara o caminho para módulos
          internos, frontends especializados e integrações controladas por eventos.
        </p>
      </section>

      <section className="module-grid" aria-label="Módulos do ecossistema">
        {modules.map((module) => (
          <article className="module-card" key={module.name}>
            <span>{module.status}</span>
            <h2>{module.name}</h2>
            <p>{module.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
