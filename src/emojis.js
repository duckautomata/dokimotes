import { cdn } from "./config";
// eslint-disable-next-line no-unused-vars
import { EmojiSource, EmojiType } from "./store/types";

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

const parseTSV = (text) => {
    // Split the text into lines and remove any trailing empty lines
    const lines = text.trim().split("\n");

    // Get the headers from the first line
    const headers = lines
        .shift()
        .split("\t")
        .map((header) => header.trim());

    // Map over the remaining lines to create objects
    const objects = lines.map((line) => {
        const values = line.split("\t");

        // Use reduce to build an object from headers and values
        return headers.reduce((obj, header, index) => {
            const value = values[index] === "" ? "Unknown" : values[index];
            if (header === "tags") {
                obj[header] = value.split(",").map((tag) => tag.trim());
            } else if (header === "Name") {
                obj["name"] = value;
            } else {
                obj[header] = value;
            }

            return obj;
        }, {});
    });

    return objects;
};

/**
 * Fetches and parses the emojis.tsv file.
 * @returns {Promise<Emoji[] | undefined>} An array of emoji objects, or undefined on error.
 */
export const getEmojis = async () => {
    try {
        const response = await fetch(`${cdn}/emotes.tsv`);
        const text = await response.text();
        const parsedData = parseTSV(text);
        return parsedData;
    } catch {
        return undefined;
    }
};
