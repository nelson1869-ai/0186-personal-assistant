import type { AssistantRequest, AssistantService } from "./assistant-service";

const DEFAULT_RESPONSE =
  "I can help you organize that. For now, I’m responding from the local Phase 2 mock service, so no prompt leaves this device.";

function wait(duration: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Generation stopped", "AbortError"));
      return;
    }
    const timeout = window.setTimeout(resolve, duration);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException("Generation stopped", "AbortError"));
      },
      { once: true },
    );
  });
}

class MockAssistantService implements AssistantService {
  async *streamResponse(request: AssistantRequest, signal: AbortSignal): AsyncIterable<string> {
    if (request.prompt.toLowerCase().includes("simulate an error")) {
      await wait(180, signal);
      throw new Error("The local mock service could not complete this response.");
    }

    const response = request.prompt.toLowerCase().includes("privacy")
      ? "Your privacy is the priority. This simulated response is generated locally and is not sent to an external AI provider."
      : DEFAULT_RESPONSE;

    for (const token of response.match(/\S+\s*/g) ?? []) {
      await wait(28, signal);
      yield token;
    }
  }
}

export const mockAssistantService: AssistantService = new MockAssistantService();
