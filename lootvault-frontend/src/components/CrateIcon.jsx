import { useId } from "react";
const THEMES = { COMMON:['#b7c5d7','#506583'], BASIC:['#9cd9ff','#346fb8'], EXCELLENT:['#d2b6ff','#8151c8'], EXTRA_EXTRAORDINARY:['#ffaaa8','#a22d59'] };
export default function CrateIcon({ code='COMMON', size=80 }) {
    const id=useId();const [light,dark]=THEMES[code] || THEMES.COMMON;
    return <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden="true">
        <defs><linearGradient id={id} x1="20" y1="14" x2="78" y2="82" gradientUnits="userSpaceOnUse"><stop stopColor={light}/><stop offset="1" stopColor={dark}/></linearGradient></defs>
        <ellipse cx="48" cy="83" rx="30" ry="4" fill={dark} opacity=".18"/>
        <path d="M14 32Q14 26 20 24L44 14Q48 12 52 14L76 24Q82 26 82 32V68Q82 74 76 76L52 85Q48 87 44 85L20 76Q14 74 14 68Z" fill={`url(#${id})`} fillOpacity=".18" stroke={`url(#${id})`} strokeWidth="2"/>
        <path d="M15 29 48 42 81 29M48 43V85M24 24 57 37M39 17 72 30" stroke={light} strokeOpacity=".5" strokeWidth="1.5"/>
        <path d="M19 46 37 53M19 54 30 58M58 76 76 69" stroke={light} strokeOpacity=".3" strokeWidth="2" strokeLinecap="round"/>
        <g transform="translate(48 58)" stroke={light} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {code==='COMMON'?<><rect x="-8" y="-7" width="16" height="15" rx="4"/><path d="M-3-7v-4a3 3 0 0 1 6 0v4M0 0v3"/></>:code==='BASIC'?<><path d="M0-12 11-6v9L0 12-11 3v-9Z"/><path d="M-5 0-1 4 6-4"/></>:code==='EXCELLENT'?<><path d="M0-14 5-5 14 0 5 5 0 14-5 5-14 0-5-5Z"/><path d="M0-5v10M-5 0H5"/></>:<><ellipse rx="14" ry="8" transform="rotate(-25)"/><ellipse rx="14" ry="8" transform="rotate(25)"/><path d="M0-8 4 0 0 8-4 0Z" fill={light}/></>}
        </g>
        <path d="M21 32 42 40" stroke="white" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round"/>
    </svg>;
}
