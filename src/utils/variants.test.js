import { describe, it, expect } from "vitest";
import { buildGroups, getVariants } from "./variants";

const emote = (id, variant_of = "") => ({
    emote_id: id,
    image_id: `${id}-img`,
    image_ext: ".webp",
    name: id,
    artist: "Artist",
    credit: "",
    type: "static",
    source: "official",
    tags: [],
    variant_of,
});

describe("buildGroups", () => {
    it("keeps standalone emotes as single-member groups", () => {
        const groups = buildGroups([emote("a"), emote("b")]);
        expect(groups).toHaveLength(2);
        expect(groups.every((g) => g.variants.length === 1)).toBe(true);
    });

    it("groups variants under their primary, primary listed first", () => {
        const groups = buildGroups([emote("p"), emote("v1", "p"), emote("v2", "p")]);
        expect(groups).toHaveLength(1);
        expect(groups[0].primary.emote_id).toBe("p");
        expect(groups[0].variants.map((v) => v.emote_id)).toEqual(["p", "v1", "v2"]);
    });

    it("groups correctly even when a variant appears before its primary", () => {
        const groups = buildGroups([emote("v1", "p"), emote("p")]);
        expect(groups).toHaveLength(1);
        expect(groups[0].primary.emote_id).toBe("p");
        expect(groups[0].variants.map((v) => v.emote_id)).toEqual(["p", "v1"]);
    });

    it("treats a dangling variant_of as its own primary", () => {
        const groups = buildGroups([emote("v1", "missing")]);
        expect(groups).toHaveLength(1);
        expect(groups[0].primary.emote_id).toBe("v1");
    });

    it("does not loop forever on a cycle", () => {
        const groups = buildGroups([emote("a", "b"), emote("b", "a")]);
        expect(groups.length).toBeGreaterThanOrEqual(1);
    });
});

describe("getVariants", () => {
    const data = [emote("p"), emote("v1", "p"), emote("v2", "p"), emote("other")];

    it("returns the whole set (primary first) for any member", () => {
        expect(getVariants(data, data[1]).map((v) => v.emote_id)).toEqual(["p", "v1", "v2"]);
        expect(getVariants(data, data[0]).map((v) => v.emote_id)).toEqual(["p", "v1", "v2"]);
    });

    it("returns a lone emote for a standalone", () => {
        expect(getVariants(data, data[3]).map((v) => v.emote_id)).toEqual(["other"]);
    });

    it("returns an empty list for a missing emote", () => {
        expect(getVariants(data, undefined)).toEqual([]);
    });

    it("orders variants by original CSV position, not array order (stable across the gallery shuffle)", () => {
        const withOrder = (id, variant_of, order) => ({ ...emote(id, variant_of), _order: order });
        // Array deliberately scrambled; _order carries the real CSV order.
        const shuffled = [withOrder("v2", "p", 3), withOrder("p", "", 0), withOrder("v1", "p", 1)];

        expect(getVariants(shuffled, shuffled[0]).map((v) => v.emote_id)).toEqual(["p", "v1", "v2"]);
        expect(buildGroups(shuffled)[0].variants.map((v) => v.emote_id)).toEqual(["p", "v1", "v2"]);
    });
});
