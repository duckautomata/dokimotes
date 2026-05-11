// oxlint-disable react/only-export-components
import { createBrowserRouter, useOutletContext } from "react-router-dom";
import App from "./App.jsx";
import Home from "./pages/Home";
import View from "./pages/View";
import AddEmote from "./pages/AddEmote";
import EditEmote from "./pages/EditEmote";
import Suggestion from "./pages/Suggestion";
import RouteErrorBoundary from "./components/RouteErrorBoundary";

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

export const router = createBrowserRouter(
    [
        {
            path: "/",
            element: <App />,
            errorElement: <RouteErrorBoundary />,
            children: [
                { index: true, element: <HomeRoute />, errorElement: <RouteErrorBoundary /> },
                { path: "view/:emote_id", element: <ViewRoute />, errorElement: <RouteErrorBoundary /> },
                { path: "add", element: <AddEmote />, errorElement: <RouteErrorBoundary /> },
                { path: "edit/:emote_id", element: <EditEmoteRoute />, errorElement: <RouteErrorBoundary /> },
                { path: "suggestion", element: <Suggestion />, errorElement: <RouteErrorBoundary /> },
            ],
        },
    ],
    { basename: "/dokimotes/" },
);
