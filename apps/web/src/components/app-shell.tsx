import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/lib/auth-actions";
import { requireCurrentUser } from "@/lib/auth";

type AppShellProps = {
  activePath?: string;
  children: ReactNode;
};

const cadastroItems = [
  { href: "/cadastro/empresas", label: "Empresas" },
  { href: "/cadastro/usuarios", label: "Usuarios" },
  { href: "/cadastro/planos", label: "Planos" },
  { href: "/cadastro/modulos", label: "Modulos" }
];

const movimentacaoItems = [
  { href: "/movimentacao/modulos-contratados", label: "Modulos contratados" }
];

const auditoriaItems = [
  { href: "/auditoria", label: "Visao geral" },
  { href: "/auditoria/empresas", label: "Empresas" },
  { href: "/auditoria/usuarios", label: "Usuarios" },
  { href: "/auditoria/modulos", label: "Modulos e permissoes" },
  { href: "/auditoria/sistema", label: "Sistema" }
];

export async function AppShell({ activePath = "/", children }: AppShellProps) {
  const user = await requireCurrentUser();

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <div className="sidebar-brand">
          <Image src="/brand/logo-b.png" alt="FP WebTech" width={270} height={95} priority />
        </div>
        <nav className="nav-list">
          <Link className={activePath === "/" ? "nav-item active" : "nav-item"} href="/">
            Portal
          </Link>

          <details className="nav-group" open>
            <summary>Cadastro</summary>
            <div className="nav-group-items">
              {cadastroItems.map((item) => (
                <Link
                  className={activePath === item.href ? "nav-item active" : "nav-item"}
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>

          <details className="nav-group" open>
            <summary>Movimentacao</summary>
            <div className="nav-group-items">
              {movimentacaoItems.map((item) => (
                <Link
                  className={activePath === item.href ? "nav-item active" : "nav-item"}
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>

          <details className="nav-group" open>
            <summary>Auditoria</summary>
            <div className="nav-group-items">
              {auditoriaItems.map((item) => (
                <Link
                  className={activePath === item.href ? "nav-item active" : "nav-item"}
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>
        <div className="sidebar-foot">
          <Image src="/brand/icon.png" alt="" width={40} height={40} />
          <div className="sidebar-user">
            <span>{user.email ?? "Usuario autenticado"}</span>
            <small>FP Connect Foundation</small>
          </div>
          <form action={signOutAction}>
            <button className="logout-button" type="submit">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <section className="workspace">{children}</section>
    </main>
  );
}
