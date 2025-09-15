import { TextField, FormControl, InputLabel, Select, MenuItem, Grid, Paper } from "@mui/material";

const EmojiFilter = ({ searchTerm, filters, onSearchChange, onFilterChange }) => {
    return (
        <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center" justifyContent="center">
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Search"
                        variant="outlined"
                        value={searchTerm}
                        onChange={onSearchChange}
                        size="small"
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel id="type-filter-label">Type</InputLabel>
                        <Select
                            labelId="type-filter-label"
                            id="type-filter"
                            value={filters.type}
                            label="Type"
                            name="type"
                            onChange={onFilterChange}
                        >
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="animated">Animated</MenuItem>
                            <MenuItem value="still">Still</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel id="source-filter-label">Source</InputLabel>
                        <Select
                            labelId="source-filter-label"
                            id="source-filter"
                            value={filters.source}
                            label="Source"
                            name="source"
                            onChange={onFilterChange}
                        >
                            <MenuItem value="all">All Sources</MenuItem>
                            <MenuItem value="official">Official</MenuItem>
                            <MenuItem value="fan-made">Fan-made</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default EmojiFilter;
