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

type NavGroupMeta = {
  description: string;
  icon: string;
};

const fallbackNavigation: AdminNavigationContract = {
  primary: [{ href: "/", label: "Portal" }],
  groups: []
};

const navGroupMeta: Record<string, NavGroupMeta> = {
  Auditoria: {
    description: "Logs, rastros e operacao",
    icon: "AU"
  },
  Cadastro: {
    description: "Base administrativa",
    icon: "CD"
  },
  Carteira: {
    description: "Empresas e suporte",
    icon: "CE"
  },
  "Minhas empresas": {
    description: "Carteira e suporte",
    icon: "ME"
  },
  Movimentacao: {
    description: "Contratos e operacao",
    icon: "MV"
  },
  Sistemas: {
    description: "Modulos operacionais",
    icon: "SI"
  }
};

export async function AppShell({ access, accessError, activePath = "/", children }: AppShellProps) {
  const user = await requireCurrentUser();
  const accessResult = access === undefined ? await getCurrentAdminAccess() : null;
  const resolvedAccess = access ?? accessResult?.data ?? null;
  const navigation = normalizeNavigation(resolvedAccess?.navigation ?? fallbackNavigation);
  const navigationError = accessError ?? accessResult?.error ?? null;
  const isFallbackNavigation = !resolvedAccess?.navigation;
  const accountLabel = resolvedAccess?.user.fullName ?? user.email ?? "Usuario autenticado";
  const accountDetail = resolvedAccess
    ? formatGlobalRole(resolvedAccess.user.globalRole, resolvedAccess.isSuperAdmin)
    : "FP Connect Foundation";

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <div className="sidebar-brand">
          <Image src="/brand/logo-b.png" alt="FP WebTech" width={270} height={95} priority />
          <span>Console</span>
        </div>
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
              open={shouldOpenNavigationGroup(activePath, group)}
            >
              <summary>
                <span className="nav-group-icon" aria-hidden="true">
                  {getNavigationGroupMeta(group.label).icon}
                </span>
                <span className="nav-group-copy">
                  <strong>{group.label}</strong>
                  <small>{getNavigationGroupMeta(group.label).description}</small>
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
            <span>{accountLabel}</span>
            <small>{accountDetail}</small>
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

function getNavigationGroupMeta(label: string): NavGroupMeta {
  return (
    navGroupMeta[label] ?? {
      description: "Area do Console",
      icon: label.slice(0, 2).toUpperCase()
    }
  );
}

function getNavigationItemIcon(href: string, label: string): string {
  if (href === "/") {
    return "IN";
  }

  if (href.startsWith("/robots")) {
    return "RB";
  }

  if (href.startsWith("/gateway")) {
    return "GW";
  }

  return label.slice(0, 2).toUpperCase();
}

function shouldOpenNavigationGroup(
  activePath: string,
  group: AdminNavigationContract["groups"][number]
): boolean {
  return (
    isActiveNavigationGroup(activePath, group) ||
    ["Cadastro", "Carteira", "Minhas empresas", "Movimentacao", "Sistemas"].includes(group.label)
  );
}

function isActiveNavigationGroup(
  activePath: string,
  group: AdminNavigationContract["groups"][number]
): boolean {
  return group.items.some((item) => isActiveNavigationItem(activePath, item.href));
}

function isActiveNavigationItem(activePath: string, href: string): boolean {
  const cleanHref = href.split("?")[0];

  if (cleanHref === "/") {
    return activePath === "/";
  }

  return activePath === cleanHref || activePath.startsWith(`${cleanHref}/`);
}

function formatGlobalRole(
  role: AdminCurrentUserAccessContract["user"]["globalRole"],
  isSuperAdmin: boolean
): string {
  if (isSuperAdmin || role === "super_admin") {
    return "Superadmin";
  }

  if (role === "fp_admin") {
    return "Admin do Console";
  }

  if (role === "support") {
    return "Suporte";
  }

  return "Usuario da empresa";
}

function normalizeNavigation(navigation: AdminNavigationContract): AdminNavigationContract {
  return {
    primary: navigation.primary,
    groups: navigation.groups.map((group) => {
      if (group.label !== "Minhas empresas" && group.label !== "Carteira") {
        return group;
      }

      return {
        label: "Carteira",
        items: [{ href: "/carteira/empresas", label: "Carteira de empresas" }]
      };
    })
  };
}
