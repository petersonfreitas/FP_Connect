import Image from "next/image";
import { redirect } from "next/navigation";
import { signInAction } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="login-screen">
      <section className="login-panel" aria-label="Acesso ao FP Connect">
        <Image src="/brand/logo.png" alt="FP WebTech" width={250} height={88} priority />
        <div>
          <div className="eyebrow">Admin Console</div>
          <h1>Acesse o FP Connect</h1>
          <p>Use seu usuario do Supabase Auth para administrar empresas, modulos e permissoes.</p>
        </div>

        {error ? (
          <div className="form-error" role="status">
            {error}
          </div>
        ) : null}

        <form action={signInAction} className="auth-form">
          <label>
            E-mail
            <input autoComplete="email" maxLength={254} name="email" required type="email" />
          </label>
          <label>
            Senha
            <input
              autoComplete="current-password"
              maxLength={128}
              name="password"
              required
              type="password"
            />
          </label>
          <button className="primary-action" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
