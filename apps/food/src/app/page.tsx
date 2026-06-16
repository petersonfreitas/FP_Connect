import Link from "next/link";
import type { AdminCurrentUserCompanyAccessContract, FoodStoreContract } from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { getCurrentUser } from "@/lib/auth";
import { signOutAction } from "@/lib/auth-actions";
import { getCurrentAdminAccess, getFoodAccess, getFoodStore } from "@/lib/internal-api";
import { saveFoodStoreAction } from "./actions";

type HomePageProps = {
  searchParams?: Promise<{
    companyId?: string;
    error?: string;
    saved?: string;
  }>;
};

export const dynamic = "force-dynamic";

const statusOptions = [
  ["implementation", "Implementacao"],
  ["open", "Aberta"],
  ["closed", "Fechada"],
  ["suspended", "Suspensa"]
] as const;

export default async function HomePage({ searchParams }: HomePageProps) {
  const [user, accessResult] = await Promise.all([getCurrentUser(), getCurrentAdminAccess()]);
  const params = await searchParams;

  if (!user) {
    return null;
  }

  const foodCompanies = accessResult.data
    ? accessResult.data.companies.filter((companyAccess) =>
        companyAccess.modules.some((module) => module.applicationKey === "food")
      )
    : [];
  const selectedCompany =
    foodCompanies.find((companyAccess) => companyAccess.company.id === params?.companyId) ??
    foodCompanies[0] ??
    null;
  const foodAccessResult = selectedCompany
    ? await getFoodAccess(selectedCompany.company.id)
    : { data: null, error: null };
  const storeResult =
    selectedCompany && !foodAccessResult.error
      ? await getFoodStore(selectedCompany.company.id)
      : { data: null, error: null };
  const missingStore =
    storeResult.error?.includes("404") || storeResult.error?.includes("ainda nao configurada");
  const store = storeResult.data;

  return (
    <main className="app-screen">
      <header className="topbar">
        <Link className="brand-mark" href="/">
          FP Food
        </Link>
        <div className="session-box">
          <span>{accessResult.data?.user.fullName ?? user.email ?? "Usuario"}</span>
          <small>{user.email}</small>
          <form action={signOutAction}>
            <button className="ghost-button" type="submit">
              Sair
            </button>
          </form>
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow">Operacao da loja</div>
          <h1>Configuracao inicial do FP Food</h1>
          <p>
            Esta primeira tela prepara a empresa Food para receber cardapio, pedidos e automacoes
            conectadas ao FP Robots.
          </p>
        </div>
      </section>

      {accessResult.error ? <Notice tone="danger" message={accessResult.error} /> : null}
      {params?.error ? <Notice tone="danger" message={params.error} /> : null}
      {params?.saved ? <Notice tone="success" message="Loja Food salva com sucesso." /> : null}

      {foodCompanies.length > 0 ? (
        <div className="company-switcher" aria-label="Empresas com FP Food">
          {foodCompanies.map((companyAccess) => (
            <Link
              className={
                companyAccess.company.id === selectedCompany?.company.id
                  ? "company-pill active"
                  : "company-pill"
              }
              href={`/?companyId=${companyAccess.company.id}`}
              key={companyAccess.company.id}
            >
              {displayCompanyName(companyAccess)}
            </Link>
          ))}
        </div>
      ) : null}

      {!selectedCompany ? (
        <EmptyState />
      ) : foodAccessResult.error ? (
        <Notice tone="danger" message={foodAccessResult.error} />
      ) : storeResult.error && !missingStore ? (
        <Notice tone="danger" message={storeResult.error} />
      ) : (
        <StoreForm company={selectedCompany} store={store} />
      )}
    </main>
  );
}

function StoreForm({
  company,
  store
}: {
  company: AdminCurrentUserCompanyAccessContract;
  store: FoodStoreContract | null;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">Empresa selecionada</div>
          <h2>{displayCompanyName(company)}</h2>
        </div>
        <span className="status-chip">{store ? "Configurada" : "Primeira configuracao"}</span>
      </div>

      <form action={saveFoodStoreAction} className="store-form">
        <input name="companyId" type="hidden" value={company.company.id} />

        <label>
          Nome publico da loja
          <input
            defaultValue={store?.displayName ?? company.company.tradeName ?? company.company.legalName}
            maxLength={120}
            name="displayName"
            required
          />
        </label>

        <label>
          Slug publico
          <input
            defaultValue={store?.publicSlug ?? suggestSlug(company)}
            maxLength={80}
            name="publicSlug"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </label>

        <div className="form-grid">
          <label>
            Status operacional
            <select defaultValue={store?.status ?? "implementation"} name="status">
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tempo de preparo
            <input
              defaultValue={store?.preparationTimeMinutes ?? ""}
              min={0}
              max={600}
              name="preparationTimeMinutes"
              type="number"
            />
          </label>
        </div>

        <label>
          Telefone de contato
          <input defaultValue={store?.contactPhone ?? ""} maxLength={40} name="contactPhone" />
        </label>

        <label>
          Observacoes de entrega
          <textarea
            defaultValue={store?.deliveryNotes ?? ""}
            maxLength={600}
            name="deliveryNotes"
            rows={4}
          />
        </label>

        <div className="form-footer">
          <span>Salvar emite o evento food.store.configured para o FP Robots.</span>
          <PendingSubmitButton pendingLabel="Salvando...">Salvar loja</PendingSubmitButton>
        </div>
      </form>
    </section>
  );
}

function Notice({ message, tone }: { message: string; tone: "danger" | "success" }) {
  return (
    <div className={`notice ${tone}`} role="status">
      {message}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="empty-state">
      <h2>Nenhuma empresa Food liberada</h2>
      <p>
        Libere o modulo FP Food para uma empresa no FP Console e vincule o usuario a um papel com
        permissao de acesso.
      </p>
    </section>
  );
}

function displayCompanyName(companyAccess: AdminCurrentUserCompanyAccessContract): string {
  return companyAccess.company.tradeName ?? companyAccess.company.legalName;
}

function suggestSlug(companyAccess: AdminCurrentUserCompanyAccessContract): string {
  return displayCompanyName(companyAccess)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
