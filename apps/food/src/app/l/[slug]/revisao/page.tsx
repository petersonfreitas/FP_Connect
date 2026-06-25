import { Notice } from "@/components/page-feedback";
import { PublicCartReview } from "@/components/public-cart-review";
import { getCurrentPublicStoreUser } from "@/lib/auth";
import {
  ensurePublicFoodCustomerStoreAccess,
  getPublicFoodCheckout,
  getPublicFoodMenu
} from "@/lib/internal-api";
import { createFallbackPublicStoreContext } from "@/lib/public-store-urls";

type PublicCartReviewPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PublicCartReviewPage({ params }: PublicCartReviewPageProps) {
  const { slug } = await params;
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
      {customerSessionResult?.error ? (
        <Notice
          tone="danger"
          message={`Nao foi possivel preparar seu cadastro nesta loja: ${customerSessionResult.error}`}
        />
      ) : null}
      <PublicCartReview
        addresses={customerSessionResult?.data?.addresses ?? []}
        checkout={checkoutResult.data}
        hasSavedPaymentMethods={
          (customerSessionResult?.data?.paymentMethods.length ?? 0) > 0
        }
        isAuthenticated={Boolean(currentUser)}
        isCustomerCompleteForCheckout={
          customerSessionResult?.data?.isCompleteForCheckout ?? false
        }
        menu={menuResult.data}
        storeContext={storeContext}
      />
    </>
  );
}
