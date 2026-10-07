import { useId } from "react";

export default function OpponentIcon({ name }) {
    const id = useId().replaceAll(":", "");
    return <svg width="44" height="44" viewBox="0 0 48 48" fill="none" role="img" aria-label={`${name} artwork`}>
        <defs>
            <radialGradient id={`${id}-planet`} cx=".3" cy=".25" r=".85"><stop stopColor="#b7f7ef"/><stop offset=".4" stopColor="#49bac5"/><stop offset="1" stopColor="#153d83"/></radialGradient>
            <radialGradient id={`${id}-star`}><stop stopColor="#fffce0"/><stop offset=".4" stopColor="#ffe59c"/><stop offset="1" stopColor="#e391fd" stopOpacity="0"/></radialGradient>
        </defs>
        {name === "Atlas" ? <>
            <circle cx="24" cy="24" r="18" fill={`url(#${id}-planet)`}/>
            <path d="m13 11 8-3 5 3-2 5-6 1-2 6-6-2-1-5Zm13 10 5-2 7 5-2 8-5 6-4-4 1-6-4-3Z" fill="#164d6277"/>
            <path d="m11 14 5-3 4-1" stroke="#d4ffff" strokeWidth="2" strokeLinecap="round" opacity=".7"/>
            <path d="m6 32 4 7m29-29 4 5" stroke="#a9cfff" strokeWidth="1.3" strokeLinecap="round" opacity=".65"/>
        </> : name === "Nova" ? <>
            <circle cx="24" cy="24" r="23" fill={`url(#${id}-star)`}/>
            <path d="m24 4 4 14 16 6-16 4-4 16-5-16-15-4 15-6Z" fill="#ffebb0"/>
            <path d="m24 13 2 9 9 2-9 2-2 9-2-9-9-2 9-2Z" fill="#fff"/>
            <path d="m37 6 1 4 4 1-4 1-1 4-1-4-4-1 4-1ZM9 34l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="#d9bcff"/>
        </> : <>
            <path d="m7 31-3-19 12 8 8-15 8 15 12-8-3 19Z" fill="#bca4eb"/>
            <path d="M9 35h30v5H9Z" fill="#eadcb4"/>
        </>}
    </svg>;
}
