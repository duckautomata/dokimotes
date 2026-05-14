import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TurnstileWidget from "../components/TurnstileWidget";
import ImageDropZone from "../components/ImageDropZone";
import UnsavedChangesGuard from "../components/UnsavedChangesGuard";
import { fetchPublicConfig, uploadImage, submitSuggestion, validateImageFile } from "../utils/contentApi";
import { LOG_ERROR } from "../utils/debug";
import "./SuggestionForms.css";

export default function AddEmote() {
    const [cfg, setCfg] = useState(null);
    const [cfgError, setCfgError] = useState(null);

    const [name, setName] = useState("");
    const [artist, setArtist] = useState("");
    const [credit, setCredit] = useState("");
    const [type, setType] = useState("static");
    const [source, setSource] = useState("fan-made");
    const [tagsText, setTagsText] = useState("");
    const [notes, setNotes] = useState("");

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

    const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

    const canSubmit = name.trim().length > 0 && !!uploadedImage && turnstileToken !== null && !busy;
    const isDirty =
        !success &&
        (name.trim().length > 0 ||
            artist.trim().length > 0 ||
            credit.trim().length > 0 ||
            tagsText.trim().length > 0 ||
            notes.trim().length > 0 ||
            !!pickedFile ||
            !!uploadedImage);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError(null);
        setBusy("submitting");
        try {
            const payload = {
                name: name.trim(),
                artist: artist.trim(),
                credit: credit.trim(),
                type,
                source,
                tags,
                notes: notes.trim(),
            };
            const result = await submitSuggestion({
                token: turnstileToken,
                kind: "new",
                payload,
                imageIds: [uploadedImage.id],
            });
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
                        Your emote suggestion has been submitted for review. Reference ID: <code>{success.id}</code>
                    </p>
                    <div className="suggestion-actions">
                        <Link to="/" className="suggestion-submit-btn" style={{ textDecoration: "none" }}>
                            Back to Gallery
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const maxMb = (cfg.max_image_bytes / (1024 * 1024)).toFixed(0);
    const acceptList = (cfg.supported_formats ?? []).map((f) => `.${f}`).join(",");

    const previewSrc = uploadedImage ? uploadedImage.urls.preview : localPreviewUrl;
    let dropzoneOverlay = null;
    if (busy === "uploading") dropzoneOverlay = "Uploading…";
    else if (pickedFile && turnstileToken === null) dropzoneOverlay = "Waiting for verification…";

    return (
        <div className="suggestion-page">
            <UnsavedChangesGuard when={isDirty} />
            <Link to="/" className="suggestion-back">
                <span className="back-arrow">←</span> Back to Gallery
            </Link>
            <div className="suggestion-card glass-panel">
                <h1 className="suggestion-title">Suggest a New Emote</h1>
                <p className="suggestion-subtitle">
                    Submit a new emote for review. An admin will check it before it gets added to the archive.
                </p>

                <form className="suggestion-form" onSubmit={handleSubmit}>
                    <div className="suggestion-field">
                        <label className="suggestion-field-label" htmlFor="add-name">
                            Name <span className="suggestion-field-required">*</span>
                        </label>
                        <input
                            id="add-name"
                            className="suggestion-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            maxLength={100}
                        />
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
                        <span className="suggestion-field-label">Type</span>
                        <div className="suggestion-radio-group">
                            {["static", "animated"].map((opt) => (
                                <label key={opt} className={`suggestion-radio-option ${type === opt ? "checked" : ""}`}>
                                    <input
                                        type="radio"
                                        name="type"
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

                    <div className="suggestion-image-section suggestion-image-section-single">
                        <span className="suggestion-field-label">
                            Image <span className="suggestion-field-required">*</span>{" "}
                            <span className="suggestion-field-hint">
                                Up to {maxMb} MB · {(cfg.supported_formats ?? []).join(", ")}
                            </span>
                        </span>
                        <ImageDropZone
                            accept={acceptList}
                            onSelect={handleFileSelected}
                            previewSrc={previewSrc}
                            overlay={dropzoneOverlay}
                            onClear={handleClearImage}
                            clearable={!!uploadedImage}
                            placeholder="Drop image or click to browse"
                            hint="Auto-uploads on drop"
                            disabled={busy === "submitting"}
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
