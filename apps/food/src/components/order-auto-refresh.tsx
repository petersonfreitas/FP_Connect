"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OrderAutoRefreshProps = {
  intervalSeconds?: number;
  refreshOnFocus?: boolean;
  refreshOnMount?: boolean;
};

export function OrderAutoRefresh({
  intervalSeconds = 30,
  refreshOnFocus = false,
  refreshOnMount = false
}: OrderAutoRefreshProps) {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const refresh = useCallback(() => {
    router.refresh();
    setLastRefresh(new Date());
  }, [router]);

  useEffect(() => {
    const intervalMs = intervalSeconds * 1000;
    const interval = window.setInterval(refresh, intervalMs);

    return () => window.clearInterval(interval);
  }, [intervalSeconds, refresh]);

  useEffect(() => {
    if (refreshOnMount) {
      refresh();
    }
  }, [refresh, refreshOnMount]);

  useEffect(() => {
    if (!refreshOnFocus) {
      return;
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh, refreshOnFocus]);

  return (
    <span className="auto-refresh-note">
      Atualizacao automatica a cada {intervalSeconds}s
      {lastRefresh ? ` - ultima: ${lastRefresh.toLocaleTimeString("pt-BR")}` : ""}
    </span>
  );
}
