'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import type { PhraseEntry } from '@/types';

function PhraseEntryRow({
    entry,
    index,
    total,
    onMoveUp,
    onMoveDown,
}: {
    entry: PhraseEntry;
    index: number;
    total: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {
    const updatePhraseEntry = useAppStore((s) => s.updatePhraseEntry);
    const deletePhraseEntry = useAppStore((s) => s.deletePhraseEntry);

    return (
        <div className="p-2.5 bg-zinc-800 rounded border border-zinc-700 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
                <input
                    type="text"
                    value={entry.title ?? ''}
                    onChange={(e) => updatePhraseEntry(entry.id, { title: e.target.value || undefined })}
                    placeholder="Title (optional)"
                    className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 flex-1 min-w-0 focus:outline-none focus:border-blue-500"
                    aria-label="Phrase title"
                />
                <button
                    onClick={onMoveUp}
                    disabled={index === 0}
                    className="text-zinc-400 hover:text-zinc-200 text-xs px-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move phrase up"
                >
                    ▲
                </button>
                <button
                    onClick={onMoveDown}
                    disabled={index >= total - 1}
                    className="text-zinc-400 hover:text-zinc-200 text-xs px-1 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move phrase down"
                >
                    ▼
                </button>
                <button
                    onClick={() => deletePhraseEntry(entry.id)}
                    className="text-red-400 hover:text-red-300 text-xs px-1"
                    aria-label="Delete phrase"
                >
                    ✕
                </button>
            </div>
            <div className="flex items-start gap-1.5">
                <span className="text-xs text-zinc-400 mt-1.5 shrink-0 w-10">pt-BR</span>
                <textarea
                    value={entry.contentPtBr}
                    onChange={(e) => updatePhraseEntry(entry.id, { contentPtBr: e.target.value })}
                    rows={2}
                    className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 flex-1 min-w-0 resize-y focus:outline-none focus:border-blue-500"
                    aria-label="Portuguese content"
                />
            </div>
            <div className="flex items-start gap-1.5">
                <span className="text-xs text-zinc-400 mt-1.5 shrink-0 w-10">en</span>
                <textarea
                    value={entry.contentEn}
                    onChange={(e) => updatePhraseEntry(entry.id, { contentEn: e.target.value })}
                    rows={2}
                    className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 flex-1 min-w-0 resize-y focus:outline-none focus:border-blue-500"
                    aria-label="English content"
                />
            </div>
            <div className="flex items-start gap-1.5">
                <span className="text-xs text-zinc-400 mt-1.5 shrink-0 w-10">Notes</span>
                <input
                    type="text"
                    value={entry.notes ?? ''}
                    onChange={(e) => updatePhraseEntry(entry.id, { notes: e.target.value || undefined })}
                    placeholder="Optional notes"
                    className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-400 flex-1 min-w-0 focus:outline-none focus:border-blue-500"
                    aria-label="Phrase notes"
                />
            </div>
        </div>
    );
}

export default function PhraseEntryEditor() {
    const selectedCategoryId = useAppStore((s) => s.selectedCategoryId);
    const phraseEntries = useAppStore((s) => s.phraseEntries);
    const phraseCategories = useAppStore((s) => s.phraseCategories);
    const addPhraseEntry = useAppStore((s) => s.addPhraseEntry);
    const reorderPhraseEntries = useAppStore((s) => s.reorderPhraseEntries);

    const [adding, setAdding] = useState(false);

    if (!selectedCategoryId) {
        return <p className="text-xs text-zinc-500 italic">Select a category to edit phrases.</p>;
    }

    const categoryName = phraseCategories.find((c) => c.id === selectedCategoryId)?.name ?? '';

    const entries = phraseEntries
        .filter((e) => e.categoryId === selectedCategoryId)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    const handleAdd = () => {
        const maxOrder = entries.reduce((max, e) => Math.max(max, e.sortOrder), 0);
        addPhraseEntry({
            categoryId: selectedCategoryId,
            contentPtBr: '',
            contentEn: '',
            sortOrder: maxOrder + 1,
        });
        setAdding(false);
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const ids = entries.map((e) => e.id);
        [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
        reorderPhraseEntries(selectedCategoryId, ids);
    };

    const handleMoveDown = (index: number) => {
        if (index >= entries.length - 1) return;
        const ids = entries.map((e) => e.id);
        [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
        reorderPhraseEntries(selectedCategoryId, ids);
    };

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-zinc-300">
                Phrases — {categoryName}
            </h3>
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                {entries.map((entry, idx) => (
                    <PhraseEntryRow
                        key={entry.id}
                        entry={entry}
                        index={idx}
                        total={entries.length}
                        onMoveUp={() => handleMoveUp(idx)}
                        onMoveDown={() => handleMoveDown(idx)}
                    />
                ))}
                {entries.length === 0 && (
                    <p className="text-xs text-zinc-500 italic">No phrases in this category.</p>
                )}
            </div>
            <button
                onClick={handleAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded self-start"
            >
                + Add Phrase
            </button>
        </div>
    );
}
