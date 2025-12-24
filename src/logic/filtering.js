import { EmojiSource, EmojiType } from "../store/types";

/**
 * @typedef {import('../emojis.js').Emoji} Emoji
 */

/**
 * @param {Emoji[]} emojis
 * @param {string} searchText
 * @param {EmojiType} emojiType
 * @param {EmojiSource} emojiSource
 * @returns {Emoji[]}
 */
export const emojiFilter = (emojis, searchText, emojiType, emojiSource) => {
    return emojis.filter((emoji) => {
        const nameMatch = emoji.name.toLowerCase().includes(searchText.toLowerCase());
        const tagMatch = emoji.tags.some(
            (tag) =>
                tag !== "" &&
                (tag.toLowerCase().includes(searchText.toLowerCase()) ||
                    searchText.toLowerCase().includes(tag.toLowerCase())),
        );
        const searchMatch = searchText === "" || nameMatch || tagMatch;

        const typeMatch = emojiType === EmojiType.ALL || emoji.type === emojiType;
        const sourceMatch = emojiSource === EmojiSource.ALL || emoji.source === emojiSource;

        return searchMatch && typeMatch && sourceMatch;
    });
};
