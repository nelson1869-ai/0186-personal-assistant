import { useCallback, useEffect, useState } from "react";
import { getHealth, type HealthResponse } from "@0186/api-client";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type ConnectionState =
  | { kind: "loading" }
  | { kind: "online"; health: HealthResponse }
  | { kind: "offline"; message: string };

export function useBackendHealth() {
  const [connection, setConnection] = useState<ConnectionState>({ kind: "loading" });
  const retry = useCallback(async () => {
    setConnection({ kind: "loading" });
    try {
      setConnection({ kind: "online", health: await getHealth(apiBaseUrl) });
    } catch (error) {
      setConnection({
        kind: "offline",
        message: error instanceof Error ? error.message : "Unable to reach the local API",
      });
    }
  }, []);

  useEffect(() => { void retry(); }, [retry]);
  return { connection, retry };
}
