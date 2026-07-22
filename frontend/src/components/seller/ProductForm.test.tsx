import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductForm } from "@/components/seller/ProductForm";

const mockOnSubmit = jest.fn();

beforeEach(() => {
  mockOnSubmit.mockClear();
});

describe("ProductForm", () => {
  it("renders all required fields", () => {
    render(
      <ProductForm onSubmit={mockOnSubmit} submitLabel="Crear" submittingLabel="Creando..." />,
    );
    expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stock/i)).toBeInTheDocument();
  });

  it("renders description and ingredients fields", () => {
    render(
      <ProductForm onSubmit={mockOnSubmit} submitLabel="Crear" submittingLabel="Creando..." />,
    );
    expect(screen.getByLabelText(/descripci/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ingredientes/i)).toBeInTheDocument();
  });

  it("shows nutrition section collapsed by default", () => {
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
  });

  it("calls onSubmit with valid data", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ProductForm onSubmit={mockOnSubmit} submitLabel="Crear" submittingLabel="Creando..." />,
    );

    await user.type(screen.getByLabelText(/nombre del producto/i), "Chocolate amargo");
    await user.type(screen.getByLabelText(/precio/i), "5.99");
    await user.type(screen.getByLabelText(/stock/i), "50");
    await user.click(screen.getByRole("button", { name: /crear$/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Chocolate amargo",
        price: 5.99,
        stock: 50,
      }),
    );
  });
});
