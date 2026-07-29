// Helpers shared by the Add and Edit suggestion forms, which both let a
// submitter propose a whole variant set (one main emote plus its variants)
// rather than a single emote.

/**
 * Seeds an emote name from an uploaded file name: drops any path and the
 * trailing extension, so "art/pogduck_v2.png" becomes "pogduck_v2". The user
 * can always overwrite it in the row.
 *
 * @param {string} [fileName]
 * @returns {string}
 */
export const nameFromFileName = (fileName) => {
    if (typeof fileName !== "string") return "";
    const base = fileName.split(/[\\/]/).pop() ?? "";
    const dot = base.lastIndexOf(".");
    const stem = dot > 0 ? base.slice(0, dot) : base;
    return stem.trim().slice(0, 100);
};

/**
 * Detects whether a proposed set of `variant_of` links makes any emote a
 * variant of itself (directly or through a chain). The gallery tolerates
 * cycles, but a suggestion containing one is never what the submitter meant,
 * so the forms block on it.
 *
 * @param {Record<string, string>} parentOf - emote_id → proposed variant_of ("" for none)
 * @returns {boolean}
 */
export const hasVariantCycle = (parentOf) => {
    const IN_PATH = 0;
    const SETTLED = 1;
    const state = new Map();

    for (const start of Object.keys(parentOf)) {
        const path = [];
        let node = start;
        while (node && state.get(node) !== SETTLED) {
            if (state.get(node) === IN_PATH) return true;
            state.set(node, IN_PATH);
            path.push(node);
            node = parentOf[node] ?? "";
        }
        for (const visited of path) state.set(visited, SETTLED);
    }

    return false;
};

/**
 * Case-insensitive duplicate check over the names in a proposed set. Duplicates
 * are legal but almost always a slip, so the forms warn without blocking.
 *
 * @param {string[]} names
 * @returns {boolean}
 */
export const hasDuplicateNames = (names) => {
    const seen = new Set();
    for (const name of names) {
        const key = name.trim().toLowerCase();
        if (!key) continue;
        if (seen.has(key)) return true;
        seen.add(key);
    }
    return false;
};

/** Uppercases the first letter of a generated summary sentence. */
export const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

/** "1 variant" / "2 variants" */
export const pluralVariants = (count) => `${count} variant${count === 1 ? "" : "s"}`;
