import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import PhraseEntryEditor from './PhraseEntryEditor';
import { useAppStore } from '@/store';
import type { PhraseCategory, PhraseEntry } from '@/types';

const CAT_ID = 'cat-1';

function makeCategory(): PhraseCategory {
    return { id: CAT_ID, name: 'TAXI', sortOrder: 1 };
}

function makeEntry(overrides: Partial<PhraseEntry> & { sortOrder: number }): PhraseEntry {
    return {
        id: crypto.randomUUID(),
        categoryId: CAT_ID,
        contentPtBr: '',
        contentEn: '',
        ...overrides,
    };
}

describe('PhraseEntryEditor', () => {
    beforeEach(() => {
        useAppStore.setState({
            phraseCategories: [makeCategory()],
            phraseEntries: [],
            selectedCategoryId: CAT_ID,
            editMode: true,
            globalVariables: [],
        });
    });

    it('shows message when no category is selected', () => {
        useAppStore.setState({ selectedCategoryId: null });
        render(<PhraseEntryEditor />);
        expect(screen.getByText('Select a category to edit phrases.')).toBeInTheDocument();
    });

    it('shows empty state when category has no entries', () => {
        render(<PhraseEntryEditor />);
        expect(screen.getByText('No phrases in this category.')).toBeInTheDocument();
    });

    it('displays the category name in the heading', () => {
        render(<PhraseEntryEditor />);
        expect(screen.getByText('Phrases — TAXI')).toBeInTheDocument();
    });

    it('adds a new phrase entry', () => {
        render(<PhraseEntryEditor />);
        fireEvent.click(screen.getByText('+ Add Phrase'));

        const state = useAppStore.getState();
        expect(state.phraseEntries).toHaveLength(1);
        expect(state.phraseEntries[0].categoryId).toBe(CAT_ID);
    });

    it('renders existing entries with editable fields', () => {
        const entry = makeEntry({
            sortOrder: 1,
            title: 'Test Title',
            contentPtBr: 'Olá',
            contentEn: 'Hello',
            notes: 'A note',
        });
        useAppStore.setState({ phraseEntries: [entry] });
        render(<PhraseEntryEditor />);

        expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Olá')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
        expect(screen.getByDisplayValue('A note')).toBeInTheDocument();
    });

    it('edits pt-BR content independently', () => {
        const entry = makeEntry({ sortOrder: 1, contentPtBr: 'old', contentEn: 'eng' });
        useAppStore.setState({ phraseEntries: [entry] });
        render(<PhraseEntryEditor />);

        const ptBrInput = screen.getByDisplayValue('old');
        fireEvent.change(ptBrInput, { target: { value: 'novo' } });

        const state = useAppStore.getState();
        expect(state.phraseEntries[0].contentPtBr).toBe('novo');
        expect(state.phraseEntries[0].contentEn).toBe('eng');
    });

    it('edits en content independently', () => {
        const entry = makeEntry({ sortOrder: 1, contentPtBr: 'ptbr', contentEn: 'old' });
        useAppStore.setState({ phraseEntries: [entry] });
        render(<PhraseEntryEditor />);

        const enInput = screen.getByDisplayValue('old');
        fireEvent.change(enInput, { target: { value: 'new' } });

        const state = useAppStore.getState();
        expect(state.phraseEntries[0].contentEn).toBe('new');
        expect(state.phraseEntries[0].contentPtBr).toBe('ptbr');
    });

    it('edits optional notes', () => {
        const entry = makeEntry({ sortOrder: 1 });
        useAppStore.setState({ phraseEntries: [entry] });
        render(<PhraseEntryEditor />);

        const notesInput = screen.getByPlaceholderText('Optional notes');
        fireEvent.change(notesInput, { target: { value: 'my note' } });

        expect(useAppStore.getState().phraseEntries[0].notes).toBe('my note');
    });

    it('deletes a phrase entry', () => {
        const entry = makeEntry({ sortOrder: 1, title: 'Del' });
        useAppStore.setState({ phraseEntries: [entry] });
        render(<PhraseEntryEditor />);

        fireEvent.click(screen.getByLabelText('Delete phrase'));
        expect(useAppStore.getState().phraseEntries).toHaveLength(0);
    });

    it('reorders entries with move up/down', () => {
        const e1 = makeEntry({ sortOrder: 1, title: 'First' });
        const e2 = makeEntry({ sortOrder: 2, title: 'Second' });
        useAppStore.setState({ phraseEntries: [e1, e2] });
        render(<PhraseEntryEditor />);

        // Move Second up
        const moveUpButtons = screen.getAllByLabelText('Move phrase up');
        fireEvent.click(moveUpButtons[1]);

        const state = useAppStore.getState();
        const sorted = [...state.phraseEntries]
            .filter((e) => e.categoryId === CAT_ID)
            .sort((a, b) => a.sortOrder - b.sortOrder);
        expect(sorted[0].title).toBe('Second');
        expect(sorted[1].title).toBe('First');
    });

    it('disables move up for first entry and move down for last', () => {
        const entry = makeEntry({ sortOrder: 1, title: 'Solo' });
        useAppStore.setState({ phraseEntries: [entry] });
        render(<PhraseEntryEditor />);

        const upBtn = screen.getByLabelText('Move phrase up');
        const downBtn = screen.getByLabelText('Move phrase down');
        expect(upBtn).toBeDisabled();
        expect(downBtn).toBeDisabled();
    });

    it('only shows entries for the selected category', () => {
        const e1 = makeEntry({ sortOrder: 1, title: 'InCat' });
        const e2: PhraseEntry = {
            id: crypto.randomUUID(),
            categoryId: 'other-cat',
            contentPtBr: 'other',
            contentEn: 'other',
            sortOrder: 1,
            title: 'OutCat',
        };
        useAppStore.setState({ phraseEntries: [e1, e2] });
        render(<PhraseEntryEditor />);

        expect(screen.getByDisplayValue('InCat')).toBeInTheDocument();
        expect(screen.queryByDisplayValue('OutCat')).not.toBeInTheDocument();
    });
});
