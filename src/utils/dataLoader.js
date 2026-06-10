import Papa from "papaparse";
import { LOG_ERROR } from "./debug";
import { cdn } from "../config";

/**
 * @typedef {import("../store/types").EmoteData} EmoteData
 */

const fetchAndParseCSV = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    const text = await response.text();

    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
        });
    });
};

/**
 * Loads and parses emote data from CSV files.
 *
 * @returns {Promise<EmoteData[]>} Promise resolving to an array of parsed emote data objects
 */
export const loadEmoteData = async () => {
    try {
        const dataRows = await fetchAndParseCSV(`${cdn}/emotes.csv`);

        const emotes = dataRows.map((row, index) => {
            const obj = {};
            for (const [header, val] of Object.entries(row)) {
                // Keep `variant_of` empty (rather than "Unknown") so a blank cell
                // reads as "no parent" instead of a dangling reference.
                if (header === "variant_of") {
                    obj[header] = (val ?? "").trim();
                    continue;
                }
                const value = val === "" ? "Unknown" : val;
                if (header === "tags") {
                    obj[header] = value.split(",").map((tag) => tag.trim());
                } else if (header === "type" || header === "source") {
                    obj[header] = value.toLowerCase();
                } else {
                    obj[header] = value;
                }
            }
            if (!obj.variant_of) obj.variant_of = "";
            // Original CSV position. The gallery shuffles the array on every load,
            // so keep this to restore a stable order within a variant set.
            obj._order = index;
            return obj;
        });

        return emotes.sort(() => Math.random() - 0.5);
    } catch (error) {
        LOG_ERROR("Error loading emote data:", error);
        return [];
    }
};
