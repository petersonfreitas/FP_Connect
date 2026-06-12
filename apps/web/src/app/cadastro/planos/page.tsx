import { AppShell } from "@/components/app-shell";
import { getAdminCatalog } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo"
};

export default async function PlansPage() {
  const catalogResult = await getAdminCatalog();
  const plans = catalogResult.data?.basicPlans ?? [];

  return (
    <AppShell activePath="/cadastro/planos">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Planos</strong>
        </div>
        <span className="status-pill">{plans.length} plano(s)</span>
      </header>

      {catalogResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar planos.</strong>
          <span>{catalogResult.error}</span>
        </section>
      ) : null}

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>Planos base</h1>
            <p>Catalogo administrativo dos planos e seus modulos padrao.</p>
          </div>
        </div>

        {plans.length > 0 ? (
          <div className="catalog-card-list">
            {plans.map((plan) => (
              <article className="catalog-card" key={plan.id}>
                <div className="catalog-card-top">
                  <div>
                    <strong>{plan.name}</strong>
                    <small>{plan.key}</small>
                  </div>
                  <span>{statusLabels[plan.status]}</span>
                </div>
                <p>{plan.description ?? "Sem descricao cadastrada."}</p>
                <div className="tag-list" aria-label={`Modulos do plano ${plan.name}`}>
                  {plan.applications.length > 0 ? (
                    plan.applications.map((application) => (
                      <span className="tag" key={application.id}>
                        {application.name}
                      </span>
                    ))
                  ) : (
                    <span className="tag muted-tag">Nenhum modulo vinculado</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">Nenhum plano cadastrado ainda.</div>
        )}
      </section>
    </AppShell>
  );
}
