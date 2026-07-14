import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("renders with primary variant by default", () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-brand-600");
  });

  it("renders with secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("border-slate-200");
  });

  it("renders with ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("text-slate-600");
  });

  it("applies fullWidth class", () => {
    render(<Button fullWidth>Full</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("w-full");
  });

  it("does not apply fullWidth by default", () => {
    render(<Button>Not full</Button>);
    const button = screen.getByRole("button");
    expect(button.className).not.toContain("w-full");
  });

  it("applies disabled styles when disabled", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.className).toContain("disabled:opacity-70");
  });

  it("passes HTML attributes", () => {
    render(<Button type="submit" aria-label="Submit form">Send</Button>);
    const button = screen.getByRole("button", { name: "Submit form" });
    expect(button).toHaveAttribute("type", "submit");
  });
});
