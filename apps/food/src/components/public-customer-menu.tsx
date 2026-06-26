import Link from "next/link";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { publicCustomerSignOutAction } from "@/lib/auth-actions";
import {
  storeOrdersUrl,
  storeUrl,
  type PublicStoreUrlContext
} from "@/lib/public-store-urls";

type PublicCustomerMenuProps = {
  active: "account" | "cart" | "menu" | "order" | "orders" | "review";
  contactPhone?: string | null;
  customerEmail?: string | null;
  isAuthenticated?: boolean;
  storeContext: PublicStoreUrlContext;
};

export function PublicCustomerMenu({
  active,
  contactPhone,
  customerEmail,
  isAuthenticated = false,
  storeContext
}: PublicCustomerMenuProps) {
  const menuHref = storeUrl(storeContext);
  const accountHref = storeUrl(storeContext, "/conta");
  const cartHref = storeUrl(storeContext, "/carrinho");
  const ordersHref = storeOrdersUrl(storeContext);

  return (
    <nav className="public-customer-menu" aria-label="Menu do cliente">
      <Link className="public-customer-brand" href={menuHref}>
        FP Food
      </Link>
      <div className="public-customer-links">
        <Link className={active === "menu" ? "active" : ""} href={menuHref}>
          Cardapio
        </Link>
        <Link className={active === "cart" || active === "review" ? "active" : ""} href={cartHref}>
          Carrinho
        </Link>
        <Link className={active === "order" || active === "orders" ? "active" : ""} href={ordersHref}>
          Meus pedidos
        </Link>
        <Link className={active === "account" ? "active" : ""} href={accountHref}>
          Minha conta
        </Link>
        {contactPhone ? <a href={`tel:${contactPhone}`}>Ajuda</a> : <a href="#ajuda">Ajuda</a>}
      </div>
      <div className="public-account-badge" aria-label="Conta do cliente">
        <span className="public-account-avatar" aria-hidden="true">
          {getAccountInitial(customerEmail)}
        </span>
        <div className="public-account-user">
          <span>{isAuthenticated ? customerEmail ?? "Cliente autenticado" : "Visitante"}</span>
          <small>{isAuthenticated ? "Food publico" : "Entre para comprar"}</small>
        </div>
        {isAuthenticated ? (
          <form action={publicCustomerSignOutAction}>
            <input name="publicSlug" type="hidden" value={storeContext.publicSlug} />
            <PendingSubmitButton className="logout-button" pendingLabel="Saindo...">
              Sair
            </PendingSubmitButton>
          </form>
        ) : (
          <Link className="logout-button" href={storeUrl(storeContext, "/entrar")}>
            Entrar
          </Link>
        )}
      </div>
    </nav>
  );
}

function getAccountInitial(email: string | null | undefined): string {
  const normalized = email?.trim();
  return normalized ? normalized.slice(0, 1).toUpperCase() : "CL";
}
