import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SuggestionsDropdown from "./SuggestionsDropdown";

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("SuggestionsDropdown", () => {
    it("renders the button initially closed", () => {
        renderWithRouter(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-expanded", "false");

        // Dropdown menu should not be visible
        expect(screen.queryByText("New Emote")).not.toBeInTheDocument();
    });

    it("opens the dropdown when clicked and links to internal routes", () => {
        renderWithRouter(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });

        fireEvent.click(button);

        expect(button).toHaveAttribute("aria-expanded", "true");

        const newEmoteLink = screen.getByText("New Emote").closest("a");
        const generalLink = screen.getByText("General Suggestion").closest("a");

        expect(newEmoteLink).toHaveAttribute("href", "/add");
        expect(generalLink).toHaveAttribute("href", "/suggestion");
    });

    it("closes the dropdown when clicking outside", () => {
        renderWithRouter(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });

        fireEvent.click(button); // open it
        expect(screen.getByText("New Emote")).toBeInTheDocument();

        fireEvent.mouseDown(document.body); // simulate click outside

        expect(screen.queryByText("New Emote")).not.toBeInTheDocument();
    });

    it("closes the dropdown after selecting an item", () => {
        renderWithRouter(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });

        fireEvent.click(button);
        const newEmoteLink = screen.getByText("New Emote").closest("a");
        fireEvent.click(newEmoteLink);

        expect(screen.queryByText("New Emote")).not.toBeInTheDocument();
    });
});
