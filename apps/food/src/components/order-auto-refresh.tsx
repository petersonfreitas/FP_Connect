"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OrderAutoRefreshProps = {
  intervalSeconds?: number;
};

export function OrderAutoRefresh({ intervalSeconds = 30 }: OrderAutoRefreshProps) {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    const intervalMs = intervalSeconds * 1000;
    const interval = window.setInterval(() => {
      router.refresh();
      setLastRefresh(new Date());
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [intervalSeconds, router]);

  return (
    <span className="auto-refresh-note">
      Atualizacao automatica a cada {intervalSeconds}s
      {lastRefresh ? ` - ultima: ${lastRefresh.toLocaleTimeString("pt-BR")}` : ""}
    </span>
  );
}
