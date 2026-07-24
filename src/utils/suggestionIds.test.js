import { describe, it, expect, beforeEach } from "vitest";
import { isValidSuggestionId, loadSavedSuggestions, removeSuggestionId, saveSuggestionId } from "./suggestionIds";

const STORAGE_KEY = "suggestion_ids";

describe("suggestionIds", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("validates ids against the server rule", () => {
        expect(isValidSuggestionId("sug_M_i3lsTUpek")).toBe(true);
        expect(isValidSuggestionId("abc-123_XYZ")).toBe(true);
        expect(isValidSuggestionId("")).toBe(false);
        expect(isValidSuggestionId("has spaces")).toBe(false);
        expect(isValidSuggestionId("a".repeat(65))).toBe(false);
        expect(isValidSuggestionId(null)).toBe(false);
    });

    it("returns an empty list when nothing is stored", () => {
        expect(loadSavedSuggestions()).toEqual([]);
    });

    it("saves and reloads ids with a savedAt timestamp", () => {
        const updated = saveSuggestionId("sug_abc123");
        expect(updated).toHaveLength(1);
        expect(updated[0].id).toBe("sug_abc123");
        expect(typeof updated[0].savedAt).toBe("string");

        expect(loadSavedSuggestions()).toEqual(updated);
    });

    it("ignores duplicate and invalid ids", () => {
        saveSuggestionId("sug_abc123");
        expect(saveSuggestionId("sug_abc123")).toHaveLength(1);
        expect(saveSuggestionId("not valid!")).toHaveLength(1);
        expect(loadSavedSuggestions()).toHaveLength(1);
    });

    it("removes only the requested id", () => {
        saveSuggestionId("sug_a");
        saveSuggestionId("sug_b");
        const updated = removeSuggestionId("sug_a");
        expect(updated.map((entry) => entry.id)).toEqual(["sug_b"]);
        expect(loadSavedSuggestions().map((entry) => entry.id)).toEqual(["sug_b"]);
    });

    it("survives corrupt storage contents", () => {
        localStorage.setItem(STORAGE_KEY, "not json");
        expect(loadSavedSuggestions()).toEqual([]);

        localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: true }));
        expect(loadSavedSuggestions()).toEqual([]);

        localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: "sug_ok", savedAt: "x" }, { id: "bad id" }, null]));
        expect(loadSavedSuggestions().map((entry) => entry.id)).toEqual(["sug_ok"]);
    });
});
