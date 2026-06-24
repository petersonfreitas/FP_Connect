import {
  createPublicFoodOrderAction,
  trackPublicFoodOrderAction
} from "@/app/actions";
import { PublicStorefront } from "@/components/public-storefront";
import { Notice } from "@/components/page-feedback";
import { getCurrentPublicStoreUser } from "@/lib/auth";
import {
  ensurePublicFoodCustomerStoreAccess,
  getPublicFoodCheckout,
  getPublicFoodMenu
} from "@/lib/internal-api";
import { createFallbackPublicStoreContext } from "@/lib/public-store-urls";

type PublicStorePageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    signedOut?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PublicStorePage({
  params,
  searchParams
}: PublicStorePageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const storeContext = createFallbackPublicStoreContext(slug);
  const [menuResult, checkoutResult, currentUser] = await Promise.all([
    getPublicFoodMenu(storeContext.publicSlug),
    getPublicFoodCheckout(storeContext.publicSlug),
    getCurrentPublicStoreUser(storeContext.publicSlug)
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
    ? await ensurePublicFoodCustomerStoreAccess(storeContext.publicSlug, {
        authUserId: currentUser.id,
        email: currentUser.email
      })
    : null;

  return (
    <>
      {query?.error ? <Notice tone="danger" message={query.error} /> : null}
      {query?.signedOut ? <Notice tone="success" message="Voce saiu desta loja." /> : null}
      {customerSessionResult?.error ? (
        <Notice
          tone="danger"
          message={`Nao foi possivel preparar seu cadastro nesta loja: ${customerSessionResult.error}`}
        />
      ) : null}
      <PublicStorefront
        addresses={customerSessionResult?.data?.addresses ?? []}
        checkout={checkoutResult.data}
        createOrderAction={createPublicFoodOrderAction}
        isAuthenticated={Boolean(currentUser)}
        isCustomerCompleteForCheckout={
          customerSessionResult?.data?.isCompleteForCheckout ?? false
        }
        menu={menuResult.data}
        storeContext={storeContext}
        trackOrderAction={trackPublicFoodOrderAction}
      />
    </>
  );
}
