import { useState } from "react";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Box from "@mui/material/Box";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LinkIcon from "@mui/icons-material/Link";
import { Link } from "react-router-dom";
import { ImageSearch } from "@mui/icons-material";
import { useMediaQuery } from "@mui/material";

/**
 * @param {object} props
 * @param {import("../emojis.js").Emoji} props.emoji
 */
const EmojiCard = ({ emoji }) => {
    const isMobile = useMediaQuery("(max-width:768px)");
    const maxWidth = isMobile ? "90vw" : "600px";
    const [snackbar, setSnackbar] = useState({ open: false, message: "" });
    const imageUrl = `/dokimotes/emotes/${emoji.source}/${emoji.id}`;
    const filename = `${emoji.name}-${emoji.id}`;
    const creditIsLink = emoji.credit.startsWith("https://");
    const isGif = emoji.id.endsWith(".gif");

    const handleCopyImage = async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            setSnackbar({ open: true, message: "Image copied to clipboard!" });
        } catch (error) {
            setSnackbar({ open: true, message: `Error: Could not copy image: ${error}.` });
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
                    margin: { xs: "1rem auto", sm: "2rem auto" },
                    boxShadow: 3,
                    width: "100%",
                }}
            >
                <CardMedia
                    component="img"
                    image={imageUrl}
                    alt={emoji.name}
                    sx={{
                        width: "100%",
                        height: "auto",
                        backgroundColor: "transparent",
                    }}
                />
                <CardContent sx={{ textAlign: "center" }}>
                    <Typography gutterBottom variant="h4" component="h1">
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
                        paddingBottom: "16px",
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
                        {!isGif && (
                            <Button
                                variant="contained"
                                disabled={isGif}
                                startIcon={<ContentCopyIcon />}
                                onClick={handleCopyImage}
                                fullWidth
                            >
                                Copy Image
                            </Button>
                        )}
                        <Button
                            variant="outlined"
                            startIcon={<LinkIcon />}
                            fullWidth
                            component="a"
                            href={imageUrl}
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

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                message={snackbar.message}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </>
    );
};

export default EmojiCard;
