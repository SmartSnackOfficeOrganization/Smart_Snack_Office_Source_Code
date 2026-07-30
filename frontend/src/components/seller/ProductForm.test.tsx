import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductForm } from "@/components/seller/ProductForm";

jest.mock("@/lib/seller/catalog", () => ({
  listCategories: jest.fn().mockResolvedValue([
    { id: "cat-1", name: "Snacks" },
    { id: "cat-2", name: "Bebidas" },
  ]),
  listTags: jest.fn().mockResolvedValue([
    { id: "tag-1", name: "vegano" },
    { id: "tag-2", name: "sin-gluten" },
  ]),
}));

const mockOnSubmit = jest.fn();

beforeEach(() => {
  mockOnSubmit.mockClear();
});

describe("ProductForm", () => {
  it("renders all required fields", async () => {
    render(
      <ProductForm onSubmit={mockOnSubmit} submitLabel="Crear" submittingLabel="Creando..." />,
    );
    expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stock/i)).toBeInTheDocument();
  });

  it("renders description and ingredients fields", async () => {
    render(
      <ProductForm onSubmit={mockOnSubmit} submitLabel="Crear" submittingLabel="Creando..." />,
    );
    expect(screen.getByLabelText(/descripci/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ingredientes/i)).toBeInTheDocument();
  });

  it("renders category select", async () => {
    render(
      <ProductForm onSubmit={mockOnSubmit} submitLabel="Crear" submittingLabel="Creando..." />,
    );
    expect(screen.getByLabelText(/categor/i)).toBeInTheDocument();
  });

  it("renders tags input", async () => {
    render(
      <ProductForm onSubmit={mockOnSubmit} submitLabel="Crear" submittingLabel="Creando..." />,
    );
    expect(screen.getByLabelText(/^tags/i)).toBeInTheDocument();
  });

  it("shows nutrition section collapsed by default", async () => {
    render(
      <ProductForm onSubmit={mockOnSubmit} submitLabel="Crear" submittingLabel="Creando..." />,
    );
    expect(screen.getByText(/ficha nutricional/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/calor/i)).not.toBeInTheDocument();
  });

  it("expands nutrition section on click", async () => {
    const user = userEvent.setup();
    render(
      <ProductForm onSubmit={mockOnSubmit} submitLabel="Crear" submittingLabel="Creando..." />,
    );

    await user.click(screen.getByText(/ficha nutricional/i));
    expect(screen.getByLabelText(/calor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prote/i)).toBeInTheDocument();
  });

  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    render(
      <ProductForm onSubmit={mockOnSubmit} submitLabel="Crear" submittingLabel="Creando..." />,
    );

    await user.click(screen.getByRole("button", { name: /crear$/i }));
    expect(screen.getByText("El nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("El precio debe ser mayor a 0.")).toBeInTheDocument();
    expect(screen.getByText(/Selecciona una categor/i)).toBeInTheDocument();
    expect(screen.getByText("Agrega al menos un tag.")).toBeInTheDocument();
  });

  it("calls onSubmit with valid data including category and tags", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ProductForm onSubmit={mockOnSubmit} submitLabel="Crear" submittingLabel="Creando..." />,
    );

    await user.type(screen.getByLabelText(/nombre del producto/i), "Chocolate amargo");
    await user.type(screen.getByLabelText(/precio/i), "5.99");
    await user.type(screen.getByLabelText(/stock/i), "50");

    await user.selectOptions(screen.getByLabelText(/categor/i), "cat-1");

    const tagsInput = screen.getByLabelText(/^tags/i);
    await user.type(tagsInput, "vegano");
    await user.keyboard("{Enter}");

    await user.click(screen.getByRole("button", { name: /crear$/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Chocolate amargo",
        price: 5.99,
        stock: 50,
        category_id: "cat-1",
        tags: ["vegano"],
      }),
    );
  });

  it("removes tag when clicking the X button", async () => {
    const user = userEvent.setup();
    render(
      <ProductForm
        onSubmit={mockOnSubmit}
        submitLabel="Crear"
        submittingLabel="Creando..."
        initialData={{
          name: "Test",
          description: "",
          ingredients: "",
          price: 5,
          stock: 10,
          category_id: "cat-1",
          tags: ["vegano", "sin-gluten"],
          nutrition_facts: null,
        }}
      />,
    );

    expect(screen.getByText("vegano")).toBeInTheDocument();
    expect(screen.getByText("sin-gluten")).toBeInTheDocument();

    const removeButtons = screen.getAllByText("×");
    await user.click(removeButtons[0]);

    expect(screen.queryByText("vegano")).not.toBeInTheDocument();
    expect(screen.getByText("sin-gluten")).toBeInTheDocument();
  });
});
