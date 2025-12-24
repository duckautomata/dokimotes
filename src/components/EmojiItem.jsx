import { Box, Tooltip, Typography } from "@mui/material";
import { memo } from "react";
import { useNavigate } from "react-router-dom";

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
        navigate(`/view/${emoji.source}/${emoji.id.split(".")[0]}`);
    };

    return (
        <Tooltip
            arrow
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
                        backgroundColor: "action.hover",
                        transform: "scale(1.1)",
                        zIndex: 1,
                    },
                    transition: "transform 0.1s ease-in-out, background-color 0.1s ease-in-out",
                }}
            >
                <img
                    src={`${import.meta.env.BASE_URL}/emotes/${emoji.source}/${emoji.id}`}
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
