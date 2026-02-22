import { Box, Tooltip, Typography } from "@mui/material";
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { cdn } from "../config";

/**
 * @typedef {import('../emojis.js').Emoji} Emoji
 */

const ITEM_SIZE = 128; // Actual emoji image size (should match EmojiList's ITEM_SIZE_IN_CELL)

/**
 * @param {object} props
 * @param {Emoji} props.emoji
 */
const EmojiItem = ({ emoji }) => {
    const navigate = useNavigate();

    if (!emoji) {
        return null;
    }

    const handleClick = () => {
        navigate(`/view/${emoji.emote_id}`);
    };

    return (
        <Tooltip
            arrow
            disableInteractive
            title={
                <>
                    <Typography color="inherit" variant="subtitle2">
                        {emoji.name}
                    </Typography>
                    <Typography variant="caption">Artist: {emoji.artist}</Typography>
                    <br />
                </>
            }
        >
            <Box
                onClick={handleClick}
                sx={{
                    width: ITEM_SIZE,
                    height: ITEM_SIZE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    cursor: "pointer",
                    padding: "4px",
                    "&:hover": {
                        backgroundColor: (theme) =>
                            theme.palette.mode === "dark" ? "rgba(49, 214, 198, 0.15)" : "rgba(18, 100, 91, 0.1)",
                        transform: "scale(1.15) translateY(-4px)",
                        zIndex: 1,
                        boxShadow: (theme) =>
                            theme.palette.mode === "dark"
                                ? "0px 10px 20px rgba(49, 214, 198, 0.2)"
                                : "0px 10px 20px rgba(18, 100, 91, 0.15)",
                        borderRadius: "16px",
                    },
                    transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    borderRadius: "12px",
                }}
            >
                <img
                    src={`${cdn}/${emoji.image_id}_t.webp`}
                    alt={emoji.name}
                    loading="lazy"
                    style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                    }}
                />
            </Box>
        </Tooltip>
    );
};

export default memo(EmojiItem);
