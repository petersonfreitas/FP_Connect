import Link from "next/link";
import type { ReactNode } from "react";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { requireCurrentUser } from "@/lib/auth";
import { signOutAction } from "@/lib/auth-actions";

type FoodShellProps = {
  activePath: string;
  children: ReactNode;
};

type FoodNavigationGroup = {
  description: string;
  icon: string;
  items: Array<{
    href: string;
    label: string;
  }>;
  label: string;
};

const navigation = {
  primary: [{ href: "/", label: "Dashboard" }],
  groups: [
    {
      description: "Loja e cardapio publico",
      icon: "LJ",
      label: "Gestao da loja",
      items: [
        { href: "/cadastro/loja", label: "Loja" },
        { href: "/cadastro/horarios", label: "Horarios" },
        { href: "/movimentacao/cardapio", label: "Cardapio" }
      ]
    },
    {
      description: "Base do cardapio",
      icon: "CD",
      label: "Cadastro",
      items: [
        { href: "/cadastro/categorias", label: "Categorias" },
        { href: "/cadastro/produtos", label: "Produtos" }
      ]
    },
    {
      description: "Pedido, cozinha e entrega",
      icon: "MV",
      label: "Movimentacao",
      items: [
        { href: "/movimentacao/atendimento", label: "Atendimento" },
        { href: "/movimentacao/pedidos", label: "Pedidos" },
        { href: "/movimentacao/cozinha", label: "Cozinha" },
        { href: "/movimentacao/entregas", label: "Entregas" },
        { href: "/movimentacao/estoque", label: "Estoque" }
      ]
    }
  ]
};

export async function FoodShell({ activePath, children }: FoodShellProps) {
  const user = await requireCurrentUser();

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <Link className="sidebar-brand-text" href="/">
          <strong>FP Food</strong>
          <span>Operacao da loja</span>
        </Link>
        <nav className="nav-list">
          <div className="nav-primary">
            {navigation.primary.map((item) => (
              <Link
                aria-current={isActiveNavigationItem(activePath, item.href) ? "page" : undefined}
                className={
                  isActiveNavigationItem(activePath, item.href) ? "nav-item active" : "nav-item"
                }
                href={item.href}
                key={item.href}
                prefetch={false}
              >
                <span className="nav-item-icon" aria-hidden="true">
                  {getNavigationItemIcon(item.href, item.label)}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {navigation.groups.map((group) => (
            <details
              className={isActiveNavigationGroup(activePath, group) ? "nav-group active" : "nav-group"}
              key={group.label}
              open
            >
              <summary>
                <span className="nav-group-icon" aria-hidden="true">
                  {group.icon}
                </span>
                <span className="nav-group-copy">
                  <strong>{group.label}</strong>
                  <small>{group.description}</small>
                </span>
                <span className="nav-group-count">{group.items.length}</span>
              </summary>
              <div className="nav-group-items">
                {group.items.map((item) => (
                  <Link
                    aria-current={isActiveNavigationItem(activePath, item.href) ? "page" : undefined}
                    className={
                      isActiveNavigationItem(activePath, item.href) ? "nav-item active" : "nav-item"
                    }
                    href={item.href}
                    key={`${group.label}:${item.href}`}
                    prefetch={false}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <div className="workspace-account" aria-label="Usuario logado">
          <span className="workspace-account-avatar" aria-hidden="true">
            FD
          </span>
          <div className="workspace-user">
            <span>{user.email ?? "Usuario autenticado"}</span>
            <small>FP Food</small>
          </div>
          <form action={signOutAction}>
            <PendingSubmitButton className="logout-button" pendingLabel="Saindo...">
              Sair
            </PendingSubmitButton>
          </form>
        </div>
        {children}
      </section>
    </main>
  );
}

function getNavigationItemIcon(href: string, label: string): string {
  if (href === "/") {
    return "IN";
  }

  return label.slice(0, 2).toUpperCase();
}

function isActiveNavigationGroup(activePath: string, group: FoodNavigationGroup): boolean {
  return group.items.some((item) => isActiveNavigationItem(activePath, item.href));
}

function isActiveNavigationItem(activePath: string, href: string): boolean {
  const cleanHref = href.split("?")[0];

  if (cleanHref === "/") {
    return activePath === "/";
  }

  return activePath === cleanHref || activePath.startsWith(`${cleanHref}/`);
}
