// Each named relic has its own silhouette, guard, crest and material details.
export default function RelicIcon({ item, size }) {
    const name=item.name;
    const sword=item.type==='sword';
    const blade={
        'Wintermoon Katana':'M30 40 31 12 37 3 36 39Z',
        'Emberbreath Saber':'M28 40 25 30 30 25 27 18 34 12 34 5 41 13 37 23 39 30 34 40Z',
        'Petalstorm Katana':'M30 40Q27 16 40 3Q40 25 34 40Z',
        'Eclipse Cleaver':'M23 39 22 14 38 3 44 8 39 35 33 40Z',
        'Dawncrest Saber':'M29 39 27 14 32 2 37 14 35 39Z',
        'Crimson Veil Katana':'M29 40 29 13 37 2 35 38 32 30 32 40Z'
    }[name];
    return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke={item.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {sword?<g transform={`rotate(${name==='Eclipse Cleaver'?25:35} 32 32)`}>
            <path d={blade} fill={name==='Eclipse Cleaver'||name==='Crimson Veil Katana'?'#171320':item.color} fillOpacity={name==='Eclipse Cleaver'||name==='Crimson Veil Katana'?1:.28}/>
            <path d="M32 45v12" strokeWidth="5"/><path d="M29 47 35 50 29 53 35 56" stroke="#141725"/>
            {name==='Wintermoon Katana'&&<><path d="m32 15 5 5-5 5 4 5M21 41l7-5 4 4 4-4 7 5M26 59h12"/><path d="M17 18v8m-4-4h8m-7-3 6 6m0-6-6 6" opacity=".7"/></>}
            {name==='Emberbreath Saber'&&<><path d="M22 43 25 36 32 41 39 36 42 43Z" fill={item.color} fillOpacity=".5"/><path d="M19 30c-6-8 4-10 1-17 6 5 1 9 4 11M43 29c7-6 1-9 6-15"/><path d="M28 59h8" strokeWidth="3"/></>}
            {name==='Petalstorm Katana'&&<><path d="M32 41c-14-12-16 9 0 2-5 15 13 11 2-1 15 4 14-12-2-1Z" fill={item.color} fillOpacity=".25"/><path d="M18 12q-8-1-4 7 7 0 4-7ZM46 25q-7-2-4 6 7 1 4-6ZM34 57q12 4 10-5"/></>}
            {name==='Eclipse Cleaver'&&<><path d="M37 7 32 34" strokeWidth="3"/><path d="M22 42h19M27 57h10" strokeWidth="3"/><path d="M37 57q11 0 11-9"/><circle cx="48" cy="45" r="3"/><circle cx="48" cy="38" r="3"/><path d="M27 17 32 14"/></>}
            {name==='Dawncrest Saber'&&<><path d="M19 39 25 44 32 40 39 44 45 39M32 9v25"/><circle cx="32" cy="42" r="4" fill={item.color} fillOpacity=".4"/><path d="M17 15v-4m30 4v-4M32 58l-4 3h8Z"/></>}
            {name==='Crimson Veil Katana'&&<><path d="M35 9 32 24M32 15l-3 4m3 5 3 3" strokeWidth="2.5"/><path d="M23 41h18v4H23Z" fill={item.color} fillOpacity=".6"/><path d="M35 57c17 0 3-13 15-15M35 59c15 6 8-2 19-1"/><path d="M19 12 15 9M44 21l5-3"/></>}
        </g>:<>
            <path d={name==='Wintermoon Shield'?'M32 4 49 13 47 36 32 58 17 36 15 13Z':name==='Serpentseal Guard'?'M32 4 51 12 48 40 32 59 16 40 13 12Z':name==='Dawncrest Aegis'?'M32 4 52 15 48 38 39 53 32 59 25 53 16 38 12 15Z':'M32 3 51 13 48 42 32 60 16 42 13 13Z'} fill={item.color} fillOpacity=".14"/>
            {name==='Wintermoon Shield'&&<><path d="M37 16c-15-1-20 23-4 29 5 1 10-2 11-6-16 2-19-13-7-23Z" fill={item.color} fillOpacity=".5"/><path d="M22 13v7m-4-3h8M29 49l3 4 3-4"/></>}
            {name==='Serpentseal Guard'&&<><path d="M23 43c20 9 26-15 8-15-15 0-10-17 5-13l7 8-11-2M22 43l5-6M33 36l9 3" strokeWidth="3"/><circle cx="37" cy="18" r="1" fill={item.color}/><path d="M19 12l-2 20m30-20 2 20" opacity=".4"/></>}
            {name==='Dawncrest Aegis'&&<><circle cx="32" cy="30" r="8" fill={item.color} fillOpacity=".4"/><path d="M32 15v4m0 22v5M17 30h4m22 0h4M21 19l4 4m14 14 4 4m0-22-4 4m-14 14-4 4M25 49l7 5 7-5" strokeWidth="2.5"/></>}
            {name==='Voidseal Aegis'&&<><path d="m32 13 12 18-12 18-12-18Z" fill="#181126"/><ellipse cx="32" cy="31" rx="15" ry="6" transform="rotate(-30 32 31)"/><path d="M28 28l4-5 4 8-4 8-4-5M19 18l-2 4m30 20-2 4M30 53h4"/><circle cx="32" cy="31" r="2" fill={item.color}/></>}
        </>}
    </svg>;
}
