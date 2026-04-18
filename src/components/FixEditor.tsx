'use client';

import { useState } from 'react';
import { useAppStore } from '@/store';
import type { Direction, TransitionFix } from '@/types';

const DIRECTIONS: Direction[] = ['NORTH', 'SOUTH', 'MIXED'];

function CreateFixForm() {
    const addFix = useAppStore((s) => s.addFix);
    const [name, setName] = useState('');
    const [direction, setDirection] = useState<Direction>('NORTH');
    const [error, setError] = useState('');

    const handleCreate = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const success = addFix(trimmed, direction);
        if (success) {
            setName('');
            setDirection('NORTH');
            setError('');
        } else {
            setError(`A fix named "${trimmed.toUpperCase()}" already exists.`);
        }
    };

    return (
        <div className="mb-4 p-3 bg-zinc-800 rounded border border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-200 mb-2">Create New Fix</h3>
            <div className="flex items-center gap-2 flex-wrap">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder="Fix name"
                    className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 w-32 focus:outline-none focus:border-blue-500"
                    aria-label="New fix name"
                />
                <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as Direction)}
                    className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                    aria-label="New fix direction"
                >
                    {DIRECTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded"
                >
                    Create
                </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
    );
}

function DepartureOptionRow({ fixId, option }: { fixId: string; option: { id: string; runway: string; sid: string; direction?: Direction } }) {
    const updateDepartureOption = useAppStore((s) => s.updateDepartureOption);
    const removeDepartureOption = useAppStore((s) => s.removeDepartureOption);

    return (
        <div className="flex items-center gap-1.5">
            <input
                type="text"
                value={option.runway}
                onChange={(e) => updateDepartureOption(fixId, option.id, { runway: e.target.value })}
                className="bg-zinc-900 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-100 w-16 focus:outline-none focus:border-blue-500"
                aria-label="Runway"
                placeholder="RWY"
            />
            <input
                type="text"
                value={option.sid}
                onChange={(e) => updateDepartureOption(fixId, option.id, { sid: e.target.value })}
                className="bg-zinc-900 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-100 w-20 focus:outline-none focus:border-blue-500"
                aria-label="SID"
                placeholder="SID"
            />
            <select
                value={option.direction ?? ''}
                onChange={(e) => updateDepartureOption(fixId, option.id, { direction: (e.target.value || undefined) as Direction | undefined })}
                className="bg-zinc-900 border border-zinc-600 rounded px-1.5 py-0.5 text-xs text-zinc-100 w-16 focus:outline-none focus:border-blue-500"
                aria-label="SID direction"
            >
                <option value="">—</option>
                {DIRECTIONS.map((d) => (
                    <option key={d} value={d}>{d === 'NORTH' ? 'N' : d === 'SOUTH' ? 'S' : 'N/S'}</option>
                ))}
            </select>
            <button
                onClick={() => removeDepartureOption(fixId, option.id)}
                className="text-red-400 hover:text-red-300 text-xs px-1"
                aria-label="Remove departure option"
            >
                ✕
            </button>
        </div>
    );
}

function FixRow({ fix }: { fix: TransitionFix }) {
    const updateFix = useAppStore((s) => s.updateFix);
    const deleteFix = useAppStore((s) => s.deleteFix);
    const addDepartureOption = useAppStore((s) => s.addDepartureOption);
    const [nameError, setNameError] = useState('');

    const isOmni = fix.name.toUpperCase() === 'OMNI';

    const handleNameChange = (newName: string) => {
        setNameError('');
        const success = updateFix(fix.id, { name: newName });
        if (!success && newName.trim()) {
            setNameError(`"${newName.toUpperCase()}" already exists.`);
        }
    };

    const handleAddOption = () => {
        addDepartureOption(fix.id, '', '');
    };

    return (
        <div className="p-3 bg-zinc-800 rounded border border-zinc-700">
            <div className="flex items-center gap-2 flex-wrap mb-2">
                <input
                    type="text"
                    value={fix.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 w-32 font-semibold focus:outline-none focus:border-blue-500"
                    aria-label={`Fix name for ${fix.name}`}
                />
                <select
                    value={fix.direction}
                    onChange={(e) => updateFix(fix.id, { direction: e.target.value as Direction })}
                    className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                    aria-label={`Direction for ${fix.name}`}
                >
                    {DIRECTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
                {!isOmni && (
                    <button
                        onClick={() => deleteFix(fix.id)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-400/30 rounded hover:border-red-400/60"
                        aria-label={`Delete fix ${fix.name}`}
                    >
                        Delete
                    </button>
                )}
                {isOmni && (
                    <span className="text-zinc-500 text-xs italic">Cannot delete OMNI</span>
                )}
            </div>
            {nameError && <p className="text-red-400 text-xs mb-2">{nameError}</p>}

            <div className="ml-2">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-zinc-400">Departure Options</span>
                    <button
                        onClick={handleAddOption}
                        className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs px-2 py-0.5 rounded"
                        aria-label={`Add departure option to ${fix.name}`}
                    >
                        + Add
                    </button>
                </div>
                <div className="flex flex-col gap-1">
                    {fix.departureOptions.map((opt) => (
                        <DepartureOptionRow key={opt.id} fixId={fix.id} option={opt} />
                    ))}
                    {fix.departureOptions.length === 0 && (
                        <span className="text-xs text-zinc-500 italic">No departure options</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function FixEditor() {
    const fixes = useAppStore((s) => s.fixes);

    return (
        <div className="flex flex-col gap-3">
            <CreateFixForm />
            <h3 className="text-sm font-semibold text-zinc-300">Existing Fixes</h3>
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                {fixes.map((fix) => (
                    <FixRow key={fix.id} fix={fix} />
                ))}
                {fixes.length === 0 && (
                    <p className="text-xs text-zinc-500 italic">No fixes yet. Create one above.</p>
                )}
            </div>
        </div>
    );
}
