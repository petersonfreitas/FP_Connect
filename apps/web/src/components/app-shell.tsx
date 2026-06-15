import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminCurrentUserAccessContract, AdminNavigationContract } from "@fp/types";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { signOutAction } from "@/lib/auth-actions";
import { requireCurrentUser } from "@/lib/auth";
import { getCurrentAdminAccess } from "@/lib/internal-api";

type AppShellProps = {
  activePath?: string;
  access?: AdminCurrentUserAccessContract | null;
  children: ReactNode;
};

const fallbackNavigation: AdminNavigationContract = {
  primary: [{ href: "/", label: "Portal" }],
  groups: []
};

export async function AppShell({ access, activePath = "/", children }: AppShellProps) {
  const user = await requireCurrentUser();
  const accessResult = access === undefined ? await getCurrentAdminAccess() : null;
  const navigation = access?.navigation ?? accessResult?.data?.navigation ?? fallbackNavigation;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <div className="sidebar-brand">
          <Image src="/brand/logo-b.png" alt="FP WebTech" width={270} height={95} priority />
        </div>
        <nav className="nav-list">
          {navigation.primary.map((item) => (
            <Link
              className={activePath === item.href ? "nav-item active" : "nav-item"}
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
                    className={activePath === item.href ? "nav-item active" : "nav-item"}
                    href={item.href}
                    key={`${group.label}:${item.href}:${item.label}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Image src="/brand/icon.png" alt="" width={40} height={40} />
          <div className="sidebar-user">
            <span>{user.email ?? "Usuario autenticado"}</span>
            <small>FP Connect Foundation</small>
          </div>
          <form action={signOutAction}>
            <PendingSubmitButton className="logout-button" pendingLabel="Saindo...">
              Sair
            </PendingSubmitButton>
          </form>
        </div>
      </aside>

      <section className="workspace">{children}</section>
    </main>
  );
}
