import emojisUrl from "./assets/emojis.tsv?url";

export const emoteType = {
    ALL: "all",
    ANIMATED: "animated",
    STILL: "still",
};

export const emoteSource = {
    ALL: "all",
    OFFICIAL: "official",
    FANMADE: "fanmade",
};

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
            } else {
                obj[header] = value;
            }

            return obj;
        }, {});
    });

    return objects;
};

export const getEmojis = async () => {
    try {
        const response = await fetch(emojisUrl);
        const text = await response.text();
        const parsedData = parseTSV(text);
        return parsedData;
    } catch {
        return undefined;
    }
};
