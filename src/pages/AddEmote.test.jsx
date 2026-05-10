import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AddEmote from "./AddEmote";

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

vi.mock("../components/UnsavedChangesGuard", () => ({
    default: () => null,
}));

describe("AddEmote", () => {
    it("renders the form fields once config is loaded", async () => {
        render(
            <MemoryRouter>
                <AddEmote />
            </MemoryRouter>,
        );

        await waitFor(() => expect(screen.getByText(/Suggest a New Emote/i)).toBeInTheDocument());

        expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Tags/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Submit Suggestion/i })).toBeDisabled();
    });
});
