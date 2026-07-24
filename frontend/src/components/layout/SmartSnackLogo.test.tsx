import { render, screen } from "@testing-library/react";
import { SmartSnackLogo } from "@/components/layout/SmartSnackLogo";

describe("SmartSnackLogo", () => {
  it("links to home page by default", () => {
    render(<SmartSnackLogo />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
  });

  it("uses custom href when provided", () => {
    render(<SmartSnackLogo href="/buyer/dashboard" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/buyer/dashboard");
  });

  it("renders brand name", () => {
    render(<SmartSnackLogo />);
    expect(screen.getByText("Smart Snack")).toBeInTheDocument();
  });

  it("renders subtitle", () => {
    render(<SmartSnackLogo />);
    expect(screen.getByText("Bienestar corporativo")).toBeInTheDocument();
  });
});
