'use client';

import { useAppStore } from '@/store';

const CATEGORY_ICONS: Record<string, string> = {
    'AUTORIZAÇÃO': '✅',
    'PUSHBACK E ACIONAMENTO': '⏪',
    'TAXI': '🛞',
    'DECOLAGEM': '🛫',
    'POUSO': '🛬',
    'PÓS-POUSO': '🅿️',
};

function getIcon(name: string): string {
    return CATEGORY_ICONS[name.toUpperCase()] ?? '📋';
}

export default function CategoryButtonBar() {
    const phraseCategories = useAppStore((s) => s.phraseCategories);
    const selectedCategoryId = useAppStore((s) => s.selectedCategoryId);
    const setSelectedCategoryId = useAppStore((s) => s.setSelectedCategoryId);
    const setPhraseSearchQuery = useAppStore((s) => s.setPhraseSearchQuery);

    const sorted = [...phraseCategories].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="flex flex-wrap gap-1 pb-1" role="tablist" aria-label="Phrase categories">
            {sorted.map((cat) => {
                const isActive = cat.id === selectedCategoryId;
                return (
                    <button
                        key={cat.id}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => {
                            setSelectedCategoryId(cat.id);
                            setPhraseSearchQuery('');
                        }}
                        className={`px-2 py-1.5 rounded-md text-xs sm:text-sm sm:px-3 sm:py-2 font-medium transition-all border ${isActive
                            ? 'bg-white text-zinc-900 border-white shadow-sm'
                            : 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800'
                            }`}
                    >
                        <span className="mr-1.5">{getIcon(cat.name)}</span>
                        {cat.name}
                    </button>
                );
            })}
        </div>
    );
}
