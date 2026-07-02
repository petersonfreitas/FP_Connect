import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { signInAction } from "@/lib/auth-actions";
import { getCurrentUser } from "@/lib/auth";
import { RecoveryHashRedirect } from "./recovery-hash-redirect";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
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
  const next = normalizeRedirectPath(params?.next ?? "");

  return (
    <main className="login-screen">
      <RecoveryHashRedirect />
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
          <input name="next" type="hidden" value={next} />
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
          <PendingSubmitButton pendingLabel="Entrando...">Entrar</PendingSubmitButton>
        </form>

        <Link className="auth-link" href="/login/recuperar-senha">
          Esqueci minha senha
        </Link>
      </section>
    </main>
  );
}

function normalizeRedirectPath(value: string): string {
  const path = value.trim();

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "";
  }

  if (path.startsWith("/login")) {
    return "";
  }

  return path;
}
