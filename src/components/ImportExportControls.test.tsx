import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ImportExportControls from './ImportExportControls';
import * as importExportModule from '@/lib/importExport';

// Mock URL.createObjectURL / revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
globalThis.URL.createObjectURL = mockCreateObjectURL;
globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

describe('ImportExportControls', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        mockCreateObjectURL.mockClear();
        mockRevokeObjectURL.mockClear();
    });

    it('renders Export and Import buttons', () => {
        render(<ImportExportControls />);
        expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument();
    });

    it('has a hidden file input for import', () => {
        render(<ImportExportControls />);
        const fileInput = screen.getByLabelText('Import configuration file');
        expect(fileInput).toHaveClass('hidden');
        expect(fileInput).toHaveAttribute('type', 'file');
        expect(fileInput).toHaveAttribute('accept', '.json');
    });

    it('triggers file input click when Import button is clicked', () => {
        render(<ImportExportControls />);
        const fileInput = screen.getByLabelText('Import configuration file');
        const clickSpy = vi.spyOn(fileInput, 'click');
        fireEvent.click(screen.getByRole('button', { name: 'Import' }));
        expect(clickSpy).toHaveBeenCalled();
    });

    it('calls exportAll and triggers download on Export click', () => {
        const exportSpy = vi.spyOn(importExportModule, 'exportAll').mockReturnValue('{"version":1}');
        const appendSpy = vi.spyOn(document.body, 'appendChild');
        const removeSpy = vi.spyOn(document.body, 'removeChild');

        render(<ImportExportControls />);
        fireEvent.click(screen.getByRole('button', { name: 'Export' }));

        expect(exportSpy).toHaveBeenCalled();
        expect(mockCreateObjectURL).toHaveBeenCalled();
        // Verify an anchor was appended and removed
        expect(appendSpy).toHaveBeenCalled();
        expect(removeSpy).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('shows error on invalid JSON import', async () => {
        render(<ImportExportControls />);
        const fileInput = screen.getByLabelText('Import configuration file');

        const file = new File(['not valid json'], 'bad.json', { type: 'application/json' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByRole('status')).toHaveTextContent(/Erro:/);
        });
    });

    it('shows validation errors when importAll returns invalid', async () => {
        vi.spyOn(importExportModule, 'importAll').mockReturnValue({
            valid: false,
            errors: ['Missing required field: fixes'],
        });

        render(<ImportExportControls />);
        const fileInput = screen.getByLabelText('Import configuration file');

        const file = new File(['{"bad":true}'], 'bad.json', { type: 'application/json' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByRole('status')).toHaveTextContent('Falha');
            expect(screen.getByRole('status')).toHaveTextContent('Missing required field: fixes');
        });
    });

    it('shows success and calls hydrate on valid import', async () => {
        vi.spyOn(importExportModule, 'importAll').mockReturnValue({
            valid: true,
            errors: [],
            data: {
                fixes: [],
                phraseCategories: [],
                phraseEntries: [],
                globalVariables: [],
                version: 1,
            },
        });

        // Mock hydrate on the store
        const { useAppStore } = await import('@/store');
        const hydrateSpy = vi.fn();
        useAppStore.setState({ hydrate: hydrateSpy } as never);

        render(<ImportExportControls />);
        const fileInput = screen.getByLabelText('Import configuration file');

        const validData = JSON.stringify({
            fixes: [], phraseCategories: [], phraseEntries: [], globalVariables: [], version: 1,
        });
        const file = new File([validData], 'config.json', { type: 'application/json' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByRole('status')).toHaveTextContent(/Importado.*SIDs.*fixos/);
        });
        expect(hydrateSpy).toHaveBeenCalled();
    });
});
