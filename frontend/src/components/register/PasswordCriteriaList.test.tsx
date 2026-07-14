import { render, screen } from "@testing-library/react";
import { PasswordCriteriaList } from "@/components/register/PasswordCriteriaList";

describe("PasswordCriteriaList", () => {
  it("shows hint text when password is empty", () => {
    render(<PasswordCriteriaList password="" />);
    expect(
      screen.getByText(/Usa al menos 8 caracteres/),
    ).toBeInTheDocument();
  });

  it("does not show criteria list when password is empty", () => {
    render(<PasswordCriteriaList password="" />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows criteria list when password has content", () => {
    render(<PasswordCriteriaList password="a" />);
    expect(screen.getByRole("list", { name: /criterios/i })).toBeInTheDocument();
  });

  it("marks criteria as met when password satisfies them", () => {
    render(<PasswordCriteriaList password="Contraseña1" />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    items.forEach((item) => {
      expect(item.className).toContain("text-brand-700");
    });
  });

  it("marks criteria as unmet when password is weak", () => {
    render(<PasswordCriteriaList password="abc" />);
    const items = screen.getAllByRole("listitem");
    const textContent = items.map((item) => item.textContent);
    expect(textContent.some((t) => t?.includes("Mínimo 8 caracteres"))).toBe(true);
  });
});
