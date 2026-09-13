import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/ui/App";

describe("UI bootstrap", () => {
  it("renders the ScopePilot application shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "ScopePilot" })).toBeInTheDocument();
  });
});
