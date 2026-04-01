import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { useAppStore } from "../store/store";

// Mock zustand store
vi.mock("../store/store", () => ({
    useAppStore: vi.fn(),
}));

describe("Home", () => {
    const mockData = [
        {
            emote_id: "test-emote-1",
            name: "Alpha Emote",
            source: "official",
            type: "animated",
            artist: "Artist A",
            tags: ["tag1"],
            image_id: "img1",
            image_ext: ".webp",
        },
        {
            emote_id: "test-emote-2",
            name: "Beta Emote",
            source: "fan-made",
            type: "static",
            artist: "Artist B",
            tags: ["tag2"],
            image_id: "img2",
            image_ext: ".webp",
        },
    ];

    let mockStore;

    beforeEach(() => {
        mockStore = {
            homeSearchText: "",
            homeSetSearchText: vi.fn(),
            homeFilterSource: "All",
            homeSetFilterSource: vi.fn(),
            homeFilterType: "All",
            homeSetFilterType: vi.fn(),
            homeFilterArtist: "All",
            homeSetFilterArtist: vi.fn(),
        };

        useAppStore.mockImplementation((selector) => selector(mockStore));
    });

    it("renders all emotes initially", () => {
        render(
            <MemoryRouter>
                <Home data={mockData} />
            </MemoryRouter>,
        );

        expect(screen.getByAltText("Alpha Emote")).toBeInTheDocument();
        expect(screen.getByAltText("Beta Emote")).toBeInTheDocument();

        // Filter dropdown should have options for source, type, artist + All for each
        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(9); // Source (3), Type (3), Artist (3)
    });

    it("filters emotes based on search query", () => {
        // Set search text to match only Alpha
        mockStore.homeSearchText = "alpha";

        render(
            <MemoryRouter>
                <Home data={mockData} />
            </MemoryRouter>,
        );

        expect(screen.getByAltText("Alpha Emote")).toBeInTheDocument();
        expect(screen.queryByAltText("Beta Emote")).not.toBeInTheDocument();

        // Clear search button should be visible
        const clearBtn = screen.getByLabelText("Clear search");
        expect(clearBtn).toBeInTheDocument();

        fireEvent.click(clearBtn);
        expect(mockStore.homeSetSearchText).toHaveBeenCalledWith("");
    });

    it("filters emotes based on source", () => {
        // Set filter source to match only fan-made
        mockStore.homeFilterSource = "fan-made";

        render(
            <MemoryRouter>
                <Home data={mockData} />
            </MemoryRouter>,
        );

        expect(screen.queryByAltText("Alpha Emote")).not.toBeInTheDocument();
        expect(screen.getByAltText("Beta Emote")).toBeInTheDocument();
    });
});
