'use client';

import { useRef, useCallback, useMemo, useState } from 'react';
import type { TransitionFix, Direction } from '@/types';
import { getOptionsForRunway, getHighlightedRunways } from '@/lib/utils';

export interface DepartureResultTableProps {
    fix: TransitionFix;
    isOmniFallback: boolean;
}

const DIRECTION_LABELS: Record<Direction, string> = {
    NORTH: 'N',
    SOUTH: 'S',
    MIXED: 'N/S',
};

const DIRECTION_COLORS: Record<Direction, string> = {
    NORTH: 'text-sky-400',
    SOUTH: 'text-orange-400',
    MIXED: 'text-purple-400',
};

const SIDE_COLORS: Record<string, string> = {
    L: 'text-red-400',
    R: 'text-green-400',
};

function RunwayName({ name, className = '' }: { name: string; className?: string }) {
    const match = name.match(/^(\d+)([LRC]?)$/);
    if (!match) return <span className={className}>{name}</span>;
    const [, num, side] = match;
    return (
        <span className={className}>
            {num}
            {side && (
                <span className={`font-black text-lg ${SIDE_COLORS[side] ?? 'text-yellow-400'}`}>
                    {side}
                </span>
            )}
        </span>
    );
}

export default function DepartureResultTable({ fix, isOmniFallback }: DepartureResultTableProps) {
    const sectionRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

    const handleSidClick = useCallback(async (e: React.MouseEvent, sid: string, runway: string) => {
        const route = `${sid}.${fix.name}${runway}`;
        setSelectedRoute(route);
        setCopyStatus('idle');
        setCursorPos({ x: e.clientX, y: e.clientY });
        try {
            await navigator.clipboard.writeText(route);
            setCopyStatus('copied');
            setTimeout(() => { setCopyStatus('idle'); setCursorPos(null); }, 1200);
        } catch {
            try {
                const ta = document.createElement('textarea');
                ta.value = route;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                setCopyStatus('copied');
                setTimeout(() => { setCopyStatus('idle'); setCursorPos(null); }, 1200);
            } catch { /* ignore */ }
        }
    }, [fix.name]);

    const handleCopyRoute = handleSidClick; // kept for compatibility

    const highlightedRunways = useMemo(
        () => new Set(getHighlightedRunways(fix.direction)),
        [fix.direction],
    );

    const runways = useMemo(() => {
        const seen = new Set<string>();
        for (const opt of fix.departureOptions) {
            seen.add(opt.runway);
        }
        return Array.from(seen);
    }, [fix.departureOptions]);

    const setRef = useCallback((runway: string, el: HTMLDivElement | null) => {
        sectionRefs.current.set(runway, el);
    }, []);

    const leftRunways = runways.filter((rwy) => rwy.endsWith('L'));
    const rightRunways = runways.filter((rwy) => rwy.endsWith('R'));

    return (
        <div className="w-full">
            {runways.length === 0 && (
                <p className="text-xs text-zinc-500">Nenhuma opção de saída disponível.</p>
            )}

            <div className="grid grid-cols-2 gap-3">
                {/* Left column — L runways */}
                <div className="flex flex-col gap-1.5">
                    {leftRunways.map((rwy) => {
                        const options = getOptionsForRunway(fix, rwy);
                        const isHighlighted = highlightedRunways.has(rwy);
                        return (
                            <div
                                key={rwy}
                                ref={(el) => setRef(rwy, el)}
                                className={`rounded border p-2 ${isHighlighted
                                    ? 'border-blue-500 bg-blue-950/30'
                                    : 'border-zinc-700 bg-zinc-800/50'
                                    }`}
                            >
                                <h3 className={`mb-1 text-xs font-bold ${isHighlighted ? 'text-blue-300' : 'text-zinc-300'}`}>
                                    <RunwayName name={rwy} />
                                </h3>
                                <ul className="space-y-0.5">
                                    {options.map((opt) => {
                                        const optDir = opt.direction ?? fix.direction;
                                        const route = `${opt.sid}.${fix.name}${rwy}`;
                                        const isSelected = selectedRoute === route;
                                        return (
                                            <li
                                                key={opt.id}
                                                onClick={(e) => handleSidClick(e, opt.sid, rwy)}
                                                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs cursor-pointer transition-colors ${isSelected
                                                    ? 'bg-white/10 ring-1 ring-white'
                                                    : 'text-zinc-300 hover:bg-zinc-700/50'
                                                    }`}
                                            >
                                                <span>{opt.sid}</span>
                                                <span className={`text-[10px] font-medium ${DIRECTION_COLORS[optDir]}`}>
                                                    {DIRECTION_LABELS[optDir]}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* Right column — R runways */}
                <div className="flex flex-col gap-1.5">
                    {rightRunways.map((rwy) => {
                        const options = getOptionsForRunway(fix, rwy);
                        const isHighlighted = highlightedRunways.has(rwy);
                        return (
                            <div
                                key={rwy}
                                ref={(el) => setRef(rwy, el)}
                                className={`rounded border p-2 ${isHighlighted
                                    ? 'border-blue-500 bg-blue-950/30'
                                    : 'border-zinc-700 bg-zinc-800/50'
                                    }`}
                            >
                                <h3 className={`mb-1 text-xs font-bold ${isHighlighted ? 'text-blue-300' : 'text-zinc-300'}`}>
                                    <RunwayName name={rwy} />
                                </h3>
                                <ul className="space-y-0.5">
                                    {options.map((opt) => {
                                        const optDir = opt.direction ?? fix.direction;
                                        const route = `${opt.sid}.${fix.name}${rwy}`;
                                        const isSelected = selectedRoute === route;
                                        return (
                                            <li
                                                key={opt.id}
                                                onClick={(e) => handleSidClick(e, opt.sid, rwy)}
                                                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs cursor-pointer transition-colors ${isSelected
                                                    ? 'bg-white/10 ring-1 ring-white'
                                                    : 'text-zinc-300 hover:bg-zinc-700/50'
                                                    }`}
                                            >
                                                <span>{opt.sid}</span>
                                                <span className={`text-[10px] font-medium ${DIRECTION_COLORS[optDir]}`}>
                                                    {DIRECTION_LABELS[optDir]}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating copy indicator */}
            {copyStatus === 'copied' && cursorPos && (
                <div
                    className="fixed z-50 pointer-events-none animate-fade-up rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg"
                    style={{ left: cursorPos.x + 12, top: cursorPos.y - 20 }}
                >
                    ✓
                </div>
            )}
        </div>
    );
}
