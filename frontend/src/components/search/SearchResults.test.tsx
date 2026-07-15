import { render, screen } from "@testing-library/react";
import { SearchResults } from "@/components/search/SearchResults";
import { Product } from "@/lib/catalog.types";

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Chocolate amargo",
    description: "Barra de chocolate dulce y suave",
    ingredients: "cacao, azucar",
    price: "5.00",
    stock: 10,
    status: "active",
    avg_rating: "4.50",
    review_count: 12,
    is_featured: true,
    category: "Dulces",
    relevance_score: null,
    match_stage: "literal",
    is_compatible: null,
  },
  {
    id: "2",
    name: "Papas picantes",
    description: "Snack crujiente con chile",
    ingredients: "papa, chile",
    price: "3.50",
    stock: 20,
    status: "active",
    avg_rating: "3.00",
    review_count: 5,
    is_featured: false,
    category: "Salados",
    relevance_score: 0.374,
    match_stage: "tfidf",
    is_compatible: null,
  },
];

describe("SearchResults", () => {
  it("renders product cards", () => {
    render(<SearchResults products={mockProducts} query="dulce" />);
    expect(screen.getByText("Chocolate amargo")).toBeInTheDocument();
    expect(screen.getByText("Papas picantes")).toBeInTheDocument();
  });

  it("displays product prices", () => {
    render(<SearchResults products={mockProducts} query="dulce" />);
    expect(screen.getByText("$5.00")).toBeInTheDocument();
    expect(screen.getByText("$3.50")).toBeInTheDocument();
  });

  it("displays product descriptions", () => {
    render(<SearchResults products={mockProducts} query="dulce" />);
    expect(screen.getByText("Barra de chocolate dulce y suave")).toBeInTheDocument();
  });

  it("displays featured badge for featured products", () => {
    render(<SearchResults products={mockProducts} query="dulce" />);
    expect(screen.getByText("Destacado")).toBeInTheDocument();
  });

  it("displays literal match badge", () => {
    render(<SearchResults products={mockProducts} query="dulce" />);
    expect(screen.getByText("Coincidencia exacta")).toBeInTheDocument();
  });

  it("displays tfidf match badge", () => {
    render(<SearchResults products={mockProducts} query="dulce" />);
    expect(screen.getByText("Relevancia semántica")).toBeInTheDocument();
  });

  it("shows tfidf info banner when results include semantic matches", () => {
    render(<SearchResults products={mockProducts} query="snack raro" />);
    expect(screen.getByText(/No se encontraron coincidencias exactas/)).toBeInTheDocument();
  });

  it("does not show tfidf banner when all matches are literal", () => {
    const literalOnly = [mockProducts[0]];
    render(<SearchResults products={literalOnly} query="chocolate" />);
    expect(screen.queryByText(/No se encontraron coincidencias exactas/)).not.toBeInTheDocument();
  });

  it("displays category", () => {
    render(<SearchResults products={mockProducts} query="dulce" />);
    expect(screen.getByText("Dulces")).toBeInTheDocument();
  });

  it("displays review count", () => {
    render(<SearchResults products={mockProducts} query="dulce" />);
    expect(screen.getByText("12 reseñas")).toBeInTheDocument();
    expect(screen.getByText("5 reseñas")).toBeInTheDocument();
  });
});
