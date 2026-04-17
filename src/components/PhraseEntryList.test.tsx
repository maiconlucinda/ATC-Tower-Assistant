import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhraseEntryList, { parseContentSegments } from './PhraseEntryList';
import type { PhraseEntry } from '@/types';

// Mock the store
const mockGlobalVariables = [
    { name: 'aeroporto', token: '{aeroporto}', value: 'SBGR' },
    { name: 'pista_decolagem', token: '{pista_decolagem}', value: '' },
    { name: 'qnh', token: '{qnh}', value: '1013' },
];

vi.mock('@/store', () => ({
    useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
        selector({ globalVariables: mockGlobalVariables }),
}));

describe('parseContentSegments', () => {
    const varsMap = new Map<string, string>([
        ['aeroporto', 'SBGR'],
        ['pista_decolagem', ''],
        ['qnh', '1013'],
    ]);

    it('returns plain text for content without tokens', () => {
        const segments = parseContentSegments('Hello world', varsMap);
        expect(segments).toEqual([{ type: 'text', value: 'Hello world' }]);
    });

    it('resolves global variables with values', () => {
        const segments = parseContentSegments('Airport {aeroporto}', varsMap);
        expect(segments).toEqual([
            { type: 'text', value: 'Airport ' },
            { type: 'resolved', varName: 'aeroporto', value: 'SBGR' },
        ]);
    });

    it('marks global variables with empty values as unresolved', () => {
        const segments = parseContentSegments('Runway {pista_decolagem}', varsMap);
        expect(segments).toEqual([
            { type: 'text', value: 'Runway ' },
            { type: 'unresolved', token: '{pista_decolagem}' },
        ]);
    });

    it('marks tokens not in global vars as dynamic placeholders', () => {
        const segments = parseContentSegments('Call {callsign}', varsMap);
        expect(segments).toEqual([
            { type: 'text', value: 'Call ' },
            { type: 'dynamic', token: '{callsign}' },
        ]);
    });

    it('handles mixed tokens in a single string', () => {
        const segments = parseContentSegments(
            '{aeroporto} tower, {callsign}, QNH {qnh}, runway {pista_decolagem}',
            varsMap
        );
        expect(segments).toEqual([
            { type: 'resolved', varName: 'aeroporto', value: 'SBGR' },
            { type: 'text', value: ' tower, ' },
            { type: 'dynamic', token: '{callsign}' },
            { type: 'text', value: ', QNH ' },
            { type: 'resolved', varName: 'qnh', value: '1013' },
            { type: 'text', value: ', runway ' },
            { type: 'unresolved', token: '{pista_decolagem}' },
        ]);
    });

    it('returns empty array for empty string', () => {
        expect(parseContentSegments('', varsMap)).toEqual([]);
    });
});

describe('PhraseEntryList', () => {
    const baseEntry: PhraseEntry = {
        id: '1',
        categoryId: 'cat1',
        title: 'Clearance',
        contentPtBr: '{callsign}, autorizado {aeroporto}',
        contentEn: '{callsign}, cleared {aeroporto}',
        notes: 'Standard clearance',
        sortOrder: 1,
    };

    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        writeTextMock.mockClear();
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextMock },
            writable: true,
            configurable: true,
        });
    });

    it('renders title when present', () => {
        render(<PhraseEntryList entries={[baseEntry]} />);
        expect(screen.getByText('Clearance')).toBeInTheDocument();
    });

    it('does not render title when absent', () => {
        const entry = { ...baseEntry, title: undefined };
        render(<PhraseEntryList entries={[entry]} />);
        expect(screen.queryByText('Clearance')).not.toBeInTheDocument();
    });

    it('renders both language flags', () => {
        render(<PhraseEntryList entries={[baseEntry]} />);
        expect(screen.getByLabelText('Português')).toBeInTheDocument();
        expect(screen.getByLabelText('English')).toBeInTheDocument();
    });

    it('renders notes when present', () => {
        render(<PhraseEntryList entries={[baseEntry]} />);
        expect(screen.getByText('Standard clearance')).toBeInTheDocument();
    });

    it('does not render notes when absent', () => {
        const entry = { ...baseEntry, notes: undefined };
        render(<PhraseEntryList entries={[entry]} />);
        expect(screen.queryByText('Standard clearance')).not.toBeInTheDocument();
    });

    it('shows only pt-BR when en is empty', () => {
        const entry = { ...baseEntry, contentEn: '' };
        render(<PhraseEntryList entries={[entry]} />);
        expect(screen.getByLabelText('Português')).toBeInTheDocument();
        expect(screen.queryByLabelText('English')).not.toBeInTheDocument();
    });

    it('shows only en when pt-BR is empty', () => {
        const entry = { ...baseEntry, contentPtBr: '' };
        render(<PhraseEntryList entries={[entry]} />);
        expect(screen.queryByLabelText('Português')).not.toBeInTheDocument();
        expect(screen.getByLabelText('English')).toBeInTheDocument();
    });

    it('renders empty state when no entries', () => {
        render(<PhraseEntryList entries={[]} />);
        expect(screen.getByText('No phrases to display.')).toBeInTheDocument();
    });

    it('sorts entries by sortOrder', () => {
        const entries: PhraseEntry[] = [
            { ...baseEntry, id: '2', title: 'Second', sortOrder: 2 },
            { ...baseEntry, id: '1', title: 'First', sortOrder: 1 },
            { ...baseEntry, id: '3', title: 'Third', sortOrder: 3 },
        ];
        render(<PhraseEntryList entries={entries} />);
        const headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings[0]).toHaveTextContent('First');
        expect(headings[1]).toHaveTextContent('Second');
        expect(headings[2]).toHaveTextContent('Third');
    });

    it('renders resolved global variable with green styling', () => {
        const entry: PhraseEntry = {
            ...baseEntry,
            contentPtBr: 'Airport {aeroporto}',
            contentEn: '',
        };
        render(<PhraseEntryList entries={[entry]} />);
        const resolved = screen.getByText('SBGR');
        expect(resolved).toHaveClass('text-green-300');
    });

    it('renders unresolved global variable with warning styling', () => {
        const entry: PhraseEntry = {
            ...baseEntry,
            contentPtBr: 'Runway {pista_decolagem}',
            contentEn: '',
        };
        render(<PhraseEntryList entries={[entry]} />);
        const unresolved = screen.getByText('{pista_decolagem}');
        expect(unresolved.className).toContain('bg-orange');
    });

    it('renders dynamic placeholder with cyan styling', () => {
        const entry: PhraseEntry = {
            ...baseEntry,
            contentPtBr: 'Call {callsign}',
            contentEn: '',
        };
        render(<PhraseEntryList entries={[entry]} />);
        const dynamic = screen.getByText('{callsign}');
        expect(dynamic.className).toContain('bg-cyan');
    });

    it('copies resolved text on copy button click', async () => {
        render(<PhraseEntryList entries={[baseEntry]} />);
        const copyBtn = screen.getByLabelText('Copy pt-BR');
        await userEvent.click(copyBtn);
        expect(writeTextMock).toHaveBeenCalledWith(
            '{callsign}, autorizado SBGR'
        );
    });

    it('has separate copy buttons per language', () => {
        render(<PhraseEntryList entries={[baseEntry]} />);
        expect(screen.getByLabelText('Copy pt-BR')).toBeInTheDocument();
        expect(screen.getByLabelText('Copy en')).toBeInTheDocument();
    });
});
