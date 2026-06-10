import { Link } from "react-router-dom";
import { cdn } from "../config";

/**
 * @typedef {import("../store/types").EmoteData} EmoteData
 */

/**
 * EmoteCard component for displaying an Emote.
 *
 * @param {Object} props
 * @param {EmoteData} props.emote the emote to show (the group's primary, when grouped)
 * @param {number} [props.variantCount] total emotes in this variant group; 1 (default) renders a plain card
 */
export default function EmoteCard({ emote, variantCount = 1 }) {
    const imageUrl = `${cdn}/${emote.image_id}_t.webp`;
    const isGroup = variantCount > 1;

    return (
        <Link to={`/view/${emote.emote_id}`} className={`doki-card glass-panel${isGroup ? " doki-card-group" : ""}`}>
            <div className="doki-card-image-container">
                <img
                    src={imageUrl}
                    alt={emote.name}
                    className="doki-card-image"
                    loading="lazy"
                    onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling?.classList.contains("video-indicator")) {
                            e.target.nextSibling.style.display = "none";
                        }
                        const placeholder = e.target.parentElement.querySelector(".doki-card-placeholder");
                        if (placeholder) placeholder.style.display = "flex";
                    }}
                />
                {emote.image_ext === ".mp4" && <div className="video-indicator"></div>}

                <div className="doki-card-placeholder" style={{ display: "none" }}>
                    <span className="placeholder-text">{emote.name ? emote.name.charAt(0) : "?"}</span>
                </div>
            </div>

            {isGroup && (
                <span className="doki-card-variant-badge" title={`${variantCount} variants in this set`}>
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <rect x="3" y="3" width="13" height="13" rx="2"></rect>
                        <path d="M9 17h8a2 2 0 0 0 2-2V7"></path>
                    </svg>
                    {variantCount}
                </span>
            )}
        </Link>
    );
}
