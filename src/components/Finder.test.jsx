import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Finder from "./Finder";

describe("Finder", () => {
    it("renders empty text when no emojis are provided", () => {
        render(<Finder emojis={[]} emptyText="No emojis found matching your criteria." />);
        expect(screen.getByText("No emojis found matching your criteria.")).toBeInTheDocument();
    });
});
