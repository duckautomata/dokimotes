import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Route, Routes, useOutletContext } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import { loadEmoteData } from "./utils/dataLoader";

vi.mock("./utils/dataLoader", () => ({
    loadEmoteData: vi.fn(),
}));

const HomeRoute = () => {
    const { data } = useOutletContext();
    return <Home data={data} />;
};

const renderApp = () =>
    render(
        <MemoryRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<HomeRoute />} />
                </Route>
            </Routes>
        </MemoryRouter>,
    );

const mockData = [
    {
        emote_id: "test-emote-1",
        name: "Alpha Emote",
        source: "official",
        type: "static",
        artist: "Artist A",
        tags: ["tag1"],
        image_id: "img1",
        image_ext: ".webp",
        variant_of: "",
    },
];

describe("App", () => {
    const { matchMedia, scrollTo } = window;

    beforeEach(() => {
        vi.clearAllMocks();
        // jsdom implements neither
        window.matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        window.scrollTo = vi.fn();
    });

    afterEach(() => {
        window.matchMedia = matchMedia;
        window.scrollTo = scrollTo;
    });

    it("shows the loading screen until the emotes arrive", async () => {
        let resolve;
        loadEmoteData.mockReturnValue(new Promise((r) => (resolve = r)));
        renderApp();

        expect(screen.getByText("Loading Dokimotes...")).toBeInTheDocument();

        resolve(mockData);
        expect(await screen.findByAltText("Alpha Emote")).toBeInTheDocument();
        expect(screen.queryByText("Loading Dokimotes...")).not.toBeInTheDocument();
    });

    it("shows an error page when the emotes fail to load, and Retry loads them again", async () => {
        loadEmoteData.mockRejectedValueOnce(new Error("Failed to fetch")).mockResolvedValueOnce(mockData);
        renderApp();

        expect(await screen.findByRole("heading", { name: "Couldn't load the emotes" })).toBeInTheDocument();
        expect(screen.queryByText("Loading Dokimotes...")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Retry" }));

        expect(await screen.findByAltText("Alpha Emote")).toBeInTheDocument();
        expect(screen.queryByText("Couldn't load the emotes")).not.toBeInTheDocument();
        expect(loadEmoteData).toHaveBeenCalledTimes(2);
    });

    it("renders the app with an empty state when the site has no emotes yet", async () => {
        loadEmoteData.mockResolvedValue([]);
        renderApp();

        expect(await screen.findByRole("heading", { name: "No emotes yet" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Dokimotes" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Suggest the first emote" })).toHaveAttribute("href", "/add");
    });

    it("brands the header for Doki, and its site menu lists both sites with Doki's as current", async () => {
        loadEmoteData.mockResolvedValue(mockData);
        renderApp();

        const title = await screen.findByRole("button", { name: "Dokimotes" });
        // The site menu replaced the header's link to the other site.
        expect(screen.queryByRole("link", { name: /Mintomotes/ })).not.toBeInTheDocument();

        fireEvent.click(title);
        const menu = screen.getByRole("navigation", { name: "Sites" });
        const [doki, mint, hub] = within(menu).getAllByRole("link");

        expect(doki).toHaveAccessibleName("Dokimotes Dokibird");
        expect(doki).toHaveAttribute("aria-current", "true");
        expect(doki).toHaveAttribute("href", "/");
        expect(doki.querySelector("img")).toHaveAttribute("src", "/dokimotes/favicon-32x32.png");

        expect(mint).toHaveAccessibleName("Mintomotes Mint Fantome");
        expect(mint).not.toHaveAttribute("aria-current");
        expect(mint).toHaveAttribute("href", "/mintomotes/");
        expect(mint.querySelector("img")).toHaveAttribute(
            "srcset",
            "/mintomotes/favicon-32x32.png 1x, /mintomotes/android-chrome-192x192.png 2x",
        );

        expect(hub).toHaveAccessibleName("All my sites");
        expect(hub).toHaveAttribute("href", "https://www.duck-automata.com/");
    });

    it("follows the system theme", async () => {
        loadEmoteData.mockResolvedValue(mockData);
        renderApp();

        await screen.findByAltText("Alpha Emote");
        expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    });
});
