import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleSelector } from "@/components/register/RoleSelector";

describe("RoleSelector", () => {
  it("renders both roles", () => {
    render(<RoleSelector value="buyer" onChange={jest.fn()} />);
    expect(screen.getByText("Comprador")).toBeInTheDocument();
    expect(screen.getByText("Vendedor")).toBeInTheDocument();
  });

  it("marks selected role with aria-checked=true", () => {
    render(<RoleSelector value="buyer" onChange={jest.fn()} />);
    const buyerRadio = screen.getByRole("radio", { name: /comprador/i });
    const sellerRadio = screen.getByRole("radio", { name: /vendedor/i });
    expect(buyerRadio).toHaveAttribute("aria-checked", "true");
    expect(sellerRadio).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange with role id when clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<RoleSelector value="buyer" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: /vendedor/i }));
    expect(onChange).toHaveBeenCalledWith("seller");
  });

  it("shows error message", () => {
    render(
      <RoleSelector value="buyer" onChange={jest.fn()} error="Select a role" />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Select a role");
  });

  it("does not show error when error prop is undefined", () => {
    render(<RoleSelector value="buyer" onChange={jest.fn()} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
