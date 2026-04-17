import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './index';

function resetStore() {
    useAppStore.setState({
        fixMap: new Map(),
        fixes: [],
        phraseCategories: [],
        phraseEntries: [],
        globalVariables: [],
        editMode: false,
        selectedCategoryId: null,
        fixSearchQuery: '',
        phraseSearchQuery: '',
        warning: null,
    });
}

describe('AppStore', () => {
    beforeEach(() => {
        localStorage.clear();
        resetStore();
    });

    describe('hydrate', () => {
        it('initializes with defaults when storage is empty', () => {
            useAppStore.getState().hydrate();
            const state = useAppStore.getState();
            expect(state.phraseCategories).toHaveLength(6);
            expect(state.phraseCategories[0].name).toBe('AUTORIZAÇÃO');
            expect(state.globalVariables).toHaveLength(7);
            expect(state.globalVariables[0].name).toBe('aeroporto');
            expect(state.fixes).toHaveLength(0);
            expect(state.selectedCategoryId).toBe(state.phraseCategories[0].id);
        });

        it('loads existing data from localStorage', () => {
            const fix = { id: 'f1', name: 'EPDEP', direction: 'NORTH', departureOptions: [] };
            localStorage.setItem('atc_fixes', JSON.stringify([fix]));
            localStorage.setItem('atc_phrase_categories', JSON.stringify([{ id: 'c1', name: 'TEST', sortOrder: 1 }]));
            localStorage.setItem('atc_phrase_entries', JSON.stringify([]));
            localStorage.setItem('atc_global_variables', JSON.stringify([{ name: 'qnh', token: '{qnh}', value: '1013' }]));

            useAppStore.getState().hydrate();
            const state = useAppStore.getState();
            expect(state.fixes).toHaveLength(1);
            expect(state.fixMap.get('EPDEP')).toBeDefined();
            expect(state.phraseCategories[0].name).toBe('TEST');
            expect(state.globalVariables[0].value).toBe('1013');
        });

        it('sets warning on corrupted data', () => {
            localStorage.setItem('atc_fixes', 'not-json');
            useAppStore.getState().hydrate();
            const state = useAppStore.getState();
            expect(state.warning).toContain('Could not parse');
        });
    });

    describe('editMode', () => {
        it('defaults to false', () => {
            expect(useAppStore.getState().editMode).toBe(false);
        });

        it('toggles edit mode', () => {
            useAppStore.getState().toggleEditMode();
            expect(useAppStore.getState().editMode).toBe(true);
            useAppStore.getState().toggleEditMode();
            expect(useAppStore.getState().editMode).toBe(false);
        });
    });

    describe('Fix CRUD', () => {
        it('adds a fix and builds fixMap', () => {
            const result = useAppStore.getState().addFix('epdep', 'NORTH');
            expect(result).toBe(true);
            const state = useAppStore.getState();
            expect(state.fixes).toHaveLength(1);
            expect(state.fixes[0].name).toBe('EPDEP');
            expect(state.fixMap.get('EPDEP')).toBeDefined();
            // Persisted
            const stored = JSON.parse(localStorage.getItem('atc_fixes')!);
            expect(stored).toHaveLength(1);
        });

        it('prevents duplicate fix names', () => {
            useAppStore.getState().addFix('EPDEP', 'NORTH');
            const result = useAppStore.getState().addFix('epdep', 'SOUTH');
            expect(result).toBe(false);
            expect(useAppStore.getState().fixes).toHaveLength(1);
        });

        it('updates a fix', () => {
            useAppStore.getState().addFix('EPDEP', 'NORTH');
            const id = useAppStore.getState().fixes[0].id;
            const result = useAppStore.getState().updateFix(id, { direction: 'SOUTH' });
            expect(result).toBe(true);
            expect(useAppStore.getState().fixes[0].direction).toBe('SOUTH');
        });

        it('prevents renaming to an existing name', () => {
            useAppStore.getState().addFix('EPDEP', 'NORTH');
            useAppStore.getState().addFix('GNV', 'SOUTH');
            const id = useAppStore.getState().fixes[1].id;
            const result = useAppStore.getState().updateFix(id, { name: 'EPDEP' });
            expect(result).toBe(false);
        });

        it('deletes a fix', () => {
            useAppStore.getState().addFix('EPDEP', 'NORTH');
            const id = useAppStore.getState().fixes[0].id;
            const result = useAppStore.getState().deleteFix(id);
            expect(result).toBe(true);
            expect(useAppStore.getState().fixes).toHaveLength(0);
            expect(useAppStore.getState().fixMap.size).toBe(0);
        });

        it('prevents deleting OMNI fix', () => {
            useAppStore.getState().addFix('OMNI', 'MIXED');
            const id = useAppStore.getState().fixes[0].id;
            const result = useAppStore.getState().deleteFix(id);
            expect(result).toBe(false);
            expect(useAppStore.getState().fixes).toHaveLength(1);
        });
    });

    describe('Departure Option CRUD', () => {
        beforeEach(() => {
            useAppStore.getState().addFix('EPDEP', 'NORTH');
        });

        it('adds a departure option', () => {
            const fixId = useAppStore.getState().fixes[0].id;
            const result = useAppStore.getState().addDepartureOption(fixId, '11L', 'ESBU6A', 1);
            expect(result).toBe(true);
            expect(useAppStore.getState().fixes[0].departureOptions).toHaveLength(1);
            expect(useAppStore.getState().fixMap.get('EPDEP')!.departureOptions).toHaveLength(1);
        });

        it('updates a departure option', () => {
            const fixId = useAppStore.getState().fixes[0].id;
            useAppStore.getState().addDepartureOption(fixId, '11L', 'ESBU6A', 1);
            const optId = useAppStore.getState().fixes[0].departureOptions[0].id;
            const result = useAppStore.getState().updateDepartureOption(fixId, optId, { sid: 'ESBU6B' });
            expect(result).toBe(true);
            expect(useAppStore.getState().fixes[0].departureOptions[0].sid).toBe('ESBU6B');
        });

        it('removes a departure option', () => {
            const fixId = useAppStore.getState().fixes[0].id;
            useAppStore.getState().addDepartureOption(fixId, '11L', 'ESBU6A', 1);
            const optId = useAppStore.getState().fixes[0].departureOptions[0].id;
            const result = useAppStore.getState().removeDepartureOption(fixId, optId);
            expect(result).toBe(true);
            expect(useAppStore.getState().fixes[0].departureOptions).toHaveLength(0);
        });

        it('returns false for non-existent fix', () => {
            expect(useAppStore.getState().addDepartureOption('bad-id', '11L', 'X', 1)).toBe(false);
        });
    });

    describe('Category CRUD', () => {
        it('adds a category', () => {
            const id = useAppStore.getState().addCategory('TEST');
            expect(id).toBeTruthy();
            expect(useAppStore.getState().phraseCategories).toHaveLength(1);
            expect(useAppStore.getState().phraseCategories[0].name).toBe('TEST');
        });

        it('updates a category', () => {
            useAppStore.getState().addCategory('TEST');
            const id = useAppStore.getState().phraseCategories[0].id;
            const result = useAppStore.getState().updateCategory(id, { name: 'UPDATED' });
            expect(result).toBe(true);
            expect(useAppStore.getState().phraseCategories[0].name).toBe('UPDATED');
        });

        it('deletes a category and its entries', () => {
            const catId = useAppStore.getState().addCategory('TEST')!;
            useAppStore.getState().addPhraseEntry({
                categoryId: catId, title: 'P1', contentPtBr: 'pt', contentEn: 'en', sortOrder: 1,
            });
            expect(useAppStore.getState().phraseEntries).toHaveLength(1);
            useAppStore.getState().deleteCategory(catId);
            expect(useAppStore.getState().phraseCategories).toHaveLength(0);
            expect(useAppStore.getState().phraseEntries).toHaveLength(0);
        });

        it('reorders categories', () => {
            const id1 = useAppStore.getState().addCategory('A')!;
            const id2 = useAppStore.getState().addCategory('B')!;
            useAppStore.getState().reorderCategories([id2, id1]);
            const cats = useAppStore.getState().phraseCategories;
            expect(cats[0].id).toBe(id2);
            expect(cats[0].sortOrder).toBe(1);
            expect(cats[1].id).toBe(id1);
            expect(cats[1].sortOrder).toBe(2);
        });
    });

    describe('Phrase Entry CRUD', () => {
        let catId: string;
        beforeEach(() => {
            catId = useAppStore.getState().addCategory('TEST')!;
        });

        it('adds a phrase entry', () => {
            const id = useAppStore.getState().addPhraseEntry({
                categoryId: catId, title: 'P1', contentPtBr: 'pt', contentEn: 'en', sortOrder: 1,
            });
            expect(id).toBeTruthy();
            expect(useAppStore.getState().phraseEntries).toHaveLength(1);
        });

        it('updates a phrase entry', () => {
            const id = useAppStore.getState().addPhraseEntry({
                categoryId: catId, contentPtBr: 'pt', contentEn: 'en', sortOrder: 1,
            })!;
            useAppStore.getState().updatePhraseEntry(id, { contentPtBr: 'updated' });
            expect(useAppStore.getState().phraseEntries[0].contentPtBr).toBe('updated');
        });

        it('deletes a phrase entry', () => {
            const id = useAppStore.getState().addPhraseEntry({
                categoryId: catId, contentPtBr: 'pt', contentEn: 'en', sortOrder: 1,
            })!;
            useAppStore.getState().deletePhraseEntry(id);
            expect(useAppStore.getState().phraseEntries).toHaveLength(0);
        });

        it('reorders phrase entries', () => {
            const id1 = useAppStore.getState().addPhraseEntry({
                categoryId: catId, contentPtBr: 'a', contentEn: 'a', sortOrder: 1,
            })!;
            const id2 = useAppStore.getState().addPhraseEntry({
                categoryId: catId, contentPtBr: 'b', contentEn: 'b', sortOrder: 2,
            })!;
            useAppStore.getState().reorderPhraseEntries(catId, [id2, id1]);
            const entries = useAppStore.getState().phraseEntries.filter((e) => e.categoryId === catId);
            const e1 = entries.find((e) => e.id === id2)!;
            const e2 = entries.find((e) => e.id === id1)!;
            expect(e1.sortOrder).toBe(1);
            expect(e2.sortOrder).toBe(2);
        });
    });

    describe('Global Variable CRUD', () => {
        it('adds a global variable', () => {
            const result = useAppStore.getState().addGlobalVariable('test_var');
            expect(result).toBe(true);
            const vars = useAppStore.getState().globalVariables;
            expect(vars).toHaveLength(1);
            expect(vars[0].token).toBe('{test_var}');
            expect(vars[0].value).toBe('');
        });

        it('prevents duplicate global variable names', () => {
            useAppStore.getState().addGlobalVariable('test_var');
            const result = useAppStore.getState().addGlobalVariable('test_var');
            expect(result).toBe(false);
        });

        it('updates a global variable value', () => {
            useAppStore.getState().addGlobalVariable('qnh');
            const result = useAppStore.getState().updateGlobalVariable('qnh', '1013');
            expect(result).toBe(true);
            expect(useAppStore.getState().globalVariables[0].value).toBe('1013');
        });

        it('deletes a global variable', () => {
            useAppStore.getState().addGlobalVariable('test_var');
            const result = useAppStore.getState().deleteGlobalVariable('test_var');
            expect(result).toBe(true);
            expect(useAppStore.getState().globalVariables).toHaveLength(0);
        });

        it('returns false for non-existent variable update', () => {
            expect(useAppStore.getState().updateGlobalVariable('nope', 'val')).toBe(false);
        });
    });

    describe('persistence', () => {
        it('persists fixes on CRUD', () => {
            useAppStore.getState().addFix('TEST', 'NORTH');
            const stored = JSON.parse(localStorage.getItem('atc_fixes')!);
            expect(stored).toHaveLength(1);
            expect(stored[0].name).toBe('TEST');
        });

        it('persists categories and entries on CRUD', () => {
            const catId = useAppStore.getState().addCategory('CAT')!;
            useAppStore.getState().addPhraseEntry({
                categoryId: catId, contentPtBr: 'pt', contentEn: 'en', sortOrder: 1,
            });
            const storedCats = JSON.parse(localStorage.getItem('atc_phrase_categories')!);
            const storedEntries = JSON.parse(localStorage.getItem('atc_phrase_entries')!);
            expect(storedCats).toHaveLength(1);
            expect(storedEntries).toHaveLength(1);
        });

        it('persists global variables on CRUD', () => {
            useAppStore.getState().addGlobalVariable('x');
            useAppStore.getState().updateGlobalVariable('x', 'val');
            const stored = JSON.parse(localStorage.getItem('atc_global_variables')!);
            expect(stored).toHaveLength(1);
            expect(stored[0].value).toBe('val');
        });
    });
});
