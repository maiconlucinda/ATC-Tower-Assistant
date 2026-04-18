import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DepartureResultTable from './DepartureResultTable';
import type { TransitionFix } from '@/types';

const northFix: TransitionFix = {
    id: '1',
    name: 'EPDEP',
    direction: 'NORTH',
    departureOptions: [
        { id: 'o1', runway: '11L', sid: 'ESBU6A', priority: 1 },
        { id: 'o2', runway: '11L', sid: 'ESBU6B', priority: 2 },
        { id: 'o3', runway: '29R', sid: 'ESBU6C', priority: 1 },
        { id: 'o4', runway: '11R', sid: 'ESBU6D', priority: 3 },
        { id: 'o5', runway: '11R', sid: 'ESBU6E', priority: 1 },
    ],
};

const southFix: TransitionFix = {
    id: '2',
    name: 'GNV',
    direction: 'SOUTH',
    departureOptions: [
        { id: 's1', runway: '11R', sid: 'GNV1A', priority: 1 },
        { id: 's2', runway: '29L', sid: 'GNV1B', priority: 2 },
    ],
};

const mixedFix: TransitionFix = {
    id: '3',
    name: 'OMNI',
    direction: 'MIXED',
    departureOptions: [
        { id: 'm1', runway: '11L', sid: 'OMNI1', priority: 1 },
        { id: 'm2', runway: '11R', sid: 'OMNI2', priority: 1 },
    ],
};

const emptyFix: TransitionFix = {
    id: '4',
    name: 'EMPTY',
    direction: 'NORTH',
    departureOptions: [],
};

describe('DepartureResultTable', () => {
    it('displays fix name and direction', () => {
        render(<DepartureResultTable fix={northFix} isOmniFallback={false} />);
        expect(screen.getByText('EPDEP')).toBeInTheDocument();
        expect(screen.getByText('(NORTH)')).toBeInTheDocument();
    });

    it('shows OMNI fallback banner when isOmniFallback is true', () => {
        render(<DepartureResultTable fix={mixedFix} isOmniFallback={true} />);
        expect(screen.getByText(/OMNI fallback/)).toBeInTheDocument();
    });

    it('does not show OMNI fallback banner when isOmniFallback is false', () => {
        render(<DepartureResultTable fix={northFix} isOmniFallback={false} />);
        expect(screen.queryByText(/OMNI fallback/)).not.toBeInTheDocument();
    });

    it('groups departure options by runway', () => {
        render(<DepartureResultTable fix={northFix} isOmniFallback={false} />);
        // RunwayName splits "11L" into "11" + "L" in separate spans
        const headings = screen.getAllByRole('heading', { level: 3 });
        const texts = headings.map(h => h.textContent);
        expect(texts).toContain('Pista 11L');
        expect(texts).toContain('Pista 29R');
        expect(texts).toContain('Pista 11R');
    });

    it('sorts options by priority within each runway (lowest first)', () => {
        render(<DepartureResultTable fix={northFix} isOmniFallback={false} />);
        // 11R has ESBU6E (priority 1) and ESBU6D (priority 3)
        // ESBU6E should appear before ESBU6D
        const allItems = screen.getAllByText(/ESBU6/);
        const esbu6eIdx = allItems.findIndex((el) => el.textContent === 'ESBU6E');
        const esbu6dIdx = allItems.findIndex((el) => el.textContent === 'ESBU6D');
        expect(esbu6eIdx).toBeLessThan(esbu6dIdx);
    });

    it('highlights runways for NORTH direction (11L, 29R)', () => {
        const { container } = render(<DepartureResultTable fix={northFix} isOmniFallback={false} />);
        // Runway nav buttons: 11L and 29R should have blue styling
        const buttons = container.querySelectorAll('button');
        const btn11L = Array.from(buttons).find((b) => b.textContent === '11L');
        const btn29R = Array.from(buttons).find((b) => b.textContent === '29R');
        const btn11R = Array.from(buttons).find((b) => b.textContent === '11R');

        expect(btn11L?.className).toContain('bg-blue-600');
        expect(btn29R?.className).toContain('bg-blue-600');
        expect(btn11R?.className).not.toContain('bg-blue-600');
    });

    it('highlights runways for SOUTH direction (11R, 29L)', () => {
        const { container } = render(<DepartureResultTable fix={southFix} isOmniFallback={false} />);
        const buttons = container.querySelectorAll('button');
        const btn11R = Array.from(buttons).find((b) => b.textContent === '11R');
        const btn29L = Array.from(buttons).find((b) => b.textContent === '29L');

        expect(btn11R?.className).toContain('bg-blue-600');
        expect(btn29L?.className).toContain('bg-blue-600');
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

    it('runway buttons are clickable', () => {
        // scrollIntoView is not natively available in jsdom, mock it
        Element.prototype.scrollIntoView = () => { };
        render(<DepartureResultTable fix={northFix} isOmniFallback={false} />);
        const btn = screen.getByRole('button', { name: '11L' });
        // Should not throw when clicked
        fireEvent.click(btn);
    });
});
