import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Route, Routes, useOutletContext } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import { cdn, siteName } from "./config";
import { saveSuggestionId } from "./utils/suggestionIds";

// Builds as Mint. config.jsx reads the site from this module too, so cdn and
// siteName follow.
vi.mock("./site", async () => {
    const { sites } = await import("../sites.config.js");
    return { site: sites.mint };
});

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

describe("App built for Mint", () => {
    const { matchMedia, scrollTo } = window;

    beforeEach(() => {
        localStorage.clear();
        // jsdom implements neither
        window.matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        window.scrollTo = vi.fn();
    });

    afterEach(() => {
        window.matchMedia = matchMedia;
        window.scrollTo = scrollTo;
        vi.restoreAllMocks();
    });

    it("reads Mint's data from the mintomotes CDN folder", () => {
        expect(siteName).toBe("mintomotes");
        expect(cdn).toBe("https://content.duck-automata.com/mintomotes");
    });

    it("brands the header for Mint, marks Mint's site current in the site menu and loads Mint's CSV", async () => {
        const fetchSpy = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(new Response("emote_id,image_id,image_ext,name,artist,credit,type,source,tags\n"));
        renderApp();

        expect(screen.getByText("Loading Mintomotes...")).toBeInTheDocument();
        const title = await screen.findByRole("button", { name: "Mintomotes" });
        expect(fetchSpy).toHaveBeenCalledWith("https://content.duck-automata.com/mintomotes/emotes.csv");

        // Same order as on Doki's site, so the rows don't move when switching.
        fireEvent.click(title);
        const menu = screen.getByRole("navigation", { name: "Sites" });
        const [doki, mint] = within(menu).getAllByRole("link");

        expect(doki).toHaveAccessibleName("Dokimotes Dokibird");
        expect(doki).not.toHaveAttribute("aria-current");
        expect(doki).toHaveAttribute("href", "/dokimotes/");
        expect(doki.querySelector("img")).toHaveAttribute("src", "/dokimotes/favicon-32x32.png");

        expect(mint).toHaveAccessibleName("Mintomotes Mint Fantome");
        expect(mint).toHaveAttribute("aria-current", "true");
        expect(mint).toHaveAttribute("href", "/");
        fireEvent.click(mint);
        expect(screen.queryByRole("navigation", { name: "Sites" })).not.toBeInTheDocument();

        // A header-only CSV is a brand-new site, not an error.
        expect(screen.getByText(/Mintomotes doesn't have any emotes yet/)).toBeInTheDocument();
        expect(screen.getByText(/Mint Fantome's emotes/)).toBeInTheDocument();
    });

    it("saves suggestion ids under Mint's own key", () => {
        localStorage.setItem("suggestion_ids", JSON.stringify([{ id: "sug_doki", savedAt: "x" }]));

        expect(saveSuggestionId("sug_mint").map((entry) => entry.id)).toEqual(["sug_mint"]);
        expect(localStorage.getItem("suggestion_ids:mintomotes")).toContain("sug_mint");
        expect(localStorage.getItem("suggestion_ids")).toContain("sug_doki");
    });
});
