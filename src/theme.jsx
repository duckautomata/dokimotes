import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

const commonOptions = {
    typography: {
        fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
        button: {
            textTransform: "none",
            fontWeight: 600,
        },
        h4: {
            fontWeight: 700,
        },
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: "24px",
                    boxShadow: "none",
                    "&:hover": {
                        boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: "24px",
                },
            },
        },
    },
};

export const darkTheme = createTheme({
    ...commonOptions,
    palette: {
        mode: "dark",
        primary: {
            main: "#31D6C6",
            background: "#181818",
        },
        secondary: {
            main: "#FFFFFF",
            background: "#121212",
        },
        background: {
            default: "rgba(0, 0, 0, 0)",
            paper: "#242424",
        },
        error: {
            main: red.A400,
        },
    },
});

export const lightTheme = createTheme({
    ...commonOptions,
    palette: {
        mode: "light",
        primary: {
            main: "#12645B",
            background: "#FFFFFF",
        },
        secondary: {
            main: "#000000",
            background: "#22B9AA",
        },
        background: {
            default: "rgba(0, 0, 0, 0)",
            paper: "#ffffff",
        },
        error: {
            main: red.A400,
        },
    },
});
