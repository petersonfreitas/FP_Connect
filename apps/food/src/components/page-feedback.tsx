export function Notice({
  message,
  tone
}: {
  message: string;
  tone: "danger" | "success" | "warning";
}) {
  return (
    <div className={`notice ${tone}`} role="status">
      {message}
    </div>
  );
}

export function EmptyFoodAccess() {
  return (
    <section className="empty-state">
      <h1>Nenhuma empresa Food liberada</h1>
      <p>
        Libere o modulo FP Food para uma empresa no FP Console e vincule o usuario a um papel com
        permissao de acesso.
      </p>
    </section>
  );
}
