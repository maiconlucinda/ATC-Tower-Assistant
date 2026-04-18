'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/store';
import { substituteGlobalVariables } from '@/lib/utils';
import type { PhraseEntry } from '@/types';

/** Segment types for parsed content */
type Segment =
    | { type: 'text'; value: string }
    | { type: 'resolved'; varName: string; value: string }
    | { type: 'unresolved'; token: string }
    | { type: 'dynamic'; token: string }
    | { type: 'blank'; length: number };

/**
 * Parse content into segments distinguishing plain text,
 * resolved global variables, unresolved global variables, dynamic placeholders,
 * and blank fields (3+ underscores).
 */
export function parseContentSegments(
    content: string,
    globalVarsMap: Map<string, string>
): Segment[] {
    const segments: Segment[] = [];
    // Match {tokens} and ___ (3+ underscores)
    const regex = /\{([^}]+)\}|_{3,}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
        }

        if (match[0].startsWith('{')) {
            // Token match
            const key = match[1];
            if (globalVarsMap.has(key)) {
                const value = globalVarsMap.get(key)!;
                if (value) {
                    segments.push({ type: 'resolved', varName: key, value });
                } else {
                    segments.push({ type: 'unresolved', token: match[0] });
                }
            } else {
                segments.push({ type: 'dynamic', token: match[0] });
            }
        } else {
            // Underscore blank match
            segments.push({ type: 'blank', length: match[0].length });
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
        segments.push({ type: 'text', value: content.slice(lastIndex) });
    }

    return segments;
}

/** Render parsed segments with visual distinction */
function RenderedContent({ content, globalVarsMap }: { content: string; globalVarsMap: Map<string, string> }) {
    const segments = parseContentSegments(content, globalVarsMap);

    return (
        <span>
            {segments.map((seg, i) => {
                switch (seg.type) {
                    case 'text':
                        return <span key={i}>{seg.value}</span>;
                    case 'resolved':
                        return (
                            <span
                                key={i}
                                className="text-green-300"
                                title={`{${seg.varName}} → ${seg.value}`}
                            >
                                {seg.value}
                            </span>
                        );
                    case 'unresolved':
                        return (
                            <span
                                key={i}
                                className="bg-orange-700/60 text-orange-200 rounded px-0.5"
                                title="Unresolved global variable"
                            >
                                {seg.token}
                            </span>
                        );
                    case 'dynamic':
                        return (
                            <span
                                key={i}
                                className="bg-cyan-800/60 text-cyan-200 rounded px-0.5"
                                title="Dynamic placeholder"
                            >
                                {seg.token}
                            </span>
                        );
                    case 'blank':
                        return (
                            <span
                                key={i}
                                className="inline-block border-b-2 border-zinc-400 mx-0.5"
                                style={{ minWidth: `${Math.max(seg.length * 0.5, 2)}em` }}
                                title="Preencher manualmente"
                            >
                                &nbsp;
                            </span>
                        );
                }
            })}
        </span>
    );
}

/** Copy button with clipboard API + fallback */
function CopyButton({ text, label }: { text: string; label: string }) {
    const [status, setStatus] = useState<'idle' | 'copied' | 'fallback'>('idle');

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(text);
            setStatus('copied');
            setTimeout(() => setStatus('idle'), 1500);
        } catch {
            // Fallback: prompt user to copy manually
            setStatus('fallback');
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                setStatus('copied');
                setTimeout(() => setStatus('idle'), 1500);
            } catch {
                setTimeout(() => setStatus('idle'), 3000);
            }
        }
    }, [text]);

    return (
        <button
            onClick={handleCopy}
            className="ml-2 px-2 py-0.5 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors shrink-0"
            aria-label={`Copy ${label}`}
        >
            {status === 'copied' ? '✓' : status === 'fallback' ? 'Copy manually' : 'Copy'}
        </button>
    );
}

interface PhraseEntryListProps {
    entries: PhraseEntry[];
}

export default function PhraseEntryList({ entries }: PhraseEntryListProps) {
    const globalVariables = useAppStore((s) => s.globalVariables);

    // Build Map<string, string> for substitution (name → value)
    const globalVarsMap = new Map<string, string>();
    for (const v of globalVariables) {
        globalVarsMap.set(v.name, v.value);
    }

    // Sort entries by sortOrder
    const sorted = [...entries].sort((a, b) => a.sortOrder - b.sortOrder);

    if (sorted.length === 0) {
        return (
            <p className="text-zinc-500 text-sm italic">No phrases to display.</p>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {sorted.map((entry) => {
                const hasPtBr = !!entry.contentPtBr;
                const hasEn = !!entry.contentEn;
                const hasTitle = !!entry.title;
                const hasNotes = !!entry.notes;

                const copyTextPtBr = hasPtBr
                    ? substituteGlobalVariables(entry.contentPtBr, globalVarsMap)
                    : '';
                const copyTextEn = hasEn
                    ? substituteGlobalVariables(entry.contentEn, globalVarsMap)
                    : '';

                return (
                    <div
                        key={entry.id}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg p-3"
                    >
                        {hasTitle && (
                            <h3 className="text-sm font-semibold text-zinc-100 mb-2">
                                {entry.title}
                            </h3>
                        )}

                        {hasPtBr && (
                            <div className="flex items-start gap-2 mb-2 bg-zinc-900/50 rounded-md p-2 border-l-2 border-green-600">
                                <span className="shrink-0 mt-0.5 text-base leading-none" aria-label="Português">🇧🇷</span>
                                <p className="text-base text-zinc-200 flex-1 break-words whitespace-pre-wrap font-mono">
                                    <RenderedContent
                                        content={entry.contentPtBr}
                                        globalVarsMap={globalVarsMap}
                                    />
                                </p>
                                <CopyButton text={copyTextPtBr} label="pt-BR" />
                            </div>
                        )}

                        {hasEn && (
                            <div className="flex items-start gap-2 bg-zinc-900/50 rounded-md p-2 border-l-2 border-blue-500">
                                <span className="shrink-0 mt-0.5 text-base leading-none" aria-label="English">🇺🇸</span>
                                <p className="text-base text-zinc-200 flex-1 break-words whitespace-pre-wrap font-mono">
                                    <RenderedContent
                                        content={entry.contentEn}
                                        globalVarsMap={globalVarsMap}
                                    />
                                </p>
                                <CopyButton text={copyTextEn} label="en" />
                            </div>
                        )}

                        {hasNotes && (
                            <p className="text-xs text-zinc-500 italic mt-2">
                                {entry.notes}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
