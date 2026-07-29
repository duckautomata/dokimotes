import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import EditEmote from "./EditEmote";
import { fetchPublicConfig, uploadImage, submitSuggestion } from "../utils/contentApi";

vi.mock("../utils/contentApi", () => ({
    fetchPublicConfig: vi.fn(),
    uploadImage: vi.fn(),
    submitSuggestion: vi.fn(),
    validateImageFile: vi.fn(() => null),
}));

vi.mock("../components/TurnstileWidget", () => ({
    default: () => <div data-testid="turnstile" />,
}));

vi.mock("../components/UnsavedChangesGuard", () => ({
    default: () => null,
}));

const CONFIG = {
    turnstile_site_key: "test-key",
    // Off, so the form is submit-ready without driving the widget.
    turnstile_enabled: false,
    allowed_sites: ["dokimotes"],
    max_image_bytes: 26214400,
    supported_formats: ["png", "jpg", "webp"],
    public_url_prefix: "https://cdn.test",
    pending_prefix: "_pending/",
};

const emote = (overrides) => ({
    artist: "Artist",
    credit: "Credit",
    type: "static",
    source: "fan-made",
    tags: ["a", "b"],
    image_ext: ".webp",
    variant_of: "",
    ...overrides,
});

const mockData = [
    emote({ emote_id: "primary", name: "Test Emote", image_id: "img1", _order: 0 }),
    emote({ emote_id: "variant-1", name: "Test Emote Cry", image_id: "img2", variant_of: "primary", _order: 1 }),
    emote({ emote_id: "other", name: "Other Emote", image_id: "img3", _order: 2 }),
];

const soloData = [emote({ emote_id: "test-1", name: "Test Emote", image_id: "img1", _order: 0 })];

const renderAt = (path, data = mockData) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/edit/:emote_id" element={<EditEmote data={data} />} />
            </Routes>
        </MemoryRouter>,
    );

const submitEdit = () => {
    fireEvent.click(screen.getByRole("button", { name: /Submit Edit/i }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
};

const lastPayload = () => submitSuggestion.mock.calls[0][0];

describe("EditEmote", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchPublicConfig.mockResolvedValue(CONFIG);
        submitSuggestion.mockResolvedValue({ id: "sug_edit" });
        URL.createObjectURL = vi.fn(() => "blob:preview");
        URL.revokeObjectURL = vi.fn();
    });

    it("renders edit form prefilled when emote exists", async () => {
        renderAt("/edit/test-1", soloData);

        await waitFor(() => expect(screen.getByText(/Suggest a Change/i)).toBeInTheDocument());

        expect(screen.getByLabelText("Name *")).toHaveValue("Test Emote");
        expect(screen.getByRole("button", { name: /Submit Edit/i })).toBeDisabled();
    });

    it("shows not-found state when emote id is unknown", () => {
        renderAt("/edit/missing");
        expect(screen.getByText(/Emote not found/i)).toBeInTheDocument();
    });

    it("switches to delete mode and shows reason field", async () => {
        renderAt("/edit/test-1", soloData);
        await waitFor(() => expect(screen.getByText(/Suggest a Change/i)).toBeInTheDocument());

        fireEvent.click(screen.getByRole("tab", { name: /Delete/i }));

        expect(screen.getByLabelText(/Reason/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Request Deletion/i })).toBeDisabled();
    });

    it("offers no member tabs for a standalone emote", async () => {
        renderAt("/edit/test-1", soloData);
        await waitFor(() => expect(screen.getByText(/Suggest a Change/i)).toBeInTheDocument());

        expect(screen.queryByRole("tab", { name: /main/i })).not.toBeInTheDocument();
    });

    it("keeps a single-emote edit on the existing payload shape", async () => {
        renderAt("/edit/test-1", soloData);
        await screen.findByText(/Suggest a Change/i);

        fireEvent.change(screen.getByLabelText(/Tags/i), { target: { value: "a, b, c" } });
        submitEdit();

        await waitFor(() => expect(submitSuggestion).toHaveBeenCalledTimes(1));
        const call = lastPayload();
        expect(call.kind).toBe("edit");
        expect(call.summary).toBe("Update the tags on 'Test Emote'");
        expect(call.payload).toEqual({ target_id: "test-1", changes: { tags: ["a", "b", "c"] }, notes: "" });
    });

    it("edits another emote of the set in the same suggestion", async () => {
        renderAt("/edit/primary");
        await screen.findByText(/Suggest a Change/i);

        fireEvent.click(screen.getByRole("tab", { name: /Test Emote Cry/i }));
        expect(screen.getByLabelText("Name *")).toHaveValue("Test Emote Cry");

        fireEvent.change(screen.getByLabelText("Name *"), { target: { value: "Test Emote Sob" } });
        submitEdit();

        await waitFor(() => expect(submitSuggestion).toHaveBeenCalledTimes(1));
        const call = lastPayload();
        expect(call.payload.target_id).toBe("primary");
        expect(call.payload.changes).toEqual({});
        expect(call.payload.variant_edits).toEqual([{ target_id: "variant-1", changes: { name: "Test Emote Sob" } }]);
        expect(call.summary).toBe("Update 1 other variant");
    });

    it("re-links an emote to another set", async () => {
        renderAt("/edit/primary");
        await screen.findByText(/Suggest a Change/i);

        fireEvent.change(screen.getByLabelText(/Variant of/i), { target: { value: "other" } });
        submitEdit();

        await waitFor(() => expect(submitSuggestion).toHaveBeenCalledTimes(1));
        expect(lastPayload().payload.changes).toEqual({ variant_of: "other" });
        expect(lastPayload().summary).toBe("Update the variant grouping on 'Test Emote'");
    });

    it("blocks a grouping that loops back on itself", async () => {
        renderAt("/edit/primary");
        await screen.findByText(/Suggest a Change/i);

        // variant-1 already points at primary, so pointing primary back at it
        // would make each a variant of the other.
        fireEvent.change(screen.getByLabelText(/Variant of/i), { target: { value: "variant-1" } });

        expect(screen.getByText(/loops back on itself/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Submit Edit/i })).toBeDisabled();
    });

    it("adds a new variant to the set", async () => {
        uploadImage.mockResolvedValue({
            id: "img-new",
            ext: ".png",
            urls: { original: "o", preview: "p", thumbnail: "t" },
        });
        const { container } = renderAt("/edit/variant-1");
        await screen.findByText(/Suggest a Change/i);

        // Two dropzones: the replacement for the active emote, then new variants.
        const newVariantInput = container.querySelectorAll('input[type="file"]')[1];
        fireEvent.change(newVariantInput, { target: { files: [new File(["x"], "pogduck-mad.png")] } });

        const nameInput = await screen.findByLabelText("Name for pogduck-mad.png");
        expect(nameInput).toHaveValue("pogduck-mad");
        fireEvent.change(screen.getByLabelText("Type for pogduck-mad.png"), { target: { value: "animated" } });

        submitEdit();

        await waitFor(() => expect(submitSuggestion).toHaveBeenCalledTimes(1));
        const call = lastPayload();
        expect(call.payload.target_id).toBe("variant-1");
        expect(call.imageIds).toEqual(["img-new"]);
        // New variants hang off the set's primary, not the emote being viewed.
        expect(call.payload.new_variants).toEqual([
            { name: "pogduck-mad", type: "animated", image_id: "img-new", variant_of: "primary" },
        ]);
        expect(call.summary).toBe("Add 1 new variant");
    });

    it("replaces the image of whichever emote is active", async () => {
        uploadImage.mockResolvedValue({
            id: "img-replacement",
            ext: ".png",
            urls: { original: "o", preview: "p", thumbnail: "t" },
        });
        const { container } = renderAt("/edit/primary");
        await screen.findByText(/Suggest a Change/i);

        fireEvent.click(screen.getByRole("tab", { name: /Test Emote Cry/i }));
        const replacementInput = container.querySelectorAll('input[type="file"]')[0];
        fireEvent.change(replacementInput, { target: { files: [new File(["x"], "cry.png")] } });

        await waitFor(() => expect(screen.getByRole("button", { name: /Submit Edit/i })).toBeEnabled());
        submitEdit();

        await waitFor(() => expect(submitSuggestion).toHaveBeenCalledTimes(1));
        const call = lastPayload();
        expect(call.payload).not.toHaveProperty("replace_image_id");
        expect(call.payload.variant_edits).toEqual([
            { target_id: "variant-1", changes: {}, replace_image_id: "img-replacement" },
        ]);
        expect(call.imageIds).toEqual(["img-replacement"]);
    });
});
