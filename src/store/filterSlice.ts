import { FilterSlice, AppSliceCreator, EmojiType, EmojiSource } from "./types";

export const createFilterSlice: AppSliceCreator<FilterSlice> = (set) => ({
    searchText: "",
    setSearchText: (text) => set({ searchText: text }),
    emojiType: EmojiType.ALL,
    setEmojiType: (t) => set({ emojiType: t }),
    emojiSource: EmojiSource.ALL,
    setEmojiSource: (s) => set({ emojiSource: s }),
    artistFilter: "",
    setArtistFilter: (artist) => set({ artistFilter: artist }),
    scrollIndex: 0,
    setScrollIndex: (i) => set({ scrollIndex: i }),
});
