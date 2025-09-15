import "./App.css";
import { ThemeProvider } from "@emotion/react";
import { darkTheme, lightTheme } from "./theme";
import { useEffect, useState } from "react";
import { CssBaseline, useMediaQuery } from "@mui/material";
import { getEmojis } from "./emojis";
import Finder from "./components/Finder";
import { Route, Routes } from "react-router-dom";
import Viewer from "./components/Viewer";

const App = () => {
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    let colorTheme = prefersDarkMode ? darkTheme : lightTheme;
    const [emojis, setEmojis] = useState([]);
    const [status, setStatus] = useState("loading");
    const emptyText =
        status === "loading"
            ? "Loading"
            : status === "error"
              ? "Error loading emoji's"
              : "No emoji's found matching your criteria.";

    useEffect(() => {
        getEmojis().then((data) => {
            if (data === undefined) {
                setStatus("error");
                return;
            } else {
                setEmojis(data);
                setStatus("ok");
            }
        });
    }, []);

    return (
        <ThemeProvider theme={colorTheme}>
            <CssBaseline />
            <Routes>
                <Route path="/view/:source/:id" element={<Viewer emojis={emojis} status={status} />} />
                <Route path="*" element={<Finder emojis={emojis} emptyText={emptyText} />} />
            </Routes>
        </ThemeProvider>
    );
}

export default App;
