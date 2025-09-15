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

const EmojiCard = ({ emoji }) => {
    const [snackbar, setSnackbar] = useState({ open: false, message: "" });
    const imageUrl = `/dokimotes/emotes/${emoji.source}/${emoji.id}`;

    const handleCopyImage = async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            setSnackbar({ open: true, message: "Image copied to clipboard!" });
        } catch {
            setSnackbar({ open: true, message: "Error: Could not copy image." });
        }
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}${imageUrl}`;
        navigator.clipboard
            .writeText(link)
            .then(() => {
                setSnackbar({ open: true, message: "Link copied to clipboard!" });
            })
            .catch(() => {
                setSnackbar({ open: true, message: "Error: Could not copy link." });
            });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <Card sx={{ maxWidth: 600, margin: "2rem auto", boxShadow: 3 }}>
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
                    <Typography variant="body1" color="text.secondary" component="p">
                        <strong>Credits:</strong> {emoji.credit}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" component="p">
                        <strong>Tags:</strong> {emoji.tags.join(", ")}
                    </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center", paddingBottom: "16px" }}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={handleCopyImage}>
                            Copy Image
                        </Button>
                        <Button variant="outlined" startIcon={<LinkIcon />} onClick={handleCopyLink}>
                            Copy Link
                        </Button>
                        <Button component={Link} to="/" variant="contained" startIcon={<ImageSearch />} color="black">
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
}

export default EmojiCard;
