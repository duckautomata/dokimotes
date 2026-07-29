import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AddEmote from "./AddEmote";
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

const uploadResult = (id) => ({
    id,
    ext: ".png",
    urls: { original: `o/${id}`, preview: `p/${id}`, thumbnail: `t/${id}` },
});

const makeFile = (name) => new File(["x"], name, { type: "image/png" });

const dropFiles = (container, files) => {
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files } });
};

const renderPage = () =>
    render(
        <MemoryRouter>
            <AddEmote />
        </MemoryRouter>,
    );

describe("AddEmote", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchPublicConfig.mockResolvedValue(CONFIG);
        submitSuggestion.mockResolvedValue({ id: "sug_new" });
        URL.createObjectURL = vi.fn(() => "blob:preview");
        URL.revokeObjectURL = vi.fn();
    });

    it("renders the form fields once config is loaded", async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText(/Suggest a New Emote/i)).toBeInTheDocument());

        expect(screen.getByLabelText(/Tags/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Artist/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Submit Suggestion/i })).toBeDisabled();
    });

    it("names each dropped image from its file name", async () => {
        uploadImage.mockResolvedValue(uploadResult("img-a"));
        const { container } = renderPage();
        await screen.findByText(/Suggest a New Emote/i);

        dropFiles(container, [makeFile("pogduck.png")]);

        expect(await screen.findByLabelText("Name for pogduck.png")).toHaveValue("pogduck");
        expect(screen.getByRole("button", { name: /Submit Suggestion/i })).toBeEnabled();
    });

    it("submits a single emote without a variants list", async () => {
        uploadImage.mockResolvedValue(uploadResult("img-a"));
        const { container } = renderPage();
        await screen.findByText(/Suggest a New Emote/i);

        dropFiles(container, [makeFile("pogduck.png")]);
        await screen.findByLabelText("Name for pogduck.png");

        fireEvent.click(screen.getByRole("button", { name: /Submit Suggestion/i }));
        fireEvent.click(screen.getByRole("button", { name: "Submit" }));

        await waitFor(() => expect(submitSuggestion).toHaveBeenCalledTimes(1));
        const call = submitSuggestion.mock.calls[0][0];
        expect(call.kind).toBe("new");
        expect(call.imageIds).toEqual(["img-a"]);
        expect(call.summary).toBe("Add the emote 'pogduck'");
        expect(call.payload).toMatchObject({ name: "pogduck", type: "static", image_id: "img-a" });
        expect(call.payload).not.toHaveProperty("variants");
    });

    it("submits extra images as variants of the first one", async () => {
        uploadImage.mockResolvedValueOnce(uploadResult("img-a")).mockResolvedValueOnce(uploadResult("img-b"));
        const { container } = renderPage();
        await screen.findByText(/Suggest a New Emote/i);

        dropFiles(container, [makeFile("pogduck.png"), makeFile("pogduck-cry.png")]);
        const variantName = await screen.findByLabelText("Name for pogduck-cry.png");

        fireEvent.change(screen.getByLabelText("Type for pogduck-cry.png"), { target: { value: "animated" } });
        fireEvent.change(variantName, { target: { value: "pogduck sob" } });

        fireEvent.click(screen.getByRole("button", { name: /Submit Suggestion/i }));
        fireEvent.click(screen.getByRole("button", { name: "Submit" }));

        await waitFor(() => expect(submitSuggestion).toHaveBeenCalledTimes(1));
        const call = submitSuggestion.mock.calls[0][0];
        expect(call.imageIds).toEqual(["img-a", "img-b"]);
        expect(call.summary).toBe("Add the emote 'pogduck' with 1 variant");
        expect(call.payload.name).toBe("pogduck");
        expect(call.payload.image_id).toBe("img-a");
        expect(call.payload.variants).toEqual([{ name: "pogduck sob", type: "animated", image_id: "img-b" }]);
    });

    it("promotes a variant to the main emote", async () => {
        uploadImage.mockResolvedValueOnce(uploadResult("img-a")).mockResolvedValueOnce(uploadResult("img-b"));
        const { container } = renderPage();
        await screen.findByText(/Suggest a New Emote/i);

        dropFiles(container, [makeFile("pogduck.png"), makeFile("pogduck-cry.png")]);
        await screen.findByLabelText("Name for pogduck-cry.png");

        // Only the non-main rows offer promotion, so there is exactly one.
        fireEvent.click(screen.getByRole("button", { name: /Make main/i }));

        fireEvent.click(screen.getByRole("button", { name: /Submit Suggestion/i }));
        fireEvent.click(screen.getByRole("button", { name: "Submit" }));

        await waitFor(() => expect(submitSuggestion).toHaveBeenCalledTimes(1));
        const call = submitSuggestion.mock.calls[0][0];
        expect(call.payload.name).toBe("pogduck-cry");
        expect(call.payload.image_id).toBe("img-b");
        expect(call.payload.variants).toEqual([{ name: "pogduck", type: "static", image_id: "img-a" }]);
        expect(call.imageIds).toEqual(["img-b", "img-a"]);
    });

    it("blocks submission while an emote is unnamed", async () => {
        uploadImage.mockResolvedValue(uploadResult("img-a"));
        const { container } = renderPage();
        await screen.findByText(/Suggest a New Emote/i);

        dropFiles(container, [makeFile("pogduck.png")]);
        const nameInput = await screen.findByLabelText("Name for pogduck.png");

        fireEvent.change(nameInput, { target: { value: "  " } });

        expect(screen.getByText(/Every emote needs a name/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Submit Suggestion/i })).toBeDisabled();
    });
});
