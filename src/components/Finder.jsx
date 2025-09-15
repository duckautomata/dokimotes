import { Typography, Box, Grid, useMediaQuery } from "@mui/material";
import EmojiFilter from "./EmojiFilter";
import EmojiList from "./EmojiList";
import { useMemo, useState } from "react";
import { emoteSource, emoteType } from "../emojis";

const Finder = ({ emojis, emptyText }) => {
    const isMobile = useMediaQuery("(max-width:768px)");
    const minWidth = isMobile ? "100vw" : "50vw";

    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        type: "all", // 'all', 'animated', 'still'
        source: "all", // 'all', 'official', 'fan-made'
    });

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }));
    };

    const filteredEmojis = useMemo(() => {
        return emojis.filter((emoji) => {
            const nameMatch = emoji.name.toLowerCase().includes(searchTerm.toLowerCase());
            const tagMatch = emoji.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
            const searchMatch = searchTerm === "" || nameMatch || tagMatch;

            const typeMatch = filters.type === emoteType.ALL || emoji.type === filters.type;
            const sourceMatch = filters.source === emoteSource.ALL || emoji.source === filters.source;

            return searchMatch && typeMatch && sourceMatch;
        });
    }, [searchTerm, filters, emojis]);

    return (
        <Grid container direction="column" minWidth={minWidth} sx={{ py: 3, height: "100vh" }}>
            <Grid size={{ xs: 12 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
                    Doki Emote Finder
                </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
                <EmojiFilter
                    searchTerm={searchTerm}
                    filters={filters}
                    onSearchChange={handleSearchChange}
                    onFilterChange={handleFilterChange}
                />
            </Grid>

            <Grid
                size={{ xs: 12 }}
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                }}
            >
                <Box
                    sx={{
                        flexGrow: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    {filteredEmojis.length > 0 ? (
                        <EmojiList emojis={filteredEmojis} />
                    ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                            <Typography>{emptyText}</Typography>
                        </Box>
                    )}
                </Box>
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ pt: 2 }}>
                <Typography variant="caption" align="center" sx={{ mt: 2 }}>
                    Showing {filteredEmojis.length} of {emojis.length} emojis.
                </Typography>
            </Grid>
        </Grid>
    );
};

export default Finder;
