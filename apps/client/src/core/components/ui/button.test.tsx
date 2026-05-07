import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "../test-utils";
import { Button } from "./button";

// Basic smoke/unit tests for Button

describe("Button", () => {
  it("renders the button with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("passes props to the button", () => {
    render(
      <Button type="submit" data-testid="btn-test">
        Submit
      </Button>
    );
    const btn = screen.getByTestId("btn-test");
    expect(btn).toHaveAttribute("type", "submit");
  });

  it("calls onClick handler", () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>Press</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(fn).toHaveBeenCalled();
  });
});
