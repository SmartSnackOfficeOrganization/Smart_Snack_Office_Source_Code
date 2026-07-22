import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import CatalogPage from "./page";
import { getCatalogProducts } from "@/lib/catalog-browse";
import { getCategories, getTags } from "@/lib/catalog-browse";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/lib/catalog-browse", () => ({
  getCategories: jest.fn(),
  getTags: jest.fn(),
  getCatalogProducts: jest.fn(),
  CatalogBrowseError: class extends Error {
    constructor(
      message: string,
      public code: string,
    ) {
      super(message);
      this.name = "CatalogBrowseError";
    }
  },
}));

const mockProducts = {
  count: 3,
  next: null,
  previous: null,
  results: [
    {
      id: "prod-1",
      name: "Chocolate amargo",
      description: "Barra de chocolate 70% cacao",
      price: "5.00",
      stock: 10,
      status: "active",
      avg_rating: "4.50",
      review_count: 12,
      is_featured: true,
      category: { id: "cat-1", name: "Snacks", description: null },
      tags: ["chocolate"],
    },
    {
      id: "prod-2",
      name: "Papas picantes",
      description: "Snack crujiente con chile",
      price: "3.50",
      stock: 20,
      status: "active",
      avg_rating: "3.00",
      review_count: 5,
      is_featured: false,
      category: { id: "cat-1", name: "Snacks", description: null },
      tags: ["picante", "salado"],
    },
    {
      id: "prod-3",
      name: "Agua mineral",
      description: "Agua purificada sin gas",
      price: "1.50",
      stock: 0,
      status: "active",
      avg_rating: "0.00",
      review_count: 0,
      is_featured: false,
      category: { id: "cat-2", name: "Bebidas", description: null },
      tags: [],
    },
  ],
};

const mockCategories = [
  { id: "cat-1", name: "Snacks", description: null },
  { id: "cat-2", name: "Bebidas", description: "Bebidas saludables" },
];

const mockTags = [
  { id: "tag-1", name: "chocolate" },
  { id: "tag-2", name: "vegano" },
];

const mockRouter = { push: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  (getCategories as jest.Mock).mockResolvedValue(mockCategories);
  (getTags as jest.Mock).mockResolvedValue(mockTags);
  (getCatalogProducts as jest.Mock).mockResolvedValue(mockProducts);
});

describe("CatalogPage", () => {
  it("shows loading state initially", () => {
    (getCatalogProducts as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<CatalogPage />);
    expect(screen.getByText("Cargando productos…")).toBeInTheDocument();
  });

  it("renders products and filter sidebar", async () => {
    render(<CatalogPage />);
    expect(await screen.findByText("Chocolate amargo")).toBeInTheDocument();
    expect(screen.getByText("Papas picantes")).toBeInTheDocument();
    expect(screen.getByText("Agua mineral")).toBeInTheDocument();
    expect(screen.getByText("$5.00")).toBeInTheDocument();
    expect(screen.getByText("$3.50")).toBeInTheDocument();
    expect(screen.getByText("$1.50")).toBeInTheDocument();
    expect(screen.getAllByText("Snacks").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bebidas").length).toBeGreaterThanOrEqual(1);
  });

  it("shows error state", async () => {
    const { CatalogBrowseError } = jest.requireMock("@/lib/catalog-browse");
    (getCatalogProducts as jest.Mock).mockRejectedValue(
      new CatalogBrowseError("Error de conexión.", "NETWORK"),
    );
    render(<CatalogPage />);
    expect(
      await screen.findByText("Error de conexión."),
    ).toBeInTheDocument();
  });

  it("navigates on category change", async () => {
    render(<CatalogPage />);
    const snacksBtns = await screen.findAllByText("Snacks");
    const categoryBtn = snacksBtns[0];
    expect(categoryBtn.tagName).toBe("BUTTON");
    fireEvent.click(categoryBtn);
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining("category=cat-1"),
    );
  });

  it("navigates to product detail on card click", async () => {
    render(<CatalogPage />);
    const productLink = await screen.findByText("Chocolate amargo");
    expect(productLink.closest("a")).toHaveAttribute(
      "href",
      "/buyer/products/prod-1",
    );
  });

  it("renders pagination when products exceed page size", async () => {
    (getCatalogProducts as jest.Mock).mockResolvedValue({
      count: 50,
      next: "http://localhost:8000/api/catalog/products/?page=2",
      previous: null,
      results: mockProducts.results,
    });
    render(<CatalogPage />);
    expect(await screen.findByText("Siguiente")).toBeInTheDocument();
  });

  it("shows result count", async () => {
    render(<CatalogPage />);
    expect(await screen.findByText("3 resultados")).toBeInTheDocument();
  });

  it("navigates back to dashboard", async () => {
    render(<CatalogPage />);
    const volverBtn = await screen.findByText("Volver al panel");
    fireEvent.click(volverBtn);
    expect(mockRouter.push).toHaveBeenCalledWith("/buyer/dashboard");
  });
});
