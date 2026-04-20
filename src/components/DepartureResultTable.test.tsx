import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DepartureResultTable from './DepartureResultTable';
import type { TransitionFix } from '@/types';

const northFix: TransitionFix = {
    id: '1',
    name: 'EPDEP',
    direction: 'NORTH',
    departureOptions: [
        { id: 'o1', runway: '11L', sid: 'ESBU6A' },
        { id: 'o2', runway: '11L', sid: 'ESBU6B' },
        { id: 'o3', runway: '29R', sid: 'ESBU6C' },
        { id: 'o4', runway: '11R', sid: 'ESBU6D' },
        { id: 'o5', runway: '11R', sid: 'ESBU6E' },
    ],
};

const southFix: TransitionFix = {
    id: '2',
    name: 'GNV',
    direction: 'SOUTH',
    departureOptions: [
        { id: 's1', runway: '11R', sid: 'GNV1A' },
        { id: 's2', runway: '29L', sid: 'GNV1B' },
    ],
};

const mixedFix: TransitionFix = {
    id: '3',
    name: 'OMNI',
    direction: 'MIXED',
    departureOptions: [
        { id: 'm1', runway: '11L', sid: 'OMNI1' },
        { id: 'm2', runway: '11R', sid: 'OMNI2' },
    ],
};

const emptyFix: TransitionFix = {
    id: '4',
    name: 'EMPTY',
    direction: 'NORTH',
    departureOptions: [],
};

describe('DepartureResultTable', () => {
    it('renders runway grid', () => {
        render(<DepartureResultTable fix={northFix} isOmniFallback={false} />);
        const headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings.length).toBe(3);
    });

    it('renders SID names', () => {
        render(<DepartureResultTable fix={mixedFix} isOmniFallback={true} />);
        expect(screen.getByText('OMNI1')).toBeInTheDocument();
        expect(screen.getByText('OMNI2')).toBeInTheDocument();
    });

    it('does not show OMNI fallback banner when isOmniFallback is false', () => {
        render(<DepartureResultTable fix={northFix} isOmniFallback={false} />);
        expect(screen.queryByText(/OMNI fallback/)).not.toBeInTheDocument();
    });

    it('groups departure options by runway', () => {
        render(<DepartureResultTable fix={northFix} isOmniFallback={false} />);
        const headings = screen.getAllByRole('heading', { level: 3 });
        const texts = headings.map(h => h.textContent);
        expect(texts).toContain('11L');
        expect(texts).toContain('29R');
        expect(texts).toContain('11R');
    });

    it('sorts options within each runway by insertion order', () => {
        render(<DepartureResultTable fix={northFix} isOmniFallback={false} />);
        // 11R has ESBU6D then ESBU6E in insertion order
        // ESBU6D should appear before ESBU6E
        const allItems = screen.getAllByText(/ESBU6/);
        const esbu6dIdx = allItems.findIndex((el) => el.textContent === 'ESBU6D');
        const esbu6eIdx = allItems.findIndex((el) => el.textContent === 'ESBU6E');
        expect(esbu6dIdx).toBeLessThan(esbu6eIdx);
    });

    it('highlights runways for NORTH direction (11L, 29R)', () => {
        const { container } = render(<DepartureResultTable fix={northFix} isOmniFallback={false} />);
        const cards = container.querySelectorAll('[class*="rounded border"]');
        const card11L = Array.from(cards).find((s) => s.querySelector('h3')?.textContent === '11L');
        const card29R = Array.from(cards).find((s) => s.querySelector('h3')?.textContent === '29R');
        const card11R = Array.from(cards).find((s) => s.querySelector('h3')?.textContent === '11R');

        expect(card11L?.className).toContain('border-blue-500');
        expect(card29R?.className).toContain('border-blue-500');
        expect(card11R?.className).not.toContain('border-blue-500');
    });

    it('highlights runways for SOUTH direction (11R, 29L)', () => {
        const { container } = render(<DepartureResultTable fix={southFix} isOmniFallback={false} />);
        const cards = container.querySelectorAll('[class*="rounded border"]');
        const card11R = Array.from(cards).find((s) => s.querySelector('h3')?.textContent === '11R');
        const card29L = Array.from(cards).find((s) => s.querySelector('h3')?.textContent === '29L');

        expect(card11R?.className).toContain('border-blue-500');
        expect(card29L?.className).toContain('border-blue-500');
    });

    it('does not highlight any runway for MIXED direction', () => {
        const { container } = render(<DepartureResultTable fix={mixedFix} isOmniFallback={false} />);
        const buttons = container.querySelectorAll('button');
        for (const btn of buttons) {
            expect(btn.className).not.toContain('bg-blue-600');
        }
    });

    it('shows empty message when no departure options', () => {
        render(<DepartureResultTable fix={emptyFix} isOmniFallback={false} />);
        expect(screen.getByText('Nenhuma opção de saída disponível.')).toBeInTheDocument();
    });

    it('runway headings are rendered', () => {
        render(<DepartureResultTable fix={northFix} isOmniFallback={false} />);
        const headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings.length).toBeGreaterThan(0);
    });
});
