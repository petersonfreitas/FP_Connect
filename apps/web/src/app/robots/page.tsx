import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

const summaryItems = [
  {
    label: "Eventos processados",
    value: "0",
    detail: "Aguardando event log do modulo."
  },
  {
    label: "Regras ativas",
    value: "0",
    detail: "Automacoes entram no proximo bloco funcional."
  },
  {
    label: "Falhas pendentes",
    value: "0",
    detail: "Reprocessamento sera habilitado apos persistencia."
  }
];

const workspaceSections = [
  {
    title: "Eventos",
    label: "Entrada",
    description:
      "Registro de fatos emitidos por Sales, Food, Tracking, Billing e outros modulos do ecossistema.",
    items: ["Catalogo de eventos", "Event log", "Payload e origem", "Status de processamento"]
  },
  {
    title: "Regras",
    label: "Decisao",
    description:
      "Configuracao das condicoes que transformam eventos recebidos em uma ou mais acoes operacionais.",
    items: ["Evento gatilho", "Filtros por empresa", "Acoes padronizadas", "Ativacao controlada"]
  },
  {
    title: "Execucoes",
    label: "Operacao",
    description:
      "Acompanhamento das acoes criadas pelo Robots, com historico, erro tecnico e reprocessamento.",
    items: ["Fila de acoes", "Tentativas", "Logs de erro", "Reprocessamento autorizado"]
  },
  {
    title: "Gateway futuro",
    label: "Fronteira",
    description:
      "Integracoes externas sensiveis ficarao no FP Gateway quando sua estrutura funcional for definida.",
    items: ["WhatsApp", "Instagram e Facebook", "Ads", "Mercado Pago e PagSeguro"]
  }
];

const flowSteps = [
  "Sistema de origem emite evento",
  "FP Robots valida catalogo e regra",
  "FP Robots cria acao padronizada",
  "FP Gateway executa provedor externo quando aplicavel",
  "FP Robots registra sucesso, falha ou reprocessamento"
];

export default async function RobotsPage() {
  return (
    <AppShell activePath="/robots">
      <header className="topbar">
        <div>
          <div className="eyebrow">Sistema operacional</div>
          <strong>FP Robots</strong>
        </div>
        <span className="status-pill">Shell V0</span>
      </header>

      <section className="robots-hero">
        <div>
          <div className="eyebrow">Orquestrador de automacoes</div>
          <h1>Eventos, regras, execucoes e reprocessamentos em um fluxo auditavel.</h1>
          <p>
            O FP Robots nasce como o motor que escuta eventos do ecossistema, decide quais
            automacoes devem rodar e registra cada acao com rastreabilidade.
          </p>
        </div>
        <aside className="robots-hero-panel" aria-label="Fronteira arquitetural">
          <span>Separacao preparada</span>
          <strong>Robots decide. Gateway executa provedores externos.</strong>
          <p>
            WhatsApp, Instagram, Facebook, Ads e pagamentos externos ficam reservados para o
            futuro FP Gateway, sem acoplar credenciais e APIs ao motor de regras.
          </p>
        </aside>
      </section>

      <section className="summary-strip" aria-label="Resumo inicial do FP Robots">
        {summaryItems.map((item) => (
          <div className="summary-item" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </div>
        ))}
      </section>

      <section className="robots-workspace" aria-label="Areas planejadas do FP Robots">
        {workspaceSections.map((section) => (
          <article className="robots-section-card" key={section.title}>
            <div className="module-card-top">
              <span>{section.label}</span>
              <small>Planejado</small>
            </div>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="content-panel stack-panel">
        <div className="panel-heading">
          <div>
            <h1>Fluxo conceitual</h1>
            <p>Base para o proximo bloco funcional, ainda sem persistencia nova.</p>
          </div>
          <span>V0</span>
        </div>
        <ol className="robots-flow">
          {flowSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="empty-state">
          Nenhum evento real sera carregado nesta versao. O shell prepara navegacao, linguagem de
          produto e fronteiras para a implementacao do event log quando o ambiente Supabase estiver
          validado.
        </div>
      </section>
    </AppShell>
  );
}
