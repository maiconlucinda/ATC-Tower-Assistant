'use client';

import { useAppStore } from '@/store';

interface CategoryStyle {
    icon: string;
    bg: string;
    bgActive: string;
    border: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
    'AUTORIZAÇÃO': {
        icon: '✅',
        bg: 'bg-emerald-900/40 text-emerald-200 border-emerald-700 hover:bg-emerald-800/50',
        bgActive: 'bg-emerald-600 text-white border-emerald-500',
        border: 'border',
    },
    'PUSHBACK E ACIONAMENTO': {
        icon: '⏪',
        bg: 'bg-amber-900/40 text-amber-200 border-amber-700 hover:bg-amber-800/50',
        bgActive: 'bg-amber-600 text-white border-amber-500',
        border: 'border',
    },
    'TAXI': {
        icon: '🛞',
        bg: 'bg-yellow-900/40 text-yellow-200 border-yellow-700 hover:bg-yellow-800/50',
        bgActive: 'bg-yellow-600 text-white border-yellow-500',
        border: 'border',
    },
    'DECOLAGEM': {
        icon: '🛫',
        bg: 'bg-sky-900/40 text-sky-200 border-sky-700 hover:bg-sky-800/50',
        bgActive: 'bg-sky-600 text-white border-sky-500',
        border: 'border',
    },
    'POUSO': {
        icon: '🛬',
        bg: 'bg-violet-900/40 text-violet-200 border-violet-700 hover:bg-violet-800/50',
        bgActive: 'bg-violet-600 text-white border-violet-500',
        border: 'border',
    },
    'PÓS-POUSO': {
        icon: '🅿️',
        bg: 'bg-rose-900/40 text-rose-200 border-rose-700 hover:bg-rose-800/50',
        bgActive: 'bg-rose-600 text-white border-rose-500',
        border: 'border',
    },
};

const DEFAULT_STYLE: CategoryStyle = {
    icon: '📋',
    bg: 'bg-zinc-700 text-zinc-200 border-zinc-600 hover:bg-zinc-600',
    bgActive: 'bg-blue-600 text-white border-blue-500',
    border: 'border',
};

function getStyle(name: string): CategoryStyle {
    return CATEGORY_STYLES[name.toUpperCase()] ?? DEFAULT_STYLE;
}

export default function CategoryButtonBar() {
    const phraseCategories = useAppStore((s) => s.phraseCategories);
    const selectedCategoryId = useAppStore((s) => s.selectedCategoryId);
    const setSelectedCategoryId = useAppStore((s) => s.setSelectedCategoryId);
    const setPhraseSearchQuery = useAppStore((s) => s.setPhraseSearchQuery);

    const sorted = [...phraseCategories].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Phrase categories">
            {sorted.map((cat) => {
                const isActive = cat.id === selectedCategoryId;
                const style = getStyle(cat.name);
                return (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setSelectedCategoryId(cat.id);
                            setPhraseSearchQuery('');
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${style.border} ${isActive ? style.bgActive : style.bg
                            }`}
                        aria-pressed={isActive}
                    >
                        <span className="mr-1.5">{style.icon}</span>
                        {cat.name}
                    </button>
                );
            })}
        </div>
    );
}
