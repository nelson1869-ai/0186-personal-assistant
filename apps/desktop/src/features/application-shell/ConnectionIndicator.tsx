import { Button } from "../../components/shared/Button";
import type { ConnectionState } from "../../hooks/useBackendHealth";
import { cn } from "../../lib/utils";

export function ConnectionIndicator({ connection, onRetry }: { connection: ConnectionState; onRetry: () => void }) {
  const online = connection.kind === "online";
  return (
    <div className="flex items-center gap-2" aria-live="polite" title={connection.kind === "offline" ? connection.message : undefined}>
      <span className={cn("size-2 rounded-full", connection.kind === "loading" ? "animate-pulse bg-amber-500" : online ? "bg-success" : "bg-danger")} />
      <span className="hidden text-xs text-ink-muted sm:inline">
        {connection.kind === "loading" ? "Connecting" : online ? "Backend connected" : "Backend disconnected"}
      </span>
      {connection.kind === "offline" && <Button size="compact" variant="ghost" onClick={onRetry}>Retry</Button>}
    </div>
  );
}
