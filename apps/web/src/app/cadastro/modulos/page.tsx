import { AppShell } from "@/components/app-shell";
import { getAdminCatalog } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

const statusLabels = {
  active: "Ativo",
  hidden: "Oculto",
  inactive: "Inativo"
};

export default async function ModulesPage() {
  const catalogResult = await getAdminCatalog();
  const catalog = catalogResult.data;
  const applications = catalog?.applications ?? [];
  const plansByApplicationId = new Map<string, string[]>();

  for (const plan of catalog?.basicPlans ?? []) {
    for (const application of plan.applications) {
      const plans = plansByApplicationId.get(application.id) ?? [];
      plans.push(plan.name);
      plansByApplicationId.set(application.id, plans);
    }
  }

  return (
    <AppShell activePath="/cadastro/modulos">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Modulos</strong>
        </div>
        <span className="status-pill">{applications.length} modulo(s)</span>
      </header>

      {catalogResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar modulos.</strong>
          <span>{catalogResult.error}</span>
        </section>
      ) : null}

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>Catalogo de modulos</h1>
            <p>Modulos do ecossistema FP Connect e seus vinculos com planos base.</p>
          </div>
        </div>

        {applications.length > 0 ? (
          <div className="module-catalog-list">
            {applications.map((application) => (
              <article className="module-catalog-row" key={application.id}>
                <div>
                  <strong>{application.name}</strong>
                  <small>{application.key}</small>
                </div>
                <p>{application.description ?? "Sem descricao cadastrada."}</p>
                <div>
                  <span>{statusLabels[application.status]}</span>
                  <small>{application.entryPath ?? "Sem rota de entrada"}</small>
                </div>
                <div className="tag-list">
                  {(plansByApplicationId.get(application.id) ?? []).length > 0 ? (
                    plansByApplicationId.get(application.id)?.map((planName) => (
                      <span className="tag" key={planName}>
                        {planName}
                      </span>
                    ))
                  ) : (
                    <span className="tag muted-tag">Fora de planos</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">Nenhum modulo cadastrado ainda.</div>
        )}
      </section>
    </AppShell>
  );
}
