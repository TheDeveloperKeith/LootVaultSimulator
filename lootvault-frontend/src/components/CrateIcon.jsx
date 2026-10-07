import { useId } from "react";
const THEMES = {
 COMMON: ["#c4d0d5", "#64727e", 0], BASIC: ["#9cd9ff", "#346fb8", 1],
 EXCELLENT: ["#d2b6ff", "#8151c8", 2], EXOTIC: ["#9ff3d2", "#249875", 3],
 EXTRAORDINARY: ["#fff0ac", "#c68a38", 4], EXTRA_EXTRAORDINARY: ["#ffc2dd", "#a12d64", 5],
};
export default function CrateIcon({ code = "COMMON", size = 80 }) {
 const id = useId(); const [light, dark, tier] = THEMES[code] || THEMES.COMMON;
 return <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden="true">
  <defs><linearGradient id={id} x1="20" y1="10" x2="75" y2="85" gradientUnits="userSpaceOnUse"><stop stopColor={light}/><stop offset="1" stopColor={dark}/></linearGradient></defs>
  {tier > 1 && <circle cx="48" cy="48" r="39" stroke={light} opacity=".3" strokeDasharray={tier > 3 ? "3 6" : "50 12"}/>}
  {tier > 2 && <><path d="M10 64 4 38 22 48M86 64 92 38 74 48" fill={dark} stroke={light} opacity=".7"/><path d="M18 73 11 56 29 62M78 73 85 56 67 62" stroke={light} strokeWidth="2"/></>}
  <path d="M48 12 58 35 84 38 64 55 70 81 48 67 26 81 32 55 12 38 38 35Z" fill={`url(#${id})`} stroke={light} strokeWidth={tier ? 2 : 1}/>
  <path d="M48 12V48L12 38M48 48 70 81M48 48 26 81M48 48 84 38" stroke="#fff" opacity=".22"/>
  {tier > 0 && <path d="M48 29 54 43 68 45 57 55 60 68 48 60 36 68 39 55 28 45 42 43Z" fill="#0d1523" fillOpacity=".45" stroke={light}/>}
  {tier > 3 && <path d="M36 12 39 5 48 10 57 5 60 12M41 88H55" stroke={light} strokeWidth="2"/>}
  {tier === 5 && <><ellipse cx="48" cy="48" rx="44" ry="17" transform="rotate(-30 48 48)" stroke={light}/><path d="M48 36 53 48 48 60 43 48Z" fill="#fff5fc"/><path d="M80 8 82 14 88 16 82 18 80 24 78 18 72 16 78 14Z" fill={light}/></>}
 </svg>;
}
