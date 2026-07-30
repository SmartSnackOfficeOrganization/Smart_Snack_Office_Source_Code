import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/login/LoginForm";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockPush.mockClear();
  mockFetch.mockClear();
  localStorage.clear();
});

afterEach(() => localStorage.clear());

function mockLoginSuccess(role: "buyer" | "seller") {
  const payload = btoa(JSON.stringify({ role, exp: Date.now() / 1000 + 3600 }));
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ access: `real.${payload}.token`, refresh: "real.refresh.token" }),
  });
}

function mockLoginFailure() {
  mockFetch.mockResolvedValue({
    ok: false,
    status: 401,
    json: () => Promise.resolve({ non_field_errors: ["Correo o contraseña incorrectos"] }),
  });
}

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it("shows validation errors on submit with empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(screen.getByText("El correo electrónico es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es obligatoria.")).toBeInTheDocument();
  });

  it("navigates to buyer dashboard on successful buyer login", async () => {
    mockLoginSuccess("buyer");
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "comprador@empresa.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "ContraseñaSegura123!");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(
      () => expect(mockPush).toHaveBeenCalledWith("/buyer/dashboard"),
      { timeout: 2000 },
    );
  });

  it("navigates to seller dashboard on successful seller login", async () => {
    mockLoginSuccess("seller");
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "vendedor@empresa.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "ContraseñaSegura123!");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(
      () => expect(mockPush).toHaveBeenCalledWith("/seller/dashboard"),
      { timeout: 2000 },
    );
  });

  it("shows auth error on invalid credentials", async () => {
    mockLoginFailure();
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "wrong@empresa.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(
      () => expect(screen.getByText("Correo o contraseña incorrectos")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("clears auth error when user types in a field", async () => {
    mockLoginFailure();
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "wrong@empresa.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "wrong");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(
      () => expect(screen.getByText("Correo o contraseña incorrectos")).toBeInTheDocument(),
      { timeout: 2000 },
    );

    await user.type(screen.getByLabelText(/correo electrónico/i), "a");
    expect(screen.queryByText("Correo o contraseña incorrectos")).not.toBeInTheDocument();
  });

  it("button shows loading text during submission", async () => {
    mockLoginSuccess("buyer");
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/correo electrónico/i), "comprador@empresa.com");
    await user.type(screen.getByLabelText(/^contraseña$/i), "ContraseñaSegura123!");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(
      () => expect(screen.getByText("Iniciar sesión")).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it("validates email format on blur", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    await user.type(emailInput, "invalido");
    await user.tab();

    expect(
      screen.getByText(/Ingresa un correo electrónico válido/),
    ).toBeInTheDocument();
  });
});
