import { redirect } from "next/navigation";
import {
  savePublicCustomerAddressAction,
  savePublicCustomerProfileAction,
  setPublicCustomerPrimaryAddressAction
} from "@/app/actions";
import { Notice } from "@/components/page-feedback";
import { PublicCustomerAddressesForm } from "@/components/public-customer-addresses-form";
import { PublicCustomerMenu } from "@/components/public-customer-menu";
import { PublicCustomerProfileForm } from "@/components/public-customer-profile-form";
import { getCurrentPublicStoreUser } from "@/lib/auth";
import {
  ensurePublicFoodCustomerStoreAccess,
  getPublicFoodMenu
} from "@/lib/internal-api";
import {
  createFallbackPublicStoreContext,
  storeLoginUrl,
  storeUrl
} from "@/lib/public-store-urls";

type PublicCustomerAccountPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    addressPrimary?: string;
    addressSaved?: string;
    error?: string;
    saved?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PublicCustomerAccountPage({
  params,
  searchParams
}: PublicCustomerAccountPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const storeContext = createFallbackPublicStoreContext(slug);
  const accountPath = storeUrl(storeContext, "/conta");
  const currentUser = await getCurrentPublicStoreUser(storeContext.publicSlug);

  if (!currentUser) {
    redirect(storeLoginUrl(storeContext, accountPath));
  }

  const [menuResult, customerSessionResult] = await Promise.all([
    getPublicFoodMenu(storeContext.publicSlug),
    ensurePublicFoodCustomerStoreAccess(storeContext.publicSlug, {
      authUserId: currentUser.id,
      email: currentUser.email
    })
  ]);
  const session = customerSessionResult.data;

  return (
    <main className="public-store">
      <PublicCustomerMenu
        active="account"
        contactPhone={menuResult.data?.store.contactPhone}
        isAuthenticated
        storeContext={storeContext}
      />

      {query?.saved ? <Notice tone="success" message="Cadastro atualizado." /> : null}
      {query?.addressSaved ? <Notice tone="success" message="Endereco cadastrado." /> : null}
      {query?.addressPrimary ? (
        <Notice tone="success" message="Endereco padrao atualizado." />
      ) : null}
      {query?.error ? <Notice tone="danger" message={query.error} /> : null}
      {customerSessionResult.error ? (
        <Notice
          tone="danger"
          message={`Nao foi possivel preparar seu cadastro nesta loja: ${customerSessionResult.error}`}
        />
      ) : null}

      <section className="public-hero">
        <div>
          <div className="eyebrow">Minha conta</div>
          <h1>Dados para finalizar pedidos</h1>
          <p>
            Estes dados ficam vinculados ao seu login e a esta loja para liberar o checkout.
          </p>
        </div>
        <a className="secondary-action" href={storeUrl(storeContext)}>
          Voltar ao cardapio
        </a>
      </section>

      <section className="public-account-panel">
        <div>
          <div className="eyebrow">Status</div>
          <h2>
            {session?.isCompleteForCheckout
              ? "Cadastro pronto para compra"
              : "Complete para comprar"}
          </h2>
          <p>
            Login: <strong>{currentUser.email ?? "email nao informado"}</strong>
          </p>
        </div>

        <PublicCustomerProfileForm
          action={savePublicCustomerProfileAction}
          publicSlug={storeContext.publicSlug}
          session={session}
        />
      </section>

      <PublicCustomerAddressesForm
        addresses={session?.addresses ?? []}
        publicSlug={storeContext.publicSlug}
        saveAction={savePublicCustomerAddressAction}
        setPrimaryAction={setPublicCustomerPrimaryAddressAction}
      />
    </main>
  );
}
