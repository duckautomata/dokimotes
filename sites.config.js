// Every site is built from the same code and served at /<slug>/.
// `slug` is permanent once published: it is the URL path, the CDN/R2 prefix the
// data is read from, the `site` sent with suggestions, and the duck-site card id.
// `id` is the short key used for VITE_SITE, public/<id>/ and data-site.
//
// Read by vite.config.js, src/worker.js, scripts/sites.mjs and src/site.js,
// so keep it plain JS with no imports.
export const sites = {
    doki: {
        id: "doki",
        slug: "dokimotes",
        title: "Dokimotes",
        name: "Dokibird",
        description: "An archive of Dokibird's emotes to search through and use.",
        themeColor: "#3b82f6",
    },
    mint: {
        id: "mint",
        slug: "mintomotes",
        title: "Mintomotes",
        name: "Mint Fantome",
        description: "An archive of Mint Fantome's emotes to search through and use.",
        themeColor: "#10b981",
    },
};

export const DEFAULT_SITE = "doki";

/** Returns the site for an id, the default site when the id is empty, and throws on an unknown id. */
export const resolveSite = (id) => {
    const site = sites[id || DEFAULT_SITE];
    if (!site) {
        throw new Error(`Unknown site "${id}". Expected one of: ${Object.keys(sites).join(", ")}`);
    }
    return site;
};
