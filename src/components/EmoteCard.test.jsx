import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import EmoteCard from "./EmoteCard";
import { cdn } from "../config";

describe("EmoteCard", () => {
    const mockEmote = {
        emote_id: "test-id",
        name: "Test Emote",
        image_id: "test-img",
        image_ext: ".webp",
        source: "official",
        type: "static",
        artist: "Test Artist",
        credit: "Test Credit",
        tags: ["test1", "test2"],
    };

    const renderWithRouter = (ui) => {
        return render(<MemoryRouter>{ui}</MemoryRouter>);
    };

    it("renders image correctly and links to view page", () => {
        renderWithRouter(<EmoteCard emote={mockEmote} />);

        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/view/test-id");

        const img = screen.getByAltText("Test Emote");
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", `${cdn}/test-img_t.webp`);
        expect(img).toHaveAttribute("loading", "lazy");
    });

    it("renders video indicator when image_ext is .mp4", () => {
        const mp4Emote = { ...mockEmote, image_ext: ".mp4" };
        const { container } = renderWithRouter(<EmoteCard emote={mp4Emote} />);

        const videoIndicator = container.querySelector(".video-indicator");
        expect(videoIndicator).toBeInTheDocument();
    });

    it("does not render video indicator for non-mp4 files", () => {
        const { container } = renderWithRouter(<EmoteCard emote={mockEmote} />);

        const videoIndicator = container.querySelector(".video-indicator");
        expect(videoIndicator).not.toBeInTheDocument();
    });

    it("renders a variant badge with the count when part of a group", () => {
        const { container } = renderWithRouter(<EmoteCard emote={mockEmote} variantCount={3} />);

        const badge = container.querySelector(".doki-card-variant-badge");
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent("3");
        expect(container.querySelector(".doki-card-group")).toBeInTheDocument();
    });

    it("does not render a variant badge for a standalone emote", () => {
        const { container } = renderWithRouter(<EmoteCard emote={mockEmote} />);

        expect(container.querySelector(".doki-card-variant-badge")).not.toBeInTheDocument();
        expect(container.querySelector(".doki-card-group")).not.toBeInTheDocument();
    });

    it("shows placeholder and hides image on error", () => {
        const { container } = renderWithRouter(<EmoteCard emote={mockEmote} />);

        const img = screen.getByAltText("Test Emote");
        const placeholder = container.querySelector(".doki-card-placeholder");

        // Initially placeholder is hidden
        expect(placeholder).toHaveStyle({ display: "none" });

        // Trigger error
        fireEvent.error(img);

        // Image should be hidden
        expect(img).toHaveStyle({ display: "none" });
        // Placeholder should be visible
        expect(placeholder).toHaveStyle({ display: "flex" });
    });
});
