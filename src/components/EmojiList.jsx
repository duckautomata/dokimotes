import { useEffect, useRef } from "react";
import { FixedSizeGrid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import EmojiItem from "./EmojiItem";
import { Box } from "@mui/material";

const CELL_PADDING = 16; // Total padding/margin for each cell (for spacing)
const ITEM_SIZE_IN_CELL = 128; // Actual emoji image size (should match EmojiItem's ITEM_SIZE)

const EmojiList = ({ emojis }) => {
    const gridRef = useRef();

    // When filters change and emojis list is updated, scroll to top
    useEffect(() => {
        if (gridRef.current) {
            gridRef.current.scrollToItem({ rowIndex: 0, columnIndex: 0 });
        }
    }, [emojis]);

    const Cell = ({ columnIndex, rowIndex, style, data }) => {
        const { items, columnCount } = data;
        const index = rowIndex * columnCount + columnIndex;

        if (index >= items.length) {
            return null; // Don't render anything for cells beyond the item count
        }
        const emoji = items[index];

        return (
            <div
                style={{
                    ...style,
                    paddingLeft: `${CELL_PADDING / 2}px`,
                    paddingRight: `${CELL_PADDING / 2}px`,
                    paddingTop: `${CELL_PADDING / 2}px`,
                    paddingBottom: `${CELL_PADDING / 2}px`,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <EmojiItem emoji={emoji} />
            </div>
        );
    };

    return (
        <Box sx={{ width: "100%", height: "100%", flexGrow: 1 }}>
            <AutoSizer>
                {({ height, width }) => {
                    if (width === 0 || height === 0) {
                        return null;
                    }
                    const columnWidthWithPadding = ITEM_SIZE_IN_CELL + CELL_PADDING;
                    const rowHeightWithPadding = ITEM_SIZE_IN_CELL + CELL_PADDING;

                    const columnCount = Math.max(1, Math.floor(width / columnWidthWithPadding));
                    const rowCount = Math.ceil(emojis.length / columnCount);

                    return (
                        <FixedSizeGrid
                            ref={gridRef}
                            className="emoji-grid"
                            columnCount={columnCount}
                            columnWidth={width / columnCount - 5}
                            height={height}
                            rowCount={rowCount}
                            rowHeight={rowHeightWithPadding}
                            itemData={{ items: emojis, columnCount }}
                            width={width}
                        >
                            {Cell}
                        </FixedSizeGrid>
                    );
                }}
            </AutoSizer>
        </Box>
    );
};

export default EmojiList;
