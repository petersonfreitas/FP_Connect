"use client";

import { useEffect, useState } from "react";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { updatePasswordWithRecoveryAction } from "@/lib/auth-actions";

type RecoveryTokens = {
  accessToken: string;
  refreshToken: string;
};

export function UpdatePasswordForm() {
  const [tokens, setTokens] = useState<RecoveryTokens | null>(null);
  const [missingToken, setMissingToken] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("access_token") ?? "";
    const refreshToken = params.get("refresh_token") ?? "";

    if (!accessToken) {
      setMissingToken(true);
      return;
    }

    setTokens({ accessToken, refreshToken });
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  if (missingToken) {
    return (
      <div className="form-error" role="status">
        Link de recuperacao invalido ou expirado. Solicite um novo link.
      </div>
    );
  }

  if (!tokens) {
    return <div className="form-success">Validando link de recuperacao...</div>;
  }

  return (
    <form action={updatePasswordWithRecoveryAction} className="auth-form">
      <input name="accessToken" type="hidden" value={tokens.accessToken} />
      <input name="refreshToken" type="hidden" value={tokens.refreshToken} />
      <label>
        Nova senha
        <input
          autoComplete="new-password"
          maxLength={128}
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label>
        Confirmar senha
        <input
          autoComplete="new-password"
          maxLength={128}
          minLength={8}
          name="confirmPassword"
          required
          type="password"
        />
      </label>
      <PendingSubmitButton pendingLabel="Atualizando...">
        Atualizar senha
      </PendingSubmitButton>
    </form>
  );
}
