'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store';
import { filterFixNames, resolveFixOrOmni } from '@/lib/utils';
import type { TransitionFix } from '@/types';

export interface FixSearchInputProps {
    onFixSelected: (fix: TransitionFix, isOmniFallback: boolean) => void;
}

export default function FixSearchInput({ onFixSelected }: FixSearchInputProps) {
    const fixMap = useAppStore((s) => s.fixMap);

    const [query, setQuery] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const matches = query ? filterFixNames(fixMap, query) : [];

    const confirmSelection = useCallback(
        (fixName?: string) => {
            if (fixName) {
                const fix = fixMap.get(fixName.toUpperCase());
                if (fix) {
                    setQuery(fix.name);
                    setDropdownOpen(false);
                    setHighlightedIndex(-1);
                    onFixSelected(fix, false);
                    return;
                }
            }
            // No specific fix name or not found — resolve with OMNI fallback
            const result = resolveFixOrOmni(fixMap, query);
            if (result) {
                if (!result.isOmniFallback) {
                    setQuery(result.fix.name);
                }
                setDropdownOpen(false);
                setHighlightedIndex(-1);
                onFixSelected(result.fix, result.isOmniFallback);
            }
        },
        [fixMap, query, onFixSelected],
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setDropdownOpen(value.length > 0);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!dropdownOpen || matches.length === 0) {
            if (e.key === 'Enter' && query.trim()) {
                e.preventDefault();
                confirmSelection();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < matches.length - 1 ? prev + 1 : 0,
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : matches.length - 1,
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < matches.length) {
                    confirmSelection(matches[highlightedIndex]);
                } else {
                    confirmSelection();
                }
                break;
            case 'Escape':
                e.preventDefault();
                setDropdownOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const item = listRef.current.children[highlightedIndex] as HTMLElement;
            if (item && typeof item.scrollIntoView === 'function') {
                item.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                inputRef.current &&
                !inputRef.current.parentElement?.contains(e.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full">
            <label htmlFor="fix-search" className="sr-only">
                Search transition fix
            </label>
            <input
                ref={inputRef}
                id="fix-search"
                type="text"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (query.length > 0) setDropdownOpen(true);
                }}
                placeholder="Type a fix name..."
                className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                role="combobox"
                aria-expanded={dropdownOpen && matches.length > 0}
                aria-controls="fix-search-listbox"
                aria-activedescendant={
                    highlightedIndex >= 0
                        ? `fix-option-${highlightedIndex}`
                        : undefined
                }
                autoComplete="off"
            />

            {dropdownOpen && matches.length > 0 && (
                <ul
                    ref={listRef}
                    id="fix-search-listbox"
                    role="listbox"
                    className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-600 rounded-md shadow-lg"
                >
                    {matches.map((name, idx) => (
                        <li
                            key={name}
                            id={`fix-option-${idx}`}
                            role="option"
                            aria-selected={idx === highlightedIndex}
                            className={`px-3 py-2 text-sm cursor-pointer ${idx === highlightedIndex
                                ? 'bg-blue-600 text-white'
                                : 'text-zinc-200 hover:bg-zinc-700'
                                }`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                confirmSelection(name);
                            }}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                        >
                            {name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
