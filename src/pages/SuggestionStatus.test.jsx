import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SuggestionStatus from "./SuggestionStatus";
import { fetchSuggestionStatuses } from "../utils/contentApi";
import { loadSavedSuggestions, saveSuggestionId } from "../utils/suggestionIds";

vi.mock("../utils/contentApi", () => ({
    fetchSuggestionStatuses: vi.fn(),
}));

const renderPage = () =>
    render(
        <MemoryRouter>
            <SuggestionStatus />
        </MemoryRouter>,
    );

describe("SuggestionStatus", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it("shows an empty state when no ids are saved", async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText(/No saved suggestions yet/i)).toBeInTheDocument());
        expect(fetchSuggestionStatuses).not.toHaveBeenCalled();
    });

    it("fetches saved ids in one batch and renders status, kind, dates, and feedback", async () => {
        saveSuggestionId("sug_one");
        saveSuggestionId("sug_two");
        fetchSuggestionStatuses.mockResolvedValue({
            suggestions: [
                {
                    id: "sug_one",
                    site: "dokimotes",
                    kind: "new",
                    status: "approved",
                    submitted_at: "2026-07-20T18:41:02Z",
                    updated_at: "2026-07-22T09:15:33Z",
                    admin_context: "Great emote!\nCropping it slightly.",
                },
            ],
            not_found: ["sug_two"],
        });

        renderPage();

        await waitFor(() => expect(screen.getByText("approved")).toBeInTheDocument());
        expect(fetchSuggestionStatuses).toHaveBeenCalledTimes(1);
        expect(fetchSuggestionStatuses).toHaveBeenCalledWith(["sug_one", "sug_two"]);

        expect(screen.getByText("sug_one")).toBeInTheDocument();
        expect(screen.getByText(/Accepted! The change is being worked on/i)).toBeInTheDocument();
        expect(screen.getByText("Admin feedback")).toBeInTheDocument();
        expect(screen.getByText(/Great emote!/)).toBeInTheDocument();

        expect(screen.getByText("not found")).toBeInTheDocument();
        expect(screen.getByText(/removed by an admin, or the id is invalid/i)).toBeInTheDocument();
    });

    it("adds a manually entered id after verifying it belongs to this site", async () => {
        fetchSuggestionStatuses.mockResolvedValue({
            suggestions: [
                {
                    id: "sug_manual",
                    site: "dokimotes",
                    kind: "edit",
                    status: "pending",
                    submitted_at: "2026-07-21T00:00:00Z",
                    updated_at: "2026-07-21T00:00:00Z",
                    admin_context: "",
                },
            ],
            not_found: [],
        });

        renderPage();
        await waitFor(() => expect(screen.getByText(/No saved suggestions yet/i)).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText(/Track another suggestion/i), { target: { value: "sug_manual" } });
        fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));

        await waitFor(() => expect(screen.getByText("pending")).toBeInTheDocument());
        expect(fetchSuggestionStatuses).toHaveBeenCalledWith(["sug_manual"]);
        expect(loadSavedSuggestions().map((entry) => entry.id)).toEqual(["sug_manual"]);
    });

    it("refuses to add a manual id that belongs to another site", async () => {
        fetchSuggestionStatuses.mockResolvedValue({
            suggestions: [
                {
                    id: "sug_other",
                    site: "dokinomicon",
                    kind: "new",
                    status: "pending",
                    submitted_at: "2026-07-21T00:00:00Z",
                    updated_at: "2026-07-21T00:00:00Z",
                    admin_context: "",
                },
            ],
            not_found: [],
        });

        renderPage();
        await waitFor(() => expect(screen.getByText(/No saved suggestions yet/i)).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText(/Track another suggestion/i), { target: { value: "sug_other" } });
        fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));

        expect(await screen.findByText(/belongs to dokinomicon, not dokimotes/i)).toBeInTheDocument();
        expect(loadSavedSuggestions()).toEqual([]);
    });

    it("refuses to add a manual id the server doesn't know", async () => {
        fetchSuggestionStatuses.mockResolvedValue({ suggestions: [], not_found: ["sug_ghost"] });

        renderPage();
        await waitFor(() => expect(screen.getByText(/No saved suggestions yet/i)).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText(/Track another suggestion/i), { target: { value: "sug_ghost" } });
        fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));

        expect(await screen.findByText(/No suggestion was found with that id/i)).toBeInTheDocument();
        expect(loadSavedSuggestions()).toEqual([]);
    });

    it("rejects invalid manual ids without saving them", async () => {
        renderPage();
        await waitFor(() => expect(screen.getByText(/No saved suggestions yet/i)).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText(/Track another suggestion/i), { target: { value: "bad id!" } });
        fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));

        expect(await screen.findByText(/doesn't look like a valid suggestion id/i)).toBeInTheDocument();
        expect(loadSavedSuggestions()).toEqual([]);
        expect(fetchSuggestionStatuses).not.toHaveBeenCalled();
    });

    it("removes an id from the list without refetching", async () => {
        saveSuggestionId("sug_gone");
        fetchSuggestionStatuses.mockResolvedValue({ suggestions: [], not_found: ["sug_gone"] });

        renderPage();
        await waitFor(() => expect(screen.getByText("not found")).toBeInTheDocument());

        fireEvent.click(screen.getByRole("button", { name: /Remove sug_gone/i }));

        expect(screen.queryByText("sug_gone")).not.toBeInTheDocument();
        expect(loadSavedSuggestions()).toEqual([]);
        expect(fetchSuggestionStatuses).toHaveBeenCalledTimes(1);
    });
});
