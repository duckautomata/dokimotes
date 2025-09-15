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

    const shuffleArray = (array) => {
        // Loop from the last element to the second element
        for (let i = array.length - 1; i > 0; i--) {
            // Pick a random index from 0 to i (inclusive)
            const j = Math.floor(Math.random() * (i + 1));

            // Swap the elements at indices i and j
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    useEffect(() => {
        getEmojis().then((data) => {
            if (data === undefined) {
                setStatus("error");
                return;
            } else {
                setEmojis(shuffleArray(data));
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
};

export default App;
