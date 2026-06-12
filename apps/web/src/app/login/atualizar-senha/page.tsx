import Image from "next/image";
import Link from "next/link";
import { UpdatePasswordForm } from "./update-password-form";

type UpdatePasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="login-screen">
      <section className="login-panel" aria-label="Atualizacao de senha">
        <Image src="/brand/logo.png" alt="FP WebTech" width={250} height={88} priority />
        <div>
          <div className="eyebrow">Nova senha</div>
          <h1>Atualize sua senha</h1>
          <p>Use o link recebido por e-mail para definir uma nova senha de acesso.</p>
        </div>

        {error ? (
          <div className="form-error" role="status">
            {error}
          </div>
        ) : null}

        <UpdatePasswordForm />

        <Link className="auth-link" href="/login">
          Voltar para o login
        </Link>
      </section>
    </main>
  );
}
