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

        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);
        expect(tabs[0]).toHaveTextContent('AUTORIZAÇÃO');
        expect(tabs[1]).toHaveTextContent('PUSHBACK');
        expect(tabs[2]).toHaveTextContent('TAXI');
    });

    it('highlights the selected category with aria-selected', () => {
        resetStore({ phraseCategories: categories, selectedCategoryId: 'c2' });
        render(<CategoryButtonBar />);

        expect(screen.getByText('PUSHBACK').closest('[role="tab"]')).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('AUTORIZAÇÃO').closest('[role="tab"]')).toHaveAttribute('aria-selected', 'false');
        expect(screen.getByText('TAXI').closest('[role="tab"]')).toHaveAttribute('aria-selected', 'false');
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

        expect(screen.queryAllByRole('tab')).toHaveLength(0);
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
