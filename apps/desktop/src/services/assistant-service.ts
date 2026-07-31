export interface AssistantRequest {
  conversationId: string;
  prompt: string;
}

export interface AssistantService {
  streamResponse(request: AssistantRequest, signal: AbortSignal): AsyncIterable<string>;
}
