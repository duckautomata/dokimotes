import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TurnstileWidget from "../components/TurnstileWidget";
import ImageDropZone from "../components/ImageDropZone";
import UnsavedChangesGuard from "../components/UnsavedChangesGuard";
import ConfirmSubmitModal from "../components/ConfirmSubmitModal";
import { fetchPublicConfig, uploadImage, submitSuggestion, validateImageFile } from "../utils/contentApi";
import { saveSuggestionId } from "../utils/suggestionIds";
import { getVariants } from "../utils/variants";
import { nameFromFileName, hasVariantCycle, hasDuplicateNames, capitalize } from "../utils/variantSuggestions";
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

// The CSV writes "Unknown" for a blank artist/credit; show those as empty so
// the user isn't asked to delete a placeholder before typing.
const withoutPlaceholder = (value) => (value === "Unknown" ? "" : (value ?? ""));

// Field names as they read in the one-line summary sent with an edit.
const FIELD_LABELS = {
    name: "name",
    artist: "artist",
    credit: "credit",
    type: "type",
    source: "source",
    tags: "tags",
    variant_of: "variant grouping",
};

/** The editable snapshot of one emote in the set. */
const seedMember = (emote) => ({
    name: emote.name ?? "",
    artist: withoutPlaceholder(emote.artist),
    credit: withoutPlaceholder(emote.credit),
    type: emote.type ?? "static",
    source: emote.source ?? "fan-made",
    tagsText: tagsToText(emote.tags),
    variantOf: emote.variant_of ?? "",
    replacement: null,
});

/**
 * @param {Object} props
 * @param {EmoteData[]} props.data
 */
export default function EditEmote({ data }) {
    const { emote_id } = useParams();
    const emote = useMemo(() => data.find((e) => e.emote_id === emote_id), [data, emote_id]);
    // Every emote in this variant set, primary first. One suggestion can touch
    // all of them, so the form edits the set rather than a single row.
    const setMembers = useMemo(() => getVariants(data, emote), [data, emote]);

    const [cfg, setCfg] = useState(null);
    const [cfgError, setCfgError] = useState(null);

    const [mode, setMode] = useState("edit");

    // emote_id → editable snapshot (see seedMember).
    const [memberState, setMemberState] = useState({});
    const [activeId, setActiveId] = useState(emote_id);
    const [notes, setNotes] = useState("");
    const [reason, setReason] = useState("");

    // Files wait here until a Turnstile token is available, then upload one at
    // a time. `memberId` is the emote whose image is being replaced, or null
    // when the file is a brand-new variant for the set.
    const [pickedQueue, setPickedQueue] = useState([]); // [{ file, memberId }]
    const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
    // Emotes to add to this set. [{ id, ext, urls, name, type, file_name }]
    const [newVariants, setNewVariants] = useState([]);

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

    useEffect(() => {
        if (!emote) return;
        const seeded = {};
        for (const member of setMembers) seeded[member.emote_id] = seedMember(member);
        setMemberState(seeded);
        setActiveId(emote.emote_id);
        setNewVariants([]);
    }, [emote, setMembers]);

    const headFile = pickedQueue[0]?.file;
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

        const head = pickedQueue[0];
        const token = turnstileToken;
        setBusy("uploading");
        setError(null);

        (async () => {
            try {
                const result = await uploadImage({ token, file: head.file });
                if (head.memberId) {
                    setMemberState((prev) =>
                        prev[head.memberId]
                            ? { ...prev, [head.memberId]: { ...prev[head.memberId], replacement: result } }
                            : prev,
                    );
                } else {
                    setNewVariants((prev) => [
                        ...prev,
                        {
                            ...result,
                            name: nameFromFileName(head.file.name),
                            type: "static",
                            file_name: head.file.name,
                        },
                    ]);
                }
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

    // Diff every member of the set against its original row. Members the user
    // never touched come out with an empty `changes` and no replacement.
    const memberChanges = useMemo(() => {
        const out = {};
        for (const member of setMembers) {
            const state = memberState[member.emote_id];
            if (!state) continue;
            const changes = {};
            if (state.name.trim() !== (member.name ?? "")) changes.name = state.name.trim();
            if (state.artist.trim() !== withoutPlaceholder(member.artist)) changes.artist = state.artist.trim();
            if (state.credit.trim() !== withoutPlaceholder(member.credit)) changes.credit = state.credit.trim();
            if (state.type !== member.type) changes.type = state.type;
            if (state.source !== member.source) changes.source = state.source;
            const newTags = parseTags(state.tagsText);
            if (!sameTags(newTags, member.tags ?? [])) changes.tags = newTags;
            if (state.variantOf !== (member.variant_of ?? "")) changes.variant_of = state.variantOf;
            out[member.emote_id] = { changes, replaceImageId: state.replacement?.id ?? null };
        }
        return out;
    }, [setMembers, memberState]);

    const isMemberChanged = (id) => {
        const entry = memberChanges[id];
        return !!entry && (Object.keys(entry.changes).length > 0 || !!entry.replaceImageId);
    };

    // A re-grouping that makes some emote a variant of itself would break the
    // set, so catch it here rather than shipping it to a reviewer.
    const cycleError = useMemo(() => {
        const parentOf = {};
        for (const row of data) parentOf[row.emote_id] = row.variant_of ?? "";
        for (const member of setMembers) {
            const state = memberState[member.emote_id];
            if (state) parentOf[member.emote_id] = state.variantOf;
        }
        return hasVariantCycle(parentOf);
    }, [data, setMembers, memberState]);

    const allNames = useMemo(
        () => [...setMembers.map((m) => memberState[m.emote_id]?.name ?? ""), ...newVariants.map((v) => v.name)],
        [setMembers, memberState, newVariants],
    );

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

    const activeMember = setMembers.find((m) => m.emote_id === activeId) ?? emote;
    const activeState = memberState[activeMember.emote_id];
    const changedMemberIds = setMembers.map((m) => m.emote_id).filter(isMemberChanged);

    const editHasMemberChanges = changedMemberIds.length > 0;
    const editHasNewVariants = newVariants.length > 0;
    const missingName =
        setMembers.some((m) => !(memberState[m.emote_id]?.name ?? "").trim()) ||
        newVariants.some((v) => !v.name.trim());
    const duplicateNames = hasDuplicateNames(allNames);

    const canSubmitEdit =
        (editHasMemberChanges || editHasNewVariants) && !missingName && !cycleError && turnstileToken !== null && !busy;
    const canSubmitDelete = reason.trim().length > 0 && turnstileToken !== null && !busy;

    const isDirty =
        !success &&
        (mode === "edit"
            ? editHasMemberChanges || editHasNewVariants || pickedQueue.length > 0 || notes.trim().length > 0
            : reason.trim().length > 0);

    const updateActive = (patch) => {
        setMemberState((prev) =>
            prev[activeMember.emote_id]
                ? { ...prev, [activeMember.emote_id]: { ...prev[activeMember.emote_id], ...patch } }
                : prev,
        );
    };

    const queueFile = (file, memberId) => {
        setError(null);
        setSuccess(null);
        const validationError = validateImageFile(file, cfg);
        if (validationError) {
            setError(validationError);
            return;
        }
        if (memberId) updateActive({ replacement: null });
        setPickedQueue((prev) => [...prev, { file, memberId }]);
    };

    const handleClearQueue = () => {
        if (busy) return;
        setPickedQueue([]);
        setError(null);
    };

    const handleClearReplacement = () => {
        if (busy) return;
        updateActive({ replacement: null });
        setPickedQueue((prev) => prev.filter((entry) => entry.memberId !== activeMember.emote_id));
        setError(null);
    };

    const handleRemoveNewVariant = (id) => {
        if (busy) return;
        setNewVariants((prev) => prev.filter((v) => v.id !== id));
    };

    const handleNewVariantChange = (id, patch) => {
        setNewVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
    };

    const handleResetEdits = () => {
        if (busy) return;
        const seeded = {};
        for (const member of setMembers) seeded[member.emote_id] = seedMember(member);
        setMemberState(seeded);
        setNewVariants([]);
        setPickedQueue([]);
        setNotes("");
        setError(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === "edit" ? !canSubmitEdit : !canSubmitDelete) return;
        setError(null);
        setConfirmOpen(true);
    };

    // "Update the name, tags on 'pogduck', update 2 other variants, add 1 new variant"
    const buildEditSummary = (targetFields, otherCount, newCount) => {
        const parts = [];
        if (targetFields.length) parts.push(`update the ${targetFields.join(", ")} on '${emote.name}'`);
        if (otherCount) parts.push(`update ${otherCount} other variant${otherCount === 1 ? "" : "s"}`);
        if (newCount) parts.push(`add ${newCount} new variant${newCount === 1 ? "" : "s"}`);
        if (!parts.length) return `Edit the emote '${emote.name}'`;
        return capitalize(parts.join(", "));
    };

    const performSubmit = async () => {
        setConfirmOpen(false);
        setError(null);

        if (mode === "edit") {
            if (!canSubmitEdit) return;
            setBusy("submitting");
            try {
                const target = memberChanges[emote.emote_id] ?? { changes: {}, replaceImageId: null };
                const payload = {
                    target_id: emote.emote_id,
                    changes: target.changes,
                    notes: notes.trim(),
                };
                if (target.replaceImageId) payload.replace_image_id = target.replaceImageId;

                const otherEdits = setMembers
                    .filter((m) => m.emote_id !== emote.emote_id && isMemberChanged(m.emote_id))
                    .map((m) => {
                        const entry = memberChanges[m.emote_id];
                        const edit = { target_id: m.emote_id, changes: entry.changes };
                        if (entry.replaceImageId) edit.replace_image_id = entry.replaceImageId;
                        return edit;
                    });
                if (otherEdits.length) payload.variant_edits = otherEdits;

                if (newVariants.length) {
                    // New variants hang off the set's primary, which may itself
                    // have been re-pointed by this same suggestion.
                    const primaryId = setMembers[0]?.emote_id ?? emote.emote_id;
                    payload.new_variants = newVariants.map((v) => ({
                        name: v.name.trim(),
                        type: v.type,
                        image_id: v.id,
                        variant_of: primaryId,
                    }));
                }

                const targetFields = Object.keys(target.changes).map((field) => FIELD_LABELS[field] ?? field);
                if (target.replaceImageId) targetFields.push("image");
                const imageIds = [
                    ...(target.replaceImageId ? [target.replaceImageId] : []),
                    ...otherEdits.map((e) => e.replace_image_id).filter(Boolean),
                    ...newVariants.map((v) => v.id),
                ];

                const result = await submitSuggestion({
                    token: turnstileToken,
                    kind: "edit",
                    payload,
                    imageIds,
                    summary: buildEditSummary(targetFields, otherEdits.length, newVariants.length),
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
                    summary: `Remove the emote '${emote.name}'`,
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

    if (!cfg || !activeState) {
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
                        Reference ID: <code>{success.id}</code> (saved on this device, you can track it under My
                        Suggestions).
                    </p>
                    <div className="suggestion-actions">
                        <Link to="/my-suggestions" className="suggestion-submit-btn" style={{ textDecoration: "none" }}>
                            View Status
                        </Link>
                        <Link
                            to={`/view/${emote.emote_id}`}
                            className="suggestion-secondary-btn"
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
    const currentImageUrl = `${cdn}/${activeMember.image_id}_p.webp`;
    const memberIds = new Set(setMembers.map((m) => m.emote_id));
    const otherEmotes = data
        .filter((e) => !memberIds.has(e.emote_id))
        .slice()
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    // A variant_of pointing at a row that isn't in `data` would otherwise
    // silently blank the select and read as "no parent".
    const danglingParent =
        activeState.variantOf && !data.some((e) => e.emote_id === activeState.variantOf) ? activeState.variantOf : null;

    // The local object URL only ever previews the file at the head of the
    // queue, so hand it to whichever dropzone that file belongs to.
    const headEntry = pickedQueue[0];
    const activeReplacement = activeState.replacement;
    const isUploadingActive = pickedQueue.some((entry) => entry.memberId === activeMember.emote_id);
    const replacementPreview = activeReplacement
        ? activeReplacement.urls.preview
        : headEntry?.memberId === activeMember.emote_id
          ? localPreviewUrl
          : null;
    const newVariantQueueLength = pickedQueue.filter((entry) => !entry.memberId).length;

    let replacementOverlay = null;
    if (isUploadingActive) {
        replacementOverlay = busy === "uploading" ? "Uploading…" : "Waiting for verification…";
    }

    let newVariantOverlay = null;
    if (newVariantQueueLength > 0) {
        if (busy === "uploading") {
            newVariantOverlay = newVariantQueueLength > 1 ? `Uploading… (${newVariantQueueLength} left)` : "Uploading…";
        } else if (turnstileToken === null) {
            newVariantOverlay = "Waiting for verification…";
        }
    }

    return (
        <div className="suggestion-page">
            <UnsavedChangesGuard when={isDirty} />
            <ConfirmSubmitModal
                open={confirmOpen}
                title={mode === "delete" ? "Request deletion?" : "Submit edit?"}
                message={
                    mode === "delete" ? (
                        <>
                            Request deletion of <strong>{emote.name}</strong>? An admin will review the request before
                            anything is removed.
                        </>
                    ) : (
                        <>
                            Submit your edit suggestion for <strong>{emote.name}</strong>
                            {changedMemberIds.length > 1 || newVariants.length ? "'s variant set" : ""}?
                        </>
                    )
                }
                confirmLabel={mode === "delete" ? "Request Deletion" : "Submit"}
                danger={mode === "delete"}
                onConfirm={performSubmit}
                onCancel={() => setConfirmOpen(false)}
            />
            <Link to={`/view/${emote.emote_id}`} className="suggestion-back">
                <span className="back-arrow">←</span> Back to Emote
            </Link>
            <div className="suggestion-card glass-panel">
                <h1 className="suggestion-title">Suggest a Change</h1>
                <p className="suggestion-subtitle">
                    Editing <strong>{emote.name}</strong>
                    {setMembers.length > 1 && <> and its variant set ({setMembers.length} emotes)</>}. An admin will
                    review before any changes go live.
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
                            {setMembers.length > 1 && (
                                <div className="suggestion-field">
                                    <span className="suggestion-field-label">
                                        Emote in this set{" "}
                                        <span className="suggestion-field-hint">
                                            edit any of them — one suggestion covers the whole set
                                        </span>
                                    </span>
                                    <div className="suggestion-member-tabs" role="tablist">
                                        {setMembers.map((member, index) => {
                                            const isActive = member.emote_id === activeMember.emote_id;
                                            return (
                                                <button
                                                    key={member.emote_id}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={isActive}
                                                    className={`suggestion-member-tab ${isActive ? "active" : ""}`}
                                                    onClick={() => setActiveId(member.emote_id)}
                                                >
                                                    <img
                                                        src={`${cdn}/${member.image_id}_t.webp`}
                                                        alt=""
                                                        loading="lazy"
                                                    />
                                                    <span className="suggestion-member-tab-name">
                                                        {memberState[member.emote_id]?.name || member.name}
                                                    </span>
                                                    {index === 0 && (
                                                        <span className="suggestion-member-tab-role">main</span>
                                                    )}
                                                    {isMemberChanged(member.emote_id) && (
                                                        <span
                                                            className="suggestion-member-tab-dot"
                                                            title="Has unsaved changes"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-name">
                                    Name <span className="suggestion-field-required">*</span>
                                </label>
                                <input
                                    id="edit-name"
                                    className="suggestion-input"
                                    type="text"
                                    value={activeState.name}
                                    onChange={(e) => updateActive({ name: e.target.value })}
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
                                    value={activeState.artist}
                                    onChange={(e) => updateActive({ artist: e.target.value })}
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
                                    value={activeState.credit}
                                    onChange={(e) => updateActive({ credit: e.target.value })}
                                    maxLength={500}
                                />
                            </div>

                            <div className="suggestion-field">
                                <span className="suggestion-field-label">Type</span>
                                <div className="suggestion-radio-group">
                                    {["static", "animated"].map((opt) => (
                                        <label
                                            key={opt}
                                            className={`suggestion-radio-option ${
                                                activeState.type === opt ? "checked" : ""
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="edit-type"
                                                value={opt}
                                                checked={activeState.type === opt}
                                                onChange={() => updateActive({ type: opt })}
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
                                            className={`suggestion-radio-option ${
                                                activeState.source === opt ? "checked" : ""
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="edit-source"
                                                value={opt}
                                                checked={activeState.source === opt}
                                                onChange={() => updateActive({ source: opt })}
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
                                    value={activeState.tagsText}
                                    onChange={(e) => updateActive({ tagsText: e.target.value })}
                                />
                            </div>

                            <div className="suggestion-field">
                                <label className="suggestion-field-label" htmlFor="edit-variant-of">
                                    Variant of{" "}
                                    <span className="suggestion-field-hint">
                                        which emote this one is a variant of, if any
                                    </span>
                                </label>
                                <select
                                    id="edit-variant-of"
                                    className="suggestion-select"
                                    value={activeState.variantOf}
                                    onChange={(e) => updateActive({ variantOf: e.target.value })}
                                    disabled={!!busy}
                                >
                                    <option value="">— None (a main emote) —</option>
                                    {danglingParent && (
                                        <option value={danglingParent}>{danglingParent} (unknown emote)</option>
                                    )}
                                    {setMembers.filter((m) => m.emote_id !== activeMember.emote_id).length > 0 && (
                                        <optgroup label="This set">
                                            {setMembers
                                                .filter((m) => m.emote_id !== activeMember.emote_id)
                                                .map((m) => (
                                                    <option key={m.emote_id} value={m.emote_id}>
                                                        {m.name}
                                                    </option>
                                                ))}
                                        </optgroup>
                                    )}
                                    <optgroup label="All other emotes">
                                        {otherEmotes.map((e) => (
                                            <option key={e.emote_id} value={e.emote_id}>
                                                {e.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            <div className="suggestion-image-section">
                                <span className="suggestion-field-label">
                                    Image
                                    <span className="suggestion-field-hint">
                                        {" "}
                                        Replacement is optional · up to {maxMb} MB
                                    </span>
                                </span>
                                <div className="suggestion-image-pair">
                                    <div className="suggestion-image-pair-item">
                                        <span className="suggestion-image-caption">Current</span>
                                        <div className="suggestion-image-display">
                                            <img src={currentImageUrl} alt={`Current ${activeMember.name}`} />
                                        </div>
                                    </div>
                                    <div className="suggestion-image-pair-item">
                                        <span className="suggestion-image-caption">
                                            {activeReplacement ? "Replacement" : "Drop replacement"}
                                        </span>
                                        <ImageDropZone
                                            accept={acceptList}
                                            onSelect={(file) => queueFile(file, activeMember.emote_id)}
                                            previewSrc={replacementPreview}
                                            overlay={replacementOverlay}
                                            onClear={handleClearReplacement}
                                            clearable={!!activeReplacement}
                                            placeholder="Drop image or click"
                                            hint="Auto-uploads on drop"
                                            disabled={busy === "submitting"}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="suggestion-image-list-section">
                                <span className="suggestion-field-label">
                                    New variants{" "}
                                    <span className="suggestion-field-hint">
                                        (optional · added to this set under{" "}
                                        {memberState[setMembers[0]?.emote_id]?.name || setMembers[0]?.name})
                                    </span>
                                </span>

                                {newVariants.length > 0 && (
                                    <div className="suggestion-image-list">
                                        {newVariants.map((v) => (
                                            <div key={v.id} className="suggestion-image-row">
                                                <div className="suggestion-image-row-thumb">
                                                    <img src={v.urls.preview} alt="" />
                                                </div>
                                                <div className="suggestion-image-row-fields">
                                                    <input
                                                        className={`suggestion-image-row-name ${
                                                            v.name.trim() ? "" : "is-invalid"
                                                        }`}
                                                        type="text"
                                                        value={v.name}
                                                        onChange={(e) =>
                                                            handleNewVariantChange(v.id, { name: e.target.value })
                                                        }
                                                        placeholder="Variant name"
                                                        maxLength={100}
                                                        disabled={busy === "submitting"}
                                                        aria-label={`Name for ${v.file_name}`}
                                                    />
                                                    <select
                                                        className="suggestion-image-row-type"
                                                        value={v.type}
                                                        onChange={(e) =>
                                                            handleNewVariantChange(v.id, { type: e.target.value })
                                                        }
                                                        disabled={!!busy}
                                                        aria-label={`Type for ${v.file_name}`}
                                                    >
                                                        <option value="static">Static</option>
                                                        <option value="animated">Animated</option>
                                                    </select>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="suggestion-image-row-remove"
                                                    onClick={() => handleRemoveNewVariant(v.id)}
                                                    aria-label={`Remove ${v.file_name}`}
                                                    disabled={!!busy}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="suggestion-image-add-dropzone">
                                    <ImageDropZone
                                        accept={acceptList}
                                        multiple
                                        onSelect={(file) => queueFile(file, null)}
                                        previewSrc={headEntry && !headEntry.memberId ? localPreviewUrl : null}
                                        overlay={newVariantOverlay}
                                        onClear={handleClearQueue}
                                        clearable={newVariantQueueLength > 0 && !busy}
                                        placeholder="Drop image(s) to add variants"
                                        hint="Name each one after upload"
                                        disabled={busy === "submitting"}
                                    />
                                </div>
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

                            {cycleError && (
                                <div className="suggestion-status error">
                                    That grouping loops back on itself — an emote would end up a variant of itself. Pick
                                    a different &quot;Variant of&quot;.
                                </div>
                            )}
                            {missingName && <div className="suggestion-status error">Every emote needs a name.</div>}
                            {!missingName && duplicateNames && (
                                <div className="suggestion-status info">
                                    Two emotes in this set share a name — double-check that&apos;s intended.
                                </div>
                            )}
                            {!editHasMemberChanges && !editHasNewVariants && (
                                <div className="suggestion-status info">
                                    Make a change above (edit a field, drop a new image, or add a variant) to enable
                                    submission.
                                </div>
                            )}
                            {editHasMemberChanges && changedMemberIds.length > 1 && (
                                <div className="suggestion-status info">
                                    This suggestion changes {changedMemberIds.length} emotes in the set.
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="suggestion-status info">
                                You are requesting deletion of <strong>{emote.name}</strong>. Tell the reviewer why.
                                {setMembers.length > 1 && (
                                    <>
                                        {" "}
                                        Only this emote is requested for removal — say so in the reason if the rest of
                                        the set should go too.
                                    </>
                                )}
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
                            <div className="suggestion-image-section">
                                <span className="suggestion-field-label">Current Image</span>
                                <div className="suggestion-image-display compact">
                                    <img src={`${cdn}/${emote.image_id}_p.webp`} alt={`Current ${emote.name}`} />
                                </div>
                            </div>
                        </>
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
                                    disabled={!!busy || (!editHasMemberChanges && !editHasNewVariants)}
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
