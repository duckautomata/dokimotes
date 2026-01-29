import { TextField, FormControl, InputLabel, Select, MenuItem, Grid, Paper, Autocomplete } from "@mui/material";
import { useAppStore } from "../store/store";
import { useShallow } from "zustand/react/shallow";
import { EmojiSource, EmojiType } from "../store/types";

const EmojiFilter = ({ artists }) => {
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

    const setSearchText = useAppStore((state) => state.setSearchText);
    const setEmojiType = useAppStore((state) => state.setEmojiType);
    const setEmojiSource = useAppStore((state) => state.setEmojiSource);
    const setArtistFilter = useAppStore((state) => state.setArtistFilter);
    return (
        <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center" justifyContent="center">
                <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                        fullWidth
                        label="Search"
                        variant="outlined"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        size="small"
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel id="type-filter-label">Type</InputLabel>
                        <Select
                            labelId="type-filter-label"
                            id="type-filter"
                            value={emojiType}
                            label="Type"
                            name="type"
                            onChange={(event) => setEmojiType(event.target.value)}
                        >
                            <MenuItem value={EmojiType.ALL}>All Types</MenuItem>
                            <MenuItem value={EmojiType.ANIMATED}>Animated</MenuItem>
                            <MenuItem value={EmojiType.STILL}>Still</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel id="source-filter-label">Source</InputLabel>
                        <Select
                            labelId="source-filter-label"
                            id="source-filter"
                            value={emojiSource}
                            label="Source"
                            name="source"
                            onChange={(event) => setEmojiSource(event.target.value)}
                        >
                            <MenuItem value={EmojiSource.ALL}>All Sources</MenuItem>
                            <MenuItem value={EmojiSource.OFFICIAL}>Official</MenuItem>
                            <MenuItem value={EmojiSource.FANMADE}>Fan-made</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth variant="outlined" size="small">
                        <Autocomplete
                            id="artist-filter"
                            options={artists}
                            value={artistFilter || null}
                            onChange={(event, newValue) => {
                                setArtistFilter(newValue || "");
                            }}
                            renderInput={(params) => <TextField {...params} label="Artist" variant="outlined" />}
                            size="small"
                            freeSolo={false}
                            autoHighlight
                        />
                    </FormControl>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default EmojiFilter;
