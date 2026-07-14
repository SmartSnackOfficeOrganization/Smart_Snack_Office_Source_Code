import { render, screen } from "@testing-library/react";
import { FormField } from "@/components/ui/FormField";

describe("FormField", () => {
  it("renders label", () => {
    render(<FormField label="Email" name="email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders input by default", () => {
    render(<FormField label="Name" name="name" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders children instead of default input", () => {
    render(
      <FormField label="Password" name="password">
        <input data-testid="custom-input" type="password" />
      </FormField>,
    );
    expect(screen.getByTestId("custom-input")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows error message with role='alert'", () => {
    render(<FormField label="Email" name="email" error="Email is required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
  });

  it("applies error border class", () => {
    render(<FormField label="Email" name="email" error="Invalid" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-red-400");
  });

  it("sets aria-invalid when error is present", () => {
    render(<FormField label="Email" name="email" error="Invalid" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows hint when no error", () => {
    render(<FormField label="Email" name="email" hint="We won't share this" />);
    expect(screen.getByText("We won't share this")).toBeInTheDocument();
  });

  it("hides hint when error is present", () => {
    render(
      <FormField label="Email" name="email" hint="Help text" error="Invalid" />,
    );
    expect(screen.queryByText("Help text")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid");
  });

  it("uses id prop for label htmlFor", () => {
    render(<FormField label="Email" name="email" id="custom-id" />);
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "custom-id");
  });

  it("falls back to name prop for field id", () => {
    render(<FormField label="Email" name="email" />);
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", "email");
  });
});
