import { render, screen } from "@testing-library/react";
import { NoResults } from "@/components/search/NoResults";

describe("NoResults", () => {
  it("renders the search term", () => {
    render(<NoResults query="xyz123" />);
    expect(screen.getByText(/xyz123/)).toBeInTheDocument();
  });

  it("renders the no results heading", () => {
    render(<NoResults query="test" />);
    expect(screen.getByText(/No se encontraron resultados/)).toBeInTheDocument();
  });

  it("renders suggestion text", () => {
    render(<NoResults query="test" />);
    expect(screen.getByText(/dulce/)).toBeInTheDocument();
    expect(screen.getByText(/picante/)).toBeInTheDocument();
    expect(screen.getByText(/saludable/)).toBeInTheDocument();
  });
});
