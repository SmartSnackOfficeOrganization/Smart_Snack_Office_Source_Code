import { render, screen, fireEvent } from "@testing-library/react";
import { FilterSidebar } from "./FilterSidebar";
import { getCategories, getTags } from "@/lib/catalog-browse";

jest.mock("@/lib/catalog-browse", () => ({
  getCategories: jest.fn(),
  getTags: jest.fn(),
  CatalogBrowseError: jest
    .fn()
    .mockImplementation(
      function (this: { name: string; code: string }, message: string, code: string) {
        this.name = "CatalogBrowseError";
        this.code = code;
        this.message = message;
      } as unknown as new (message: string, code: string) => Error,
    ),
}));

const mockCategories = [
  { id: "cat-1", name: "Snacks", description: null },
  { id: "cat-2", name: "Bebidas", description: "Bebidas saludables" },
];

const mockTags = [
  { id: "tag-1", name: "chocolate" },
  { id: "tag-2", name: "vegano" },
  { id: "tag-3", name: "sin azúcar" },
];

const defaultProps = {
  selectedCategory: "",
  selectedTags: [] as string[],
  priceMin: "",
  priceMax: "",
  inStock: false,
  onCategoryChange: jest.fn(),
  onTagsChange: jest.fn(),
  onPriceMinChange: jest.fn(),
  onPriceMaxChange: jest.fn(),
  onInStockChange: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (getCategories as jest.Mock).mockResolvedValue(mockCategories);
  (getTags as jest.Mock).mockResolvedValue(mockTags);
});

describe("FilterSidebar", () => {
  it("loads and displays categories and tags", async () => {
    render(<FilterSidebar {...defaultProps} />);
    expect(await screen.findByText("Snacks")).toBeInTheDocument();
    expect(screen.getByText("Bebidas")).toBeInTheDocument();
    expect(screen.getByText("chocolate")).toBeInTheDocument();
    expect(screen.getByText("vegano")).toBeInTheDocument();
  });

  it("calls onCategoryChange when category button clicked", async () => {
    render(<FilterSidebar {...defaultProps} />);
    const snacksBtn = await screen.findByText("Snacks");
    fireEvent.click(snacksBtn);
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith("cat-1");
  });

  it("calls onCategoryChange with empty string when same category clicked again", async () => {
    render(<FilterSidebar {...defaultProps} selectedCategory="cat-1" />);
    const snacksBtn = await screen.findByText("Snacks");
    fireEvent.click(snacksBtn);
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith("");
  });

  it("calls onTagsChange when tag toggled on", async () => {
    render(<FilterSidebar {...defaultProps} />);
    const tagBtn = await screen.findByText("chocolate");
    fireEvent.click(tagBtn);
    expect(defaultProps.onTagsChange).toHaveBeenCalledWith(["chocolate"]);
  });

  it("calls onTagsChange when tag toggled off", async () => {
    render(<FilterSidebar {...defaultProps} selectedTags={["chocolate"]} />);
    const tagBtn = await screen.findByText("chocolate");
    fireEvent.click(tagBtn);
    expect(defaultProps.onTagsChange).toHaveBeenCalledWith([]);
  });

  it("calls onPriceMinChange on input", async () => {
    render(<FilterSidebar {...defaultProps} />);
    const minInput = screen.getByLabelText("Precio mínimo");
    fireEvent.change(minInput, { target: { value: "10" } });
    expect(defaultProps.onPriceMinChange).toHaveBeenCalledWith("10");
  });

  it("calls onInStockChange on checkbox toggle", () => {
    render(<FilterSidebar {...defaultProps} />);
    const checkbox = screen.getByLabelText("Solo en stock");
    fireEvent.click(checkbox);
    expect(defaultProps.onInStockChange).toHaveBeenCalledWith(true);
  });

  it("shows error when categories fail to load", async () => {
    (getCategories as jest.Mock).mockRejectedValue(new Error("Network error"));
    (getTags as jest.Mock).mockResolvedValue([]);
    render(<FilterSidebar {...defaultProps} />);
    expect(await screen.findByText("Error al cargar filtros.")).toBeInTheDocument();
  });
});
