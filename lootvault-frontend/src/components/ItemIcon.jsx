import { resolveItemDesign } from "../items/designs";
export default function ItemIcon({ name = "", type, size = 40 }) {
    const item = resolveItemDesign(name, type);
    return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={item.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {item.type === "sword" ? <g transform="rotate(35 32 32)">
            {item.design === "block" ? <><path d="M27 6h10v34H27Z" fill={item.color} fillOpacity=".2"/><path d="M30 10h4v24h-4Z" fill={item.color} fillOpacity=".4"/><path d="M22 38h20v6H22Z" fill={item.color} fillOpacity=".35"/></>
                : item.design === "cleaver" ? <><path d="M25 40V13L39 3l5 5-6 33Z" fill="#151421"/><path d="M39 3 35 36" strokeWidth="3"/><path d="M23 41h18"/></>
                : <><path d="M29 41c-1-15 1-29 9-37 2 15-2 27-3 37Z" fill={item.color} fillOpacity=".14"/><path d="M38 4c0 16-5 26-6 35" opacity=".7"/><path d="M22 42c4-5 16-5 20 0l-2 3H24Z" fill={item.color} fillOpacity=".3"/></>}
            <path d="M29 45h6v12h-6Z" fill="#212332"/><path d="m29 47 6 3-6 3 6 3"/><path d="M28 58h8" strokeWidth="3"/>
            {item.design === "flame" && <path d="M24 31c-8-6 3-12 1-21 6 5 1 12 2 15M39 32c7-6 1-8 7-14" opacity=".7"/>}
            {item.design === "petal" && <><path d="M21 13c-5 0-4 6 0 7 4-1 5-5 0-7ZM43 27c-5 0-4 6 0 7 4-1 5-5 0-7Z" fill={item.color} fillOpacity=".3"/><path d="M34 57c9 0 5-8 10-8"/></>}
            {item.design === "katana" && <path d="M35 57c7 2 2 5 8 4"/>}
        </g> : item.type === "shield" ? <>
            <path d={item.design === "square" ? "M13 9h38v32L32 56 13 41Z" : item.design === "moon" ? "M32 5 51 14 48 37 32 59 16 37 13 14Z" : "M32 5 52 13v18c0 13-9 23-20 28-11-5-20-15-20-28V13Z"} fill={item.color} fillOpacity=".12"/>
            <path d="M32 11v41M20 18h24" opacity=".35"/>
            {item.design === "square" ? <><path d="M24 24h16v16H24Z" fill={item.color} fillOpacity=".25"/><path d="M18 14h2m24 0h2M18 38h2m24 0h2" strokeWidth="3"/></>
                : item.design === "moon" ? <path d="M36 21c-14-2-17 20-3 22 5 1 8-2 9-5-13 2-16-12-6-17Z" fill={item.color} fillOpacity=".35"/>
                : item.design === "sun" ? <><circle cx="32" cy="31" r="7" fill={item.color} fillOpacity=".25"/><path d="M32 18v3m0 20v3m-13-13h3m20 0h3M23 22l2 2m14 14 2 2m0-18-2 2M25 38l-2 2"/></>
                : item.design === "serpent" ? <path d="M24 40c16 5 18-8 6-10-11-2-7-14 6-11l5 5-7 1" strokeWidth="3"/>
                : <path d="m32 21 9 11-9 11-9-11Z" fill={item.color} fillOpacity=".3"/>}
        </> : item.type === "ring" ? <><circle cx="32" cy="37" r="17"/><path d="m32 7 12 12-12 11-12-11Z" fill={item.color} fillOpacity=".2"/></> : <><path d="m22 8 10 6 10-6 12 12-7 8-4-4v31H21V24l-4 4-7-8Z" fill={item.color} fillOpacity=".15"/><path d="M25 24h14M25 33h14M25 42h14"/></>}
    </svg>;
}
