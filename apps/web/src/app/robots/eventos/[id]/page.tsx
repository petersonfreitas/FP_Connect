import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getCurrentAdminAccess, getRobotsEvent } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

type RobotsEventDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    companyId?: string;
  }>;
};

const statusLabels = {
  failed: "Falhou",
  ignored_duplicate: "Duplicado ignorado",
  received: "Recebido"
};

export default async function RobotsEventDetailPage({
  params,
  searchParams
}: RobotsEventDetailPageProps) {
  const fallbackSearchParams: Promise<{ companyId?: string }> = Promise.resolve({});
  const [{ id }, query, accessResult] = await Promise.all([
    params,
    searchParams ?? fallbackSearchParams,
    getCurrentAdminAccess()
  ]);
  const companyId = typeof query.companyId === "string" ? query.companyId : "";
  const eventResult = companyId ? await getRobotsEvent(companyId, id) : { data: null, error: null };
  const event = eventResult.data;

  return (
    <AppShell
      access={accessResult.data ?? null}
      accessError={accessResult.error}
      activePath="/robots"
    >
      <header className="topbar">
        <div>
          <div className="eyebrow">FP Robots</div>
          <strong>Detalhe do evento</strong>
        </div>
        <Link className="secondary-action" href={`/robots${companyId ? `?companyId=${companyId}` : ""}`}>
          Voltar
        </Link>
      </header>

      {accessResult.error || eventResult.error || !companyId ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar o evento.</strong>
          <span>{accessResult.error ?? eventResult.error ?? "Contexto da empresa ausente."}</span>
        </section>
      ) : null}

      {event ? (
        <section className="content-panel stack-panel">
          <div className="panel-heading">
            <div>
              <h1>{event.eventCode}</h1>
              <p>{event.sourceApplicationKey}</p>
            </div>
            <span>{statusLabels[event.status]}</span>
          </div>

          <dl className="detail-grid">
            <DetailItem label="Empresa" value={event.companyId} />
            <DetailItem label="Evento de origem" value={event.sourceEventId ?? "Nao informado"} />
            <DetailItem label="Idempotencia" value={event.idempotencyKey ?? "Nao informado"} />
            <DetailItem label="Ocorrido em" value={formatDate(event.occurredAt)} />
            <DetailItem label="Recebido em" value={formatDate(event.createdAt)} />
            <DetailItem label="Ator" value={event.createdBy ?? "Sistema"} />
          </dl>

          <div className="content-panel inset-panel">
            <div className="panel-heading">
              <div>
                <h1>Payload mascarado</h1>
                <p>Dados sensiveis sao ocultados antes de exibicao operacional.</p>
              </div>
            </div>
            <pre className="code-block">{JSON.stringify(event.payloadMasked, null, 2)}</pre>
          </div>
        </section>
      ) : (
        <section className="content-panel">
          <div className="empty-state">Evento nao encontrado para a empresa informada.</div>
        </section>
      )}
    </AppShell>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}
