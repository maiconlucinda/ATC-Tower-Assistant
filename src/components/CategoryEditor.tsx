'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';

export default function CategoryEditor() {
    const phraseCategories = useAppStore((s) => s.phraseCategories);
    const addCategory = useAppStore((s) => s.addCategory);
    const updateCategory = useAppStore((s) => s.updateCategory);
    const deleteCategory = useAppStore((s) => s.deleteCategory);
    const reorderCategories = useAppStore((s) => s.reorderCategories);

    const [newName, setNewName] = useState('');

    const sorted = [...phraseCategories].sort((a, b) => a.sortOrder - b.sortOrder);

    const handleAdd = () => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        addCategory(trimmed);
        setNewName('');
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const ids = sorted.map((c) => c.id);
        [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
        reorderCategories(ids);
    };

    const handleMoveDown = (index: number) => {
        if (index >= sorted.length - 1) return;
        const ids = sorted.map((c) => c.id);
        [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
        reorderCategories(ids);
    };

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-zinc-300">Edit Categories</h3>
            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                {sorted.map((cat, idx) => (
                    <div
                        key={cat.id}
                        className="flex items-center gap-1.5 p-2 bg-zinc-800 rounded border border-zinc-700"
                    >
                        <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                            className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 flex-1 min-w-0 focus:outline-none focus:border-blue-500"
                            aria-label={`Category name for ${cat.name}`}
                        />
                        <button
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="text-zinc-400 hover:text-zinc-200 text-xs px-1 disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={`Move ${cat.name} up`}
                        >
                            ▲
                        </button>
                        <button
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === sorted.length - 1}
                            className="text-zinc-400 hover:text-zinc-200 text-xs px-1 disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={`Move ${cat.name} down`}
                        >
                            ▼
                        </button>
                        <button
                            onClick={() => deleteCategory(cat.id)}
                            className="text-red-400 hover:text-red-300 text-xs px-1"
                            aria-label={`Delete category ${cat.name}`}
                        >
                            ✕
                        </button>
                    </div>
                ))}
                {sorted.length === 0 && (
                    <p className="text-xs text-zinc-500 italic">No categories yet.</p>
                )}
            </div>
            <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded border border-zinc-700">
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                    placeholder="New category name"
                    className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 flex-1 min-w-0 focus:outline-none focus:border-blue-500"
                    aria-label="New category name"
                />
                <button
                    onClick={handleAdd}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded"
                >
                    Add
                </button>
            </div>
        </div>
    );
}
