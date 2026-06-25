import Link from "next/link";
import { publicCustomerSignOutAction } from "@/lib/auth-actions";
import {
  storeOrdersUrl,
  storeUrl,
  type PublicStoreUrlContext
} from "@/lib/public-store-urls";

type PublicCustomerMenuProps = {
  active: "account" | "cart" | "menu" | "order" | "orders" | "review";
  contactPhone?: string | null;
  isAuthenticated?: boolean;
  storeContext: PublicStoreUrlContext;
};

export function PublicCustomerMenu({
  active,
  contactPhone,
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
      <div>
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
        {isAuthenticated ? (
          <form action={publicCustomerSignOutAction} className="public-customer-menu-form">
            <input name="publicSlug" type="hidden" value={storeContext.publicSlug} />
            <button type="submit">Sair</button>
          </form>
        ) : null}
      </div>
    </nav>
  );
}
