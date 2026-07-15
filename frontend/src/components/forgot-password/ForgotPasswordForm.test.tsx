import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordForm } from "@/components/forgot-password/ForgotPasswordForm";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
});

describe("ForgotPasswordForm", () => {
  it("renders email field", () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<ForgotPasswordForm />);
    expect(
      screen.getByRole("button", { name: /enviar enlace de recuperación/i }),
    ).toBeInTheDocument();
  });

  it("renders link back to login", () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByText(/inicia sesión/i)).toBeInTheDocument();
  });

  it("shows validation error on submit with empty email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.click(
      screen.getByRole("button", { name: /enviar enlace de recuperación/i }),
    );

    expect(screen.getByText("El correo electrónico es obligatorio.")).toBeInTheDocument();
  });

  it("shows validation error for invalid email format", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "invalido");
    await user.tab();

    expect(
      screen.getByText(/Ingresa un correo electrónico válido/),
    ).toBeInTheDocument();
  });

  it("shows success message after submitting valid email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(
      screen.getByLabelText(/correo electrónico/i),
      "test@empresa.com",
    );
    await user.click(
      screen.getByRole("button", { name: /enviar enlace de recuperación/i }),
    );

    await waitFor(
      () => {
        expect(
          screen.getByText(/enlace enviado/i),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("clears form after successful submission", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    await user.type(emailInput, "test@empresa.com");
    await user.click(
      screen.getByRole("button", { name: /enviar enlace de recuperación/i }),
    );

    await waitFor(
      () => {
        expect(emailInput).toHaveValue("");
      },
      { timeout: 2000 },
    );
  });

  it("shows loading text during submission", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(
      screen.getByLabelText(/correo electrónico/i),
      "test@empresa.com",
    );
    await user.click(
      screen.getByRole("button", { name: /enviar enlace de recuperación/i }),
    );

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /enviando enlace/i }),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("clears validation error when user types valid email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "invalido");
    await user.tab();

    expect(
      screen.getByText(/Ingresa un correo electrónico válido/),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/correo electrónico/i));
    await user.type(screen.getByLabelText(/correo electrónico/i), "valid@empresa.com");
    expect(
      screen.queryByText(/Ingresa un correo electrónico válido/),
    ).not.toBeInTheDocument();
  });
});
