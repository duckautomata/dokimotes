import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { renderTextWithLinks } from "../utils/textUtils";
import { cdn } from "../config";
import "./View.css";
import { LOG_ERROR } from "../utils/debug";

/**
 * @typedef {import("../store/types").EmoteData} EmoteData
 */

/**
 * @param {Object} props
 * @param {EmoteData[]} props.data
 */
export default function View({ data }) {
    const { emote_id } = useParams();
    const emote = data.find((e) => e.emote_id === emote_id);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedImage, setCopiedImage] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [fileSize, setFileSize] = useState(null);
    const [dimensions, setDimensions] = useState(null);

    useEffect(() => {
        if (!emote) return;

        const urlOrig = `${cdn}/${emote.image_id}${emote.image_ext}`;
        let isMounted = true;
        const fetchSize = async () => {
            try {
                const response = await fetch(urlOrig, { method: "HEAD" });
                const contentLength = response.headers.get("content-length");
                if (contentLength && isMounted) {
                    const size = parseInt(contentLength, 10);
                    if (size > 1024 * 1024) {
                        setFileSize((size / (1024 * 1024)).toFixed(2) + " MB");
                    } else if (size > 1024) {
                        setFileSize((size / 1024).toFixed(2) + " KB");
                    } else {
                        setFileSize(size + " B");
                    }
                }
            } catch (e) {
                LOG_ERROR("Failed to fetch file size:", e);
            }
        };

        fetchSize();

        return () => {
            isMounted = false;
            setFileSize(null);
            setDimensions(null);
        };
    }, [emote]);

    const handleImageLoad = (e) => {
        setDimensions(`${e.target.naturalWidth} × ${e.target.naturalHeight}`);
    };

    if (!emote)
        return (
            <div className="view-not-found">
                <h2>Emote not found</h2>
                <Link to="/" className="back-link">
                    Return Home
                </Link>
            </div>
        );

    const imageUrl = `${cdn}/${emote.image_id}_p.webp`;
    const imageUrlOrig = `${cdn}/${emote.image_id}${emote.image_ext}`;
    const editUrl = `/edit/${emote.emote_id}`;

    const handleCopyImage = async () => {
        try {
            if (!navigator.clipboard || !window.ClipboardItem) {
                setErrorMsg("Copying images is not supported in your browser.");
                setTimeout(() => setErrorMsg(""), 3000);
                return;
            }

            const response = await fetch(imageUrl);
            const blob = await response.blob();

            let clipboardBlob = blob;

            // The Clipboard API mainly supports image/png.
            // Convert non-PNG images to PNG using a canvas.
            if (blob.type !== "image/png") {
                clipboardBlob = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        URL.revokeObjectURL(img.src);
                        const canvas = document.createElement("canvas");
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob((b) => {
                            if (b) {
                                resolve(b);
                            } else {
                                reject(new Error("Canvas toBlob failed"));
                            }
                        }, "image/png");
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(img.src);
                        reject(new Error("Image failed to load for conversion"));
                    };
                    img.src = URL.createObjectURL(blob);
                });
            }

            const item = new ClipboardItem({ [clipboardBlob.type]: clipboardBlob });
            await navigator.clipboard.write([item]);
            setCopiedImage(true);
            setTimeout(() => setCopiedImage(false), 2000);
        } catch (err) {
            LOG_ERROR("Failed to copy image:", err);
            setErrorMsg(
                "Failed to copy image. Your browser might block cross-origin copying, or the image format might not be supported.",
            );
            setTimeout(() => setErrorMsg(""), 3000);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(imageUrl);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (err) {
            LOG_ERROR("Failed to copy link:", err);
        }
    };

    const handleDownload = () => {
        const link = document.createElement("a");
        const fileName = `${emote.name}${emote.image_ext}`;
        link.href = `${imageUrlOrig}?download=true&name=${encodeURIComponent(fileName)}`;
        link.download = fileName;
        link.click();
    };

    return (
        <div className="view-container">
            {errorMsg && <div className="modal-error-popup">{errorMsg}</div>}
            <div className="view-emote-card glass-panel">
                <div className="emote-image-container">
                    <img src={imageUrl} alt={emote.name} className="centered-emote-image" onLoad={handleImageLoad} />
                    {emote.image_ext === ".mp4" && <div className="video-indicator"></div>}
                </div>

                <div className="emote-details">
                    <Link to="/" className="back-link">
                        <span className="back-arrow">←</span> Back to Gallery
                    </Link>
                    <h1 className="hero-title">{emote.name}</h1>
                    {emote.artist && (
                        <p className="hero-artist">
                            Created by <span>{renderTextWithLinks(emote.artist)}</span>
                        </p>
                    )}

                    <div className="hero-meta">
                        {emote.credit && (
                            <div className="meta-item">
                                <span className="meta-label">Credit</span>
                                <span className="meta-value">{renderTextWithLinks(emote.credit)}</span>
                            </div>
                        )}
                        {emote.type && (
                            <div className="meta-item">
                                <span className="meta-label">Type</span>
                                <span className="meta-value">
                                    {emote.type.charAt(0).toUpperCase() + emote.type.slice(1)}
                                </span>
                            </div>
                        )}
                        {emote.source && (
                            <div className="meta-item">
                                <span className="meta-label">Source</span>
                                <span className="meta-value">
                                    {emote.source.charAt(0).toUpperCase() + emote.source.slice(1)}
                                </span>
                            </div>
                        )}
                        {dimensions && (
                            <div className="meta-item">
                                <span className="meta-label">Dimensions</span>
                                <span className="meta-value">{dimensions}</span>
                            </div>
                        )}
                        {fileSize && (
                            <div className="meta-item">
                                <span className="meta-label">Size</span>
                                <span className="meta-value">{fileSize}</span>
                            </div>
                        )}
                        {emote.image_ext && (
                            <div className="meta-item">
                                <span className="meta-label">Original Format</span>
                                <span className="meta-value">{emote.image_ext.replace(".", "").toUpperCase()}</span>
                            </div>
                        )}
                    </div>

                    {emote.tags && emote.tags.length > 0 && (
                        <div className="hero-tags">
                            {emote.tags.map((tag) => (
                                <span key={tag} className="tag-pill">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="emote-action-buttons">
                    {emote.type !== "animated" && (
                        <button className="primary-btn" onClick={handleCopyImage}>
                            {copiedImage ? "Copied!" : "Copy Image"}
                        </button>
                    )}
                    <button className="secondary-btn" onClick={handleCopyLink}>
                        {copiedLink ? "Copied!" : "Copy Link"}
                    </button>
                    <button className="secondary-btn" onClick={handleDownload}>
                        Download Image
                    </button>
                </div>
            </div>

            <div className="view-actions">
                <Link to={editUrl} className="edit-doki-btn">
                    <span>✎ Suggest Edit</span>
                </Link>
            </div>
        </div>
    );
}
