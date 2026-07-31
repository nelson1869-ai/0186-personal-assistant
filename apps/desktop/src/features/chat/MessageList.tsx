import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageModel } from "../../types/chat";
import { ChatMessage } from "./ChatMessage";

export function MessageList({ messages, onRegenerate, onRetry }: { messages: ChatMessageModel[]; onRegenerate: () => void; onRetry: () => void }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView?.({ block: "end", behavior: "smooth" }); }, [messages]);
  const lastAssistantId = [...messages].reverse().find((message) => message.role === "assistant")?.id;
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-2 sm:px-8">
      {messages.map((message) => <ChatMessage key={message.id} message={message} canRegenerate={message.id === lastAssistantId} onRegenerate={onRegenerate} onRetry={onRetry} />)}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
