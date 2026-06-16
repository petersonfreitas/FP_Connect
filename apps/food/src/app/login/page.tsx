import { redirect } from "next/navigation";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { getCurrentUser } from "@/lib/auth";
import { signInAction } from "@/lib/auth-actions";

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
      <section className="login-panel" aria-label="Acesso ao FP Food">
        <div>
          <div className="brand-mark">FP Food</div>
          <div className="eyebrow">Modulo operacional</div>
          <h1>Acesse sua loja</h1>
          <p>Use o mesmo usuario do FP Connect para operar empresas com modulo Food liberado.</p>
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
