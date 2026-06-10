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

        // There should be one main image (no switcher for a standalone emote)
        const images = screen.getAllByRole("img");
        expect(images).toHaveLength(1);
    });

    it("renders a variant switcher when the emote has variants", () => {
        const groupedData = [
            {
                emote_id: "primary",
                name: "Primary Emote",
                artist: "Test Artist",
                credit: "Test Credit",
                type: "static",
                source: "official",
                tags: ["Cool"],
                image_id: "imgp",
                image_ext: ".webp",
                variant_of: "",
            },
            {
                emote_id: "variant",
                name: "Variant Emote",
                artist: "Test Artist",
                credit: "Test Credit",
                type: "animated",
                source: "official",
                tags: ["Cool"],
                image_id: "imgv",
                image_ext: ".mp4",
                variant_of: "primary",
            },
        ];

        render(
            <MemoryRouter initialEntries={["/view/primary"]}>
                <Routes>
                    <Route path="/view/:emote_id" element={<View data={groupedData} />} />
                </Routes>
            </MemoryRouter>,
        );

        // One switcher entry per variant, primary marked active and linking to siblings
        const tabs = screen.getAllByRole("tab");
        expect(tabs).toHaveLength(2);
        expect(screen.getByRole("tab", { selected: true })).toHaveAttribute("href", "/view/primary");
        expect(screen.getByRole("tab", { name: /Variant Emote/ })).toHaveAttribute("href", "/view/variant");
    });
});
