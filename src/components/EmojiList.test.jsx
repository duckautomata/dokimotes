import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EmojiList from "./EmojiList";
import { MemoryRouter } from "react-router-dom";

const mockEmojis = [
    {
        emote_id: "test_emote_1",
        name: "First Emote",
        artist: "Artist 1",
        image_id: "img_1",
    },
    {
        emote_id: "test_emote_2",
        name: "Second Emote",
        artist: "Artist 2",
        image_id: "img_2",
    },
];

// Mock react-virtuoso because JSDOM doesn't support layout/measurements needed for virtual lists out-of-the-box
vi.mock("react-virtuoso", () => ({
    VirtuosoGrid: ({ data, itemContent }) => (
        <div data-testid="virtuoso-grid">
            {data.map((item, index) => (
                <div key={index} data-testid="virtuoso-item">
                    {itemContent(index, item)}
                </div>
            ))}
        </div>
    ),
}));

describe("EmojiList", () => {
    it("renders the correct array of emojis", () => {
        render(
            <MemoryRouter>
                <EmojiList emojis={mockEmojis} />
            </MemoryRouter>,
        );

        const items = screen.getAllByTestId("virtuoso-item");
        expect(items).toHaveLength(2);

        // Each sub-item (EmojiItem) should render an img with the emoji's name as alt text
        expect(screen.getByAltText("First Emote")).toBeInTheDocument();
        expect(screen.getByAltText("Second Emote")).toBeInTheDocument();
    });
});
