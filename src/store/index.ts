import { create } from 'zustand';
import type {
    TransitionFix,
    DepartureOption,
    Direction,
    PhraseCategory,
    PhraseEntry,
    GlobalVariable,
    SidProcedure,
} from '@/types';
import { loadAll, persistFixes, persistSidProcedures, persistPhrases, persistGlobalVariables } from '@/lib/dataStore';
import { getDefaultCategories, getDefaultGlobalVariables } from '@/lib/defaults';
import { buildFixesFromSids } from '@/lib/utils';

function buildFixMap(fixes: TransitionFix[]): Map<string, TransitionFix> {
    const map = new Map<string, TransitionFix>();
    for (const fix of fixes) {
        map.set(fix.name.toUpperCase(), fix);
    }
    return map;
}

export interface AppState {
    // --- State slices ---
    fixMap: Map<string, TransitionFix>;
    fixes: TransitionFix[];
    sidProcedures: SidProcedure[];
    phraseCategories: PhraseCategory[];
    phraseEntries: PhraseEntry[];
    globalVariables: GlobalVariable[];
    editMode: boolean;
    selectedCategoryId: string | null;
    fixSearchQuery: string;
    phraseSearchQuery: string;
    warning: string | null;

    // --- Hydration ---
    hydrate: () => void;

    // --- Edit mode ---
    toggleEditMode: () => void;

    // --- Selection & search ---
    setSelectedCategoryId: (id: string | null) => void;
    setFixSearchQuery: (query: string) => void;
    setPhraseSearchQuery: (query: string) => void;

    // --- Fix CRUD (legacy, still works for direct fix editing) ---
    addFix: (name: string, direction: Direction) => boolean;
    updateFix: (id: string, updates: Partial<Pick<TransitionFix, 'name' | 'direction'>>) => boolean;
    deleteFix: (id: string) => boolean;
    addDepartureOption: (fixId: string, runway: string, sid: string) => boolean;
    updateDepartureOption: (fixId: string, optionId: string, updates: Partial<Pick<DepartureOption, 'runway' | 'sid' | 'direction'>>) => boolean;
    removeDepartureOption: (fixId: string, optionId: string) => boolean;

    // --- SID Procedure CRUD ---
    addSidProcedure: (name: string, runway: string, direction: Direction, fixNames: string[]) => string | null;
    updateSidProcedure: (id: string, updates: Partial<Omit<SidProcedure, 'id'>>) => boolean;
    deleteSidProcedure: (id: string) => boolean;
    rebuildFixesFromSids: () => void;

    // --- Category CRUD ---
    addCategory: (name: string) => string | null;
    updateCategory: (id: string, updates: Partial<Pick<PhraseCategory, 'name'>>) => boolean;
    deleteCategory: (id: string) => boolean;
    reorderCategories: (orderedIds: string[]) => void;

    // --- Phrase Entry CRUD ---
    addPhraseEntry: (entry: Omit<PhraseEntry, 'id'>) => string | null;
    updatePhraseEntry: (id: string, updates: Partial<Omit<PhraseEntry, 'id'>>) => boolean;
    deletePhraseEntry: (id: string) => boolean;
    reorderPhraseEntries: (categoryId: string, orderedIds: string[]) => void;

    // --- Global Variable CRUD ---
    updateGlobalVariable: (name: string, value: string) => boolean;
    addGlobalVariable: (name: string) => boolean;
    deleteGlobalVariable: (name: string) => boolean;
}

export const useAppStore = create<AppState>()((set, get) => ({
    // --- Initial state ---
    fixMap: new Map(),
    fixes: [],
    sidProcedures: [],
    phraseCategories: [],
    phraseEntries: [],
    globalVariables: [],
    editMode: false,
    selectedCategoryId: null,
    fixSearchQuery: '',
    phraseSearchQuery: '',
    warning: null,

    // --- Hydration ---
    hydrate: () => {
        const { data, warning } = loadAll();

        // Direct localStorage read for sidProcedures as safety net
        let sidProcedures: SidProcedure[] = data.sidProcedures ?? [];
        if (sidProcedures.length === 0) {
            try {
                const raw = localStorage.getItem('atc_sid_procedures');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        sidProcedures = parsed;
                    }
                }
            } catch { /* ignore */ }
        }

        const isEmpty =
            data.fixes.length === 0 &&
            sidProcedures.length === 0 &&
            data.phraseCategories.length === 0 &&
            data.phraseEntries.length === 0 &&
            data.globalVariables.length === 0;

        let fixes = data.fixes;
        let phraseCategories = data.phraseCategories;
        let phraseEntries = data.phraseEntries;
        let globalVariables = data.globalVariables;

        if (isEmpty && !warning) {
            phraseCategories = getDefaultCategories();
            globalVariables = getDefaultGlobalVariables();
            persistPhrases(phraseCategories, []);
            persistGlobalVariables(globalVariables);
        }

        // If we have SID procedures, rebuild fixes from them
        if (sidProcedures.length > 0) {
            fixes = buildFixesFromSids(sidProcedures);
            persistFixes(fixes);
        }

        set({
            fixes,
            fixMap: buildFixMap(fixes),
            sidProcedures,
            phraseCategories,
            phraseEntries,
            globalVariables,
            warning,
            selectedCategoryId: phraseCategories.length > 0 ? phraseCategories[0].id : null,
        });
    },

    // --- Edit mode ---
    toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

    // --- Selection & search ---
    setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
    setFixSearchQuery: (query) => set({ fixSearchQuery: query }),
    setPhraseSearchQuery: (query) => set({ phraseSearchQuery: query }),

    // --- Fix CRUD ---
    addFix: (name, direction) => {
        const upperName = name.toUpperCase();
        if (get().fixMap.has(upperName)) return false;

        const newFix: TransitionFix = {
            id: crypto.randomUUID(),
            name: upperName,
            direction,
            departureOptions: [],
        };
        const fixes = [...get().fixes, newFix];
        persistFixes(fixes);
        set({ fixes, fixMap: buildFixMap(fixes) });
        return true;
    },

    updateFix: (id, updates) => {
        const { fixes } = get();
        const idx = fixes.findIndex((f) => f.id === id);
        if (idx === -1) return false;

        if (updates.name) {
            const upperName = updates.name.toUpperCase();
            const existing = get().fixMap.get(upperName);
            if (existing && existing.id !== id) return false;
            updates = { ...updates, name: upperName };
        }

        const updated = [...fixes];
        updated[idx] = { ...updated[idx], ...updates };
        persistFixes(updated);
        set({ fixes: updated, fixMap: buildFixMap(updated) });
        return true;
    },

    deleteFix: (id) => {
        const { fixes } = get();
        const fix = fixes.find((f) => f.id === id);
        if (!fix) return false;
        if (fix.name.toUpperCase() === 'OMNI') return false;

        const updated = fixes.filter((f) => f.id !== id);
        persistFixes(updated);
        set({ fixes: updated, fixMap: buildFixMap(updated) });
        return true;
    },

    addDepartureOption: (fixId, runway, sid) => {
        const { fixes } = get();
        const idx = fixes.findIndex((f) => f.id === fixId);
        if (idx === -1) return false;

        const newOption: DepartureOption = {
            id: crypto.randomUUID(),
            runway,
            sid,
        };
        const updated = [...fixes];
        updated[idx] = {
            ...updated[idx],
            departureOptions: [...updated[idx].departureOptions, newOption],
        };
        persistFixes(updated);
        set({ fixes: updated, fixMap: buildFixMap(updated) });
        return true;
    },

    updateDepartureOption: (fixId, optionId, updates) => {
        const { fixes } = get();
        const fixIdx = fixes.findIndex((f) => f.id === fixId);
        if (fixIdx === -1) return false;

        const fix = fixes[fixIdx];
        const optIdx = fix.departureOptions.findIndex((o) => o.id === optionId);
        if (optIdx === -1) return false;

        const updatedOptions = [...fix.departureOptions];
        updatedOptions[optIdx] = { ...updatedOptions[optIdx], ...updates };

        const updated = [...fixes];
        updated[fixIdx] = { ...updated[fixIdx], departureOptions: updatedOptions };
        persistFixes(updated);
        set({ fixes: updated, fixMap: buildFixMap(updated) });
        return true;
    },

    removeDepartureOption: (fixId, optionId) => {
        const { fixes } = get();
        const fixIdx = fixes.findIndex((f) => f.id === fixId);
        if (fixIdx === -1) return false;

        const fix = fixes[fixIdx];
        const updatedOptions = fix.departureOptions.filter((o) => o.id !== optionId);
        if (updatedOptions.length === fix.departureOptions.length) return false;

        const updated = [...fixes];
        updated[fixIdx] = { ...updated[fixIdx], departureOptions: updatedOptions };
        persistFixes(updated);
        set({ fixes: updated, fixMap: buildFixMap(updated) });
        return true;
    },

    // --- Category CRUD ---
    addCategory: (name) => {
        const id = crypto.randomUUID();
        const { phraseCategories, phraseEntries } = get();
        const maxOrder = phraseCategories.reduce((max, c) => Math.max(max, c.sortOrder), 0);
        const newCat: PhraseCategory = { id, name, sortOrder: maxOrder + 1 };
        const updated = [...phraseCategories, newCat];
        persistPhrases(updated, phraseEntries);
        set({ phraseCategories: updated });
        return id;
    },

    updateCategory: (id, updates) => {
        const { phraseCategories, phraseEntries } = get();
        const idx = phraseCategories.findIndex((c) => c.id === id);
        if (idx === -1) return false;

        const updated = [...phraseCategories];
        updated[idx] = { ...updated[idx], ...updates };
        persistPhrases(updated, phraseEntries);
        set({ phraseCategories: updated });
        return true;
    },

    deleteCategory: (id) => {
        const { phraseCategories, phraseEntries } = get();
        const idx = phraseCategories.findIndex((c) => c.id === id);
        if (idx === -1) return false;

        const updatedCats = phraseCategories.filter((c) => c.id !== id);
        const updatedEntries = phraseEntries.filter((e) => e.categoryId !== id);
        persistPhrases(updatedCats, updatedEntries);
        set({ phraseCategories: updatedCats, phraseEntries: updatedEntries });
        return true;
    },

    reorderCategories: (orderedIds) => {
        const { phraseCategories, phraseEntries } = get();
        const catMap = new Map(phraseCategories.map((c) => [c.id, c]));
        const reordered = orderedIds
            .map((id, i) => {
                const cat = catMap.get(id);
                return cat ? { ...cat, sortOrder: i + 1 } : null;
            })
            .filter((c): c is PhraseCategory => c !== null);

        persistPhrases(reordered, phraseEntries);
        set({ phraseCategories: reordered });
    },

    // --- Phrase Entry CRUD ---
    addPhraseEntry: (entry) => {
        const id = crypto.randomUUID();
        const { phraseEntries, phraseCategories } = get();
        const newEntry: PhraseEntry = { ...entry, id };
        const updated = [...phraseEntries, newEntry];
        persistPhrases(phraseCategories, updated);
        set({ phraseEntries: updated });
        return id;
    },

    updatePhraseEntry: (id, updates) => {
        const { phraseEntries, phraseCategories } = get();
        const idx = phraseEntries.findIndex((e) => e.id === id);
        if (idx === -1) return false;

        const updated = [...phraseEntries];
        updated[idx] = { ...updated[idx], ...updates };
        persistPhrases(phraseCategories, updated);
        set({ phraseEntries: updated });
        return true;
    },

    deletePhraseEntry: (id) => {
        const { phraseEntries, phraseCategories } = get();
        const idx = phraseEntries.findIndex((e) => e.id === id);
        if (idx === -1) return false;

        const updated = phraseEntries.filter((e) => e.id !== id);
        persistPhrases(phraseCategories, updated);
        set({ phraseEntries: updated });
        return true;
    },

    reorderPhraseEntries: (categoryId, orderedIds) => {
        const { phraseEntries, phraseCategories } = get();
        const idSet = new Set(orderedIds);
        const otherEntries = phraseEntries.filter((e) => !idSet.has(e.id));
        const entryMap = new Map(phraseEntries.filter((e) => e.categoryId === categoryId).map((e) => [e.id, e]));
        const reordered = orderedIds
            .map((id, i) => {
                const entry = entryMap.get(id);
                return entry ? { ...entry, sortOrder: i + 1 } : null;
            })
            .filter((e): e is PhraseEntry => e !== null);

        const updated = [...otherEntries, ...reordered];
        persistPhrases(phraseCategories, updated);
        set({ phraseEntries: updated });
    },

    // --- SID Procedure CRUD ---
    addSidProcedure: (name, runway, direction, fixNames) => {
        const id = crypto.randomUUID();
        const newSid: SidProcedure = { id, name: name.toUpperCase(), runway, direction, fixNames: fixNames.map(f => f.toUpperCase()) };
        const sids = [...get().sidProcedures, newSid];
        persistSidProcedures(sids);
        const fixes = buildFixesFromSids(sids);
        persistFixes(fixes);
        set({ sidProcedures: sids, fixes, fixMap: buildFixMap(fixes) });
        return id;
    },

    updateSidProcedure: (id, updates) => {
        const { sidProcedures } = get();
        const idx = sidProcedures.findIndex((s) => s.id === id);
        if (idx === -1) return false;

        const updated = [...sidProcedures];
        if (updates.name) updates = { ...updates, name: updates.name.toUpperCase() };
        if (updates.fixNames) updates = { ...updates, fixNames: updates.fixNames.map(f => f.toUpperCase()) };
        updated[idx] = { ...updated[idx], ...updates };
        persistSidProcedures(updated);
        const fixes = buildFixesFromSids(updated);
        persistFixes(fixes);
        set({ sidProcedures: updated, fixes, fixMap: buildFixMap(fixes) });
        return true;
    },

    deleteSidProcedure: (id) => {
        const { sidProcedures } = get();
        const idx = sidProcedures.findIndex((s) => s.id === id);
        if (idx === -1) return false;

        const updated = sidProcedures.filter((s) => s.id !== id);
        persistSidProcedures(updated);
        const fixes = buildFixesFromSids(updated);
        persistFixes(fixes);
        set({ sidProcedures: updated, fixes, fixMap: buildFixMap(fixes) });
        return true;
    },

    rebuildFixesFromSids: () => {
        const { sidProcedures } = get();
        const fixes = buildFixesFromSids(sidProcedures);
        persistFixes(fixes);
        set({ fixes, fixMap: buildFixMap(fixes) });
    },

    // --- Global Variable CRUD ---
    updateGlobalVariable: (name, value) => {
        const { globalVariables } = get();
        const idx = globalVariables.findIndex((v) => v.name === name);
        if (idx === -1) return false;

        const updated = [...globalVariables];
        updated[idx] = { ...updated[idx], value };
        persistGlobalVariables(updated);
        set({ globalVariables: updated });
        return true;
    },

    addGlobalVariable: (name) => {
        const { globalVariables } = get();
        if (globalVariables.some((v) => v.name === name)) return false;

        const newVar: GlobalVariable = { name, token: `{${name}}`, value: '' };
        const updated = [...globalVariables, newVar];
        persistGlobalVariables(updated);
        set({ globalVariables: updated });
        return true;
    },

    deleteGlobalVariable: (name) => {
        const { globalVariables } = get();
        const idx = globalVariables.findIndex((v) => v.name === name);
        if (idx === -1) return false;

        const updated = globalVariables.filter((v) => v.name !== name);
        persistGlobalVariables(updated);
        set({ globalVariables: updated });
        return true;
    },
}));
