import { Typography, Box, Grid, useMediaQuery } from "@mui/material";
import EmojiFilter from "./EmojiFilter";
import EmojiList from "./EmojiList";
import { useMemo } from "react";
import { useAppStore } from "../store/store";
import { useShallow } from "zustand/react/shallow";
import { emojiFilter } from "../logic/filtering.js";

/**
 * @typedef {import('../emojis.js').Emoji} Emoji
 */

/**
 * @param {object} props
 * @param {Emoji[]} props.emojis
 * @param {string} props.emptyText
 */
const Finder = ({ emojis, emptyText }) => {
    const isMobile = useMediaQuery("(max-width:768px)");
    const isTablet = useMediaQuery("(max-width:1229px)");
    const minWidth = isMobile ? "100vw" : isTablet ? "75vw" : "50vw";

    const { searchText, emojiType, emojiSource } = useAppStore(
        useShallow((state) => {
            return {
                searchText: state.searchText,
                emojiType: state.emojiType,
                emojiSource: state.emojiSource,
            };
        }),
    );

    const filteredEmojis = useMemo(() => {
        return emojiFilter(emojis, searchText, emojiType, emojiSource);
    }, [searchText, emojiType, emojiSource, emojis]);

    return (
        <Grid container direction="column" minWidth={minWidth} sx={{ py: 3, height: "100vh" }}>
            <Grid size={{ xs: 12 }}>
                <Typography variant="h4" component="h4" gutterBottom align="center" sx={{ mb: 3 }}>
                    Doki Emote Finder
                </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
                <EmojiFilter />
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
