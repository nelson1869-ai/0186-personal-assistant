import { useState } from "react";
import { Button } from "../../components/shared/Button";
import { Icon } from "../../components/shared/Icon";
import { cn } from "../../lib/utils";
import type { ChatMessage as ChatMessageModel } from "../../types/chat";

export function ChatMessage({ message, canRegenerate, onRegenerate, onRetry }: { message: ChatMessageModel; canRegenerate: boolean; onRegenerate: () => void; onRetry: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <article className={cn("group flex gap-3 py-5", message.role === "user" && "justify-end")} aria-label={`${message.role} message`}>
      {message.role === "assistant" && <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent"><Icon name="spark" className="size-4" /></div>}
      <div className={cn("min-w-0 max-w-[min(680px,86%)]", message.role === "user" && "rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-white dark:text-neutral-950")}>
        <div className="whitespace-pre-wrap text-sm leading-6">
          {message.content || (message.status === "streaming" ? <span className="text-ink-muted">Thinking</span> : null)}
          {message.status === "streaming" && <span className="streaming-cursor ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-accent" aria-label="Assistant is streaming" />}
        </div>
        {message.role === "assistant" && message.status !== "streaming" && (
          <div className="mt-2 flex min-h-8 items-center gap-1">
            {message.content && <Button size="compact" variant="ghost" onClick={() => void copy()} aria-label="Copy message"><Icon name="copy" className="size-3.5" />{copied ? "Copied" : "Copy"}</Button>}
            {canRegenerate && message.status !== "error" && <Button size="compact" variant="ghost" onClick={onRegenerate} aria-label="Regenerate response"><Icon name="refresh" className="size-3.5" />Regenerate</Button>}
            {message.status === "error" && <Button size="compact" variant="danger" onClick={onRetry} aria-label="Retry response"><Icon name="retry" className="size-3.5" />Retry</Button>}
            {message.status === "stopped" && <span className="px-2 text-xs text-ink-muted">Generation stopped</span>}
          </div>
        )}
      </div>
    </article>
  );
}
