import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import CategoryButtonBar from './CategoryButtonBar';
import { useAppStore } from '@/store';

function resetStore(overrides: Partial<ReturnType<typeof useAppStore.getState>> = {}) {
    useAppStore.setState({
        phraseCategories: [],
        selectedCategoryId: null,
        phraseSearchQuery: '',
        ...overrides,
    });
}

const categories = [
    { id: 'c3', name: 'TAXI', sortOrder: 3 },
    { id: 'c1', name: 'AUTORIZAÇÃO', sortOrder: 1 },
    { id: 'c2', name: 'PUSHBACK', sortOrder: 2 },
];

describe('CategoryButtonBar', () => {
    beforeEach(() => resetStore());

    it('renders categories sorted by sortOrder', () => {
        resetStore({ phraseCategories: categories });
        render(<CategoryButtonBar />);

        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(3);
        expect(buttons[0]).toHaveTextContent('AUTORIZAÇÃO');
        expect(buttons[1]).toHaveTextContent('PUSHBACK');
        expect(buttons[2]).toHaveTextContent('TAXI');
    });

    it('highlights the selected category with aria-pressed', () => {
        resetStore({ phraseCategories: categories, selectedCategoryId: 'c2' });
        render(<CategoryButtonBar />);

        expect(screen.getByText('PUSHBACK')).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('AUTORIZAÇÃO')).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByText('TAXI')).toHaveAttribute('aria-pressed', 'false');
    });

    it('selects category and clears phrase search on click', () => {
        resetStore({
            phraseCategories: categories,
            selectedCategoryId: 'c1',
            phraseSearchQuery: 'some query',
        });
        render(<CategoryButtonBar />);

        fireEvent.click(screen.getByText('TAXI'));

        const state = useAppStore.getState();
        expect(state.selectedCategoryId).toBe('c3');
        expect(state.phraseSearchQuery).toBe('');
    });

    it('renders nothing when no categories exist', () => {
        resetStore({ phraseCategories: [] });
        render(<CategoryButtonBar />);

        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('supports keyboard activation via Enter on native buttons', () => {
        resetStore({ phraseCategories: categories, selectedCategoryId: 'c1' });
        render(<CategoryButtonBar />);

        const taxiBtn = screen.getByText('TAXI');
        taxiBtn.focus();
        fireEvent.keyDown(taxiBtn, { key: 'Enter' });
        fireEvent.click(taxiBtn);

        expect(useAppStore.getState().selectedCategoryId).toBe('c3');
    });
});
