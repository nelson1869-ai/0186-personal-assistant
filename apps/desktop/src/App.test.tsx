import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import type { AssistantService } from "./services/assistant-service";

function connectedBackend() {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ status: "ok", service: "assistant-api", version: "0.1.0" })),
  );
}

function responseService(responses: string[]): AssistantService {
  let call = 0;
  return {
    async *streamResponse() {
      yield responses[Math.min(call, responses.length - 1)];
      call += 1;
    },
  };
}

function submit(value: string) {
  const composer = screen.getByRole("textbox", { name: "Message 0186" });
  fireEvent.change(composer, { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
}

describe("Phase 2 chat application", () => {
  beforeEach(() => {
    window.localStorage.clear();
    connectedBackend();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows the empty welcome state", async () => {
    render(<App assistantService={responseService(["Hello"])} />);
    expect(screen.getByRole("heading", { name: "How can I help today?" })).toBeInTheDocument();
    expect(await screen.findByText("Backend connected")).toBeInTheDocument();
  });

  it("sends a user message and completes a streamed assistant response", async () => {
    let release: (() => void) | undefined;
    const service: AssistantService = {
      async *streamResponse() {
        yield "A streamed";
        await new Promise<void>((resolve) => { release = resolve; });
        yield " response";
      },
    };
    render(<App assistantService={service} initialConversations={[]} />);
    submit("Help me focus");
    expect(screen.getByLabelText("user message")).toHaveTextContent("Help me focus");
    expect(await screen.findByText(/A streamed/)).toBeInTheDocument();
    expect(screen.getByLabelText("Assistant is streaming")).toBeInTheDocument();
    await act(async () => release?.());
    expect(await screen.findByText("A streamed response")).toBeInTheDocument();
  });

  it("stops generation", async () => {
    const service: AssistantService = {
      async *streamResponse(_request, signal) {
        yield "Partial response";
        await new Promise<void>((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Stopped", "AbortError")), { once: true }));
      },
    };
    render(<App assistantService={service} initialConversations={[]} />);
    submit("Start something long");
    expect(await screen.findByText("Partial response")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop generation" }));
    expect(await screen.findByText("Generation stopped")).toBeInTheDocument();
  });

  it("retries after a service failure", async () => {
    let attempts = 0;
    const service: AssistantService = {
      async *streamResponse() {
        attempts += 1;
        if (attempts === 1) throw new Error("Mock service unavailable");
        yield "Recovered response";
      },
    };
    render(<App assistantService={service} initialConversations={[]} />);
    submit("Please retry this");
    expect(await screen.findByRole("alert")).toHaveTextContent("Mock service unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry response" }));
    expect(await screen.findByText("Recovered response")).toBeInTheDocument();
  });

  it("regenerates the latest response", async () => {
    render(<App assistantService={responseService(["First answer", "Second answer"])} initialConversations={[]} />);
    submit("Give me an answer");
    expect(await screen.findByText("First answer")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Regenerate response" }));
    expect(await screen.findByText("Second answer")).toBeInTheDocument();
    expect(screen.queryByText("First answer")).not.toBeInTheDocument();
  });

  it("submits with Enter", async () => {
    render(<App assistantService={responseService(["Keyboard response"])} initialConversations={[]} />);
    const composer = screen.getByRole("textbox", { name: "Message 0186" });
    fireEvent.change(composer, { target: { value: "Sent by keyboard" } });
    fireEvent.keyDown(composer, { key: "Enter", shiftKey: false });
    expect(screen.getByLabelText("user message")).toHaveTextContent("Sent by keyboard");
    expect(await screen.findByText("Keyboard response")).toBeInTheDocument();
  });

  it("allows Shift+Enter without submitting", () => {
    render(<App assistantService={responseService(["Unused"])} initialConversations={[]} />);
    const composer = screen.getByRole("textbox", { name: "Message 0186" });
    fireEvent.change(composer, { target: { value: "First line" } });
    expect(fireEvent.keyDown(composer, { key: "Enter", shiftKey: true })).toBe(true);
    fireEvent.change(composer, { target: { value: "First line\nSecond line" } });
    expect(composer).toHaveValue("First line\nSecond line");
    expect(screen.queryByLabelText("user message")).not.toBeInTheDocument();
  });

  it("switches between mock conversations", () => {
    render(<App assistantService={responseService(["Unused"])} />);
    fireEvent.click(screen.getByRole("button", { name: "Plan my week" }));
    const workspace = screen.getByRole("region", { name: "Chat workspace" });
    expect(within(workspace).getByText("Help me make a focused plan for the week.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Organize project notes" }));
    expect(within(workspace).getByText("How should I structure notes for this project?")).toBeInTheDocument();
  });

  it("shows connected backend metadata", async () => {
    render(<App assistantService={responseService(["Unused"])} />);
    expect(await screen.findByText("Backend connected")).toBeInTheDocument();
  });

  it("shows a disconnected backend and retries connectivity", async () => {
    vi.mocked(globalThis.fetch)
      .mockRejectedValueOnce(new Error("Connection refused"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "ok", service: "assistant-api", version: "0.1.0" })));
    render(<App assistantService={responseService(["Unused"])} />);
    expect(await screen.findByText("Backend disconnected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Backend connected")).toBeInTheDocument();
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
  });
});
