'use client';

import { useState, useRef, useEffect } from 'react';
import { searchIcao, type AirportInfo } from '@/lib/icao';

export default function IcaoSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<AirportInfo[]>([]);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleChange = (v: string) => {
        setQuery(v);
        if (v.length >= 2) {
            setResults(searchIcao(v, 8));
            setOpen(true);
        } else {
            setResults([]);
            setOpen(false);
        }
    };

    return (
        <div ref={ref} className="relative">
            <input
                type="text"
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                onFocus={() => { if (results.length > 0) setOpen(true); }}
                placeholder="ICAO..."
                className="bg-zinc-800 border border-zinc-600 rounded px-1.5 py-0.5 text-[10px] text-zinc-100 w-20 focus:outline-none focus:border-blue-500 placeholder-zinc-500"
                aria-label="Busca ICAO"
            />
            {open && results.length > 0 && (
                <ul className="absolute z-20 mt-0.5 left-0 w-64 max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded shadow-lg">
                    {results.map((ap) => (
                        <li key={ap.icao} className="px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-700 cursor-default">
                            <span className="font-bold text-blue-400">{ap.icao}</span>
                            <span className="text-zinc-400 ml-1">{ap.name}</span>
                            {ap.city && <span className="text-zinc-500 ml-1">· {ap.city}</span>}
                            <span className="text-zinc-600 ml-1">{ap.country}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
