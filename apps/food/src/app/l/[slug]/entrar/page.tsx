import Link from "next/link";
import { redirect } from "next/navigation";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Notice } from "@/components/page-feedback";
import { PublicCustomerMenu } from "@/components/public-customer-menu";
import { getCurrentPublicStoreUser } from "@/lib/auth";
import { publicCustomerSignInAction } from "@/lib/auth-actions";
import { getPublicFoodMenu } from "@/lib/internal-api";
import {
  createFallbackPublicStoreContext,
  normalizeStoreRedirectPath,
  storeUrl
} from "@/lib/public-store-urls";

type PublicStoreLoginPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PublicStoreLoginPage({
  params,
  searchParams
}: PublicStoreLoginPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const storeContext = createFallbackPublicStoreContext(slug);
  const currentUser = await getCurrentPublicStoreUser(storeContext.publicSlug);
  const next = normalizeStoreRedirectPath(query?.next ?? "", storeContext);

  if (currentUser) {
    redirect(next);
  }

  const menuResult = await getPublicFoodMenu(storeContext.publicSlug);
  const storeName = menuResult.data?.store.displayName ?? "esta loja";

  return (
    <main className="public-store">
      <PublicCustomerMenu
        active="menu"
        contactPhone={menuResult.data?.store.contactPhone}
        isAuthenticated={Boolean(currentUser)}
        storeContext={storeContext}
      />

      {query?.error ? <Notice tone="danger" message={query.error} /> : null}

      <section className="login-screen public-login-screen">
        <div className="login-panel" aria-label={`Entrar para comprar em ${storeName}`}>
          <div>
            <div className="brand-mark">FP Food</div>
            <div className="eyebrow">Cliente da loja</div>
            <h1>Entrar para comprar em {storeName}</h1>
            <p>Acesse sua conta para finalizar o pedido e acompanhar suas compras nesta loja.</p>
          </div>

          <form action={publicCustomerSignInAction} className="auth-form">
            <input name="publicSlug" type="hidden" value={storeContext.publicSlug} />
            <input name="next" type="hidden" value={next} />
            <label>
              E-mail
              <input autoComplete="email" maxLength={254} name="email" required type="email" />
            </label>
            <label>
              Senha
              <input
                autoComplete="current-password"
                maxLength={128}
                name="password"
                required
                type="password"
              />
            </label>
            <PendingSubmitButton pendingLabel="Entrando...">Entrar</PendingSubmitButton>
          </form>

          <div className="public-login-links">
            <Link className="secondary-action" href={storeUrl(storeContext)}>
              Voltar ao cardapio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
