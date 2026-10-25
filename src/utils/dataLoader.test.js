import { describe, it, expect, vi, afterEach } from "vitest";
import { loadEmoteData } from "./dataLoader";
import { cdn } from "../config";

const HEADER = "emote_id,image_id,image_ext,name,artist,credit,type,source,tags,variant_of";

const mockFetch = (impl) => vi.spyOn(globalThis, "fetch").mockImplementation(impl);
const csvResponse = (text, init = { status: 200 }) => Promise.resolve(new Response(text, init));

describe("loadEmoteData", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("fetches emotes.csv from this site's CDN folder and parses the rows", async () => {
        const fetchSpy = mockFetch(() =>
            csvResponse(`${HEADER}\ne1,img1,.webp,Wave,Artist A,,Static,Official,"happy, hi",\n`),
        );

        const data = await loadEmoteData();

        expect(fetchSpy).toHaveBeenCalledWith(`${cdn}/emotes.csv`);
        expect(data).toEqual([
            {
                emote_id: "e1",
                image_id: "img1",
                image_ext: ".webp",
                name: "Wave",
                artist: "Artist A",
                credit: "Unknown",
                type: "static",
                source: "official",
                tags: ["happy", "hi"],
                variant_of: "",
                _order: 0,
            },
        ]);
    });

    it("resolves to an empty list for a header-only CSV", async () => {
        mockFetch(() => csvResponse(`${HEADER}\n`));
        await expect(loadEmoteData()).resolves.toEqual([]);
    });

    it("rejects when the CSV can't be fetched", async () => {
        mockFetch(() => csvResponse("Not Found", { status: 404 }));
        await expect(loadEmoteData()).rejects.toThrow(`Failed to fetch ${cdn}/emotes.csv`);
    });

    it("rejects on a network error", async () => {
        mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));
        await expect(loadEmoteData()).rejects.toThrow("Failed to fetch");
    });
});
