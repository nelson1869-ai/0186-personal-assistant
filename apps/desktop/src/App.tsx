import type { AssistantService } from "./services/assistant-service";
import { ApplicationShell } from "./features/application-shell/ApplicationShell";
import { mockAssistantService } from "./services/mock-assistant-service";
import type { Conversation } from "./types/chat";

export interface AppProps {
  assistantService?: AssistantService;
  initialConversations?: Conversation[];
}

export function App({
  assistantService = mockAssistantService,
  initialConversations,
}: AppProps) {
  return (
    <ApplicationShell
      assistantService={assistantService}
      initialConversations={initialConversations}
    />
  );
}
