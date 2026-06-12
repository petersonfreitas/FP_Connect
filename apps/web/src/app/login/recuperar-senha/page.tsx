import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requestPasswordRecoveryAction } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/auth";

type RecoverPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    sent?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function RecoverPasswordPage({ searchParams }: RecoverPasswordPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const error = params?.error;
  const sent = params?.sent === "1";

  return (
    <main className="login-screen">
      <section className="login-panel" aria-label="Recuperacao de senha">
        <Image src="/brand/logo.png" alt="FP WebTech" width={250} height={88} priority />
        <div>
          <div className="eyebrow">Recuperacao de senha</div>
          <h1>Receba um link seguro</h1>
          <p>Informe o e-mail cadastrado para receber o link de redefinicao de senha.</p>
        </div>

        {error ? (
          <div className="form-error" role="status">
            {error}
          </div>
        ) : null}

        {sent ? (
          <div className="form-success" role="status">
            Se o e-mail existir no Supabase Auth, o link de recuperacao sera enviado.
          </div>
        ) : null}

        <form action={requestPasswordRecoveryAction} className="auth-form">
          <label>
            E-mail
            <input autoComplete="email" maxLength={254} name="email" required type="email" />
          </label>
          <button className="primary-action" type="submit">
            Enviar link
          </button>
        </form>

        <Link className="auth-link" href="/login">
          Voltar para o login
        </Link>
      </section>
    </main>
  );
}
