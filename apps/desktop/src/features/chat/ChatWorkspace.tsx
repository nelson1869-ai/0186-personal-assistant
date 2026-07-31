import type { ReturnTypeOfChatController } from "./chat-controller-types";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";
import { WelcomeState } from "./WelcomeState";

export function ChatWorkspace({ chat }: { chat: ReturnTypeOfChatController }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto" data-testid="chat-scroll-region">
        {chat.selectedConversation ? (
          <MessageList messages={chat.selectedConversation.messages} onRegenerate={chat.regenerate} onRetry={chat.retry} />
        ) : (
          <WelcomeState onSuggestion={chat.setDraft} />
        )}
      </div>
      {chat.generationError && <div role="alert" className="mx-auto mb-2 w-[calc(100%-2rem)] max-w-[704px] rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-xs text-danger">{chat.generationError}</div>}
      <MessageComposer value={chat.draft} onChange={chat.setDraft} onSend={chat.send} onStop={chat.stop} isGenerating={chat.isGenerating} />
    </div>
  );
}
