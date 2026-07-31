import { useCallback, useEffect, useState } from "react";
import { getHealth, type HealthResponse } from "@0186/api-client";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

type ConnectionState =
  | { kind: "loading" }
  | { kind: "online"; health: HealthResponse }
  | { kind: "offline"; message: string };

export function App() {
  const [connection, setConnection] = useState<ConnectionState>({ kind: "loading" });

  const checkConnection = useCallback(async () => {
    setConnection({ kind: "loading" });
    try {
      const health = await getHealth(apiBaseUrl);
      setConnection({ kind: "online", health });
    } catch (error) {
      setConnection({
        kind: "offline",
        message: error instanceof Error ? error.message : "Unable to reach the local API",
      });
    }
  }, []);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  const online = connection.kind === "online";

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="app-title">
        <span className="eyebrow">Local-first assistant</span>
        <h1 id="app-title">0186</h1>
        <p className="subtitle">Your private workspace for thoughtful, controlled assistance.</p>

        <div className="status-card" aria-live="polite">
          <span className={`status-dot ${online ? "online" : ""}`} aria-hidden="true" />
          <div>
            <strong>
              {connection.kind === "loading"
                ? "Checking local service…"
                : online
                  ? "Local service connected"
                  : "Local service unavailable"}
            </strong>
            <p>
              {online
                ? `${connection.health.service} · v${connection.health.version}`
                : connection.kind === "offline"
                  ? connection.message
                  : "Connecting securely on this device"}
            </p>
          </div>
          {connection.kind === "offline" && (
            <button type="button" onClick={() => void checkConnection()}>
              Try again
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
