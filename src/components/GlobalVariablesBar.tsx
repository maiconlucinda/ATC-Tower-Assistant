'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';

function UtcClock() {
    const [time, setTime] = useState('');

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setTime(now.toISOString().slice(11, 19) + 'Z');
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    if (!time) return null;

    return (
        <div className="flex items-center gap-1.5 shrink-0 pr-2 mr-2 border-r border-zinc-700">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">UTC</span>
            <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums">{time}</span>
        </div>
    );
}

export default function GlobalVariablesBar() {
    const globalVariables = useAppStore((s) => s.globalVariables);
    const editMode = useAppStore((s) => s.editMode);
    const updateGlobalVariable = useAppStore((s) => s.updateGlobalVariable);
    const addGlobalVariable = useAppStore((s) => s.addGlobalVariable);
    const deleteGlobalVariable = useAppStore((s) => s.deleteGlobalVariable);

    const [newVarName, setNewVarName] = useState('');
    const [addError, setAddError] = useState('');
    const [copiedVar, setCopiedVar] = useState<string | null>(null);

    const handleCopyTag = useCallback((varName: string) => {
        const tag = `{${varName}}`;
        navigator.clipboard.writeText(tag);
        setCopiedVar(varName);
        setTimeout(() => setCopiedVar(null), 1200);
    }, []);

    const handleAdd = () => {
        const trimmed = newVarName.trim().toLowerCase();
        if (!trimmed) return;
        const success = addGlobalVariable(trimmed);
        if (success) {
            setNewVarName('');
            setAddError('');
        } else {
            setAddError(`"${trimmed}" already exists`);
        }
    };

    const handleAddKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    };

    return (
        <div className="w-full bg-zinc-900 border-b border-zinc-700 px-3 py-1.5 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
                <UtcClock />
                {globalVariables.map((v) => (
                    <div key={v.name} className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => handleCopyTag(v.name)}
                            className="text-[10px] text-zinc-500 uppercase tracking-wide hover:text-blue-400 cursor-pointer transition-colors"
                            title={`Clique para copiar {${v.name}}`}
                            aria-label={`Copiar tag {${v.name}}`}
                        >
                            {copiedVar === v.name ? '✓ copiado' : v.name.replace(/_/g, ' ')}
                        </button>
                        <input
                            id={`gv-${v.name}`}
                            type="text"
                            value={v.value}
                            onChange={(e) => updateGlobalVariable(v.name, e.target.value)}
                            className="bg-zinc-800 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-100 w-20 focus:outline-none focus:border-blue-500"
                            aria-label={`${v.name} value`}
                        />
                        {editMode && (
                            <button
                                onClick={() => deleteGlobalVariable(v.name)}
                                className="text-red-400 hover:text-red-300 text-[10px] px-0.5"
                                aria-label={`Delete ${v.name}`}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}

                {editMode && (
                    <div className="flex items-center gap-1 shrink-0 ml-1 pl-1 border-l border-zinc-700">
                        <input
                            type="text"
                            value={newVarName}
                            onChange={(e) => {
                                setNewVarName(e.target.value);
                                setAddError('');
                            }}
                            onKeyDown={handleAddKeyDown}
                            placeholder="nova variável"
                            className="bg-zinc-800 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-100 w-24 focus:outline-none focus:border-blue-500"
                            aria-label="New variable name"
                        />
                        <button
                            onClick={handleAdd}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-1.5 py-0.5 rounded"
                        >
                            +
                        </button>
                        {addError && (
                            <span className="text-red-400 text-[10px]">{addError}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
