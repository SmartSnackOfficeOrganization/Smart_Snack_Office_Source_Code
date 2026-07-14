import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AuthSession } from "@/lib/auth/types";
import { AUTH_STORAGE_KEY } from "@/lib/auth/constants";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRouter = { replace: mockReplace, push: mockPush };
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const buyerSession: AuthSession = {
  access: "mock.access.buyer.token.example",
  refresh: "mock.refresh.buyer.token.example",
  role: "buyer",
  email: "comprador@empresa.com",
};

const sellerSession: AuthSession = {
  access: "mock.access.seller.token.example",
  refresh: "mock.refresh.seller.token.example",
  role: "seller",
  email: "vendedor@empresa.com",
};

beforeEach(() => {
  mockReplace.mockClear();
  mockPush.mockClear();
  localStorage.clear();
});

afterEach(() => localStorage.clear());

describe("DashboardShell", () => {
  it("redirects to /login when no session exists", () => {
    render(<DashboardShell role="buyer" title="Test" description="Test" />);
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when role does not match", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(buyerSession));
    render(<DashboardShell role="seller" title="Test" description="Test" />);
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("shows loading state while checking session", () => {
    render(<DashboardShell role="buyer" title="Test" description="Test" />);
    expect(screen.getByText("Verificando sesión…")).toBeInTheDocument();
  });

  it("renders dashboard content when session is valid", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(buyerSession));
    render(<DashboardShell role="buyer" title="Mi Panel" description="Panel del comprador" />);

    expect(screen.getByText("Mi Panel")).toBeInTheDocument();
    expect(screen.getByText("Panel del comprador")).toBeInTheDocument();
    expect(screen.getByText("comprador@empresa.com")).toBeInTheDocument();
  });

  it("renders buyer role badge", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(buyerSession));
    render(<DashboardShell role="buyer" title="Test" description="Test" />);
    expect(screen.getByText("Panel Comprador")).toBeInTheDocument();
  });

  it("renders seller role badge", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sellerSession));
    render(<DashboardShell role="seller" title="Test" description="Test" />);
    expect(screen.getByText("Panel Vendedor")).toBeInTheDocument();
  });

  it("shows JWT token previews", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(buyerSession));
    render(<DashboardShell role="buyer" title="Test" description="Test" />);
    expect(screen.getByText(/Access:/)).toBeInTheDocument();
    expect(screen.getByText(/Refresh:/)).toBeInTheDocument();
  });

  it("renders logout button", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(buyerSession));
    render(<DashboardShell role="buyer" title="Test" description="Test" />);
    expect(screen.getByRole("button", { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it("logout clears session and navigates to /login", async () => {
    const user = userEvent.setup();
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(buyerSession));
    render(<DashboardShell role="buyer" title="Test" description="Test" />);

    await user.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("renders link back to home", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(buyerSession));
    render(<DashboardShell role="buyer" title="Test" description="Test" />);
    const link = screen.getByRole("link", { name: /volver al inicio/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
