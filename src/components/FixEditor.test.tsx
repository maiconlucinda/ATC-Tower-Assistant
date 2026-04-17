import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import FixEditor from './FixEditor';
import { useAppStore } from '@/store';
import type { TransitionFix } from '@/types';

const makeFix = (name: string, direction: 'NORTH' | 'SOUTH' | 'MIXED' = 'NORTH', opts: TransitionFix['departureOptions'] = []): TransitionFix => ({
    id: `id-${name}`,
    name: name.toUpperCase(),
    direction,
    departureOptions: opts,
});

describe('FixEditor', () => {
    beforeEach(() => {
        useAppStore.setState({
            fixes: [],
            fixMap: new Map(),
            editMode: true,
        });
    });

    it('renders create form with name input, direction dropdown, and create button', () => {
        render(<FixEditor />);
        expect(screen.getByLabelText('New fix name')).toBeInTheDocument();
        expect(screen.getByLabelText('New fix direction')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('creates a new fix and clears the form', () => {
        render(<FixEditor />);
        const nameInput = screen.getByLabelText('New fix name');
        const dirSelect = screen.getByLabelText('New fix direction');

        fireEvent.change(nameInput, { target: { value: 'EPDEP' } });
        fireEvent.change(dirSelect, { target: { value: 'SOUTH' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        const state = useAppStore.getState();
        expect(state.fixes).toHaveLength(1);
        expect(state.fixes[0].name).toBe('EPDEP');
        expect(state.fixes[0].direction).toBe('SOUTH');
        expect((nameInput as HTMLInputElement).value).toBe('');
    });

    it('shows error on duplicate fix name', () => {
        const fix = makeFix('EPDEP');
        const fixMap = new Map([['EPDEP', fix]]);
        useAppStore.setState({ fixes: [fix], fixMap });

        render(<FixEditor />);
        fireEvent.change(screen.getByLabelText('New fix name'), { target: { value: 'epdep' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create' }));

        expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });

    it('renders existing fixes with editable fields', () => {
        const fix = makeFix('GNV', 'SOUTH');
        useAppStore.setState({ fixes: [fix], fixMap: new Map([['GNV', fix]]) });

        render(<FixEditor />);
        expect(screen.getByDisplayValue('GNV')).toBeInTheDocument();
    });

    it('shows delete button for non-OMNI fixes', () => {
        const fix = makeFix('GNV');
        useAppStore.setState({ fixes: [fix], fixMap: new Map([['GNV', fix]]) });

        render(<FixEditor />);
        expect(screen.getByLabelText('Delete fix GNV')).toBeInTheDocument();
    });

    it('hides delete button for OMNI fix and shows message', () => {
        const omni = makeFix('OMNI', 'MIXED');
        useAppStore.setState({ fixes: [omni], fixMap: new Map([['OMNI', omni]]) });

        render(<FixEditor />);
        expect(screen.queryByLabelText('Delete fix OMNI')).not.toBeInTheDocument();
        expect(screen.getByText(/cannot delete omni/i)).toBeInTheDocument();
    });

    it('deletes a non-OMNI fix', () => {
        const fix = makeFix('GNV');
        useAppStore.setState({ fixes: [fix], fixMap: new Map([['GNV', fix]]) });

        render(<FixEditor />);
        fireEvent.click(screen.getByLabelText('Delete fix GNV'));

        expect(useAppStore.getState().fixes).toHaveLength(0);
    });

    it('adds a departure option to a fix', () => {
        const fix = makeFix('GNV');
        useAppStore.setState({ fixes: [fix], fixMap: new Map([['GNV', fix]]) });

        render(<FixEditor />);
        fireEvent.click(screen.getByLabelText('Add departure option to GNV'));

        const state = useAppStore.getState();
        expect(state.fixes[0].departureOptions).toHaveLength(1);
    });

    it('renders departure option fields and allows removal', () => {
        const fix = makeFix('GNV', 'NORTH', [
            { id: 'opt-1', runway: '11L', sid: 'ESBU6A', priority: 1 },
        ]);
        useAppStore.setState({ fixes: [fix], fixMap: new Map([['GNV', fix]]) });

        render(<FixEditor />);
        expect(screen.getByDisplayValue('11L')).toBeInTheDocument();
        expect(screen.getByDisplayValue('ESBU6A')).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText('Remove departure option'));
        expect(useAppStore.getState().fixes[0].departureOptions).toHaveLength(0);
    });

    it('shows empty state when no fixes exist', () => {
        render(<FixEditor />);
        expect(screen.getByText(/no fixes yet/i)).toBeInTheDocument();
    });
});
