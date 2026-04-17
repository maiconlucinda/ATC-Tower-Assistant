'use client';

import { useAppStore } from '@/store';

export default function EditModeToggle() {
    const editMode = useAppStore((s) => s.editMode);
    const toggleEditMode = useAppStore((s) => s.toggleEditMode);

    return (
        <button
            onClick={toggleEditMode}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${editMode
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
                }`}
            aria-pressed={editMode}
        >
            {editMode ? 'Edit Mode' : 'View Mode'}
        </button>
    );
}
