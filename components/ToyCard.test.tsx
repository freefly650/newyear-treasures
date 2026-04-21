import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToyCard } from "./ToyCard";

const baseToy = {
  id: "toy-1",
  name: "Barbie Fashionistas",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("ToyCard", () => {
  it("renders toy name", () => {
    const onEdit = vi.fn();
    render(
      <ToyCard
        toy={{ ...baseToy }}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText("Barbie Fashionistas")).toBeInTheDocument();
  });

  it("renders line and year when present", () => {
    const onEdit = vi.fn();
    render(
      <ToyCard
        toy={{ ...baseToy, line: "Collector", year: "2020" }}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText(/Collector · 2020/)).toBeInTheDocument();
  });

  it("renders paint and rarity label", () => {
    const onEdit = vi.fn();
    render(
      <ToyCard
        toy={{ ...baseToy, paint: "amalhama", rarity: "RR" }}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText("Амальгама · RR")).toBeInTheDocument();
  });

  it("renders notes when present", () => {
    const onEdit = vi.fn();
    render(
      <ToyCard
        toy={{ ...baseToy, notes: "Never removed from box" }}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText("Never removed from box")).toBeInTheDocument();
  });

  it("calls onEdit when button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <ToyCard
        toy={{ ...baseToy }}
        onEdit={onEdit}
      />
    );
    await user.click(screen.getByRole("button", { name: /редагувати/i }));
    expect(onEdit).toHaveBeenCalledWith("toy-1");
  });

  it("does not render removed eBay price button", () => {
    const onEdit = vi.fn();
    render(<ToyCard toy={{ ...baseToy }} onEdit={onEdit} />);
    expect(screen.queryByRole("button", { name: /price/i })).not.toBeInTheDocument();
  });
});
