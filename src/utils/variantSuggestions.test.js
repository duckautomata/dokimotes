import { describe, it, expect } from "vitest";
import { nameFromFileName, hasVariantCycle, hasDuplicateNames, capitalize, pluralVariants } from "./variantSuggestions";

describe("nameFromFileName", () => {
    it("drops the extension", () => {
        expect(nameFromFileName("pogduck.png")).toBe("pogduck");
    });

    it("drops any leading path", () => {
        expect(nameFromFileName("art\\sets/pogduck_v2.webp")).toBe("pogduck_v2");
    });

    it("keeps dots inside the name", () => {
        expect(nameFromFileName("doki.pog.gif")).toBe("doki.pog");
    });

    it("leaves a dotfile alone rather than emptying it", () => {
        expect(nameFromFileName(".pogduck")).toBe(".pogduck");
    });

    it("handles a missing name", () => {
        expect(nameFromFileName(undefined)).toBe("");
    });
});

describe("hasVariantCycle", () => {
    it("accepts a plain chain", () => {
        expect(hasVariantCycle({ p: "", v1: "p", v2: "v1" })).toBe(false);
    });

    it("accepts a dangling parent", () => {
        expect(hasVariantCycle({ v1: "gone" })).toBe(false);
    });

    it("catches an emote pointed at itself", () => {
        expect(hasVariantCycle({ p: "p" })).toBe(true);
    });

    it("catches a two-emote loop", () => {
        expect(hasVariantCycle({ a: "b", b: "a" })).toBe(true);
    });

    it("catches a loop that only some emotes reach", () => {
        expect(hasVariantCycle({ standalone: "", a: "b", b: "c", c: "a" })).toBe(true);
    });
});

describe("hasDuplicateNames", () => {
    it("ignores case and surrounding space", () => {
        expect(hasDuplicateNames(["pogduck", " PogDuck "])).toBe(true);
    });

    it("ignores blank names", () => {
        expect(hasDuplicateNames(["", "", "pogduck"])).toBe(false);
    });

    it("passes a distinct set", () => {
        expect(hasDuplicateNames(["pogduck", "pogduck cry"])).toBe(false);
    });
});

describe("summary helpers", () => {
    it("capitalizes only the first letter", () => {
        expect(capitalize("update the tags on 'pogDuck'")).toBe("Update the tags on 'pogDuck'");
        expect(capitalize("")).toBe("");
    });

    it("pluralizes variant counts", () => {
        expect(pluralVariants(1)).toBe("1 variant");
        expect(pluralVariants(3)).toBe("3 variants");
    });
});
