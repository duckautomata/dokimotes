import { Link, useParams } from "react-router-dom";
import EmojiCard from "./EmojiCard";
import { Box, Button, Typography } from "@mui/material";
import { SentimentDissatisfied } from "@mui/icons-material";

/**
 * @typedef {import('../emojis.js').Emoji} Emoji
 */

const EmojiNotFound = ({ id, source }) => {
    return (
        <>
            <SentimentDissatisfied sx={{ fontSize: 80, color: "text.secondary", marginBottom: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
                Dokimote Not Found
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 400, mb: 3 }}>
                That emote with ID &#34;{id}&#34; and source &#34;{source}&#34; does not seem to exist. It might have
                been removed or the link is incorrect.
            </Typography>
            <Button component={Link} to="/" variant="contained" color="secondary">
                Back to Gallery
            </Button>
        </>
    );
};

/**
 * @param {object} props
 * @param {Emoji[]} props.emojis
 * @param {string} props.status
 */
const Viewer = ({ emojis, status }) => {
    const { source, id } = useParams();
    const emoji = emojis.find((e) => e.id.includes(id) && e.source === source);
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
            }}
        >
            {status === "loading" ? (
                <Typography>Loading</Typography>
            ) : (
                <>{emoji === undefined ? <EmojiNotFound id={id} source={source} /> : <EmojiCard emoji={emoji} />}</>
            )}
        </Box>
    );
};

export default Viewer;
