import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import GlobalVariablesBar from './GlobalVariablesBar';
import { useAppStore } from '@/store';

const defaultVars = [
    { name: 'aeroporto', token: '{aeroporto}', value: 'SBGR' },
    { name: 'qnh', token: '{qnh}', value: '1013' },
];

describe('GlobalVariablesBar', () => {
    beforeEach(() => {
        useAppStore.setState({
            globalVariables: defaultVars.map((v) => ({ ...v })),
            editMode: false,
        });
    });

    it('renders an input for each global variable', () => {
        render(<GlobalVariablesBar />);
        expect(screen.getByLabelText('aeroporto value')).toHaveValue('SBGR');
        expect(screen.getByLabelText('qnh value')).toHaveValue('1013');
    });

    it('inputs are always editable in View Mode', () => {
        render(<GlobalVariablesBar />);
        const input = screen.getByLabelText('aeroporto value');
        fireEvent.change(input, { target: { value: 'SBBR' } });
        expect(input).toHaveValue('SBBR');
    });

    it('inputs are editable in Edit Mode', () => {
        useAppStore.setState({ editMode: true });
        render(<GlobalVariablesBar />);
        const input = screen.getByLabelText('qnh value');
        fireEvent.change(input, { target: { value: '1020' } });
        expect(input).toHaveValue('1020');
    });

    it('does not show delete buttons in View Mode', () => {
        render(<GlobalVariablesBar />);
        expect(screen.queryByLabelText('Delete aeroporto')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Delete qnh')).not.toBeInTheDocument();
    });

    it('shows delete buttons in Edit Mode', () => {
        useAppStore.setState({ editMode: true });
        render(<GlobalVariablesBar />);
        expect(screen.getByLabelText('Delete aeroporto')).toBeInTheDocument();
        expect(screen.getByLabelText('Delete qnh')).toBeInTheDocument();
    });

    it('does not show Add controls in View Mode', () => {
        render(<GlobalVariablesBar />);
        expect(screen.queryByLabelText('New variable name')).not.toBeInTheDocument();
        expect(screen.queryByText('+')).not.toBeInTheDocument();
    });

    it('shows Add controls in Edit Mode', () => {
        useAppStore.setState({ editMode: true });
        render(<GlobalVariablesBar />);
        expect(screen.getByLabelText('New variable name')).toBeInTheDocument();
        expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('adds a new variable via Add button', () => {
        useAppStore.setState({ editMode: true });
        render(<GlobalVariablesBar />);
        const input = screen.getByLabelText('New variable name');
        fireEvent.change(input, { target: { value: 'frequencia' } });
        fireEvent.click(screen.getByText('+'));
        expect(screen.getByLabelText('frequencia value')).toBeInTheDocument();
    });

    it('adds a new variable via Enter key', () => {
        useAppStore.setState({ editMode: true });
        render(<GlobalVariablesBar />);
        const input = screen.getByLabelText('New variable name');
        fireEvent.change(input, { target: { value: 'vento' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(screen.getByLabelText('vento value')).toBeInTheDocument();
    });

    it('shows error when adding duplicate variable', () => {
        useAppStore.setState({ editMode: true });
        render(<GlobalVariablesBar />);
        const input = screen.getByLabelText('New variable name');
        fireEvent.change(input, { target: { value: 'aeroporto' } });
        fireEvent.click(screen.getByText('+'));
        expect(screen.getByText('"aeroporto" already exists')).toBeInTheDocument();
    });

    it('deletes a variable in Edit Mode', () => {
        useAppStore.setState({ editMode: true });
        render(<GlobalVariablesBar />);
        fireEvent.click(screen.getByLabelText('Delete qnh'));
        expect(screen.queryByLabelText('qnh value')).not.toBeInTheDocument();
        expect(screen.getByLabelText('aeroporto value')).toBeInTheDocument();
    });
});
