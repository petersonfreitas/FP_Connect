import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AppShellProps = {
  activePath?: string;
  children: ReactNode;
};

const cadastroItems = [
  { href: "/cadastro/empresas", label: "Empresas" },
  { href: "/cadastro/usuarios", label: "Usuarios" },
  { href: "/", label: "Planos" },
  { href: "/", label: "Modulos" }
];

const movimentacaoItems = [
  { href: "/", label: "Modulos contratados" },
  { href: "/movimentacao/auditoria", label: "Auditoria" }
];

export function AppShell({ activePath = "/", children }: AppShellProps) {
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
        </nav>
        <div className="sidebar-foot">
          <Image src="/brand/icon.png" alt="" width={40} height={40} />
          <span>FP Connect Foundation</span>
        </div>
      </aside>

      <section className="workspace">{children}</section>
    </main>
  );
}
