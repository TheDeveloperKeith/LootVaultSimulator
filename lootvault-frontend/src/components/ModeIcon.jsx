export default function ModeIcon({ mode, size = 58 }) {
    const paths = {
        earn: <><rect x="7" y="6" width="20" height="28" rx="4" transform="rotate(-10 17 20)"/><path d="m15 16 4-5 4 5-4 5Z"/><circle cx="31" cy="29" r="9"/><path d="M31 25v8m-3-6h6m-6 4h6"/></>,
        sandbox: <><path d="m8 24 12-16 12 16-12 8Z"/><path d="m8 24 12-2 12 2M20 8v14m0 0v10"/><path d="M34 7v8m-4-4h8"/></>,
        banners: <><path d="M11 35V6h23l-5 8 5 8H11"/><path d="m21 10 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5Z"/></>,
        crates: <><rect x="7" y="12" width="28" height="23" rx="5"/><path d="m7 20 14 6 14-6M21 26v9M8 13l13-7 13 7"/><path d="M18 18h6"/></>,
        progression: <><rect x="9" y="7" width="25" height="30" rx="5"/><path d="m14 16 2 2 4-4m-6 13 2 2 4-4m5-8h4m-4 11h4M17 7V4h9v3"/></>,
        crafting: <><path d="m8 32 19-19m-6-5 6-5 10 10-5 6Z"/><path d="m9 8 24 24m-3-2 5 5M6 5l8 3-6 6Z"/><path d="M7 37h28"/></>,
    };
    return <svg width={size} height={size} viewBox="0 0 42 42" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3h36v22L21 40 3 25Z" fill="currentColor" fillOpacity=".08"/><path d="M6 6h30M3 30l7 5m22 0 7-5" strokeOpacity=".45"/><g transform="translate(5 4) scale(.76)">{paths[mode] || paths.crates}</g></svg>;
}
