import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import CategoryEditor from './CategoryEditor';
import { useAppStore } from '@/store';
import type { PhraseCategory } from '@/types';

function makeCategory(name: string, sortOrder: number): PhraseCategory {
    return { id: crypto.randomUUID(), name, sortOrder };
}

describe('CategoryEditor', () => {
    beforeEach(() => {
        useAppStore.setState({
            phraseCategories: [],
            phraseEntries: [],
            editMode: true,
        });
    });

    it('renders empty state when no categories exist', () => {
        render(<CategoryEditor />);
        expect(screen.getByText('No categories yet.')).toBeInTheDocument();
    });

    it('renders existing categories with editable name fields', () => {
        const cats = [makeCategory('TAXI', 1), makeCategory('POUSO', 2)];
        useAppStore.setState({ phraseCategories: cats });
        render(<CategoryEditor />);

        const inputs = screen.getAllByRole('textbox');
        // 2 category name inputs + 1 new category input
        expect(inputs.length).toBe(3);
        expect((inputs[0] as HTMLInputElement).value).toBe('TAXI');
        expect((inputs[1] as HTMLInputElement).value).toBe('POUSO');
    });

    it('adds a new category via the Add button', () => {
        render(<CategoryEditor />);
        const newInput = screen.getByPlaceholderText('New category name');
        fireEvent.change(newInput, { target: { value: 'DECOLAGEM' } });
        fireEvent.click(screen.getByText('Add'));

        const state = useAppStore.getState();
        expect(state.phraseCategories).toHaveLength(1);
        expect(state.phraseCategories[0].name).toBe('DECOLAGEM');
    });

    it('adds a new category via Enter key', () => {
        render(<CategoryEditor />);
        const newInput = screen.getByPlaceholderText('New category name');
        fireEvent.change(newInput, { target: { value: 'TAXI' } });
        fireEvent.keyDown(newInput, { key: 'Enter' });

        const state = useAppStore.getState();
        expect(state.phraseCategories).toHaveLength(1);
        expect(state.phraseCategories[0].name).toBe('TAXI');
    });

    it('does not add a category with empty name', () => {
        render(<CategoryEditor />);
        fireEvent.click(screen.getByText('Add'));
        expect(useAppStore.getState().phraseCategories).toHaveLength(0);
    });

    it('renames a category inline', () => {
        const cat = makeCategory('OLD', 1);
        useAppStore.setState({ phraseCategories: [cat] });
        render(<CategoryEditor />);

        const input = screen.getByDisplayValue('OLD');
        fireEvent.change(input, { target: { value: 'NEW' } });

        const state = useAppStore.getState();
        expect(state.phraseCategories[0].name).toBe('NEW');
    });

    it('deletes a category', () => {
        const cat = makeCategory('DELETE_ME', 1);
        useAppStore.setState({ phraseCategories: [cat] });
        render(<CategoryEditor />);

        fireEvent.click(screen.getByLabelText('Delete category DELETE_ME'));
        expect(useAppStore.getState().phraseCategories).toHaveLength(0);
    });

    it('reorders categories with move up/down buttons', () => {
        const cats = [makeCategory('A', 1), makeCategory('B', 2), makeCategory('C', 3)];
        useAppStore.setState({ phraseCategories: cats });
        render(<CategoryEditor />);

        // Move B up → order should be B, A, C
        const moveUpButtons = screen.getAllByLabelText(/Move .* up/);
        fireEvent.click(moveUpButtons[1]); // Move B up

        const state = useAppStore.getState();
        const sorted = [...state.phraseCategories].sort((a, b) => a.sortOrder - b.sortOrder);
        expect(sorted[0].name).toBe('B');
        expect(sorted[1].name).toBe('A');
        expect(sorted[2].name).toBe('C');
    });

    it('disables move up for first category and move down for last', () => {
        const cats = [makeCategory('ONLY', 1)];
        useAppStore.setState({ phraseCategories: cats });
        render(<CategoryEditor />);

        const upBtn = screen.getByLabelText('Move ONLY up');
        const downBtn = screen.getByLabelText('Move ONLY down');
        expect(upBtn).toBeDisabled();
        expect(downBtn).toBeDisabled();
    });
});
