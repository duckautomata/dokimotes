// oxlint-disable react/only-export-components
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, useOutletContext } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Home from "./pages/Home";
import View from "./pages/View";
import AddEmote from "./pages/AddEmote";
import EditEmote from "./pages/EditEmote";
import Suggestion from "./pages/Suggestion";

const HomeRoute = () => {
    const { data } = useOutletContext();
    return <Home data={data} />;
};

const ViewRoute = () => {
    const { data } = useOutletContext();
    return <View data={data} />;
};

const EditEmoteRoute = () => {
    const { data } = useOutletContext();
    return <EditEmote data={data} />;
};

const router = createBrowserRouter(
    [
        {
            path: "/",
            element: <App />,
            children: [
                { index: true, element: <HomeRoute /> },
                { path: "view/:emote_id", element: <ViewRoute /> },
                { path: "add", element: <AddEmote /> },
                { path: "edit/:emote_id", element: <EditEmoteRoute /> },
                { path: "suggestion", element: <Suggestion /> },
            ],
        },
    ],
    { basename: "/dokimotes/" },
);

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
);
