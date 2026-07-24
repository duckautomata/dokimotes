import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Suggestion from "./Suggestion";
import { fetchPublicConfig, submitSuggestion } from "../utils/contentApi";
import { loadSavedSuggestions } from "../utils/suggestionIds";

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

describe("Suggestion", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("renders the form once config is loaded", async () => {
        render(
            <MemoryRouter>
                <Suggestion />
            </MemoryRouter>,
        );

        expect(screen.getByText(/loading suggestion form/i)).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText(/General Suggestion/i)).toBeInTheDocument());

        expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Submit Suggestion/i })).toBeDisabled();
    });

    it("asks for confirmation before submitting and saves the returned id", async () => {
        fetchPublicConfig.mockResolvedValueOnce({
            turnstile_site_key: "test-key",
            turnstile_enabled: false,
            allowed_sites: ["dokimotes"],
            max_image_bytes: 26214400,
            supported_formats: ["png", "jpg", "webp"],
            public_url_prefix: "https://cdn.test",
            pending_prefix: "_pending/",
        });
        submitSuggestion.mockResolvedValue({ id: "sug_confirmed1" });

        render(
            <MemoryRouter>
                <Suggestion />
            </MemoryRouter>,
        );

        await waitFor(() => expect(screen.getByText(/General Suggestion/i)).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText(/Message/i), { target: { value: "An idea" } });
        const submitBtn = screen.getByRole("button", { name: /Submit Suggestion/i });
        await waitFor(() => expect(submitBtn).toBeEnabled());

        // Submitting the form opens the confirmation modal instead of sending.
        fireEvent.click(submitBtn);
        expect(screen.getByText(/Submit suggestion\?/i)).toBeInTheDocument();
        expect(submitSuggestion).not.toHaveBeenCalled();

        // Cancel closes the modal without submitting.
        fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
        expect(screen.queryByText(/Submit suggestion\?/i)).not.toBeInTheDocument();
        expect(submitSuggestion).not.toHaveBeenCalled();

        // Confirming actually submits and lands on the success screen.
        fireEvent.click(screen.getByRole("button", { name: /Submit Suggestion/i }));
        fireEvent.click(screen.getByRole("button", { name: /^Submit$/ }));

        await waitFor(() => expect(screen.getByText(/Thanks!/i)).toBeInTheDocument());
        expect(submitSuggestion).toHaveBeenCalledTimes(1);
        expect(loadSavedSuggestions().map((entry) => entry.id)).toEqual(["sug_confirmed1"]);
    });
});
