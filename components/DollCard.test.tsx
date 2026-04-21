import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DollCard } from "./DollCard";

const baseDoll = {
  id: "doll-1",
  name: "Barbie Fashionistas",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("DollCard", () => {
  it("renders doll name", () => {
    const onEdit = vi.fn();
    render(
      <DollCard
        doll={{ ...baseDoll }}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText("Barbie Fashionistas")).toBeInTheDocument();
  });

  it("renders line and year when present", () => {
    const onEdit = vi.fn();
    render(
      <DollCard
        doll={{ ...baseDoll, line: "Collector", year: "2020" }}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText(/Collector · 2020/)).toBeInTheDocument();
  });

  it("renders paint and rarity label", () => {
    const onEdit = vi.fn();
    render(
      <DollCard
        doll={{ ...baseDoll, paint: "amalhama", rarity: "RR" }}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText("Амальгама · RR")).toBeInTheDocument();
  });

  it("renders notes when present", () => {
    const onEdit = vi.fn();
    render(
      <DollCard
        doll={{ ...baseDoll, notes: "Never removed from box" }}
        onEdit={onEdit}
      />
    );
    expect(screen.getByText("Never removed from box")).toBeInTheDocument();
  });

  it("calls onEdit when button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <DollCard
        doll={{ ...baseDoll }}
        onEdit={onEdit}
      />
    );
    await user.click(screen.getByRole("button", { name: /редагувати/i }));
    expect(onEdit).toHaveBeenCalledWith("doll-1");
  });

  it("does not render removed eBay price button", () => {
    const onEdit = vi.fn();
    render(<DollCard doll={{ ...baseDoll }} onEdit={onEdit} />);
    expect(screen.queryByRole("button", { name: /price/i })).not.toBeInTheDocument();
  });
});
