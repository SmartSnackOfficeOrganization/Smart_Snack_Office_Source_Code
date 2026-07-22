import { render, screen } from "@testing-library/react";
import { useParams, useRouter } from "next/navigation";
import ProductDetailPage from "./page";
import { getProductById } from "@/lib/buyer";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock("@/lib/buyer", () => ({
  getProductById: jest.fn(),
  BuyerProductError: class extends Error {
    constructor(
      message: string,
      public code: string,
    ) {
      super(message);
      this.name = "BuyerProductError";
    }
  },
}));

const mockProduct = {
  id: "prod-1",
  name: "Chocolate amargo",
  description: "Barra de chocolate 70% cacao",
  ingredients: "cacao, azúcar, manteca de cacao",
  price: "5.00",
  stock: 10,
  status: "active",
  avg_rating: "4.50",
  review_count: 12,
  is_featured: true,
  category: { id: "cat-1", name: "Dulces", description: null },
  tags: ["chocolate", "vegano"],
  nutrition_facts: {
    calories: 120,
    protein_g: 3,
    fat_g: 8,
    carbs_g: 15,
    sugar_g: 10,
    sodium_mg: 5,
    serving_size: "30g",
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockRouter = { push: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  (useParams as jest.Mock).mockReturnValue({ id: "prod-1" });
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
});

describe("ProductDetailPage", () => {
  it("shows loading state initially", () => {
    (getProductById as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<ProductDetailPage />);
    expect(screen.getByText("Cargando producto…")).toBeInTheDocument();
  });

  it("renders product details when loaded", async () => {
    (getProductById as jest.Mock).mockResolvedValue(mockProduct);

    render(<ProductDetailPage />);
    expect(await screen.findByText("Chocolate amargo")).toBeInTheDocument();
    expect(screen.getByText("$5.00")).toBeInTheDocument();
    expect(screen.getByText("Stock: 10")).toBeInTheDocument();
    expect(screen.getByText("Dulces")).toBeInTheDocument();
    expect(screen.getByText("chocolate")).toBeInTheDocument();
    expect(screen.getByText("vegano")).toBeInTheDocument();
    expect(screen.getByText("Agregar al carrito")).toBeInTheDocument();
    expect(screen.getByText("Agregar a lista de deseos")).toBeInTheDocument();
  });

  it("shows out-of-stock state", async () => {
    (getProductById as jest.Mock).mockResolvedValue({
      ...mockProduct,
      stock: 0,
    });

    render(<ProductDetailPage />);
    const agotados = await screen.findAllByText("Agotado");
    expect(agotados).toHaveLength(2);
    expect(screen.getByText("Stock: 0 — Producto agotado")).toBeInTheDocument();
  });

  it("shows error when product not found", async () => {
    const { BuyerProductError } = jest.requireMock("@/lib/buyer");
    (getProductById as jest.Mock).mockRejectedValue(
      new BuyerProductError("Not found", "NOT_FOUND"),
    );

    render(<ProductDetailPage />);
    expect(
      await screen.findByText(
        "El producto que buscas no existe o ha sido eliminado.",
      ),
    ).toBeInTheDocument();
  });

  it("shows generic error on network failure", async () => {
    const { BuyerProductError } = jest.requireMock("@/lib/buyer");
    (getProductById as jest.Mock).mockRejectedValue(
      new BuyerProductError("Network error", "NETWORK"),
    );

    render(<ProductDetailPage />);
    expect(
      await screen.findByText("Error al cargar el producto. Intenta de nuevo."),
    ).toBeInTheDocument();
  });

  it("navigates back on volver button click", async () => {
    (getProductById as jest.Mock).mockResolvedValue(mockProduct);

    render(<ProductDetailPage />);
    expect(await screen.findByText("Chocolate amargo")).toBeInTheDocument();

    const volverBtn = screen.getByText("Volver al panel");
    volverBtn.click();
    expect(mockRouter.push).toHaveBeenCalledWith("/buyer/dashboard");
  });

  it("renders description and ingredients", async () => {
    (getProductById as jest.Mock).mockResolvedValue(mockProduct);

    render(<ProductDetailPage />);
    expect(
      await screen.findByText("Barra de chocolate 70% cacao"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("cacao, azúcar, manteca de cacao"),
    ).toBeInTheDocument();
  });

  it("renders nutrition facts", async () => {
    (getProductById as jest.Mock).mockResolvedValue(mockProduct);

    render(<ProductDetailPage />);
    const nutritionBtn = await screen.findByText("Información nutricional");
    nutritionBtn.click();
    expect(await screen.findByText("120")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
  });
});
