import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TurnstileWidget from "../components/TurnstileWidget";
import ImageDropZone from "../components/ImageDropZone";
import UnsavedChangesGuard from "../components/UnsavedChangesGuard";
import ConfirmSubmitModal from "../components/ConfirmSubmitModal";
import { fetchPublicConfig, uploadImage, submitSuggestion, validateImageFile } from "../utils/contentApi";
import { saveSuggestionId } from "../utils/suggestionIds";
import { nameFromFileName, hasDuplicateNames, pluralVariants } from "../utils/variantSuggestions";
import { LOG_ERROR } from "../utils/debug";
import "./SuggestionForms.css";

export default function AddEmote() {
    const [cfg, setCfg] = useState(null);
    const [cfgError, setCfgError] = useState(null);

    // Artist, credit, source and tags describe the whole set: variants of the
    // same emote share them. Name, type and image are per-emote, edited on the
    // rows below.
    const [artist, setArtist] = useState("");
    const [credit, setCredit] = useState("");
    const [source, setSource] = useState("fan-made");
    const [tagsText, setTagsText] = useState("");
    const [notes, setNotes] = useState("");

    // Files wait here until a Turnstile token is available, then upload one at
    // a time (each upload spends the token, so the widget is reset after each).
    const [pickedQueue, setPickedQueue] = useState([]);
    const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
    // The set being proposed, in order: index 0 is the main emote, the rest
    // become its variants. [{ id, ext, urls, name, type, file_name }]
    const [emotes, setEmotes] = useState([]);

    const [turnstileToken, setTurnstileToken] = useState(null);
    const turnstileResetRef = useRef(null);
    const isUploadingRef = useRef(false);

    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

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

    const headFile = pickedQueue[0];
    useEffect(() => {
        if (!headFile) {
            setLocalPreviewUrl(null);
            return undefined;
        }
        const url = URL.createObjectURL(headFile);
        setLocalPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [headFile]);

    useEffect(() => {
        if (pickedQueue.length === 0 || turnstileToken === null || busy) return;
        if (isUploadingRef.current) return;
        isUploadingRef.current = true;

        const file = pickedQueue[0];
        const token = turnstileToken;
        setBusy("uploading");
        setError(null);

        (async () => {
            try {
                const result = await uploadImage({ token, file });
                setEmotes((prev) => [
                    ...prev,
                    { ...result, name: nameFromFileName(file.name), type: "static", file_name: file.name },
                ]);
                setPickedQueue((prev) => prev.slice(1));
            } catch (err) {
                LOG_ERROR("Upload failed", err);
                setError(`Upload failed: ${err.message}`);
                setPickedQueue((prev) => prev.slice(1)); // skip the failed one
            } finally {
                isUploadingRef.current = false;
                setBusy(null);
                turnstileResetRef.current?.();
            }
        })();
    }, [pickedQueue, turnstileToken, busy]);

    const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

    const main = emotes[0];
    const variants = emotes.slice(1);
    const missingName = emotes.some((e) => !e.name.trim());
    const duplicateNames = hasDuplicateNames(emotes.map((e) => e.name));

    const canSubmit = emotes.length > 0 && !missingName && turnstileToken !== null && !busy;
    const isDirty =
        !success &&
        (artist.trim().length > 0 ||
            credit.trim().length > 0 ||
            tagsText.trim().length > 0 ||
            notes.trim().length > 0 ||
            pickedQueue.length > 0 ||
            emotes.length > 0);

    const handleFileSelected = (file) => {
        setError(null);
        setSuccess(null);
        const validationError = validateImageFile(file, cfg);
        if (validationError) {
            setError(validationError);
            return;
        }
        setPickedQueue((prev) => [...prev, file]);
    };

    const handleClearQueue = () => {
        if (busy) return;
        setPickedQueue([]);
        setError(null);
    };

    const handleRemove = (id) => {
        if (busy) return;
        setEmotes((prev) => prev.filter((e) => e.id !== id));
    };

    const handleNameChange = (id, value) => {
        setEmotes((prev) => prev.map((e) => (e.id === id ? { ...e, name: value } : e)));
    };

    const handleTypeChange = (id, value) => {
        setEmotes((prev) => prev.map((e) => (e.id === id ? { ...e, type: value } : e)));
    };

    // Primacy is encoded by position, so promoting a row moves it to the front
    // and the list visibly reorders.
    const handleMakeMain = (id) => {
        if (busy) return;
        setEmotes((prev) => {
            const picked = prev.find((e) => e.id === id);
            if (!picked) return prev;
            return [picked, ...prev.filter((e) => e.id !== id)];
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError(null);
        setConfirmOpen(true);
    };

    const performSubmit = async () => {
        setConfirmOpen(false);
        if (!canSubmit) return;
        setError(null);
        setBusy("submitting");
        try {
            const payload = {
                name: main.name.trim(),
                artist: artist.trim(),
                credit: credit.trim(),
                type: main.type,
                source,
                tags,
                notes: notes.trim(),
                image_id: main.id,
            };
            if (variants.length > 0) {
                payload.variants = variants.map((v) => ({
                    name: v.name.trim(),
                    type: v.type,
                    image_id: v.id,
                }));
            }
            const result = await submitSuggestion({
                token: turnstileToken,
                kind: "new",
                payload,
                imageIds: emotes.map((e) => e.id),
                summary: variants.length
                    ? `Add the emote '${payload.name}' with ${pluralVariants(variants.length)}`
                    : `Add the emote '${payload.name}'`,
            });
            saveSuggestionId(result.id);
            setSuccess(result);
        } catch (err) {
            LOG_ERROR("Submit failed", err);
            setError(`Submission failed: ${err.message}`);
        } finally {
            setBusy(null);
            turnstileResetRef.current?.();
        }
    };

    if (cfgError) {
        return (
            <div className="suggestion-page">
                <Link to="/" className="suggestion-back">
                    <span className="back-arrow">←</span> Back to Gallery
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
                <Link to="/" className="suggestion-back">
                    <span className="back-arrow">←</span> Back to Gallery
                </Link>
                <div className="suggestion-card glass-panel">
                    <h1 className="suggestion-title">Thanks!</h1>
                    <p className="suggestion-subtitle">
                        Your emote suggestion has been submitted for review. Reference ID: <code>{success.id}</code>{" "}
                        (saved on this device, you can track it under My Suggestions).
                    </p>
                    <div className="suggestion-actions">
                        <Link to="/my-suggestions" className="suggestion-submit-btn" style={{ textDecoration: "none" }}>
                            View Status
                        </Link>
                        <Link to="/" className="suggestion-secondary-btn" style={{ textDecoration: "none" }}>
                            Back to Gallery
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const maxMb = (cfg.max_image_bytes / (1024 * 1024)).toFixed(0);
    const acceptList = (cfg.supported_formats ?? []).map((f) => `.${f}`).join(",");

    let dropzoneOverlay = null;
    if (busy === "uploading") {
        dropzoneOverlay = pickedQueue.length > 1 ? `Uploading… (${pickedQueue.length} left)` : "Uploading…";
    } else if (pickedQueue.length > 0 && turnstileToken === null) {
        dropzoneOverlay = "Waiting for verification…";
    }

    return (
        <div className="suggestion-page">
            <UnsavedChangesGuard when={isDirty} />
            <ConfirmSubmitModal
                open={confirmOpen}
                title="Submit suggestion?"
                message={
                    variants.length ? (
                        <>
                            Submit <strong>{main?.name.trim()}</strong> and its {pluralVariants(variants.length)} for
                            review?
                        </>
                    ) : (
                        <>
                            Submit the new emote <strong>{main?.name.trim()}</strong> for review?
                        </>
                    )
                }
                confirmLabel="Submit"
                onConfirm={performSubmit}
                onCancel={() => setConfirmOpen(false)}
            />
            <Link to="/" className="suggestion-back">
                <span className="back-arrow">←</span> Back to Gallery
            </Link>
            <div className="suggestion-card glass-panel">
                <h1 className="suggestion-title">Suggest a New Emote</h1>
                <p className="suggestion-subtitle">
                    Submit a new emote for review, or a whole variant set at once. An admin will check it before it gets
                    added to the archive.
                </p>

                <form className="suggestion-form" onSubmit={handleSubmit}>
                    <div className="suggestion-image-list-section">
                        <span className="suggestion-field-label">
                            Emotes <span className="suggestion-field-required">*</span>{" "}
                            <span className="suggestion-field-hint">
                                Drop one image, or several to suggest a variant set · up to {maxMb} MB ·{" "}
                                {(cfg.supported_formats ?? []).join(", ")}
                            </span>
                        </span>

                        {emotes.length > 0 && (
                            <div className="suggestion-image-list">
                                {emotes.map((e, index) => {
                                    const isMain = index === 0;
                                    return (
                                        <div key={e.id} className={`suggestion-image-row ${isMain ? "is-main" : ""}`}>
                                            <div className="suggestion-image-row-thumb">
                                                <img src={e.urls.preview} alt="" />
                                            </div>
                                            <div className="suggestion-image-row-fields">
                                                <input
                                                    className={`suggestion-image-row-name ${
                                                        e.name.trim() ? "" : "is-invalid"
                                                    }`}
                                                    type="text"
                                                    value={e.name}
                                                    onChange={(ev) => handleNameChange(e.id, ev.target.value)}
                                                    placeholder="Emote name"
                                                    maxLength={100}
                                                    disabled={busy === "submitting"}
                                                    aria-label={`Name for ${e.file_name}`}
                                                />
                                                <select
                                                    className="suggestion-image-row-type"
                                                    value={e.type}
                                                    onChange={(ev) => handleTypeChange(e.id, ev.target.value)}
                                                    disabled={!!busy}
                                                    aria-label={`Type for ${e.file_name}`}
                                                >
                                                    <option value="static">Static</option>
                                                    <option value="animated">Animated</option>
                                                </select>
                                            </div>
                                            {isMain ? (
                                                <span
                                                    className="suggestion-role-badge"
                                                    title="The main emote of the set"
                                                >
                                                    Main
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="suggestion-role-btn"
                                                    onClick={() => handleMakeMain(e.id)}
                                                    disabled={!!busy}
                                                >
                                                    Make main
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="suggestion-image-row-remove"
                                                onClick={() => handleRemove(e.id)}
                                                aria-label={`Remove ${e.file_name}`}
                                                disabled={!!busy}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="suggestion-image-add-dropzone">
                            <ImageDropZone
                                accept={acceptList}
                                multiple
                                onSelect={handleFileSelected}
                                previewSrc={localPreviewUrl}
                                overlay={dropzoneOverlay}
                                onClear={handleClearQueue}
                                clearable={pickedQueue.length > 0 && !busy}
                                placeholder={
                                    emotes.length
                                        ? "Drop another variant, or click"
                                        : "Drop image(s) or click to browse"
                                }
                                hint="Name each one after upload"
                                disabled={busy === "submitting"}
                            />
                        </div>

                        {emotes.length > 1 && (
                            <span className="suggestion-field-hint">
                                <strong>{main.name.trim() || "The main emote"}</strong> is the main emote; the other{" "}
                                {pluralVariants(variants.length)} will be grouped under it.
                            </span>
                        )}
                        {missingName && <div className="suggestion-status error">Every emote needs a name.</div>}
                        {!missingName && duplicateNames && (
                            <div className="suggestion-status info">
                                Two emotes in this set share a name — double-check that&apos;s intended.
                            </div>
                        )}
                    </div>

                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="add-artist">
                            Artist <span className="suggestion-field-hint">(who made it)</span>
                        </label>
                        <input
                            id="add-artist"
                            className="suggestion-input"
                            type="text"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            maxLength={200}
                        />
                    </div>

                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="add-credit">
                            Credit <span className="suggestion-field-hint">(source link, etc.)</span>
                        </label>
                        <input
                            id="add-credit"
                            className="suggestion-input"
                            type="text"
                            value={credit}
                            onChange={(e) => setCredit(e.target.value)}
                            maxLength={500}
                        />
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
                                        name="source"
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
                        <label className="suggestion-field-label" htmlFor="add-tags">
                            Tags <span className="suggestion-field-hint">(comma separated)</span>
                        </label>
                        <input
                            id="add-tags"
                            className="suggestion-input"
                            type="text"
                            value={tagsText}
                            onChange={(e) => setTagsText(e.target.value)}
                            placeholder="happy, dance, cute"
                        />
                    </div>

                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="add-notes">
                            Notes <span className="suggestion-field-hint">(anything else for the reviewer)</span>
                        </label>
                        <textarea
                            id="add-notes"
                            className="suggestion-textarea"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            maxLength={2000}
                        />
                    </div>

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
                        <button type="submit" className="suggestion-submit-btn" disabled={!canSubmit}>
                            {busy === "submitting" ? "Submitting…" : "Submit Suggestion"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
