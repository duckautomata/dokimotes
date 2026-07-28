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

    it("fetches saved ids in one batch and renders summary, status, kind, dates, and feedback", async () => {
        saveSuggestionId("sug_one");
        saveSuggestionId("sug_two");
        fetchSuggestionStatuses.mockResolvedValue({
            suggestions: [
                {
                    id: "sug_one",
                    site: "dokimotes",
                    kind: "new",
                    status: "approved",
                    summary: "Add the emote 'pogduck'",
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
        expect(screen.getByText("Add the emote 'pogduck'")).toBeInTheDocument();
        expect(screen.getByText(/Accepted! The change is being worked on/i)).toBeInTheDocument();
        expect(screen.getByText("Admin feedback")).toBeInTheDocument();
        expect(screen.getByText(/Great emote!/)).toBeInTheDocument();

        expect(screen.getByText("not found")).toBeInTheDocument();
        expect(
            screen.getByText(/removed by an admin, belong to another site, or the id is invalid/i),
        ).toBeInTheDocument();
    });

    it("re-reads the summary on refresh", async () => {
        saveSuggestionId("sug_one");
        const suggestion = {
            id: "sug_one",
            site: "dokimotes",
            kind: "new",
            status: "pending",
            summary: "Add the emote 'pogduck'",
            submitted_at: "2026-07-20T18:41:02Z",
            updated_at: "2026-07-20T18:41:02Z",
            admin_context: "",
        };
        fetchSuggestionStatuses.mockResolvedValue({ suggestions: [suggestion], not_found: [] });

        renderPage();
        await waitFor(() => expect(screen.getByText("Add the emote 'pogduck'")).toBeInTheDocument());

        fetchSuggestionStatuses.mockResolvedValue({
            suggestions: [{ ...suggestion, summary: "Add the emote 'pogduck' (renamed by admin)" }],
            not_found: [],
        });
        fireEvent.click(screen.getByRole("button", { name: /^Refresh$/i }));

        await waitFor(() => expect(screen.getByText("Add the emote 'pogduck' (renamed by admin)")).toBeInTheDocument());
        expect(screen.queryByText("Add the emote 'pogduck'")).not.toBeInTheDocument();
    });

    it("adds a manually entered id the server returns for this site", async () => {
        fetchSuggestionStatuses.mockResolvedValue({
            suggestions: [
                {
                    id: "sug_manual",
                    site: "dokimotes",
                    kind: "edit",
                    status: "pending",
                    summary: "Update the tags on 'pogduck'",
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
        expect(screen.getByText("Update the tags on 'pogduck'")).toBeInTheDocument();
        expect(fetchSuggestionStatuses).toHaveBeenCalledWith(["sug_manual"]);
        expect(loadSavedSuggestions().map((entry) => entry.id)).toEqual(["sug_manual"]);
    });

    // The lookup is scoped to this site server-side, so an id from another site
    // is indistinguishable from an unknown one: both come back in not_found.
    it("refuses to add a manual id the server doesn't return for this site", async () => {
        fetchSuggestionStatuses.mockResolvedValue({ suggestions: [], not_found: ["sug_ghost"] });

        renderPage();
        await waitFor(() => expect(screen.getByText(/No saved suggestions yet/i)).toBeInTheDocument());

        fireEvent.change(screen.getByLabelText(/Track another suggestion/i), { target: { value: "sug_ghost" } });
        fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));

        expect(await screen.findByText(/No dokimotes suggestion was found with that id/i)).toBeInTheDocument();
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
