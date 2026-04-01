import { useMemo } from "react";
import EmoteCard from "../components/EmoteCard";
import { useAppStore } from "../store/store";
import "./Home.css";

/**
 * @typedef {import("../store/types").EmoteData} EmoteData
 */

/**
 * @param {Object} props
 * @param {EmoteData[]} props.data
 */
export default function Home({ data }) {
    const searchQuery = useAppStore((state) => state.homeSearchText);
    const setSearchQuery = useAppStore((state) => state.homeSetSearchText);
    const filterSource = useAppStore((state) => state.homeFilterSource);
    const setFilterSource = useAppStore((state) => state.homeSetFilterSource);
    const filterType = useAppStore((state) => state.homeFilterType);
    const setFilterType = useAppStore((state) => state.homeSetFilterType);
    const filterArtist = useAppStore((state) => state.homeFilterArtist);
    const setFilterArtist = useAppStore((state) => state.homeSetFilterArtist);

    const { sources, types, artists } = useMemo(() => {
        const uniqueSources = new Set();
        const uniqueTypes = new Set();
        const uniqueArtists = new Set();

        data.forEach((emote) => {
            if (emote.source) uniqueSources.add(emote.source);
            if (emote.type) uniqueTypes.add(emote.type);
            if (emote.artist) uniqueArtists.add(emote.artist);
        });

        return {
            sources: ["All", ...Array.from(uniqueSources).sort()],
            types: ["All", ...Array.from(uniqueTypes).sort()],
            artists: [
                "All",
                ...Array.from(uniqueArtists).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
            ],
        };
    }, [data]);

    const filteredData = data.filter((emote) => {
        const matchesSource = filterSource === "All" || emote.source === filterSource;
        const matchesType = filterType === "All" || emote.type === filterType;
        const matchesArtist = filterArtist === "All" || emote.artist === filterArtist;

        if (!matchesSource || !matchesType || !matchesArtist) return false;

        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            emote.name.toLowerCase().includes(query) ||
            (emote.tags && emote.tags.some((tag) => tag.toLowerCase().includes(query)))
        );
    });

    const isFiltered = filterSource !== "All" || filterType !== "All" || filterArtist !== "All";

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="home-controls">
                    <div className="home-search-container">
                        <input
                            type="text"
                            className="home-search-input"
                            placeholder="Search by name or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="search-clear-button"
                                onClick={() => setSearchQuery("")}
                                aria-label="Clear search"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="home-filter-container">
                        <div className="filter-group">
                            <label htmlFor="source-filter" className="filter-label">
                                Source
                            </label>
                            <select
                                id="source-filter"
                                className="home-filter-select"
                                value={filterSource}
                                onChange={(e) => setFilterSource(e.target.value)}
                            >
                                {sources.map((source) => (
                                    <option key={source} value={source}>
                                        {source.charAt(0).toUpperCase() + source.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="type-filter" className="filter-label">
                                Type
                            </label>
                            <select
                                id="type-filter"
                                className="home-filter-select"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                {types.map((type) => (
                                    <option key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="artist-filter" className="filter-label">
                                Artist
                            </label>
                            <select
                                id="artist-filter"
                                className="home-filter-select"
                                value={filterArtist}
                                onChange={(e) => setFilterArtist(e.target.value)}
                            >
                                {artists.map((artist) => (
                                    <option key={artist} value={artist}>
                                        {artist}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {isFiltered && (
                            <button
                                className="home-filter-reset"
                                onClick={() => {
                                    setFilterSource("All");
                                    setFilterType("All");
                                    setFilterArtist("All");
                                }}
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="doki-grid">
                {filteredData.map((emote) => (
                    <EmoteCard key={emote.emote_id} emote={emote} />
                ))}
            </div>
        </div>
    );
}
