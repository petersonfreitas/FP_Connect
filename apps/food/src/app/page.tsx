import Link from "next/link";
import type { FoodOrderStatus, FoodPaymentStatus } from "@fp/types";
import { CompanySwitcher } from "@/components/company-switcher";
import { formatMoney } from "@/components/food-forms";
import { FoodShell } from "@/components/food-shell";
import { EmptyFoodAccess, Notice } from "@/components/page-feedback";
import { getFoodPageContext } from "@/lib/food-context";
import { getFoodAccess, getFoodDashboard, getFoodStore } from "@/lib/internal-api";
import { createFallbackPublicStoreContext, storeUrl } from "@/lib/public-store-urls";

type DashboardPageProps = {
  searchParams?: Promise<{
    companyId?: string;
  }>;
};

export const dynamic = "force-dynamic";

const orderStatusLabels: Record<FoodOrderStatus, string> = {
  accepted: "Aceitos",
  cancelled: "Cancelados",
  created: "Criados",
  delivered: "Entregues",
  out_for_delivery: "Em entrega",
  preparing: "Em preparo",
  ready: "Prontos"
};

const paymentStatusLabels: Record<FoodPaymentStatus, string> = {
  cancelled: "Cancelado",
  paid: "Pago",
  pending: "Pendente"
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const context = await getFoodPageContext(params?.companyId);
  const selectedCompany = context.selectedCompany;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const dashboardResult =
    selectedCompany && !foodAccessResult.error
      ? await getFoodDashboard(selectedCompany.company.id)
      : { data: null, error: null };
  const storeResult =
    selectedCompany && !foodAccessResult.error
      ? await getFoodStore(selectedCompany.company.id)
      : { data: null, error: null };
  const dashboard = dashboardResult.data;
  const store = storeResult.data;
  const companyId = selectedCompany?.company.id;

  return (
    <FoodShell activePath="/">
      <header className="topbar">
        <div>
          <div className="eyebrow">FP Food</div>
          <strong>Dashboard operacional</strong>
        </div>
      </header>

      {context.accessError ? <Notice tone="danger" message={context.accessError} /> : null}
      {foodAccessResult.error ? <Notice tone="danger" message={foodAccessResult.error} /> : null}
      {dashboardResult.error ? <Notice tone="danger" message={dashboardResult.error} /> : null}
      {storeResult.error &&
      !storeResult.error.includes("404") &&
      !storeResult.error.includes("ainda nao configurada") ? (
        <Notice tone="danger" message={storeResult.error} />
      ) : null}

      <CompanySwitcher
        basePath="/"
        companies={context.foodCompanies}
        selectedCompanyId={selectedCompany?.company.id}
      />

      {!selectedCompany ? (
        <EmptyFoodAccess />
      ) : !dashboard ? (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <h1>Dashboard indisponivel</h1>
              <p>Nao foi possivel carregar os indicadores operacionais agora.</p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <StoreAccessPanel companyId={companyId} store={store} />

          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <h1>Visao do dia</h1>
                <p>
                  Indicadores do ciclo operacional atual, gerados em{" "}
                  {new Date(dashboard.generatedAt).toLocaleString("pt-BR")}.
                </p>
              </div>
              <span>
                Dia operacional: {new Date(dashboard.periodStart).toLocaleDateString("pt-BR")}
              </span>
            </div>

            <div className="dashboard-metrics-grid">
              <DashboardMetric
                label="Pedidos"
                value={String(dashboard.totalOrders)}
                description="Pedidos criados no dia"
              />
              <DashboardMetric
                label="Faturamento"
                value={formatMoney(dashboard.totalCents)}
                description="Valor bruto dos pedidos do dia"
              />
              <DashboardMetric
                label="Pago"
                value={formatMoney(dashboard.paidCents)}
                description="Total confirmado manualmente"
              />
              <DashboardMetric
                label="Pendente"
                value={formatMoney(dashboard.pendingPaymentCents)}
                description="Valor ainda sem pagamento confirmado"
              />
            </div>
          </section>

          <section className="dashboard-grid stack-panel">
            <div className="content-panel dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h1>Filas ativas</h1>
                  <p>Pedidos em andamento fora do recorte diario.</p>
                </div>
              </div>
              <div className="dashboard-metrics-grid compact-dashboard-grid">
                <DashboardMetric
                  label="Cozinha"
                  value={String(dashboard.activeKitchenCount)}
                  description="Aceitos ou em preparo"
                />
                <DashboardMetric
                  label="Entregas"
                  value={String(dashboard.activeDeliveryCount)}
                  description="Prontos ou em rota"
                />
              </div>
              <div className="dashboard-actions">
                <Link className="secondary-action compact-action" href={`/movimentacao/cozinha?companyId=${companyId}`}>
                  Abrir cozinha
                </Link>
                <Link className="secondary-action compact-action" href={`/movimentacao/entregas?companyId=${companyId}`}>
                  Abrir entregas
                </Link>
              </div>
            </div>

            <div className="content-panel dashboard-panel">
              <div className="panel-heading">
                <div>
                  <h1>Pagamentos</h1>
                  <p>Status dos pagamentos dos pedidos criados no dia.</p>
                </div>
              </div>
              <DashboardList
                items={Object.entries(dashboard.paymentStatusCounts).map(([status, count]) => ({
                  label: paymentStatusLabels[status as FoodPaymentStatus],
                  value: count
                }))}
              />
              <div className="dashboard-actions">
                <Link className="secondary-action compact-action" href={`/movimentacao/pedidos?companyId=${companyId}`}>
                  Ver pedidos
                </Link>
              </div>
            </div>
          </section>

          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Status dos pedidos</h1>
                <p>Distribuicao dos pedidos criados no dia por status operacional.</p>
              </div>
            </div>
            <DashboardList
              items={Object.entries(dashboard.orderStatusCounts).map(([status, count]) => ({
                label: orderStatusLabels[status as FoodOrderStatus],
                value: count
              }))}
            />
          </section>
        </>
      )}
    </FoodShell>
  );
}

function StoreAccessPanel({
  companyId,
  store
}: {
  companyId: string | undefined;
  store:
    | {
        displayName: string;
        publicSlug: string;
        status: string;
      }
    | null
    | undefined;
}) {
  const storeConfigHref = `/cadastro/loja${companyId ? `?companyId=${companyId}` : ""}`;
  const menuConfigHref = `/movimentacao/cardapio${companyId ? `?companyId=${companyId}` : ""}`;
  const storeContext = store ? createFallbackPublicStoreContext(store.publicSlug) : null;
  const publicStoreHref = storeContext ? storeUrl(storeContext) : null;

  return (
    <section className="content-panel quick-access-panel">
      <div className="panel-heading">
        <div>
          <h1>Area da loja</h1>
          <p>Atalhos para operar, configurar e validar a visao publica do cliente.</p>
        </div>
        <span>{store ? getStoreStatusLabel(store.status) : "Loja pendente"}</span>
      </div>

      <div className="quick-access-grid">
        <article className="quick-access-card">
          <span>Configuracao</span>
          <strong>{store?.displayName ?? "Configurar loja"}</strong>
          <p>Nome publico, slug, telefone, tempo medio e status da loja.</p>
          <Link className="secondary-action compact-action" href={storeConfigHref}>
            Abrir cadastro
          </Link>
        </article>
        <article className="quick-access-card">
          <span>Cardapio</span>
          <strong>Produtos publicados</strong>
          <p>Organize categorias e confira os itens que aparecem na vitrine publica.</p>
          <Link className="secondary-action compact-action" href={menuConfigHref}>
            Abrir cardapio
          </Link>
        </article>
        <article className="quick-access-card">
          <span>Link publico</span>
          <strong>{publicStoreHref ?? "Configure o slug"}</strong>
          <p>Visao do cliente para realizar pedidos e acompanhar compras anteriores.</p>
          {publicStoreHref ? (
            <a
              className="primary-action compact-action"
              href={publicStoreHref}
              rel="noreferrer"
              target="_blank"
            >
              Abrir vitrine
            </a>
          ) : (
            <Link className="primary-action compact-action" href={storeConfigHref}>
              Configurar link
            </Link>
          )}
        </article>
      </div>
    </section>
  );
}

function DashboardMetric({
  description,
  label,
  value
}: {
  description: string;
  label: string;
  value: string;
}) {
  return (
    <div className="dashboard-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{description}</small>
    </div>
  );
}

function getStoreStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    closed: "Fechada",
    implementation: "Implementacao",
    open: "Aberta",
    suspended: "Suspensa"
  };

  return labels[status] ?? status;
}

function DashboardList({ items }: { items: Array<{ label: string; value: number }> }) {
  return (
    <div className="dashboard-list">
      {items.map((item) => (
        <div className="dashboard-list-row" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
