import { describe, it, expect, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToyForm } from "./ToyForm";

describe("ToyForm", () => {
  it("renders add mode with required name field", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<ToyForm onSave={onSave} onCancel={onCancel} />);

    expect(screen.getByRole("heading", { name: /додати іграшку/i })).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/назва \*/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute("required");
  });

  it("calls onSave with payload when name is filled and form submitted", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<ToyForm onSave={onSave} onCancel={onCancel} />);

    await user.type(screen.getByLabelText(/назва \*/i), "Кулька #123");
    await user.click(screen.getByRole("button", { name: /додати до колекції/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Кулька #123" }),
      })
    );
  });

  it("does not call onSave when name is empty on submit", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ToyForm onSave={onSave} onCancel={() => {}} />);

    const submitBtn = screen.getByRole("button", { name: /додати до колекції/i });
    await user.click(submitBtn);

    expect(onSave).not.toHaveBeenCalled();
  });

  it("renders edit mode when initial toy provided", () => {
    const initial = {
      id: "toy-1",
      name: "Vintage Barbie",
      line: "Collector",
      factory: "Клавдієво",
      year: "1990",
      paint: "amalhama" as const,
      rarity: "R" as const,
      notes: "NIB",
      imageUrl: undefined,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    render(
      <ToyForm
        initial={initial}
        onSave={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByRole("heading", { name: /редагувати іграшку/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Vintage Barbie")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Collector")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Клавдієво")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1990")).toBeInTheDocument();
    expect(screen.getByDisplayValue("NIB")).toBeInTheDocument();
  });
});
