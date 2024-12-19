import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Homepage from "./page";
import { ClerkProvider, SignedOut, SignedIn } from "@clerk/nextjs";

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));

vi.mock("@clerk/nextjs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ClerkProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    SignedOut: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe("Homepage", () => {
  it("renders the correct heading", () => {
    render(
      <ClerkProvider>
        <Homepage />
      </ClerkProvider>
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "QA via natural language"
    );
  });
});
