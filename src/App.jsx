import { useEffect, useLayoutEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { loadEmoteData } from "./utils/dataLoader";
import { useSystemTheme } from "./utils/useSystemTheme";
import { sites } from "../sites.config.js";
import { site } from "./site";
import { hubUrl } from "./config";
import UpdateAlert from "./components/UpdateAlert";
import DataLoadError from "./components/DataLoadError";
import EnvironmentBadge from "./components/EnvironmentBadge";
import MockApiBadge from "./components/MockApiBadge";
import ScrollToTop from "./components/ScrollToTop";
import SuggestionsDropdown from "./components/SuggestionsDropdown";
import SiteMenu from "./components/SiteMenu";
import "./App.css";

// Every site in config order, so the rows stay put when switching sites. Paths are
// built at runtime: a literal "/<slug>/" would fail the build's check for another site's base.
const menuSites = Object.values(sites).map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.name,
    href: `/${s.slug}/`,
    iconSrc: `/${s.slug}/favicon-32x32.png`,
    iconSrcSet: `/${s.slug}/favicon-32x32.png 1x, /${s.slug}/android-chrome-192x192.png 2x`,
    current: s.id === site.id,
}));

export default function App() {
    const location = useLocation();

    useLayoutEffect(() => {
        document.documentElement.style.scrollBehavior = "auto";

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant",
        });

        // Cleared on the way out: a navigation that unmounts the app, as every test does, would
        // otherwise leave this reaching for a document that is no longer there.
        const restoreScrollBehavior = setTimeout(() => {
            document.documentElement.style.scrollBehavior = "";
        }, 20);
        return () => clearTimeout(restoreScrollBehavior);
    }, [location.pathname]);

    useSystemTheme();

    // null until emotes.csv has loaded. An empty array is a loaded site with no emotes yet.
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [loadAttempt, setLoadAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        loadEmoteData()
            .then((rows) => {
                if (!cancelled) setData(rows);
            })
            .catch((error) => {
                if (!cancelled) setLoadError(error);
            });
        return () => {
            cancelled = true;
        };
    }, [loadAttempt]);

    const retryLoad = () => {
        setLoadError(null);
        setLoadAttempt((attempt) => attempt + 1);
    };

    if (loadError) return <DataLoadError error={loadError} onRetry={retryLoad} />;

    if (!data)
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100vh",
                    fontSize: "1.2rem",
                    color: "var(--text-secondary)",
                }}
            >
                {`Loading ${site.title}...`}
            </div>
        );

    return (
        <>
            <UpdateAlert />
            <header className="top-nav">
                <div className="brand-group">
                    <SiteMenu title={site.title} sites={menuSites} hubUrl={hubUrl} />
                    <EnvironmentBadge className="desktop-only" />
                    <MockApiBadge className="desktop-only" />
                </div>
                <nav className="nav-links">
                    <div className="nav-main-links">
                        <NavLink to="/" className="nav-link nav-home">
                            Home
                        </NavLink>
                        <EnvironmentBadge className="mobile-only" />
                        <MockApiBadge className="mobile-only" />
                        <SuggestionsDropdown />
                    </div>
                    <ScrollToTop />
                </nav>
            </header>
            <main className="content">
                <Outlet context={{ data }} />
            </main>
        </>
    );
}
