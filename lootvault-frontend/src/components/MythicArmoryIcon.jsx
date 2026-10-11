import { useId } from "react";

// Forged steel, ceremonial guards and wrapped grips, with each relic's elemental crest.
export default function MythicArmoryIcon({ item, size = 64 }) {
    const id = useId().replaceAll(":", "");
    const accent = item.color === "currentColor" ? "#bda1ff" : item.color;
    const storm = item.effect === "stormheart";
    const solar = item.effect === "sunbreak";
    const eclipse = item.effect === "eclipse";
    const astral = item.effect === "astral";
    const shield = item.type === "shield";
    const gold = solar ? "#eac46e" : eclipse ? "#b4c6bc" : "#b7a78b";
    const steel = `url(#${id}-steel)`;
    const dark = `url(#${id}-dark)`;
    const trim = `url(#${id}-trim)`;
    const blade = eclipse ? "M43 59 39 19 48 5 60 16 54 28 55 55 49 61Z" : solar ? "M43 60Q35 35 55 5Q57 34 49 60Z" : "M44 60Q42 27 56 5Q53 36 49 60Z";
    return <svg width={size} height={size} viewBox="0 0 96 96" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-mythic-armory={item.effect || item.name}>
        <defs>
            <linearGradient id={`${id}-steel`} x1="0" x2="1"><stop stopColor="#465563"/><stop offset=".35" stopColor="#cad4d9"/><stop offset=".55" stopColor="#f5f7f6"/><stop offset=".7" stopColor="#7a8c99"/><stop offset="1" stopColor="#354451"/></linearGradient>
            <linearGradient id={`${id}-dark`} x1="0" x2="1" y2="1"><stop stopColor="#34424c"/><stop offset=".5" stopColor="#15212b"/><stop offset="1" stopColor="#080e16"/></linearGradient>
            <linearGradient id={`${id}-trim`} x1="0" x2="1"><stop stopColor="#66533a"/><stop offset=".45" stopColor={gold}/><stop offset=".65" stopColor="#fff1c3"/><stop offset="1" stopColor={gold}/></linearGradient>
        </defs>
        <circle cx="48" cy="46" r="34" stroke={accent} strokeWidth=".7" opacity=".25" strokeDasharray={storm ? "3 5" : "18 8"}/>
        {shield ? <>
            <path d="M48 8 80 22 76 58Q68 78 48 90Q28 78 20 58L16 22Z" fill={dark} stroke={gold} strokeWidth="2"/>
            <path d="M48 14 73 26 69 56Q61 73 48 81Q35 73 27 56L23 26Z" fill={steel} stroke="#677c8a"/>
            <path d="M48 19 67 29 63 54Q57 66 48 73Q39 66 33 54L29 29Z" fill={dark} stroke={accent} strokeWidth="1.5"/>
            <path d="M48 14v15M23 26l11 7m39-7-11 7M27 56l10-5m32 5-10-5M48 73v8" stroke={gold} strokeWidth="2"/>
            {[ [24,25],[72,25],[28,56],[68,56],[48,81] ].map(([cx,cy])=><circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" fill={trim} stroke="#18212b" strokeWidth=".5"/>)}
            {astral ? <><path d="m48 30 5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2Z" fill={accent} stroke="#efe9ff"/><circle cx="48" cy="46" r="21" stroke={accent} strokeWidth=".8" strokeDasharray="2 4"/><path d="m40 22 8-5 8 5M36 69l12 5 12-5" stroke={accent}/></> : <><path d="m48 29 13 19-13 19-13-19Z" fill="#130c24" stroke={accent} strokeWidth="2"/><ellipse cx="48" cy="48" rx="21" ry="7" transform="rotate(-30 48 48)" stroke={accent}/><path d="m48 38 6 10-6 10-6-10Z" fill={accent}/></>}
        </> : <g transform="rotate(34 48 48)">
            {/* Lacquered scabbard and steel fittings sit behind the exposed blade. */}
            <path d="M29 23 33 24 34 85 28 85Z" fill={dark} stroke={gold} strokeWidth=".8"/>
            <path d="M28 29h6m-5 46h5m-6 9h6" stroke={trim} strokeWidth="3"/>
            <path d="M31 37q-5 4 0 9t0 9t0 9" stroke={accent} strokeWidth=".8" opacity=".7"/>
            <path d={blade} fill={steel} stroke="#bac6cb" strokeWidth=".8"/>
            <path d={eclipse ? "M48 12 47 57" : "M55 10Q48 34 46 57"} stroke="#fbffff" strokeWidth="1.1"/>
            <path d={solar ? "M48 51q-5-4-1-9t2-10q5 4 1 10t-2 9Z" : eclipse ? "M47 26a7 7 0 1 0 0 14 5 5 0 0 1 0-14Z" : storm ? "m49 25-5 10 6-2-6 15" : "M46 27q-4 4 1 7t0 8t0 8"} stroke={accent} strokeWidth="1.5" fill={solar || eclipse ? accent : "none"}/>
            {solar || eclipse ? <><path d="M34 61q5-8 12 0t15-2M35 61q-10 18 8 21l11-18" stroke={trim} strokeWidth="2.4"/><path d="M39 64q-6 9 3 13" stroke={gold} strokeWidth=".8"/></> : <><ellipse cx="46" cy="62" rx="10" ry="3" fill={trim} stroke={gold}/><path d="M38 63h16" stroke="#fff3c7" strokeWidth=".7"/></>}
            <path d="M42 65h8v20h-8Z" fill={dark} stroke={gold} strokeWidth=".8"/>
            <path d="m43 67 6 3-6 3 6 3-6 3 6 3" stroke={accent} strokeWidth="2"/>
            <path d="M41 66h10m-10 19h10" stroke={trim} strokeWidth="2"/>
            <circle cx="46" cy="62" r="2.3" fill={accent} stroke={gold} strokeWidth=".8"/>
            <path d="M42 86h8l-1 4h-6Z" fill={trim} stroke={gold} strokeWidth=".6"/>
            {storm && <path d="M34 31q-8 0-6 7l6 2m-6-5-3 1m4 2-2 5" stroke={accent} strokeWidth="1.2"/>}
            {solar && <path d="M59 16q9 7 3 18m-24 8q-8-8-2-17" stroke={accent} strokeWidth="1" opacity=".7"/>}
        </g>}
    </svg>;
}
