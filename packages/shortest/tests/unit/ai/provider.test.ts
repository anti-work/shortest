import { describe, expect, it, vi } from "vitest";
import { createProvider } from "@/ai/provider";
import { AIConfig } from "@/types";

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn(() => (model: string) => ({ model })),
}));

describe("createProvider", () => {
  it("creates an Anthropic provider with correct config", () => {
    const config: AIConfig = {
      provider: "anthropic",
      apiKey: "test-key",
      model: "claude-3-7-sonnet-20250219",
    };

    const provider = createProvider(config);
    expect(provider).toEqual({ model: "claude-3-7-sonnet-20250219" });
  });

  it("throws AIError for unsupported provider", () => {
    const config = {
      provider: "unsupported",
      apiKey: "test-key",
      model: "claude-3-7-sonnet-20250219",
    } as unknown as AIConfig;

    expect(() => createProvider(config)).toThrow(
      "unsupported is not supported.",
    );
  });
});
