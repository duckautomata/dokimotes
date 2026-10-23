import { StateCreator } from "zustand";

// Data Structure Interfaces

export enum EmoteType {
    ALL = "all",
    ANIMATED = "animated",
    STATIC = "static",
}

export enum EmojiSource {
    ALL = "all",
    OFFICIAL = "official",
    FANMADE = "fan-made",
}

export interface EmoteData {
    emote_id: string;
    image_id: string;
    image_ext: string;
    name: string;
    artist: string;
    credit: string;
    type: EmoteType;
    source: EmojiSource;
    tags: string[];
    variant_of: string;
    _order?: number;
}

/** A primary emote together with all of its variants (the primary is included and listed first). */
export interface EmoteGroup {
    primary: EmoteData;
    variants: EmoteData[];
}

// Slice Interfaces

export interface FilterSlice {
    homeSearchText: string;
    homeSetSearchText: (text: string) => void;
    homeFilterSource: string;
    homeSetFilterSource: (source: string) => void;
    homeFilterType: string;
    homeSetFilterType: (type: string) => void;
    homeFilterArtist: string;
    homeSetFilterArtist: (artist: string) => void;
}

// The combined store type
export type AppStore = FilterSlice;

// Helper type for creating slices
export type AppSliceCreator<T> = StateCreator<AppStore, [], [], T>;
