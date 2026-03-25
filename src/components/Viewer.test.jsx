import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Viewer from "./Viewer";
import { MemoryRouter, Route, Routes } from "react-router-dom";

describe("Viewer", () => {
    it("renders loading state", () => {
        render(
            <MemoryRouter initialEntries={["/view/123"]}>
                <Routes>
                    <Route path="/view/:emote_id" element={<Viewer emojis={[]} status="loading" />} />
                </Routes>
            </MemoryRouter>,
        );
        expect(screen.getByText("Loading")).toBeInTheDocument();
    });

    it("renders not found when emoji is missing", () => {
        render(
            <MemoryRouter initialEntries={["/view/123"]}>
                <Routes>
                    <Route path="/view/:emote_id" element={<Viewer emojis={[]} status="ok" />} />
                </Routes>
            </MemoryRouter>,
        );
        expect(screen.getByText("Dokimote Not Found")).toBeInTheDocument();
    });

    it("renders the emote data correctly when emoji is found", () => {
        const mockEmojis = [
            {
                emote_id: "test_emote_1",
                name: "Test Emote Name",
                artist: "Test Artist",
                credit: "Test Credit",
                type: "static",
                source: "test",
                tags: ["tag1", "tag2"],
                image_id: "test_id",
                image_ext: ".png",
            },
        ];

        render(
            <MemoryRouter initialEntries={["/view/test_emote_1"]}>
                <Routes>
                    <Route path="/view/:emote_id" element={<Viewer emojis={mockEmojis} status="ok" />} />
                </Routes>
            </MemoryRouter>,
        );
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Test Emote Name");
        expect(screen.getByText(/Test Artist/)).toBeInTheDocument();
        expect(screen.getByText(/Test Credit/)).toBeInTheDocument();
        expect(screen.getByText(/tag1, tag2/)).toBeInTheDocument();
    });
});
