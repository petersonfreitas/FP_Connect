import Link from "next/link";
import { publicCustomerSignOutAction } from "@/lib/auth-actions";
import {
  storeOrderUrl,
  storeUrl,
  type PublicStoreUrlContext
} from "@/lib/public-store-urls";

type PublicCustomerMenuProps = {
  active: "account" | "menu" | "order";
  contactPhone?: string | null;
  isAuthenticated?: boolean;
  orderNumber?: string;
  storeContext: PublicStoreUrlContext;
};

export function PublicCustomerMenu({
  active,
  contactPhone,
  isAuthenticated = false,
  orderNumber,
  storeContext
}: PublicCustomerMenuProps) {
  const menuHref = storeUrl(storeContext);
  const accountHref = storeUrl(storeContext, "/conta");
  const orderHref = orderNumber ? storeOrderUrl(storeContext, orderNumber) : undefined;

  return (
    <nav className="public-customer-menu" aria-label="Menu do cliente">
      <Link className="public-customer-brand" href={menuHref}>
        FP Food
      </Link>
      <div>
        <Link className={active === "menu" ? "active" : ""} href={menuHref}>
          Cardapio
        </Link>
        {orderHref ? (
          <Link className={active === "order" ? "active" : ""} href={orderHref}>
            Meu pedido
          </Link>
        ) : (
          <a href="#meus-pedidos">Meus pedidos</a>
        )}
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
