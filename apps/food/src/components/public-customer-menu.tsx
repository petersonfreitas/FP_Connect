import Link from "next/link";

type PublicCustomerMenuProps = {
  active: "menu" | "order";
  contactPhone?: string | null;
  orderNumber?: string;
  slug: string;
};

export function PublicCustomerMenu({
  active,
  contactPhone,
  orderNumber,
  slug
}: PublicCustomerMenuProps) {
  const menuHref = `/l/${encodeURIComponent(slug)}`;
  const orderHref = orderNumber
    ? `${menuHref}/pedido/${encodeURIComponent(orderNumber)}`
    : undefined;

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
        {contactPhone ? <a href={`tel:${contactPhone}`}>Ajuda</a> : <a href="#ajuda">Ajuda</a>}
      </div>
    </nav>
  );
}
