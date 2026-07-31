import { useCallback, useMemo, useRef, useState } from "react";
import { createId } from "../../lib/utils";
import type { AssistantService } from "../../services/assistant-service";
import type { ChatMessage, Conversation } from "../../types/chat";
import { mockConversations } from "../conversations/mock-conversations";

const now = () => new Date().toISOString();

export function useChatController(service: AssistantService, initial?: Conversation[]) {
  const [conversations, setConversations] = useState<Conversation[]>(initial ?? mockConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const updateMessage = useCallback((conversationId: string, messageId: string, update: (message: ChatMessage) => ChatMessage) => {
    setConversations((current) => current.map((conversation) => conversation.id === conversationId
      ? { ...conversation, updatedAt: now(), messages: conversation.messages.map((message) => message.id === messageId ? update(message) : message) }
      : conversation));
  }, []);

  const generate = useCallback(async (conversationId: string, userMessage: ChatMessage, assistantId: string) => {
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;
    setIsGenerating(true);
    setGenerationError(null);
    try {
      for await (const chunk of service.streamResponse({ conversationId, prompt: userMessage.content }, controller.signal)) {
        updateMessage(conversationId, assistantId, (message) => ({ ...message, content: message.content + chunk }));
      }
      updateMessage(conversationId, assistantId, (message) => ({ ...message, status: "complete" }));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        updateMessage(conversationId, assistantId, (message) => ({ ...message, status: "stopped" }));
      } else {
        const message = error instanceof Error ? error.message : "The response could not be completed.";
        setGenerationError(message);
        updateMessage(conversationId, assistantId, (current) => ({ ...current, status: "error" }));
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setIsGenerating(false);
      }
    }
  }, [service, updateMessage]);

  const send = useCallback(() => {
    const content = draft.trim();
    if (!content || isGenerating) return;

    const conversationId = selectedId ?? createId("conversation");
    const userMessage: ChatMessage = { id: createId("user"), role: "user", content, status: "complete", createdAt: now() };
    const assistantMessage: ChatMessage = { id: createId("assistant"), role: "assistant", content: "", status: "streaming", createdAt: now() };

    setConversations((current) => {
      const existing = current.find((conversation) => conversation.id === conversationId);
      if (existing) {
        return current.map((conversation) => conversation.id === conversationId
          ? { ...conversation, messages: [...conversation.messages, userMessage, assistantMessage], updatedAt: now() }
          : conversation);
      }
      return [{ id: conversationId, title: content.slice(0, 42), messages: [userMessage, assistantMessage], updatedAt: now() }, ...current];
    });
    setSelectedId(conversationId);
    setDraft("");
    void generate(conversationId, userMessage, assistantMessage.id);
  }, [draft, generate, isGenerating, selectedId]);

  const repeatLast = useCallback(() => {
    if (!selectedConversation || isGenerating) return;
    let assistantIndex = -1;
    for (let index = selectedConversation.messages.length - 1; index >= 0; index -= 1) {
      if (selectedConversation.messages[index].role === "assistant") {
        assistantIndex = index;
        break;
      }
    }
    if (assistantIndex < 1) return;
    const assistant = selectedConversation.messages[assistantIndex];
    const user = [...selectedConversation.messages.slice(0, assistantIndex)].reverse().find((message) => message.role === "user");
    if (!user) return;
    updateMessage(selectedConversation.id, assistant.id, (message) => ({ ...message, content: "", status: "streaming" }));
    void generate(selectedConversation.id, user, assistant.id);
  }, [generate, isGenerating, selectedConversation, updateMessage]);

  const stop = useCallback(() => controllerRef.current?.abort(), []);
  const selectConversation = useCallback((id: string | null) => {
    controllerRef.current?.abort();
    setSelectedId(id);
    setGenerationError(null);
  }, []);

  return {
    conversations, selectedConversation, selectedId, selectConversation,
    draft, setDraft, send, stop, regenerate: repeatLast, retry: repeatLast,
    isGenerating, generationError,
  };
}
