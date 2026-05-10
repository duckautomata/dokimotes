import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import EditEmote from "./EditEmote";

vi.mock("../utils/contentApi", () => ({
    fetchPublicConfig: vi.fn(() =>
        Promise.resolve({
            turnstile_site_key: "test-key",
            allowed_sites: ["dokimotes"],
            max_image_bytes: 26214400,
            supported_formats: ["png", "jpg", "webp"],
            public_url_prefix: "https://cdn.test",
            pending_prefix: "_pending/",
        }),
    ),
    uploadImage: vi.fn(),
    submitSuggestion: vi.fn(),
    validateImageFile: vi.fn(() => null),
}));

vi.mock("../components/TurnstileWidget", () => ({
    default: () => <div data-testid="turnstile" />,
}));

const mockData = [
    {
        emote_id: "test-1",
        name: "Test Emote",
        artist: "Artist",
        credit: "Credit",
        type: "static",
        source: "fan-made",
        tags: ["a", "b"],
        image_id: "img1",
        image_ext: ".webp",
    },
];

const renderAt = (path) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/edit/:emote_id" element={<EditEmote data={mockData} />} />
            </Routes>
        </MemoryRouter>,
    );

describe("EditEmote", () => {
    it("renders edit form prefilled when emote exists", async () => {
        renderAt("/edit/test-1");

        await waitFor(() => expect(screen.getByText(/Suggest a Change/i)).toBeInTheDocument());

        const nameInput = screen.getByLabelText(/Name/i);
        expect(nameInput).toHaveValue("Test Emote");
        expect(screen.getByRole("button", { name: /Submit Edit/i })).toBeDisabled();
    });

    it("shows not-found state when emote id is unknown", () => {
        renderAt("/edit/missing");
        expect(screen.getByText(/Emote not found/i)).toBeInTheDocument();
    });

    it("switches to delete mode and shows reason field", async () => {
        renderAt("/edit/test-1");
        await waitFor(() => expect(screen.getByText(/Suggest a Change/i)).toBeInTheDocument());

        const deleteTab = screen.getByRole("tab", { name: /Delete/i });
        fireEvent.click(deleteTab);

        expect(screen.getByLabelText(/Reason/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Request Deletion/i })).toBeDisabled();
    });
});
