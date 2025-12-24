import { VirtuosoGrid } from "react-virtuoso";
import EmojiItem from "./EmojiItem";
import { Box } from "@mui/material";

/**
 * @typedef {import('../emojis.js').Emoji} Emoji
 */

const CELL_PADDING = 16; // Total padding/margin for each cell (for spacing)
const ITEM_SIZE_IN_CELL = 128; // Actual emoji image size (should match EmojiItem's ITEM_SIZE)

const ListContainer = (props) => (
    <Box
        {...props}
        sx={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fill, minmax(${ITEM_SIZE_IN_CELL + CELL_PADDING}px, 1fr))`,
            gap: `${CELL_PADDING / 2}px`, // 8px
            padding: `${CELL_PADDING / 2}px`, // 8px
        }}
    />
);

const ItemContainer = (props) => (
    <Box
        {...props}
        sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: `${ITEM_SIZE_IN_CELL + CELL_PADDING}px`,
        }}
    />
);

/**
 * @param {object} props
 * @param {Emoji[]} props.emojis
 */
const EmojiList = ({ emojis }) => {
    return (
        <Box sx={{ width: "100%", height: "100%" }}>
            <VirtuosoGrid
                data={emojis}
                components={{
                    List: ListContainer,
                    Item: ItemContainer,
                }}
                itemContent={(index, emoji) => <EmojiItem emoji={emoji} />}
            />
        </Box>
    );
};

export default EmojiList;
