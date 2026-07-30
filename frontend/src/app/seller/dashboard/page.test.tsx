import { render, screen } from "@testing-library/react";
import SellerDashboardPage from "@/app/seller/dashboard/page";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRouter = { push: mockPush, replace: mockReplace };

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("@/lib/auth/session", () => ({
  getAuthSession: () => ({
    role: "seller",
    email: "vendedor@empresa.com",
    access: "mock.access.token",
    refresh: "mock.refresh.token",
  }),
  clearAuthSession: jest.fn(),
}));

beforeEach(() => {
  mockReplace.mockClear();
  mockPush.mockClear();
});

describe("SellerDashboardPage", () => {
  it("renders the dashboard shell", () => {
    render(<SellerDashboardPage />);
    expect(screen.getByText("Panel de vendedor")).toBeInTheDocument();
  });

  it("renders catalog management card", () => {
    render(<SellerDashboardPage />);
    expect(screen.getByText(/Gestionar cat/i)).toBeInTheDocument();
    expect(screen.getByText(/Crea, edita y elimina productos/i)).toBeInTheDocument();
  });

  it("renders profile card", () => {
    render(<SellerDashboardPage />);
    expect(screen.getByText("Mi perfil")).toBeInTheDocument();
    expect(screen.getByText(/Edita tu informaci/i)).toBeInTheDocument();
  });

  it("links catalog card to products page", () => {
    render(<SellerDashboardPage />);
    const link = screen.getByText(/Gestionar cat/i).closest("a");
    expect(link).toHaveAttribute("href", "/seller/products");
  });
});
