export default function OpponentIcon({name}) {
 return <svg width="36" height="36" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{name === "Atlas" ? <><circle cx="20" cy="20" r="14"/><ellipse cx="20" cy="20" rx="6" ry="14"/><path d="M6 20h28M9 12h22M9 28h22"/></> : name === "Nova" ? <><path d="m20 3 4 12 13 5-13 4-4 13-5-13-12-4 12-5Z" fill="currentColor" fillOpacity=".2"/><circle cx="20" cy="20" r="5"/><path d="m30 7 3 3M7 30l3 3"/></> : <><path d="m8 27-2-16 9 6 5-10 5 10 9-6-2 16Z"/><path d="M8 32h24"/></>}</svg>;
}
