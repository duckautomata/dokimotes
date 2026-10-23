import { siteName } from "../config";

// Persists the ids returned by POST /api/public/suggestion so the user can
// look up their suggestions later. The id is an unguessable token that acts as
// the access capability, so losing it means losing access to the status.
//
// The key is scoped by site because dokimotes and dokinomicon are served from
// the same origin under different base paths, and localStorage is per-origin,
// an unscoped key would leak each site's ids into the other's list.
const STORAGE_KEY = `suggestion_ids:${siteName}`;

// Before the key was scoped, dokimotes saved its ids under this bare key.
// dokinomicon was scoped from the start, so only the dokimotes build adopts them.
const LEGACY_STORAGE_KEY = "suggestion_ids";
const LEGACY_SITE = "dokimotes";

// Server-side id rule from the suggestion status API.
const SUGGESTION_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const isValidSuggestionId = (id) => typeof id === "string" && SUGGESTION_ID_PATTERN.test(id);

/**
 * @typedef {Object} SavedSuggestion
 * @property {string} id
 * @property {string} savedAt - ISO-8601 timestamp of when the id was saved.
 */

/**
 * @param {string} key
 * @returns {SavedSuggestion[]} the entries with a valid id stored under `key`
 */
const readEntries = (key) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((entry) => entry && isValidSuggestionId(entry.id));
    } catch {
        return [];
    }
};

/**
 * Moves ids saved under the legacy unscoped key into this site's list, then
 * drops the legacy key. A no-op on every site but dokimotes and once the legacy
 * key is gone. The legacy key is only removed after the merged list is saved,
 * so a failed write never loses ids.
 */
const migrateLegacyIds = () => {
    if (siteName !== LEGACY_SITE) return;
    try {
        if (localStorage.getItem(LEGACY_STORAGE_KEY) === null) return;
        // Legacy ids are the older ones, so they go first. Keep the first copy of each id.
        const merged = [];
        const seen = new Set();
        for (const entry of [...readEntries(LEGACY_STORAGE_KEY), ...readEntries(STORAGE_KEY)]) {
            if (seen.has(entry.id)) continue;
            seen.add(entry.id);
            merged.push(entry);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
        // Storage unavailable/full. The legacy key stays put for the next attempt.
    }
};

/** @returns {SavedSuggestion[]} */
export const loadSavedSuggestions = () => {
    migrateLegacyIds();
    return readEntries(STORAGE_KEY);
};

const persist = (entries) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
        // Storage unavailable/full. Worst case the id just isn't remembered.
    }
};

/**
 * Appends an id to the saved list (no-op for duplicates or invalid ids).
 *
 * @returns {SavedSuggestion[]} the updated list
 */
export const saveSuggestionId = (id) => {
    const entries = loadSavedSuggestions();
    if (!isValidSuggestionId(id) || entries.some((entry) => entry.id === id)) return entries;
    const updated = [...entries, { id, savedAt: new Date().toISOString() }];
    persist(updated);
    return updated;
};

/**
 * Removes an id from the saved list. Does not delete anything server-side.
 *
 * @returns {SavedSuggestion[]} the updated list
 */
export const removeSuggestionId = (id) => {
    const entries = loadSavedSuggestions();
    const updated = entries.filter((entry) => entry.id !== id);
    if (updated.length !== entries.length) persist(updated);
    return updated;
};
