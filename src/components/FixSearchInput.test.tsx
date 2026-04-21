import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FixSearchInput from './FixSearchInput';
import type { TransitionFix } from '@/types';

// Build a mock fixMap
const mockFixes: TransitionFix[] = [
    {
        id: '1',
        name: 'EPDEP',
        direction: 'NORTH',
        departureOptions: [
            { id: 'o1', runway: '11L', sid: 'ESBU6A' },
        ],
    },
    {
        id: '2',
        name: 'GNV',
        direction: 'SOUTH',
        departureOptions: [
            { id: 'o2', runway: '11R', sid: 'GNV1A' },
        ],
    },
    {
        id: '3',
        name: 'OMNI',
        direction: 'MIXED',
        departureOptions: [
            { id: 'o3', runway: '11L', sid: 'OMNI1' },
            { id: 'o4', runway: '11R', sid: 'OMNI2' },
        ],
    },
    {
        id: '4',
        name: 'NELEG',
        direction: 'NORTH',
        departureOptions: [],
    },
];

const mockFixMap = new Map<string, TransitionFix>();
for (const fix of mockFixes) {
    mockFixMap.set(fix.name.toUpperCase(), fix);
}

// Mock the store
vi.mock('@/store', () => ({
    useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
        selector({ fixMap: mockFixMap }),
}));

describe('FixSearchInput', () => {
    let onFixSelected: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        onFixSelected = vi.fn();
    });

    it('renders the search input', () => {
        render(<FixSearchInput onFixSelected={onFixSelected} />);
        expect(screen.getByPlaceholderText('Fixo...')).toBeInTheDocument();
    });

    it('shows matching fixes in dropdown when typing', () => {
        render(<FixSearchInput onFixSelected={onFixSelected} />);
        const input = screen.getByPlaceholderText('Fixo...');
        fireEvent.change(input, { target: { value: 'ep' } });
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(screen.getByText('EPDEP')).toBeInTheDocument();
    });

    it('does not show dropdown for empty input', () => {
        render(<FixSearchInput onFixSelected={onFixSelected} />);
        const input = screen.getByPlaceholderText('Fixo...');
        fireEvent.change(input, { target: { value: '' } });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('selects a fix with Enter on highlighted item', () => {
        render(<FixSearchInput onFixSelected={onFixSelected} />);
        const input = screen.getByPlaceholderText('Fixo...');
        fireEvent.change(input, { target: { value: 'ep' } });
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onFixSelected).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'EPDEP' }),
            false,
        );
    });

    it('navigates dropdown with arrow keys', () => {
        render(<FixSearchInput onFixSelected={onFixSelected} />);
        const input = screen.getByPlaceholderText('Fixo...');
        // Type 'n' to match NELEG, GNV, OMNI (all contain 'n' case-insensitive? Let's use 'ne' for NELEG)
        fireEvent.change(input, { target: { value: 'ne' } });
        // Should show NELEG
        expect(screen.getByText('NELEG')).toBeInTheDocument();

        fireEvent.keyDown(input, { key: 'ArrowDown' });
        const option = screen.getByRole('option', { selected: true });
        expect(option).toHaveTextContent('NELEG');
    });

    it('closes dropdown on Escape', () => {
        render(<FixSearchInput onFixSelected={onFixSelected} />);
        const input = screen.getByPlaceholderText('Fixo...');
        fireEvent.change(input, { target: { value: 'ep' } });
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('falls back to OMNI when no match and Enter pressed', () => {
        render(<FixSearchInput onFixSelected={onFixSelected} />);
        const input = screen.getByPlaceholderText('Fixo...');
        fireEvent.change(input, { target: { value: 'ZZZZZ' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onFixSelected).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'OMNI' }),
            true,
        );
    });

    it('selects fix on mouse click in dropdown', () => {
        render(<FixSearchInput onFixSelected={onFixSelected} />);
        const input = screen.getByPlaceholderText('Fixo...');
        fireEvent.change(input, { target: { value: 'gnv' } });
        const option = screen.getByText('GNV');
        fireEvent.mouseDown(option);
        expect(onFixSelected).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'GNV' }),
            false,
        );
    });

    it('wraps around when navigating past last item', () => {
        render(<FixSearchInput onFixSelected={onFixSelected} />);
        const input = screen.getByPlaceholderText('Fixo...');
        fireEvent.change(input, { target: { value: 'ep' } });
        // Only EPDEP matches, so ArrowDown once highlights it, ArrowDown again wraps to 0
        fireEvent.keyDown(input, { key: 'ArrowDown' }); // index 0
        fireEvent.keyDown(input, { key: 'ArrowDown' }); // wraps to 0
        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('wraps around when navigating up past first item', () => {
        render(<FixSearchInput onFixSelected={onFixSelected} />);
        const input = screen.getByPlaceholderText('Fixo...');
        fireEvent.change(input, { target: { value: 'ep' } });
        fireEvent.keyDown(input, { key: 'ArrowUp' }); // wraps to last (index 0 since only 1 match)
        const options = screen.getAllByRole('option');
        expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');
    });

    it('confirms exact match on Enter without dropdown highlight', () => {
        render(<FixSearchInput onFixSelected={onFixSelected} />);
        const input = screen.getByPlaceholderText('Fixo...');
        fireEvent.change(input, { target: { value: 'EPDEP' } });
        // Don't arrow down, just press Enter directly
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onFixSelected).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'EPDEP' }),
            false,
        );
    });
});
