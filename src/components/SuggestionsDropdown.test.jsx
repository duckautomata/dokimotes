import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SuggestionsDropdown from "./SuggestionsDropdown";
import { new_emoji_form, suggestion_form, edit_emote_form } from "../config";

describe("SuggestionsDropdown", () => {
    it("renders the button initially closed", () => {
        render(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-expanded", "false");

        // Dropdown menu should not be visible
        expect(screen.queryByText("New Emote")).not.toBeInTheDocument();
    });

    it("opens the dropdown when clicked", () => {
        render(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });

        fireEvent.click(button);

        expect(button).toHaveAttribute("aria-expanded", "true");

        // Dropdown items should be visible
        const newEmoteLink = screen.getByText("New Emote").closest("a");
        const generalLink = screen.getByText("General Suggestion").closest("a");
        const editLink = screen.getByText("Edit Emote").closest("a");

        expect(newEmoteLink).toHaveAttribute("href", new_emoji_form);
        expect(generalLink).toHaveAttribute("href", suggestion_form);
        expect(editLink).toHaveAttribute("href", edit_emote_form("", "", "", "", "", "", ""));
    });

    it("closes the dropdown when clicking outside", () => {
        render(<SuggestionsDropdown />);
        const button = screen.getByRole("button", { name: /Suggestions/i });

        fireEvent.click(button); // open it
        expect(screen.getByText("New Emote")).toBeInTheDocument();

        fireEvent.mouseDown(document.body); // simulate click outside

        expect(screen.queryByText("New Emote")).not.toBeInTheDocument();
    });
});
