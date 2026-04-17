'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import type { Direction, SidProcedure } from '@/types';

const DIRECTIONS: Direction[] = ['NORTH', 'SOUTH', 'MIXED'];
const DIR_LABEL: Record<Direction, string> = { NORTH: 'N', SOUTH: 'S', MIXED: 'N/S' };
const DIR_COLOR: Record<Direction, string> = { NORTH: 'text-sky-400', SOUTH: 'text-orange-400', MIXED: 'text-purple-400' };

function CreateSidForm() {
    const addSidProcedure = useAppStore((s) => s.addSidProcedure);
    const [name, setName] = useState('');
    const [runway, setRunway] = useState('11L');
    const [direction, setDirection] = useState<Direction>('NORTH');
    const [fixNames, setFixNames] = useState('');
    const [priority, setPriority] = useState(1);

    const handleCreate = () => {
        const trimmedName = name.trim();
        const fixes = fixNames.split(',').map(f => f.trim()).filter(Boolean);
        if (!trimmedName || fixes.length === 0) return;
        addSidProcedure(trimmedName, runway, direction, fixes, priority);
        setName('');
        setFixNames('');
        setPriority(1);
    };

    return (
        <div className="p-3 bg-zinc-800 rounded border border-zinc-700 mb-3">
            <h3 className="text-sm font-semibold text-zinc-200 mb-2">Novo Procedimento (SID)</h3>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome da SID (ex: ESBU6A)"
                        className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 w-36 focus:outline-none focus:border-blue-500"
                        aria-label="SID name"
                    />
                    <select
                        value={runway}
                        onChange={(e) => setRunway(e.target.value)}
                        className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                        aria-label="Runway"
                    >
                        <option value="11L">11L</option>
                        <option value="11R">11R</option>
                        <option value="29R">29R</option>
                        <option value="29L">29L</option>
                    </select>
                    <select
                        value={direction}
                        onChange={(e) => setDirection(e.target.value as Direction)}
                        className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                        aria-label="Direction"
                    >
                        {DIRECTIONS.map((d) => (
                            <option key={d} value={d}>{DIR_LABEL[d]}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={priority}
                        onChange={(e) => setPriority(Number(e.target.value))}
                        className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 w-14 focus:outline-none focus:border-blue-500"
                        aria-label="Priority"
                        min={1}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={fixNames}
                        onChange={(e) => setFixNames(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                        placeholder="Fixos separados por vírgula (ex: EPDEP, PULUV, ILKUS)"
                        className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 flex-1 focus:outline-none focus:border-blue-500"
                        aria-label="Fix names"
                    />
                    <button
                        onClick={handleCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded shrink-0"
                    >
                        Criar
                    </button>
                </div>
            </div>
        </div>
    );
}

function SidRow({ sid }: { sid: SidProcedure }) {
    const updateSidProcedure = useAppStore((s) => s.updateSidProcedure);
    const deleteSidProcedure = useAppStore((s) => s.deleteSidProcedure);
    const [editingFixes, setEditingFixes] = useState(false);
    const [fixText, setFixText] = useState(sid.fixNames.join(', '));

    const saveFixes = () => {
        const fixes = fixText.split(',').map(f => f.trim()).filter(Boolean);
        updateSidProcedure(sid.id, { fixNames: fixes });
        setEditingFixes(false);
    };

    return (
        <div className="p-2.5 bg-zinc-800 rounded border border-zinc-700">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <input
                    type="text"
                    value={sid.name}
                    onChange={(e) => updateSidProcedure(sid.id, { name: e.target.value })}
                    className="bg-zinc-900 border border-zinc-600 rounded px-2 py-0.5 text-sm font-bold text-zinc-100 w-24 focus:outline-none focus:border-blue-500"
                    aria-label={`Nome da SID ${sid.name}`}
                />
                <select
                    value={sid.runway}
                    onChange={(e) => updateSidProcedure(sid.id, { runway: e.target.value })}
                    className="bg-zinc-900 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                    aria-label={`Pista da SID ${sid.name}`}
                >
                    <option value="11L">11L</option>
                    <option value="11R">11R</option>
                    <option value="29R">29R</option>
                    <option value="29L">29L</option>
                </select>
                <select
                    value={sid.direction}
                    onChange={(e) => updateSidProcedure(sid.id, { direction: e.target.value as Direction })}
                    className="bg-zinc-900 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                    aria-label={`Direção da SID ${sid.name}`}
                >
                    {DIRECTIONS.map((d) => (
                        <option key={d} value={d}>{DIR_LABEL[d]}</option>
                    ))}
                </select>
                <input
                    type="number"
                    value={sid.priority}
                    onChange={(e) => updateSidProcedure(sid.id, { priority: Number(e.target.value) })}
                    className="bg-zinc-900 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-100 w-12 focus:outline-none focus:border-blue-500"
                    aria-label={`Prioridade da SID ${sid.name}`}
                    min={1}
                />
                <button
                    onClick={() => deleteSidProcedure(sid.id)}
                    className="text-red-400 hover:text-red-300 text-xs px-1 ml-auto"
                    aria-label={`Deletar SID ${sid.name}`}
                >
                    ✕
                </button>
            </div>
            <div className="ml-1">
                {editingFixes ? (
                    <div className="flex items-center gap-1.5">
                        <input
                            type="text"
                            value={fixText}
                            onChange={(e) => setFixText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveFixes(); if (e.key === 'Escape') setEditingFixes(false); }}
                            className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-100 flex-1 focus:outline-none focus:border-blue-500"
                            autoFocus
                        />
                        <button onClick={saveFixes} className="text-green-400 hover:text-green-300 text-xs px-1">✓</button>
                        <button onClick={() => setEditingFixes(false)} className="text-zinc-400 hover:text-zinc-300 text-xs px-1">✕</button>
                    </div>
                ) : (
                    <button
                        onClick={() => { setFixText(sid.fixNames.join(', ')); setEditingFixes(true); }}
                        className="text-xs text-zinc-400 hover:text-zinc-200 text-left"
                        title="Clique para editar fixos"
                    >
                        Fixos: <span className="text-zinc-200">{sid.fixNames.join(', ')}</span>
                    </button>
                )}
            </div>
        </div>
    );
}

export default function SidEditor() {
    const sidProcedures = useAppStore((s) => s.sidProcedures);
    const [filterRunway, setFilterRunway] = useState<string>('');

    const filtered = filterRunway
        ? sidProcedures.filter((s) => s.runway === filterRunway)
        : sidProcedures;

    // Group by runway
    const grouped = new Map<string, SidProcedure[]>();
    for (const sid of filtered) {
        if (!grouped.has(sid.runway)) grouped.set(sid.runway, []);
        grouped.get(sid.runway)!.push(sid);
    }

    return (
        <div className="flex flex-col gap-3">
            <CreateSidForm />
            <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-300">Procedimentos (SIDs)</h3>
                <select
                    value={filterRunway}
                    onChange={(e) => setFilterRunway(e.target.value)}
                    className="bg-zinc-900 border border-zinc-600 rounded px-2 py-0.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                    <option value="">Todas as pistas</option>
                    <option value="11L">11L</option>
                    <option value="11R">11R</option>
                    <option value="29R">29R</option>
                    <option value="29L">29L</option>
                </select>
                <span className="text-xs text-zinc-500">{filtered.length} SIDs</span>
            </div>
            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                {Array.from(grouped.entries()).map(([runway, sids]) => (
                    <div key={runway}>
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-1.5">Pista {runway}</h4>
                        <div className="flex flex-col gap-1.5">
                            {sids.map((sid) => (
                                <SidRow key={sid.id} sid={sid} />
                            ))}
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <p className="text-xs text-zinc-500 italic">Nenhum procedimento cadastrado. Crie um acima.</p>
                )}
            </div>
        </div>
    );
}
