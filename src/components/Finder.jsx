import { Typography, Box, Grid, useMediaQuery, Button } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import EmojiFilter from "./EmojiFilter";
import EmojiList from "./EmojiList";
import { useMemo } from "react";
import { useAppStore } from "../store/store";
import { useShallow } from "zustand/react/shallow";
import { emojiFilter } from "../logic/filtering.js";
import { new_emoji_form, suggestion_form } from "../config";

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

    const { searchText, emojiType, emojiSource, artistFilter } = useAppStore(
        useShallow((state) => {
            return {
                searchText: state.searchText,
                emojiType: state.emojiType,
                emojiSource: state.emojiSource,
                artistFilter: state.artistFilter,
            };
        }),
    );

    const artists = useMemo(() => {
        const artistSet = new Set(emojis.map((e) => e.artist));
        return Array.from(artistSet).sort();
    }, [emojis]);

    const filteredEmojis = useMemo(() => {
        return emojiFilter(emojis, searchText, emojiType, emojiSource, artistFilter);
    }, [searchText, emojiType, emojiSource, artistFilter, emojis]);

    return (
        <Grid container direction="column" minWidth={minWidth} sx={{ py: 3, height: "100vh" }}>
            <Grid size={{ xs: 12 }}>
                <Typography
                    variant="h3"
                    component="h1"
                    gutterBottom
                    align="center"
                    sx={{
                        mb: 4,
                        fontWeight: 800,
                        background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, #54e8d6)`,
                        backgroundClip: "text",
                        textFillColor: "transparent",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    Doki Emote Finder
                </Typography>
                <Box display="flex" justifyContent="center" gap={2} mb={4}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        component="a"
                        href={new_emoji_form}
                        target="_blank"
                        startIcon={<AddCircleOutlineIcon />}
                        sx={{
                            borderRadius: "24px",
                            textTransform: "none",
                            fontWeight: 600,
                        }}
                    >
                        Suggest New Emote
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        component="a"
                        href={suggestion_form}
                        target="_blank"
                        startIcon={<EditIcon />}
                        sx={{
                            borderRadius: "24px",
                            textTransform: "none",
                            fontWeight: 600,
                        }}
                    >
                        General Suggestion
                    </Button>
                </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
                <EmojiFilter artists={artists} />
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
