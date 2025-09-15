import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

export const darkTheme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#20A79A",
            background: "#FFFFFF",
        },
        secondary: {
            main: "#FFFFFF",
            background: "#17786E",
        },
        background: {
            main: "#424242",
        },
        error: {
            main: red.A400,
        },
    },
});

export const lightTheme = createTheme({
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
            main: "#17786E",
        },
        error: {
            main: red.A400,
        },
    },
});
