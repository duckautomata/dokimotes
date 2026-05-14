import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TurnstileWidget from "../components/TurnstileWidget";
import ImageDropZone from "../components/ImageDropZone";
import UnsavedChangesGuard from "../components/UnsavedChangesGuard";
import { fetchPublicConfig, uploadImage, submitSuggestion, validateImageFile } from "../utils/contentApi";
import { LOG_ERROR } from "../utils/debug";
import { cdn } from "../config";
import "./SuggestionForms.css";

/**
 * @typedef {import("../store/types").EmoteData} EmoteData
 */

const tagsToText = (tags) => (Array.isArray(tags) ? tags.join(", ") : "");

const parseTags = (text) =>
    text
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

const sameTags = (a, b) => {
    if (a.length !== b.length) return false;
    return a.every((tag, i) => tag === b[i]);
};

/**
 * @param {Object} props
 * @param {EmoteData[]} props.data
 */
export default function EditEmote({ data }) {
    const { emote_id } = useParams();
    const emote = useMemo(() => data.find((e) => e.emote_id === emote_id), [data, emote_id]);

    const [cfg, setCfg] = useState(null);
    const [cfgError, setCfgError] = useState(null);

    const [mode, setMode] = useState("edit");

    const [name, setName] = useState("");
    const [artist, setArtist] = useState("");
    const [credit, setCredit] = useState("");
    const [type, setType] = useState("static");
    const [source, setSource] = useState("fan-made");
    const [tagsText, setTagsText] = useState("");
    const [notes, setNotes] = useState("");
    const [reason, setReason] = useState("");

    const [pickedFile, setPickedFile] = useState(null);
    const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);

    const [turnstileToken, setTurnstileToken] = useState(null);
    const turnstileResetRef = useRef(null);
    const isUploadingRef = useRef(false);

    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchPublicConfig()
            .then(setCfg)
            .catch((err) => {
                LOG_ERROR("Failed to fetch public config", err);
                setCfgError(err.message);
            });
    }, []);

    useEffect(() => {
        if (cfg && cfg.turnstile_enabled === false) {
            setTurnstileToken("");
        }
    }, [cfg]);

    useEffect(() => {
        if (!emote) return;
        setName(emote.name ?? "");
        setArtist(emote.artist === "Unknown" ? "" : (emote.artist ?? ""));
        setCredit(emote.credit === "Unknown" ? "" : (emote.credit ?? ""));
        setType(emote.type ?? "static");
        setSource(emote.source ?? "fan-made");
        setTagsText(tagsToText(emote.tags));
    }, [emote]);

    useEffect(() => {
        if (!pickedFile) {
            setLocalPreviewUrl(null);
            return undefined;
        }
        const url = URL.createObjectURL(pickedFile);
        setLocalPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [pickedFile]);

    useEffect(() => {
        if (!pickedFile || turnstileToken === null || uploadedImage || busy) return;
        if (isUploadingRef.current) return;
        isUploadingRef.current = true;

        const file = pickedFile;
        const token = turnstileToken;
        setBusy("uploading");
        setError(null);

        (async () => {
            try {
                const result = await uploadImage({ token, file });
                setUploadedImage(result);
                setPickedFile(null);
            } catch (err) {
                LOG_ERROR("Upload failed", err);
                setError(`Upload failed: ${err.message}`);
                setPickedFile(null);
            } finally {
                isUploadingRef.current = false;
                setBusy(null);
                turnstileResetRef.current?.();
            }
        })();
    }, [pickedFile, turnstileToken, uploadedImage, busy]);

    const editChanges = useMemo(() => {
        if (!emote) return {};
        const changes = {};
        if (name.trim() !== (emote.name ?? "")) changes.name = name.trim();
        const origArtist = emote.artist === "Unknown" ? "" : (emote.artist ?? "");
        if (artist.trim() !== origArtist) changes.artist = artist.trim();
        const origCredit = emote.credit === "Unknown" ? "" : (emote.credit ?? "");
        if (credit.trim() !== origCredit) changes.credit = credit.trim();
        if (type !== emote.type) changes.type = type;
        if (source !== emote.source) changes.source = source;
        const newTags = parseTags(tagsText);
        if (!sameTags(newTags, emote.tags ?? [])) changes.tags = newTags;
        return changes;
    }, [name, artist, credit, type, source, tagsText, emote]);

    if (!emote) {
        return (
            <div className="suggestion-page">
                <Link to="/" className="suggestion-back">
                    <span className="back-arrow">←</span> Back to Gallery
                </Link>
                <div className="suggestion-card glass-panel">
                    <h1 className="suggestion-title">Emote not found</h1>
                    <p className="suggestion-subtitle">
                        No emote was found with id <code>{emote_id}</code>.
                    </p>
                </div>
            </div>
        );
    }

    const editHasFieldChanges = Object.keys(editChanges).length > 0;
    const editHasReplacementImage = !!uploadedImage;
    const canSubmitEdit =
        (editHasFieldChanges || editHasReplacementImage) && turnstileToken !== null && !busy && name.trim().length > 0;
    const canSubmitDelete = reason.trim().length > 0 && turnstileToken !== null && !busy;

    const isDirty =
        !success &&
        (mode === "edit"
            ? editHasFieldChanges || editHasReplacementImage || !!pickedFile || notes.trim().length > 0
            : reason.trim().length > 0);

    const handleFileSelected = (file) => {
        setError(null);
        setSuccess(null);
        const validationError = validateImageFile(file, cfg);
        if (validationError) {
            setError(validationError);
            return;
        }
        setUploadedImage(null);
        setPickedFile(file);
    };

    const handleClearImage = () => {
        if (busy) return;
        setUploadedImage(null);
        setPickedFile(null);
        setError(null);
    };

    const handleResetEdits = () => {
        if (busy || !emote) return;
        setName(emote.name ?? "");
        setArtist(emote.artist === "Unknown" ? "" : (emote.artist ?? ""));
        setCredit(emote.credit === "Unknown" ? "" : (emote.credit ?? ""));
        setType(emote.type ?? "static");
        setSource(emote.source ?? "fan-made");
        setTagsText(tagsToText(emote.tags));
        setNotes("");
        setUploadedImage(null);
        setPickedFile(null);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (mode === "edit") {
            if (!canSubmitEdit) return;
            setBusy("submitting");
            try {
                const payload = {
                    target_id: emote.emote_id,
                    changes: editChanges,
                    notes: notes.trim(),
                };
                if (uploadedImage) payload.replace_image_id = uploadedImage.id;
                const result = await submitSuggestion({
                    token: turnstileToken,
                    kind: "edit",
                    payload,
                    imageIds: uploadedImage ? [uploadedImage.id] : [],
                });
                setSuccess(result);
            } catch (err) {
                LOG_ERROR("Submit failed", err);
                setError(`Submission failed: ${err.message}`);
            } finally {
                setBusy(null);
                turnstileResetRef.current?.();
            }
        } else {
            if (!canSubmitDelete) return;
            setBusy("submitting");
            try {
                const result = await submitSuggestion({
                    token: turnstileToken,
                    kind: "delete",
                    payload: {
                        target_id: emote.emote_id,
                        reason: reason.trim(),
                    },
                });
                setSuccess(result);
            } catch (err) {
                LOG_ERROR("Submit failed", err);
                setError(`Submission failed: ${err.message}`);
            } finally {
                setBusy(null);
                turnstileResetRef.current?.();
            }
        }
    };

    const handleModeChange = (newMode) => {
        if (busy || success) return;
        setMode(newMode);
        setError(null);
    };

    if (cfgError) {
        return (
            <div className="suggestion-page">
                <Link to={`/view/${emote.emote_id}`} className="suggestion-back">
                    <span className="back-arrow">←</span> Back to Emote
                </Link>
                <div className="suggestion-card glass-panel">
                    <div className="suggestion-status error">Failed to load suggestion config: {cfgError}</div>
                </div>
            </div>
        );
    }

    if (!cfg) {
        return (
            <div className="suggestion-page">
                <div className="suggestion-loading">Loading suggestion form…</div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="suggestion-page">
                <Link to={`/view/${emote.emote_id}`} className="suggestion-back">
                    <span className="back-arrow">←</span> Back to Emote
                </Link>
                <div className="suggestion-card glass-panel">
                    <h1 className="suggestion-title">Thanks!</h1>
                    <p className="suggestion-subtitle">
                        Your {mode === "delete" ? "deletion" : "edit"} suggestion has been submitted for review.
                        Reference ID: <code>{success.id}</code>
                    </p>
                    <div className="suggestion-actions">
                        <Link
                            to={`/view/${emote.emote_id}`}
                            className="suggestion-submit-btn"
                            style={{ textDecoration: "none" }}
                        >
                            Back to Emote
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const maxMb = (cfg.max_image_bytes / (1024 * 1024)).toFixed(0);
    const acceptList = (cfg.supported_formats ?? []).map((f) => `.${f}`).join(",");
    const currentImageUrl = `${cdn}/${emote.image_id}_p.webp`;

    const previewSrc = uploadedImage ? uploadedImage.urls.preview : localPreviewUrl;
    let dropzoneOverlay = null;
    if (busy === "uploading") dropzoneOverlay = "Uploading…";
    else if (pickedFile && turnstileToken === null) dropzoneOverlay = "Waiting for verification…";

    return (
        <div className="suggestion-page">
            <UnsavedChangesGuard when={isDirty} />
            <Link to={`/view/${emote.emote_id}`} className="suggestion-back">
                <span className="back-arrow">←</span> Back to Emote
            </Link>
            <div className="suggestion-card glass-panel">
                <h1 className="suggestion-title">Suggest a Change</h1>
                <p className="suggestion-subtitle">
                    Editing <strong>{emote.name}</strong>. An admin will review before any changes go live.
                </p>

                <div className="suggestion-mode-tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        className={`suggestion-mode-tab ${mode === "edit" ? "active" : ""}`}
                        aria-selected={mode === "edit"}
                        onClick={() => handleModeChange("edit")}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        role="tab"
                        className={`suggestion-mode-tab ${mode === "delete" ? "active" : ""}`}
                        aria-selected={mode === "delete"}
                        onClick={() => handleModeChange("delete")}
                    >
                        Delete
                    </button>
                </div>

                <form className="suggestion-form" onSubmit={handleSubmit}>
                    {mode === "edit" ? (
                        <>
                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-name">
                                    Name <span className="suggestion-field-required">*</span>
                                </label>
                                <input
                                    id="edit-name"
                                    className="suggestion-input"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    maxLength={100}
                                />
                            </div>

                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-artist">
                                    Artist
                                </label>
                                <input
                                    id="edit-artist"
                                    className="suggestion-input"
                                    type="text"
                                    value={artist}
                                    onChange={(e) => setArtist(e.target.value)}
                                    maxLength={200}
                                />
                            </div>

                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-credit">
                                    Credit
                                </label>
                                <input
                                    id="edit-credit"
                                    className="suggestion-input"
                                    type="text"
                                    value={credit}
                                    onChange={(e) => setCredit(e.target.value)}
                                    maxLength={500}
                                />
                            </div>

                            <div className="suggestion-field">
                                <span className="suggestion-field-label">Type</span>
                                <div className="suggestion-radio-group">
                                    {["static", "animated"].map((opt) => (
                                        <label
                                            key={opt}
                                            className={`suggestion-radio-option ${type === opt ? "checked" : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name="edit-type"
                                                value={opt}
                                                checked={type === opt}
                                                onChange={() => setType(opt)}
                                            />
                                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="suggestion-field">
                                <span className="suggestion-field-label">Source</span>
                                <div className="suggestion-radio-group">
                                    {["official", "fan-made"].map((opt) => (
                                        <label
                                            key={opt}
                                            className={`suggestion-radio-option ${source === opt ? "checked" : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name="edit-source"
                                                value={opt}
                                                checked={source === opt}
                                                onChange={() => setSource(opt)}
                                            />
                                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-tags">
                                    Tags <span className="suggestion-field-hint">(comma separated)</span>
                                </label>
                                <input
                                    id="edit-tags"
                                    className="suggestion-input"
                                    type="text"
                                    value={tagsText}
                                    onChange={(e) => setTagsText(e.target.value)}
                                />
                            </div>

                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-notes">
                                    Notes <span className="suggestion-field-hint">(context for the reviewer)</span>
                                </label>
                                <textarea
                                    id="edit-notes"
                                    className="suggestion-textarea"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    maxLength={2000}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="suggestion-status info">
                                You are requesting deletion of <strong>{emote.name}</strong>. Tell the reviewer why.
                            </div>
                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="delete-reason">
                                    Reason <span className="suggestion-field-required">*</span>
                                </label>
                                <textarea
                                    id="delete-reason"
                                    className="suggestion-textarea"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. duplicate of another emote, violates guidelines, …"
                                    required
                                    maxLength={2000}
                                />
                            </div>
                        </>
                    )}

                    <div className="suggestion-image-section">
                        <span className="suggestion-field-label">
                            {mode === "edit" ? "Image" : "Current Image"}
                            {mode === "edit" && (
                                <span className="suggestion-field-hint">
                                    {" "}
                                    Replacement is optional · up to {maxMb} MB
                                </span>
                            )}
                        </span>
                        {mode === "edit" ? (
                            <div className="suggestion-image-pair">
                                <div className="suggestion-image-pair-item">
                                    <span className="suggestion-image-caption">Current</span>
                                    <div className="suggestion-image-display">
                                        <img src={currentImageUrl} alt={`Current ${emote.name}`} />
                                    </div>
                                </div>
                                <div className="suggestion-image-pair-item">
                                    <span className="suggestion-image-caption">
                                        {uploadedImage ? "Replacement" : "Drop replacement"}
                                    </span>
                                    <ImageDropZone
                                        accept={acceptList}
                                        onSelect={handleFileSelected}
                                        previewSrc={previewSrc}
                                        overlay={dropzoneOverlay}
                                        onClear={handleClearImage}
                                        clearable={!!uploadedImage}
                                        placeholder="Drop image or click"
                                        hint="Auto-uploads on drop"
                                        disabled={busy === "submitting"}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="suggestion-image-display compact">
                                <img src={currentImageUrl} alt={`Current ${emote.name}`} />
                            </div>
                        )}
                    </div>

                    {mode === "edit" && !editHasFieldChanges && !editHasReplacementImage && (
                        <div className="suggestion-status info">
                            Make a change above (edit a field or drop a new image) to enable submission.
                        </div>
                    )}

                    {cfg.turnstile_enabled !== false && (
                        <div className="suggestion-turnstile-block">
                            <span className="suggestion-field-hint">Human verification:</span>
                            <TurnstileWidget
                                siteKey={cfg.turnstile_site_key}
                                onToken={setTurnstileToken}
                                resetRef={turnstileResetRef}
                            />
                        </div>
                    )}

                    {error && <div className="suggestion-status error">{error}</div>}

                    <div className="suggestion-actions">
                        {mode === "edit" ? (
                            <>
                                <button type="submit" className="suggestion-submit-btn" disabled={!canSubmitEdit}>
                                    {busy === "submitting" ? "Submitting…" : "Submit Edit"}
                                </button>
                                <button
                                    type="button"
                                    className="suggestion-secondary-btn"
                                    onClick={handleResetEdits}
                                    disabled={!!busy || (!editHasFieldChanges && !editHasReplacementImage)}
                                >
                                    Reset Changes
                                </button>
                            </>
                        ) : (
                            <button type="submit" className="suggestion-submit-btn danger" disabled={!canSubmitDelete}>
                                {busy === "submitting" ? "Submitting…" : "Request Deletion"}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
