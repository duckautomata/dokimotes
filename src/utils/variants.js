/**
 * @typedef {import("../store/types").EmoteData} EmoteData
 * @typedef {import("../store/types").EmoteGroup} EmoteGroup
 */

/**
 * Resolves the root "primary" emote for a row by following its `variant_of` link.
 * Standalone rows, dangling references (the named primary isn't present), and
 * accidental cycles all resolve to the row itself, so grouping never throws or
 * loops forever.
 *
 * @param {EmoteData} emote
 * @param {Map<string, EmoteData>} byId
 * @param {Set<string>} seen
 * @returns {EmoteData}
 */
const resolveRoot = (emote, byId, seen) => {
    const parentId = emote.variant_of;
    if (!parentId) return emote;
    const parent = byId.get(parentId);
    if (!parent || seen.has(emote.emote_id)) return emote;
    seen.add(emote.emote_id);
    return resolveRoot(parent, byId, seen);
};

/** Orders variants by their original CSV position so a set stays stable across the gallery shuffle. */
const byOrder = (a, b) => (a._order ?? 0) - (b._order ?? 0);

/**
 * Collapses a flat list of emotes into variant groups. Group order follows the
 * first appearance of each group in the input; within a group the primary is
 * listed first, followed by its variants in original CSV order.
 *
 * @param {EmoteData[]} emotes
 * @returns {EmoteGroup[]}
 */
export const buildGroups = (emotes) => {
    const byId = new Map(emotes.map((e) => [e.emote_id, e]));
    const groups = new Map();
    const order = [];

    for (const emote of emotes) {
        const root = resolveRoot(emote, byId, new Set());
        let group = groups.get(root.emote_id);
        if (!group) {
            group = { primary: root, members: [] };
            groups.set(root.emote_id, group);
            order.push(root.emote_id);
        }
        group.members.push(emote);
    }

    return order.map((id) => {
        const { primary, members } = groups.get(id);
        const variants = [primary, ...members.filter((e) => e.emote_id !== primary.emote_id).sort(byOrder)];
        return { primary, variants };
    });
};

/**
 * Returns the variant group a single emote belongs to (primary first, including
 * the emote itself). Returns a one-element list for a standalone emote, or an
 * empty list when `emote` is missing.
 *
 * @param {EmoteData[]} emotes
 * @param {EmoteData} [emote]
 * @returns {EmoteData[]}
 */
export const getVariants = (emotes, emote) => {
    if (!emote) return [];
    const byId = new Map(emotes.map((e) => [e.emote_id, e]));
    const rootId = resolveRoot(emote, byId, new Set()).emote_id;
    const siblings = emotes.filter((e) => resolveRoot(e, byId, new Set()).emote_id === rootId && e.emote_id !== rootId);
    const primary = byId.get(rootId) ?? emote;
    return [primary, ...siblings.sort(byOrder)];
};
