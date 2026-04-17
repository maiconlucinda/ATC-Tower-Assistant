'use client';

import { useRef, useCallback, useMemo } from 'react';
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

    const scrollToRunway = useCallback((runway: string) => {
        const el = sectionRefs.current.get(runway);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, []);

    const setRef = useCallback((runway: string, el: HTMLDivElement | null) => {
        sectionRefs.current.set(runway, el);
    }, []);

    return (
        <div className="w-full">
            {/* Fix header */}
            <div className="mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-zinc-100">{fix.name}</span>
                    <span className={`text-sm font-medium ${DIRECTION_COLORS[fix.direction]}`}>
                        ({fix.direction})
                    </span>
                </div>
            </div>

            {/* OMNI fallback banner */}
            {isOmniFallback && (
                <div className="mb-3 rounded-md border border-amber-600 bg-amber-900/40 px-3 py-2 text-sm text-amber-300">
                    OMNI fallback — fixo não encontrado
                </div>
            )}

            {/* Runway quick-nav buttons */}
            {runways.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {runways.map((rwy) => {
                        const isHighlighted = highlightedRunways.has(rwy);
                        return (
                            <button
                                key={rwy}
                                onClick={() => scrollToRunway(rwy)}
                                className={`rounded px-3 py-1.5 text-sm font-semibold transition-colors ${isHighlighted
                                    ? 'bg-blue-600 text-white hover:bg-blue-500 border border-blue-400'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-600'
                                    }`}
                            >
                                <RunwayName name={rwy} />
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Runway sections */}
            {runways.length === 0 && (
                <p className="text-sm text-zinc-500">Nenhuma opção de saída disponível.</p>
            )}

            {runways.map((rwy) => {
                const options = getOptionsForRunway(fix, rwy);
                const isHighlighted = highlightedRunways.has(rwy);

                return (
                    <div
                        key={rwy}
                        ref={(el) => setRef(rwy, el)}
                        className={`mb-3 rounded-md border p-3 ${isHighlighted
                            ? 'border-blue-500 bg-blue-950/30'
                            : 'border-zinc-700 bg-zinc-800/50'
                            }`}
                    >
                        <h3
                            className={`mb-2 text-base font-bold ${isHighlighted ? 'text-blue-300' : 'text-zinc-300'
                                }`}
                        >
                            Pista <RunwayName name={rwy} />
                        </h3>

                        <ul className="space-y-1">
                            {options.map((opt, idx) => {
                                const isPreferred = idx === 0;
                                const optDir = opt.direction ?? fix.direction;
                                return (
                                    <li
                                        key={opt.id}
                                        className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${isPreferred
                                            ? 'bg-emerald-900/40 text-emerald-200 font-bold'
                                            : 'text-zinc-300'
                                            }`}
                                    >
                                        {isPreferred && (
                                            <span className="text-emerald-400" aria-label="Preferred SID">★</span>
                                        )}
                                        <span>{opt.sid}</span>
                                        <span className={`text-xs font-medium ${DIRECTION_COLORS[optDir]}`}>
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
    );
}
