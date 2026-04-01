import { FilterSlice, AppSliceCreator } from "./types";

export const createFilterSlice: AppSliceCreator<FilterSlice> = (set) => ({
    homeSearchText: "",
    homeSetSearchText: (text) => set({ homeSearchText: text }),
    homeFilterSource: "All",
    homeSetFilterSource: (source) => set({ homeFilterSource: source }),
    homeFilterType: "All",
    homeSetFilterType: (type) => set({ homeFilterType: type }),
    homeFilterArtist: "All",
    homeSetFilterArtist: (artist) => set({ homeFilterArtist: artist }),
});
