import Link from "next/link";
import type { AdminCurrentUserCompanyAccessContract, FoodStoreContract } from "@fp/types";
import { AppShell } from "@/components/app-shell";
import { getCurrentAdminAccess, getFoodStore } from "@/lib/internal-api";
import { loadServerEnv } from "@/lib/server-env";

export const dynamic = "force-dynamic";

type FoodSystemHubPageProps = {
  searchParams?: Promise<{
    companyId?: string;
  }>;
};

type FoodStoreResult = {
  error: string | null;
  store: FoodStoreContract | null;
};

const storeStatusLabels: Record<FoodStoreContract["status"], string> = {
  closed: "Fechada",
  implementation: "Em implantacao",
  open: "Aberta",
  suspended: "Suspensa"
};

export default async function FoodSystemHubPage({ searchParams }: FoodSystemHubPageProps) {
  const query = searchParams ? await searchParams : {};
  const accessResult = await getCurrentAdminAccess();
  const access = accessResult.data;
  const foodCompanies = access
    ? access.companies.filter((companyAccess) =>
        companyAccess.modules.some((module) => module.applicationKey === "food")
      )
    : [];
  const selectedCompany =
    foodCompanies.find((companyAccess) => companyAccess.company.id === query.companyId) ??
    foodCompanies[0] ??
    null;
  const storeResult = selectedCompany
    ? await readFoodStore(selectedCompany.company.id)
    : { error: null, store: null };
  const foodBaseUrl = getFoodBaseUrl();
  const operationalUrl = selectedCompany
    ? buildUrl(foodBaseUrl, "/", { companyId: selectedCompany.company.id })
    : foodBaseUrl;
  const storeConfigUrl = selectedCompany
    ? buildUrl(foodBaseUrl, "/cadastro/loja", { companyId: selectedCompany.company.id })
    : buildUrl(foodBaseUrl, "/cadastro/loja");
  const publicStoreUrl = storeResult.store
    ? buildUrl(foodBaseUrl, `/l/${encodeURIComponent(storeResult.store.publicSlug)}`)
    : null;

  return (
    <AppShell access={access ?? null} accessError={accessResult.error} activePath="/sistemas/food">
      <header className="topbar">
        <div>
          <div className="eyebrow">Sistemas</div>
          <strong>FP Food</strong>
        </div>
        <div className="status-pill">{foodCompanies.length} empresa(s)</div>
      </header>

      {accessResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar seu acesso.</strong>
          <span>{accessResult.error}</span>
        </section>
      ) : null}

      {foodCompanies.length > 0 ? (
        <>
          <section className="content-panel stack-panel">
            <div className="panel-heading">
              <div>
                <h1>Hub operacional do FP Food</h1>
                <p>
                  Escolha a empresa e abra o painel da loja ou a vitrine publica em uma nova aba.
                </p>
              </div>
              <span>{selectedCompany ? getCompanyName(selectedCompany) : "Sem empresa"}</span>
            </div>

            <div className="module-grid">
              {foodCompanies.map((companyAccess) => {
                const isSelected = selectedCompany?.company.id === companyAccess.company.id;

                return (
                  <article
                    className={isSelected ? "module-card selected-module-card" : "module-card"}
                    key={companyAccess.membershipId}
                  >
                    <div className="module-card-top">
                      <span>{isSelected ? "Selecionada" : "Disponivel"}</span>
                      <small>{companyAccess.modules.length} modulo(s)</small>
                    </div>
                    <h3>{getCompanyName(companyAccess)}</h3>
                    <p>{companyAccess.company.legalName}</p>
                    {isSelected ? (
                      <span className="tag muted-tag">Empresa atual</span>
                    ) : (
                      <Link
                        className="tag"
                        href={`/sistemas/food?companyId=${companyAccess.company.id}`}
                      >
                        Selecionar
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          {selectedCompany ? (
            <section className="module-grid" aria-label="Acoes do FP Food">
              <article className="module-card">
                <div className="module-card-top">
                  <span>Painel</span>
                  <small>Operacao interna</small>
                </div>
                <h3>Abrir painel da loja</h3>
                <p>Acessa dashboard, pedidos, cozinha, entregas, cardapio e cadastros do Food.</p>
                <a className="primary-action" href={operationalUrl} rel="noreferrer" target="_blank">
                  Abrir painel
                </a>
              </article>

              <article className="module-card">
                <div className="module-card-top">
                  <span>{storeResult.store ? storeStatusLabels[storeResult.store.status] : "Pendente"}</span>
                  <small>Vitrine publica</small>
                </div>
                <h3>{storeResult.store?.displayName ?? "Loja nao configurada"}</h3>
                <p>
                  {storeResult.store
                    ? `Slug publico: ${storeResult.store.publicSlug}`
                    : storeResult.error ?? "Configure a loja antes de abrir a vitrine publica."}
                </p>
                {publicStoreUrl ? (
                  <a
                    className="primary-action"
                    href={publicStoreUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir vitrine
                  </a>
                ) : (
                  <a
                    className="secondary-action"
                    href={storeConfigUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Configurar loja
                  </a>
                )}
              </article>

              <article className="module-card">
                <div className="module-card-top">
                  <span>Configuracao</span>
                  <small>Cadastro da loja</small>
                </div>
                <h3>Configurar loja</h3>
                <p>Abre a tela de dados publicos, slug, status e regras basicas da loja.</p>
                <a className="secondary-action" href={storeConfigUrl} rel="noreferrer" target="_blank">
                  Abrir configuracao
                </a>
              </article>
            </section>
          ) : null}
        </>
      ) : (
        <section className="content-panel">
          <div className="empty-state">
            Nenhuma empresa com FP Food liberado foi encontrada para o seu usuario.
          </div>
        </section>
      )}
    </AppShell>
  );
}

async function readFoodStore(companyId: string): Promise<FoodStoreResult> {
  const result = await getFoodStore(companyId);

  return {
    error: result.error,
    store: result.data
  };
}

function getFoodBaseUrl(): string {
  loadServerEnv();
  return (process.env.FP_FOOD_URL?.trim() || "http://localhost:3002").replace(/\/+$/, "");
}

function buildUrl(baseUrl: string, path = "/", params?: Record<string, string>): string {
  const url = new URL(path, `${baseUrl}/`);

  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

function getCompanyName(companyAccess: AdminCurrentUserCompanyAccessContract): string {
  return companyAccess.company.tradeName ?? companyAccess.company.legalName;
}
