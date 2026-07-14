import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationForm } from "@/components/register/RegistrationForm";

describe("RegistrationForm", () => {
  it("renders all form fields for buyer role", () => {
    render(<RegistrationForm />);
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
  });

  it("renders buyer-specific fields by default (companyName, deliveryAddress)", () => {
    render(<RegistrationForm />);
    expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dirección de entrega/i)).toBeInTheDocument();
  });

  it("does not render seller-specific fields for buyer role", () => {
    render(<RegistrationForm />);
    expect(screen.queryByLabelText(/nombre del negocio/i)).not.toBeInTheDocument();
  });

  it("shows seller-specific fields when seller role is selected", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.click(screen.getByRole("radio", { name: /vendedor/i }));
    expect(screen.getByLabelText(/nombre del negocio/i)).toBeInTheDocument();
  });

  it("hides buyer-specific fields when seller role is selected", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.click(screen.getByRole("radio", { name: /vendedor/i }));
    expect(screen.queryByLabelText(/empresa/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/dirección de entrega/i)).not.toBeInTheDocument();
  });

  it("shows validation errors on submit with empty fields", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("El correo electrónico es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("Confirma tu contraseña.")).toBeInTheDocument();
    expect(
      screen.getByText("Debes aceptar los términos y condiciones."),
    ).toBeInTheDocument();
  });

  it("does not show errors before interaction", () => {
    render(<RegistrationForm />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows success screen after valid submission", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.type(screen.getByLabelText(/nombre completo/i), "María González");
    await user.type(screen.getByLabelText(/correo electrónico/i), "maria@empresa.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "ContraseñaSegura123!");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "ContraseñaSegura123!");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(
      () => expect(screen.getByText("¡Cuenta creada con éxito!")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("button shows submitting text during submission", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    await user.type(screen.getByLabelText(/nombre completo/i), "María González");
    await user.type(screen.getByLabelText(/correo electrónico/i), "maria@empresa.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "ContraseñaSegura123!");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "ContraseñaSegura123!");
    await user.click(screen.getByRole("checkbox"));

    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(screen.getByText("Creando cuenta…")).toBeInTheDocument();

    await waitFor(
      () => expect(screen.getByText("¡Cuenta creada con éxito!")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("shows password criteria list", () => {
    render(<RegistrationForm />);
    expect(screen.getByText(/Usa al menos 8 caracteres/)).toBeInTheDocument();
  });
});
