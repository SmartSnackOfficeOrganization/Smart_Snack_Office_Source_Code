import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordForm } from "@/components/reset-password/ResetPasswordForm";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
});

describe("ResetPasswordForm", () => {
  const defaultProps = {
    uidb64: "dGVzdA==",
    token: "mock-token-abc123",
  };

  it("renders new password field", () => {
    render(<ResetPasswordForm {...defaultProps} />);
    expect(screen.getByLabelText(/nueva contraseña/i)).toBeInTheDocument();
  });

  it("renders confirm password field", () => {
    render(<ResetPasswordForm {...defaultProps} />);
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<ResetPasswordForm {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /restablecer contraseña/i }),
    ).toBeInTheDocument();
  });

  it("renders link back to login", () => {
    render(<ResetPasswordForm {...defaultProps} />);
    expect(screen.getByText(/inicia sesión/i)).toBeInTheDocument();
  });

  it("shows password criteria hint when password is empty", () => {
    render(<ResetPasswordForm {...defaultProps} />);
    expect(screen.getByText(/usa al menos 8 caracteres/i)).toBeInTheDocument();
  });

  it("shows validation errors on submit with empty fields", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm {...defaultProps} />);

    await user.click(
      screen.getByRole("button", { name: /restablecer contraseña/i }),
    );

    expect(screen.getByText("La contraseña es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("Confirma tu contraseña.")).toBeInTheDocument();
  });

  it("shows validation error for weak password", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/nueva contraseña/i), "weak");
    await user.tab();

    expect(
      screen.getByText("La contraseña no cumple los criterios de seguridad."),
    ).toBeInTheDocument();
  });

  it("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/nueva contraseña/i), "NewPassword1!");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "Different1!");
    await user.tab();

    expect(screen.getByText("Las contraseñas no coinciden.")).toBeInTheDocument();
  });

  it("navigates to login on successful password reset", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/nueva contraseña/i), "NewPassword1!");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "NewPassword1!");
    await user.click(
      screen.getByRole("button", { name: /restablecer contraseña/i }),
    );

    await waitFor(
      () => expect(mockPush).toHaveBeenCalledWith("/login"),
      { timeout: 2000 },
    );
  });

  it("shows loading text during submission", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm {...defaultProps} />);

    await user.type(screen.getByLabelText(/nueva contraseña/i), "NewPassword1!");
    await user.type(screen.getByLabelText(/confirmar contraseña/i), "NewPassword1!");
    await user.click(
      screen.getByRole("button", { name: /restablecer contraseña/i }),
    );

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /restableciendo contraseña/i }),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
