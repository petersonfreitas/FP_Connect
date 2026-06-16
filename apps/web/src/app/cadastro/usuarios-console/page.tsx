import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PaginationControls } from "@/components/pagination-controls";
import { getCurrentAdminAccess, listAdminUsers } from "@/lib/internal-api";

export const dynamic = "force-dynamic";
const pageSize = 20;

type ConsoleUsersPageProps = {
  searchParams?: Promise<{
    created?: string;
    page?: string;
  }>;
};

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  invited: "Convidado"
};

const globalRoleLabels = {
  company_user: "Usuario da empresa",
  fp_admin: "Admin do Console",
  super_admin: "Superadmin",
  support: "Suporte"
};

export default async function ConsoleUsersPage({ searchParams }: ConsoleUsersPageProps) {
  const query = searchParams ? await searchParams : {};
  const page = normalizePage(query.page);
  const [accessResult, usersResult] = await Promise.all([
    getCurrentAdminAccess(),
    listAdminUsers({ page, pageSize, scope: "platform" })
  ]);
  const access = accessResult.data;
  const isSuperAdmin = access?.isSuperAdmin === true;
  const canInviteSupport = isSuperAdmin || access?.user.globalRole === "fp_admin";
  const pagination = usersResult.data;
  const users = pagination?.items ?? [];
  const pageTitle = isSuperAdmin ? "Equipe interna da plataforma" : "Equipe de suporte";
  const pageDescription = isSuperAdmin
    ? "Superadmins, admins do Console e suporte operacional da FPWebTech."
    : "Suportes que podem ser vinculados as empresas da sua carteira.";

  return (
    <AppShell activePath="/cadastro/usuarios-console">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Usuarios do Console</strong>
        </div>
        {canInviteSupport ? (
          <Link className="primary-action" href="/cadastro/usuarios-console/novo">
            {isSuperAdmin ? "Novo usuario interno" : "Novo suporte"}
          </Link>
        ) : null}
      </header>

      {accessResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar seu acesso atual.</strong>
          <span>{accessResult.error}</span>
        </section>
      ) : null}

      {usersResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar usuarios do Console.</strong>
          <span>{usersResult.error}</span>
        </section>
      ) : null}

      {query.created ? (
        <section className="form-alert neutral" role="status">
          Convite enviado para {query.created}.
        </section>
      ) : null}

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageDescription}</p>
          </div>
          <span>{pagination?.total ?? 0} registro(s)</span>
        </div>

        {users.length > 0 ? (
          <div className="data-table" role="table" aria-label="Usuarios do Console">
            <div className="data-row data-row-head users-row" role="row">
              <span>Usuario</span>
              <span>E-mail</span>
              <span>Papel</span>
              <span>Status</span>
              <span />
            </div>
            {users.map((user) => (
              <div className="data-row users-row" role="row" key={user.id}>
                <span>
                  <strong>{user.fullName}</strong>
                  <small>{user.id}</small>
                </span>
                <span>{user.email ?? "Nao informado"}</span>
                <span>
                  <strong>{globalRoleLabels[user.globalRole] ?? "Usuario interno"}</strong>
                  <small>Console</small>
                </span>
                <span>{statusLabels[user.status]}</span>
                {isSuperAdmin ? (
                  <Link
                    href={`/cadastro/usuarios/${user.id}/editar?returnTo=${encodeURIComponent(
                      `/cadastro/usuarios-console?page=${page}`
                    )}`}
                  >
                    Editar
                  </Link>
                ) : (
                  <span>-</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Nenhum usuario interno cadastrado ainda.</div>
        )}

        {pagination ? (
          <PaginationControls
            basePath="/cadastro/usuarios-console"
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
          />
        ) : null}
      </section>
    </AppShell>
  );
}

function normalizePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
