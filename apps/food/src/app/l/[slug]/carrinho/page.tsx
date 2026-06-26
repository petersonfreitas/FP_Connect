import { PublicCartManager } from "@/components/public-cart-manager";
import { getCurrentPublicStoreUser } from "@/lib/auth";
import { getPublicFoodMenu } from "@/lib/internal-api";
import { createFallbackPublicStoreContext } from "@/lib/public-store-urls";

type PublicCartPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PublicCartPage({ params }: PublicCartPageProps) {
  const { slug } = await params;
  const storeContext = createFallbackPublicStoreContext(slug);
  const [menuResult, currentUser] = await Promise.all([
    getPublicFoodMenu(storeContext.publicSlug),
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

  return (
    <PublicCartManager
      customerEmail={currentUser?.email}
      isAuthenticated={Boolean(currentUser)}
      menu={menuResult.data}
      storeContext={storeContext}
    />
  );
}
