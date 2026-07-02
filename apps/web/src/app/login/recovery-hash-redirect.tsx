"use client";

import { useEffect } from "react";

export function RecoveryHashRedirect() {
  useEffect(() => {
    const hash = window.location.hash;

    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const hasRecoveryToken = params.has("access_token");
    const type = params.get("type");

    if (!hasRecoveryToken || (type && type !== "recovery")) {
      return;
    }

    window.location.replace(`/login/atualizar-senha${hash}`);
  }, []);

  return null;
}
