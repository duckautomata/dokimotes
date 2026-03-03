import { cdn } from "./config";
// eslint-disable-next-line no-unused-vars
import { EmojiSource, EmojiType } from "./store/types";
import Papa from "papaparse";

/**
 * @typedef {object} Emoji
 * @property {string} emote_id - A unique id for each emote.
 * @property {string} image_id - Used to fetch the image from the cdn.
 * @property {string} image_ext - Used to fetch the image from the cdn.
 * @property {string} name - The display name of the emoji.
 * @property {string} artist - The artist's name or handle.
 * @property {string} credit - A URL or text credit for the artist.
 * @property {EmojiType} type - The type of emoji.
 * @property {EmojiSource} source - The source of the emoji.
 * @property {string[]} tags - An array of search tags.
 */

const parseCSV = (text) => {
    const parsed = Papa.parse(text.trim(), {
        header: true,
        skipEmptyLines: true,
    });

    return parsed.data.map((row) => {
        const obj = {};
        for (const [header, val] of Object.entries(row)) {
            const value = val === "" ? "Unknown" : val;
            if (header === "tags") {
                obj[header] = value.split(",").map((tag) => tag.trim());
            } else {
                obj[header] = value;
            }
        }
        return obj;
    });
};

/**
 * Fetches and parses the emotes.csv file.
 * @returns {Promise<Emoji[] | undefined>} An array of emoji objects, or undefined on error.
 */
export const getEmojis = async () => {
    try {
        const response = await fetch(`${cdn}/emotes.csv`);
        const text = await response.text();
        const parsedData = parseCSV(text);
        return parsedData;
    } catch {
        return undefined;
    }
};
