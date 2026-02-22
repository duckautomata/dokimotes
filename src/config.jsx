export const cdn = "https://content.duck-automata.com/dokimotes";
export const new_emoji_form = "https://docs.google.com/forms/d/e/1FAIpQLSfiXrRDeaorF4lXnVabic_foh1lejiVOfJXEqQYD-ujzMehJA/viewform?usp=dialog";
export const suggestion_form = "https://docs.google.com/forms/d/e/1FAIpQLScmOkrLqj1TTyys4TeZQeDahvPBkE6G_0Hddzct0hF7A8roFA/viewform?usp=dialog";

export const edit_emote_form = (emote_id, name, artist, credits, emote_type, source, tags) => {
    return `https://docs.google.com/forms/d/e/1FAIpQLSf_gtc9wDrZBojisaifppaOXE6wTuEWQdip3l4LaCMJMGusog/viewform?usp=pp_url&entry.1547084858=${encodeURIComponent(name)}&entry.666396598=${encodeURIComponent(artist)}&entry.1767201088=${encodeURIComponent(credits)}&entry.770719207=${encodeURIComponent(emote_type)}&entry.1997731597=${encodeURIComponent(source)}&entry.1941144467=${encodeURIComponent(tags)}&entry.869760669=${encodeURIComponent(emote_id)}`;
}
