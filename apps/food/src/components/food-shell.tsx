import Link from "next/link";
import type { ReactNode } from "react";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { requireCurrentUser } from "@/lib/auth";
import { signOutAction } from "@/lib/auth-actions";

type FoodShellProps = {
  activePath: string;
  children: ReactNode;
};

const navigation = {
  primary: [{ href: "/cadastro/loja", label: "Loja" }],
  groups: [
    {
      label: "Cadastro",
      items: [
        { href: "/cadastro/loja", label: "Loja" },
        { href: "/cadastro/categorias", label: "Categorias" },
        { href: "/cadastro/produtos", label: "Produtos" }
      ]
    },
    {
      label: "Movimentacao",
      items: [
        { href: "/movimentacao/cardapio", label: "Cardapio" },
        { href: "/movimentacao/pedidos", label: "Pedidos" },
        { href: "/movimentacao/cozinha", label: "Cozinha" },
        { href: "/movimentacao/entregas", label: "Entregas" }
      ]
    }
  ]
};

export async function FoodShell({ activePath, children }: FoodShellProps) {
  const user = await requireCurrentUser();

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <Link className="sidebar-brand-text" href="/cadastro/loja">
          FP Food
        </Link>
        <nav className="nav-list">
          {navigation.primary.map((item) => (
            <Link
              className={isActiveNavigationItem(activePath, item.href) ? "nav-item active" : "nav-item"}
              href={item.href}
              key={item.href}
              prefetch={false}
            >
              {item.label}
            </Link>
          ))}

          {navigation.groups.map((group) => (
            <details className="nav-group" key={group.label} open>
              <summary>{group.label}</summary>
              <div className="nav-group-items">
                {group.items.map((item) => (
                  <Link
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

function isActiveNavigationItem(activePath: string, href: string): boolean {
  return activePath === href || activePath.startsWith(`${href}/`);
}
