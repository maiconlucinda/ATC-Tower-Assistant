'use client';

import { useRef } from 'react';
import { useAppStore } from '@/store';

export default function PhraseSearchInput() {
    const phraseSearchQuery = useAppStore((s) => s.phraseSearchQuery);
    const setPhraseSearchQuery = useAppStore((s) => s.setPhraseSearchQuery);
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="relative w-full">
            <label htmlFor="phrase-search" className="sr-only">
                Search phrases
            </label>
            <input
                ref={inputRef}
                id="phrase-search"
                type="text"
                value={phraseSearchQuery}
                onChange={(e) => setPhraseSearchQuery(e.target.value)}
                placeholder="Search phrases..."
                className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 pr-8"
                autoComplete="off"
            />
            {phraseSearchQuery && (
                <button
                    type="button"
                    onClick={() => {
                        setPhraseSearchQuery('');
                        inputRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-sm leading-none"
                    aria-label="Clear search"
                >
                    ✕
                </button>
            )}
        </div>
    );
}
