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
    transcriptHeight: "100%" | "90%" | "75%" | "50%";
    enableTagHelper: boolean;
    defaultOffset: number;
    sidebarOpen: boolean;
    devMode: boolean;
    membershipKey: string;
    membershipInfo: { channel: string; expiresAt: string } | null;
    useVirtualList: boolean;
    setTheme: (theme: SettingsSlice["theme"]) => void;
    setDensity: (density: SettingsSlice["density"]) => void;
    setTimeFormat: (format: SettingsSlice["timeFormat"]) => void;
    setTranscriptHeight: (height: SettingsSlice["transcriptHeight"]) => void;
    setEnableTagHelper: (value: boolean) => void;
    setDefaultOffset: (offset: number) => void;
    setSidebarOpen: (isOpen: boolean) => void;
    setDevMode: (value: boolean) => void;
    setMembershipKey: (key: string) => void;
    setMembershipInfo: (info: SettingsSlice["membershipInfo"]) => void;
    setUseVirtualList: (value: boolean) => void;
}

// The combined store type
export type AppStore = FilterSlice & SettingsSlice;

// Helper type for creating slices
export type AppSliceCreator<T> = StateCreator<AppStore, [], [], T>;
