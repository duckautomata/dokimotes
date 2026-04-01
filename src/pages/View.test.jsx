import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import View from "./View";

describe("View", () => {
    const mockData = [
        {
            emote_id: "test-emote-1",
            name: "Test Emote One",
            artist: "Test Artist",
            credit: "Test Credit",
            type: "animated",
            source: "official",
            tags: ["Cool", "Test"],
            image_id: "img1",
            image_ext: ".webp",
        },
    ];

    it("renders Emote not found if id doesn't match", () => {
        render(
            <MemoryRouter initialEntries={["/view/unknown"]}>
                <Routes>
                    <Route path="/view/:emote_id" element={<View data={mockData} />} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText("Emote not found")).toBeInTheDocument();
        expect(screen.getByText("Return Home")).toBeInTheDocument();
    });

    it("renders Emote details if id matches", () => {
        render(
            <MemoryRouter initialEntries={["/view/test-emote-1"]}>
                <Routes>
                    <Route path="/view/:emote_id" element={<View data={mockData} />} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByRole("heading", { name: "Test Emote One" })).toBeInTheDocument();
        expect(screen.getByText("Test Artist")).toBeInTheDocument();
        expect(screen.getByText("Test Credit")).toBeInTheDocument();

        // Tags
        expect(screen.getByText("Cool")).toBeInTheDocument();
        expect(screen.getByText("Test")).toBeInTheDocument();

        // There should be one main image
        const images = screen.getAllByRole("img");
        expect(images).toHaveLength(1);
    });
});
