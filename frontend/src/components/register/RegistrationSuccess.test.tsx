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

  it("shows activation button when activationUrl is provided", () => {
    render(
      <RegistrationSuccess
        role="buyer"
        email="test@empresa.com"
        activationUrl="http://localhost:8000/api/auth/activate/dGVzdA==/token123"
      />,
    );
    expect(screen.getByRole("button", { name: /activar cuenta/i })).toBeInTheDocument();
  });

  it("shows inactive message when activationUrl is provided", () => {
    render(
      <RegistrationSuccess
        role="buyer"
        email="test@empresa.com"
        activationUrl="http://localhost:8000/api/auth/activate/dGVzdA==/token123"
      />,
    );
    expect(screen.getByText(/tu cuenta está inactiva/i)).toBeInTheDocument();
  });

  it("shows login link after activation", () => {
    render(
      <RegistrationSuccess
        role="buyer"
        email="test@empresa.com"
        activationUrl="http://localhost:8000/api/auth/activate/dGVzdA==/token123"
      />,
    );
    expect(screen.getByRole("button", { name: /activar cuenta/i })).toBeInTheDocument();
  });

  it("links to home page", () => {
    render(<RegistrationSuccess role="buyer" email="test@empresa.com" />);
    const link = screen.getByRole("link", { name: /volver al inicio/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
