'use client';

import { useRef, useState } from 'react';
import { exportAll, importAll } from '@/lib/importExport';
import { persistSidProcedures } from '@/lib/dataStore';
import { useAppStore } from '@/store';
import type { SidProcedure } from '@/types';

const GITHUB_DATA_URL = 'https://github.com/maiconlucinda/ATC-Tower-Assistant/tree/main/data';

export default function ImportExportControls() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleExport = () => {
        try {
            const json = exportAll();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const date = new Date().toISOString().slice(0, 10);
            const a = document.createElement('a');
            a.href = url;
            a.download = `atc-config-${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            setMessage({ type: 'error', text: 'Falha ao exportar.' });
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string);

                // Persist sidProcedures DIRECTLY before importAll
                if (Array.isArray(parsed.sidProcedures) && parsed.sidProcedures.length > 0) {
                    persistSidProcedures(parsed.sidProcedures as SidProcedure[]);
                }

                const result = importAll(parsed);
                if (result.valid) {
                    useAppStore.getState().hydrate();
                    const state = useAppStore.getState();
                    setMessage({ type: 'success', text: `Importado: ${state.sidProcedures.length} SIDs, ${state.fixes.length} fixos` });
                } else {
                    setMessage({ type: 'error', text: `Falha: ${result.errors.join('; ')}` });
                }
            } catch (err) {
                setMessage({ type: 'error', text: `Erro: ${err instanceof Error ? err.message : String(err)}` });
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.onerror = () => {
            setMessage({ type: 'error', text: 'Falha ao ler arquivo.' });
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex items-center gap-2">
            <a
                href={GITHUB_DATA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-700 text-white hover:bg-blue-600 transition-colors"
            >
                📥 Dados Iniciais
            </a>
            <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
            >
                Export
            </button>
            <button
                onClick={handleImportClick}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
            >
                Import
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Import configuration file"
            />
            {message && (
                <span
                    className={`text-xs ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
                    role="status"
                >
                    {message.text}
                </span>
            )}
        </div>
    );
}
