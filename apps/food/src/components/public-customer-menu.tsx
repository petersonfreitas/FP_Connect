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
  const navItems = [
    {
      href: menuHref,
      icon: "CA",
      isActive: active === "menu",
      label: "Cardapio"
    },
    {
      href: cartHref,
      icon: "CR",
      isActive: active === "cart" || active === "review",
      label: "Carrinho"
    },
    {
      href: ordersHref,
      icon: "PD",
      isActive: active === "order" || active === "orders",
      label: "Pedidos"
    },
    {
      href: accountHref,
      icon: "CO",
      isActive: active === "account",
      label: "Conta"
    }
  ];

  return (
    <nav className="public-customer-menu" aria-label="Menu do cliente">
      <Link className="public-customer-brand" href={menuHref}>
        <span className="public-brand-icon" aria-hidden="true">
          FP
        </span>
        <span>
          <strong>FP Food</strong>
          <small>Vitrine publica</small>
        </span>
      </Link>
      <div className="public-customer-links">
        {navItems.map((item) => (
          <Link
            className={item.isActive ? "public-nav-link active" : "public-nav-link"}
            href={item.href}
            key={item.label}
          >
            <span className="public-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
        <a className="public-nav-link" href={contactPhone ? `tel:${contactPhone}` : "#ajuda"}>
          <span className="public-nav-icon" aria-hidden="true">
            AJ
          </span>
          <span>Ajuda</span>
        </a>
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
