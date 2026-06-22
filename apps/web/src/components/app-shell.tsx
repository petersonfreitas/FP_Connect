import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminCurrentUserAccessContract, AdminNavigationContract } from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { signOutAction } from "@/lib/auth-actions";
import { requireCurrentUser } from "@/lib/auth";
import { getCurrentAdminAccess } from "@/lib/internal-api";

type AppShellProps = {
  accessError?: string | null;
  activePath?: string;
  access?: AdminCurrentUserAccessContract | null;
  children: ReactNode;
};

const fallbackNavigation: AdminNavigationContract = {
  primary: [{ href: "/", label: "Portal" }],
  groups: []
};

export async function AppShell({ access, accessError, activePath = "/", children }: AppShellProps) {
  const user = await requireCurrentUser();
  const accessResult = access === undefined ? await getCurrentAdminAccess() : null;
  const navigation = access?.navigation ?? accessResult?.data?.navigation ?? fallbackNavigation;
  const navigationError = accessError ?? accessResult?.error ?? null;
  const isFallbackNavigation = navigation === fallbackNavigation;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <div className="sidebar-brand">
          <Image src="/brand/logo-b.png" alt="FP WebTech" width={270} height={95} priority />
        </div>
        <nav className="nav-list">
          {navigation.primary.map((item) => (
            <Link
              className={isActiveNavigationItem(activePath, item.href) ? "nav-item active" : "nav-item"}
              href={item.href}
              key={item.href}
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
                    key={`${group.label}:${item.href}:${item.label}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
          ))}

          {isFallbackNavigation && navigationError ? (
            <div className="nav-status" role="status">
              <strong>Navegacao indisponivel</strong>
              <span>Permissoes nao carregadas agora. Recarregue a pagina em instantes.</span>
            </div>
          ) : null}
        </nav>
      </aside>

      <section className="workspace">
        <div className="workspace-account" aria-label="Usuario logado">
          <Image src="/brand/icon.png" alt="" width={36} height={36} />
          <div className="workspace-user">
            <span>{user.email ?? "Usuario autenticado"}</span>
            <small>FP Connect Foundation</small>
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
  return activePath === href || activePath === href.split("?")[0];
}
