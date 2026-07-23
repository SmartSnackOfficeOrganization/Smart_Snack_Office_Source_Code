import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "@/components/search/SearchBar";

describe("SearchBar", () => {
  it("renders input field", () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(screen.getByLabelText(/buscar productos/i)).toBeInTheDocument();
  });

  it("renders search button", () => {
    render(<SearchBar onSearch={jest.fn()} />);
    expect(screen.getByRole("button", { name: /buscar/i })).toBeInTheDocument();
  });

  it("renders with default value", () => {
    render(<SearchBar defaultValue="dulce" onSearch={jest.fn()} />);
    expect(screen.getByLabelText(/buscar productos/i)).toHaveValue("dulce");
  });

  it("calls onSearch with trimmed query on submit", async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText(/buscar productos/i), "picante");
    await user.click(screen.getByRole("button", { name: /buscar/i }));

    expect(onSearch).toHaveBeenCalledWith("picante");
  });

  it("trims whitespace from query", async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText(/buscar productos/i), "  dulce  ");
    await user.click(screen.getByRole("button", { name: /buscar/i }));

    expect(onSearch).toHaveBeenCalledWith("dulce");
  });

  it("does not call onSearch when query is empty or whitespace", async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.click(screen.getByRole("button", { name: /buscar/i }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("submits on Enter key", async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText(/buscar productos/i), "saludable{Enter}");

    expect(onSearch).toHaveBeenCalledWith("saludable");
  });
});
