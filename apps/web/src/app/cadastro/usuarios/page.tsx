import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { listAdminUsers } from "@/lib/internal-api";

export const dynamic = "force-dynamic";

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  invited: "Convidado"
};

export default async function UsersPage() {
  const usersResult = await listAdminUsers();
  const users = usersResult.data ?? [];

  return (
    <AppShell activePath="/cadastro/usuarios">
      <header className="topbar">
        <div>
          <div className="eyebrow">Cadastro</div>
          <strong>Usuarios</strong>
        </div>
        <Link className="primary-action" href="/cadastro/usuarios/novo">
          Novo usuario
        </Link>
      </header>

      {usersResult.error ? (
        <section className="data-alert" role="status">
          <strong>Nao foi possivel carregar usuarios.</strong>
          <span>{usersResult.error}</span>
        </section>
      ) : null}

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h1>Usuarios cadastrados</h1>
            <p>Perfis centrais do core, prontos para vinculo com empresas.</p>
          </div>
          <span>{users.length} registro(s)</span>
        </div>

        {users.length > 0 ? (
          <div className="data-table" role="table" aria-label="Usuarios cadastrados">
            <div className="data-row data-row-head" role="row">
              <span>Usuario</span>
              <span>E-mail</span>
              <span>Status</span>
              <span />
            </div>
            {users.map((user) => (
              <div className="data-row" role="row" key={user.id}>
                <span>
                  <strong>{user.fullName}</strong>
                  <small>{user.id}</small>
                </span>
                <span>{user.email ?? "Nao informado"}</span>
                <span>{statusLabels[user.status]}</span>
                <Link href={`/cadastro/usuarios/${user.id}/editar`}>Editar</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            Nenhum usuario cadastrado ainda. Crie um usuario e vincule a uma empresa.
          </div>
        )}
      </section>
    </AppShell>
  );
}
