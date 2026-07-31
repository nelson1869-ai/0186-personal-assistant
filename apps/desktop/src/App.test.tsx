import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows a connected state when the API is healthy", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", service: "assistant-api", version: "0.1.0" })),
    );

    render(<App />);

    expect(await screen.findByText("Local service connected")).toBeInTheDocument();
    expect(screen.getByText("assistant-api · v0.1.0")).toBeInTheDocument();
  });

  it("offers a retry when the API cannot be reached", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Connection refused"));

    render(<App />);

    expect(await screen.findByText("Local service unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
