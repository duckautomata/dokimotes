import { useState } from "react";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";
import Box from "@mui/material/Box";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from "@mui/icons-material/Link";
import { Link } from "react-router-dom";
import { ImageSearch } from "@mui/icons-material";
import { useMediaQuery } from "@mui/material";
import { cdn, edit_emote_form } from "../config";

/**
 * @typedef {import('../emojis.js').Emoji} Emoji
 */

/**
 * @param {object} props
 * @param {Emoji} props.emoji
 */
const EmojiCard = ({ emoji }) => {
    const isMobile = useMediaQuery("(max-width:768px)");
    const maxWidth = isMobile ? "90vw" : "600px";
    const [snackbar, setSnackbar] = useState({ open: false, message: "" });
    const originalUrl = `${cdn}/${emoji.image_id}${emoji.image_ext}`;
    const previewUrl = `${cdn}/${emoji.image_id}_p.webp`;
    const filename = `${emoji.emote_id}${emoji.image_ext}`;
    const downloadUrl = `${originalUrl}?download=true&name=${encodeURIComponent(filename)}`;
    const editFormUrl = edit_emote_form(
        emoji.emote_id,
        emoji.name,
        emoji.artist,
        emoji.credit,
        emoji.type,
        emoji.source,
        emoji.tags.join(", "),
    );
    const creditIsLink = emoji.credit.startsWith("https://");
    const isAnimated = emoji.type === "animated";

    const handleCopyImage = async () => {
        try {
            const response = await fetch(originalUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            setSnackbar({ open: true, message: "Image copied to clipboard!" });
        } catch (error) {
            setSnackbar({ open: true, message: `Error: Could not copy image: ${error}.` });
        }
    };

    const handleCopyImageURL = async () => {
        try {
            await navigator.clipboard.writeText(previewUrl);
            setSnackbar({ open: true, message: "Image link copied to clipboard!" });
        } catch (error) {
            setSnackbar({ open: true, message: `Error: Could not copy image link: ${error}.` });
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <Card
                sx={{
                    maxWidth: maxWidth,
                    margin: { xs: "2rem auto", sm: "3rem auto" },
                    boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
                    borderRadius: 4,
                    width: "100%",
                    background: (theme) =>
                        theme.palette.mode === "dark" ? "rgba(36, 36, 36, 0.45)" : "rgba(255, 255, 255, 0.45)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid",
                    borderColor: (theme) =>
                        theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                }}
            >
                <CardMedia
                    component="img"
                    image={originalUrl}
                    alt={emoji.name}
                    sx={{
                        width: "100%",
                        height: "auto",
                        backgroundColor: "transparent",
                        p: 2,
                    }}
                />
                <CardContent sx={{ textAlign: "center" }}>
                    <Typography gutterBottom variant="h3" component="h1" fontWeight="700">
                        {emoji.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" component="p">
                        <strong>Artist:</strong> {emoji.artist}
                    </Typography>
                    {creditIsLink ? (
                        <Typography variant="body1" color="text.secondary" component="p">
                            <strong>Credits:</strong>{" "}
                            <a href={emoji.credit} target="_blank" style={{ wordWrap: "break-word" }}>
                                {emoji.credit}
                            </a>
                        </Typography>
                    ) : (
                        <Typography variant="body1" color="text.secondary" component="p">
                            <strong>Credits:</strong> {emoji.credit}
                        </Typography>
                    )}
                    <Typography variant="body1" color="text.secondary" component="p">
                        <strong>Tags:</strong> {emoji.tags.join(", ")}
                    </Typography>
                </CardContent>
                <CardActions
                    sx={{
                        justifyContent: "center",
                        paddingBottom: "24px",
                        paddingX: "24px",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            flexDirection: { xs: "column", sm: "row" },
                            width: "100%",
                        }}
                    >
                        {!isAnimated && (
                            <Button
                                variant="contained"
                                disabled={isAnimated}
                                startIcon={<ContentCopyIcon />}
                                onClick={handleCopyImage}
                                fullWidth
                            >
                                Copy Image
                            </Button>
                        )}
                        <Button variant="contained" startIcon={<LinkIcon />} onClick={handleCopyImageURL} fullWidth>
                            Copy Link
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<LinkIcon />}
                            fullWidth
                            component="a"
                            href={downloadUrl}
                            download={filename}
                        >
                            Download Image
                        </Button>
                        <Button
                            component={Link}
                            to="/"
                            variant="contained"
                            startIcon={<ImageSearch />}
                            color="black"
                            fullWidth
                        >
                            Back to Gallery
                        </Button>
                    </Box>
                </CardActions>
            </Card>

            <Box sx={{ mt: 2, textAlign: "center" }}>
                <Typography variant="body1" sx={{ mb: 1.5, color: "text.secondary" }}>
                    Something wrong with this emote?
                </Typography>
                <Button
                    variant="outlined"
                    color="secondary"
                    component="a"
                    href={editFormUrl}
                    target="_blank"
                    sx={{ borderRadius: "24px", textTransform: "none", fontWeight: 600 }}
                >
                    Suggest an Edit
                </Button>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <SnackbarContent
                    message={snackbar.message}
                    sx={{
                        backgroundColor: (theme) =>
                            theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(36, 36, 36, 0.9)",
                        color: (theme) => (theme.palette.mode === "dark" ? "#000000" : "#ffffff"),
                        fontWeight: 600,
                        backdropFilter: "blur(8px)",
                    }}
                />
            </Snackbar>
        </>
    );
};

export default EmojiCard;
