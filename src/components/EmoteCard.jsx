import { Link } from "react-router-dom";
import { cdn } from "../config";

/**
 * @typedef {import("../store/types").EmoteData} EmoteData
 */

/**
 * EmoteCard component for displaying an Emote.
 *
 * @param {Object} props
 * @param {EmoteData} props.emote
 */
export default function EmoteCard({ emote }) {
    const imageUrl = `${cdn}/${emote.image_id}_t.webp`;

    return (
        <Link to={`/view/${emote.emote_id}`} className="doki-card glass-panel">
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
        </Link>
    );
}
