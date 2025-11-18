import { StateCreator } from "zustand";

// Data Structure Interfaces
export enum EmojiType {
    ALL = "all",
    ANIMATED = "animated",
    STILL = "still",
}

export enum EmojiSource {
    ALL = "all",
    OFFICIAL = "official",
    FANMADE = "fan-made",
}

// Slice Interfaces

export interface FilterSlice {
    searchText: string;
    setSearchText: (text: string) => void;
    emojiType: EmojiType;
    setEmojiType: (t: EmojiType) => void;
    emojiSource: EmojiSource;
    setEmojiSource: (s: EmojiSource) => void;
    scrollIndex: number;
    setScrollIndex: (i: number) => void;
}

export interface SettingsSlice {
    theme: "light" | "system" | "dark";
    density: "compact" | "standard" | "comfortable";
    timeFormat: "relative" | "local" | "UTC";
    newAtTop: boolean;
    enableTagHelper: boolean;
    defaultOffset: number;
    sidebarOpen: boolean;
    setTheme: (theme: SettingsSlice["theme"]) => void;
    setDensity: (density: SettingsSlice["density"]) => void;
    setTimeFormat: (format: SettingsSlice["timeFormat"]) => void;
    setNewAtTop: (value: boolean) => void;
    setEnableTagHelper: (value: boolean) => void;
    setDefaultOffset: (offset: number) => void;
    setSidebarOpen: (isOpen: boolean) => void;
}

// The combined store type
export type AppStore = FilterSlice & SettingsSlice;

// Helper type for creating slices
export type AppSliceCreator<T> = StateCreator<AppStore, [], [], T>;
