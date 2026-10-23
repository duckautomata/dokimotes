import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isValidSuggestionId, loadSavedSuggestions, removeSuggestionId, saveSuggestionId } from "./suggestionIds";
import { siteName } from "../config";

const STORAGE_KEY = `suggestion_ids:${siteName}`;
const LEGACY_STORAGE_KEY = "suggestion_ids";

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

    it("scopes the storage key by site", () => {
        saveSuggestionId("sug_abc123");
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).map((entry) => entry.id)).toEqual(["sug_abc123"]);
        expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    });
});

describe("suggestionIds legacy key migration", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.doUnmock("../config");
        vi.resetModules();
    });

    /** Loads a fresh copy of the module as if it were built for `site`. */
    const importForSite = async (site) => {
        vi.resetModules();
        vi.doMock("../config", () => ({ siteName: site }));
        return import("./suggestionIds");
    };

    it("merges the legacy ids into the dokimotes list and removes the legacy key", async () => {
        const { loadSavedSuggestions: load } = await importForSite("dokimotes");
        localStorage.setItem(
            LEGACY_STORAGE_KEY,
            JSON.stringify([
                { id: "sug_old1", savedAt: "2026-01-01T00:00:00.000Z" },
                { id: "bad id", savedAt: "x" },
                { id: "sug_both", savedAt: "2026-01-02T00:00:00.000Z" },
                { id: "sug_old1", savedAt: "2026-01-03T00:00:00.000Z" },
            ]),
        );
        localStorage.setItem(
            "suggestion_ids:dokimotes",
            JSON.stringify([
                { id: "sug_both", savedAt: "2026-02-01T00:00:00.000Z" },
                { id: "sug_new", savedAt: "2026-02-02T00:00:00.000Z" },
            ]),
        );

        expect(load()).toEqual([
            { id: "sug_old1", savedAt: "2026-01-01T00:00:00.000Z" },
            { id: "sug_both", savedAt: "2026-01-02T00:00:00.000Z" },
            { id: "sug_new", savedAt: "2026-02-02T00:00:00.000Z" },
        ]);
        expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
        expect(JSON.parse(localStorage.getItem("suggestion_ids:dokimotes")).map((entry) => entry.id)).toEqual([
            "sug_old1",
            "sug_both",
            "sug_new",
        ]);
    });

    it("migrates on the first save too", async () => {
        const { saveSuggestionId: save } = await importForSite("dokimotes");
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify([{ id: "sug_old", savedAt: "x" }]));

        expect(save("sug_new").map((entry) => entry.id)).toEqual(["sug_old", "sug_new"]);
        expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    });

    it("is idempotent", async () => {
        const { loadSavedSuggestions: load, removeSuggestionId: remove } = await importForSite("dokimotes");
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify([{ id: "sug_old", savedAt: "x" }]));

        const first = load();
        expect(load()).toEqual(first);
        expect(load()).toEqual([{ id: "sug_old", savedAt: "x" }]);

        // A removed id must not come back from the (already migrated) legacy list.
        remove("sug_old");
        expect(load()).toEqual([]);
    });

    it("leaves the legacy key alone on other sites", async () => {
        const { loadSavedSuggestions: load, saveSuggestionId: save } = await importForSite("mintomotes");
        const legacy = JSON.stringify([{ id: "sug_doki", savedAt: "x" }]);
        localStorage.setItem(LEGACY_STORAGE_KEY, legacy);

        expect(load()).toEqual([]);
        save("sug_mint");
        expect(load().map((entry) => entry.id)).toEqual(["sug_mint"]);
        expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBe(legacy);
        expect(localStorage.getItem("suggestion_ids:mintomotes")).toContain("sug_mint");
        expect(localStorage.getItem("suggestion_ids:dokimotes")).toBeNull();
    });

    it("keeps the legacy key when the merged list can't be saved", async () => {
        const { loadSavedSuggestions: load } = await importForSite("dokimotes");
        const legacy = JSON.stringify([{ id: "sug_old", savedAt: "x" }]);
        localStorage.setItem(LEGACY_STORAGE_KEY, legacy);

        const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("QuotaExceededError");
        });
        try {
            expect(load()).toEqual([]);
            expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBe(legacy);
        } finally {
            setItem.mockRestore();
        }

        // The next load, with storage working again, finishes the migration.
        expect(load()).toEqual([{ id: "sug_old", savedAt: "x" }]);
        expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    });

    it("tolerates storage that throws", async () => {
        const { loadSavedSuggestions: load, saveSuggestionId: save } = await importForSite("dokimotes");
        const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("SecurityError");
        });
        try {
            expect(load()).toEqual([]);
            expect(() => save("sug_new")).not.toThrow();
        } finally {
            getItem.mockRestore();
        }
    });
});
