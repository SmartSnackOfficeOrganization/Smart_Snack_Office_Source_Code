import { render, screen } from "@testing-library/react";
import { RegistrationSuccess } from "@/components/register/RegistrationSuccess";

describe("RegistrationSuccess", () => {
  it("renders buyer role label", () => {
    render(<RegistrationSuccess role="buyer" email="test@empresa.com" />);
    expect(screen.getByText("Comprador")).toBeInTheDocument();
  });

  it("renders seller role label", () => {
    render(<RegistrationSuccess role="seller" email="test@empresa.com" />);
    expect(screen.getByText("Vendedor")).toBeInTheDocument();
  });

  it("renders email", () => {
    render(<RegistrationSuccess role="buyer" email="maria@empresa.com" />);
    expect(screen.getByText("maria@empresa.com")).toBeInTheDocument();
  });

  it("renders success heading", () => {
    render(<RegistrationSuccess role="buyer" email="test@empresa.com" />);
    expect(screen.getByText("¡Cuenta creada con éxito!")).toBeInTheDocument();
  });

  it("links to login page", () => {
    render(<RegistrationSuccess role="buyer" email="test@empresa.com" />);
    const link = screen.getByRole("link", { name: /iniciar sesión/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("links to home page", () => {
    render(<RegistrationSuccess role="buyer" email="test@empresa.com" />);
    const link = screen.getByRole("link", { name: /volver al inicio/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
