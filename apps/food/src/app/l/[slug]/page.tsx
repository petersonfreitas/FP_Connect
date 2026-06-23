import {
  createPublicFoodOrderAction,
  trackPublicFoodOrderAction
} from "@/app/actions";
import { PublicStorefront } from "@/components/public-storefront";
import { Notice } from "@/components/page-feedback";
import { getCurrentUser } from "@/lib/auth";
import {
  ensurePublicFoodCustomerStoreAccess,
  getPublicFoodCheckout,
  getPublicFoodMenu
} from "@/lib/internal-api";

type PublicStorePageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PublicStorePage({
  params,
  searchParams
}: PublicStorePageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [menuResult, checkoutResult, currentUser] = await Promise.all([
    getPublicFoodMenu(slug),
    getPublicFoodCheckout(slug),
    getCurrentUser()
  ]);

  if (menuResult.error || !menuResult.data) {
    return (
      <main className="public-store public-store-message">
        <section className="public-hero">
          <div>
            <div className="eyebrow">FP Food</div>
            <h1>Loja indisponivel</h1>
            <p>{menuResult.error ?? "Nao foi possivel carregar esta loja."}</p>
          </div>
        </section>
      </main>
    );
  }

  const customerSessionResult = currentUser
    ? await ensurePublicFoodCustomerStoreAccess(slug, {
        authUserId: currentUser.id,
        email: currentUser.email
      })
    : null;

  return (
    <>
      {query?.error ? <Notice tone="danger" message={query.error} /> : null}
      {customerSessionResult?.error ? (
        <Notice
          tone="danger"
          message={`Nao foi possivel preparar seu cadastro nesta loja: ${customerSessionResult.error}`}
        />
      ) : null}
      <PublicStorefront
        checkout={checkoutResult.data}
        createOrderAction={createPublicFoodOrderAction}
        isAuthenticated={Boolean(currentUser)}
        menu={menuResult.data}
        trackOrderAction={trackPublicFoodOrderAction}
      />
    </>
  );
}
