import {
  createPublicFoodOrderAction,
  trackPublicFoodOrderAction
} from "@/app/actions";
import { PublicStorefront } from "@/components/public-storefront";
import { Notice } from "@/components/page-feedback";
import { getPublicFoodMenu } from "@/lib/internal-api";

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
  const menuResult = await getPublicFoodMenu(slug);

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
    <>
      {query?.error ? <Notice tone="danger" message={query.error} /> : null}
      <PublicStorefront
        createOrderAction={createPublicFoodOrderAction}
        menu={menuResult.data}
        trackOrderAction={trackPublicFoodOrderAction}
      />
    </>
  );
}
