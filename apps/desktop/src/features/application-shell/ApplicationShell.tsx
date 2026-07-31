import { useState } from "react";
import { Button } from "../../components/shared/Button";
import { Icon } from "../../components/shared/Icon";
import { useBackendHealth } from "../../hooks/useBackendHealth";
import { useTheme } from "../../hooks/useTheme";
import type { AssistantService } from "../../services/assistant-service";
import type { Conversation } from "../../types/chat";
import { ChatWorkspace } from "../chat/ChatWorkspace";
import { useChatController } from "../chat/useChatController";
import { ConversationSidebar } from "../conversations/ConversationSidebar";
import { ConnectionIndicator } from "./ConnectionIndicator";

export function ApplicationShell({ assistantService, initialConversations }: { assistantService: AssistantService; initialConversations?: Conversation[] }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const chat = useChatController(assistantService, initialConversations);
  const { connection, retry } = useBackendHealth();
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="flex h-dvh min-h-[520px] overflow-hidden bg-canvas text-ink">
      <ConversationSidebar conversations={chat.conversations} selectedId={chat.selectedId} onSelect={chat.selectConversation} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
      <section className="flex min-w-0 flex-1 flex-col" aria-label="Chat workspace">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-panel px-4 sm:px-6">
          <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold">{chat.selectedConversation?.title ?? "New conversation"}</h2><p className="text-[11px] text-ink-muted">Mock assistant · Local UI preview</p></div>
          <ConnectionIndicator connection={connection} onRetry={() => void retry()} />
          <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}><Icon name={theme === "dark" ? "sun" : "moon"} className="size-4" /></Button>
        </header>
        <ChatWorkspace chat={chat} />
      </section>
    </main>
  );
}
