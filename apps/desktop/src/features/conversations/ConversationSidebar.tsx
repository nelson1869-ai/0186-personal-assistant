import { Button } from "../../components/shared/Button";
import { Icon } from "../../components/shared/Icon";
import { cn } from "../../lib/utils";
import type { Conversation } from "../../types/chat";

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function ConversationSidebar({ conversations, selectedId, onSelect, collapsed, onToggle }: ConversationSidebarProps) {
  return (
    <aside className={cn("flex h-full shrink-0 flex-col border-r border-line bg-panel transition-[width] max-[760px]:w-[72px]", collapsed ? "w-[72px]" : "w-[272px]")} aria-label="Conversation navigation">
      <div className="flex h-16 items-center gap-3 border-b border-line px-4">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-xs font-bold text-white dark:text-neutral-950">01</div>
        {!collapsed && <div className="min-w-0 max-[760px]:hidden"><strong className="block text-sm tracking-tight">0186 Assistant</strong><span className="block text-[11px] text-ink-muted">Local workspace</span></div>}
        <Button className="ml-auto" size="icon" variant="ghost" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}><Icon name="menu" className="size-4" /></Button>
      </div>

      <div className="p-3">
        <Button variant="primary" className={cn("w-full", collapsed && "px-0")} onClick={() => onSelect(null)} aria-label="New conversation">
          <Icon name="plus" className="size-4" />{!collapsed && <span className="max-[760px]:hidden">New conversation</span>}
        </Button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3" aria-label="Conversation history">
        {!collapsed && <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[.12em] text-ink-muted max-[760px]:hidden">Recent</p>}
        <ul className="space-y-1">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                aria-current={selectedId === conversation.id ? "page" : undefined}
                aria-label={collapsed ? conversation.title : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-panel-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  selectedId === conversation.id && "bg-accent-soft text-ink",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon name="message" className="size-4 shrink-0" />
                {!collapsed && <span className="truncate max-[760px]:hidden">{conversation.title}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-line p-3">
        <Button variant="ghost" className={cn("w-full justify-start", collapsed && "justify-center px-0")} aria-label="Settings placeholder">
          <Icon name="settings" className="size-4" />{!collapsed && <span className="max-[760px]:hidden">Settings</span>}
        </Button>
      </div>
    </aside>
  );
}
