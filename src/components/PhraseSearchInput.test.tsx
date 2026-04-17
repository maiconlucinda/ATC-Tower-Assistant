import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import PhraseSearchInput from './PhraseSearchInput';
import { useAppStore } from '@/store';

function resetStore(overrides: Partial<ReturnType<typeof useAppStore.getState>> = {}) {
    useAppStore.setState({
        phraseSearchQuery: '',
        ...overrides,
    });
}

describe('PhraseSearchInput', () => {
    beforeEach(() => resetStore());

    it('renders a search input with placeholder', () => {
        render(<PhraseSearchInput />);
        expect(screen.getByPlaceholderText('Search phrases...')).toBeInTheDocument();
    });

    it('updates phraseSearchQuery in the store as the user types', () => {
        render(<PhraseSearchInput />);
        const input = screen.getByPlaceholderText('Search phrases...');

        fireEvent.change(input, { target: { value: 'taxi' } });
        expect(useAppStore.getState().phraseSearchQuery).toBe('taxi');
    });

    it('does not show clear button when query is empty', () => {
        render(<PhraseSearchInput />);
        expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('shows clear button when query is non-empty', () => {
        resetStore({ phraseSearchQuery: 'test' });
        render(<PhraseSearchInput />);
        expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('clears the search query when clear button is clicked', () => {
        resetStore({ phraseSearchQuery: 'some query' });
        render(<PhraseSearchInput />);

        fireEvent.click(screen.getByLabelText('Clear search'));
        expect(useAppStore.getState().phraseSearchQuery).toBe('');
    });

    it('reflects the current store value in the input', () => {
        resetStore({ phraseSearchQuery: 'decolagem' });
        render(<PhraseSearchInput />);

        const input = screen.getByPlaceholderText('Search phrases...') as HTMLInputElement;
        expect(input.value).toBe('decolagem');
    });
});
