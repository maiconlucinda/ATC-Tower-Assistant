'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store';
import type { TransitionFix } from '@/types';

import GlobalVariablesBar from '@/components/GlobalVariablesBar';
import EditModeToggle from '@/components/EditModeToggle';
import FixSearchInput from '@/components/FixSearchInput';
import DepartureResultTable from '@/components/DepartureResultTable';
import SidEditor from '@/components/SidEditor';
import CategoryButtonBar from '@/components/CategoryButtonBar';
import PhraseEntryList from '@/components/PhraseEntryList';
import CategoryEditor from '@/components/CategoryEditor';
import PhraseEntryEditor from '@/components/PhraseEntryEditor';
import ImportExportControls from '@/components/ImportExportControls';
import IcaoSearch from '@/components/IcaoSearch';

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [selectedFix, setSelectedFix] = useState<{ fix: TransitionFix; isOmniFallback: boolean } | null>(null);
  const [runwayFilter, setRunwayFilter] = useState<Set<string>>(new Set());

  const hydrate = useAppStore((s) => s.hydrate);
  const warning = useAppStore((s) => s.warning);
  const editMode = useAppStore((s) => s.editMode);
  const selectedCategoryId = useAppStore((s) => s.selectedCategoryId);
  const phraseEntries = useAppStore((s) => s.phraseEntries);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  const handleFixSelected = useCallback((fix: TransitionFix, isOmniFallback: boolean) => {
    setSelectedFix({ fix, isOmniFallback });
  }, []);

  const availableRunways = useMemo(() => {
    if (!selectedFix) return [];
    const seen = new Set<string>();
    for (const opt of selectedFix.fix.departureOptions) {
      seen.add(opt.runway);
    }
    return Array.from(seen).sort();
  }, [selectedFix]);

  const handleRunwayToggle = useCallback((rwy: string) => {
    setRunwayFilter((prev) => {
      const next = new Set(prev);
      if (next.has(rwy)) {
        next.delete(rwy);
      } else {
        next.add(rwy);
      }
      return next;
    });
  }, []);

  const displayedEntries = useMemo(() => {
    if (selectedCategoryId) {
      return phraseEntries.filter((e) => e.categoryId === selectedCategoryId);
    }
    return [];
  }, [phraseEntries, selectedCategoryId]);

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Warning banner */}
      {warning && (
        <div className="bg-amber-900/60 border-b border-amber-700 px-4 py-2 text-sm text-amber-200">
          ⚠ {warning}
        </div>
      )}

      {/* Global Variables header */}
      <GlobalVariablesBar />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
        <h1 className="text-xs font-semibold text-zinc-400 tracking-wide uppercase shrink-0">ATC Tower</h1>
        <div className="flex items-center gap-3">
          <IcaoSearch />
          <ImportExportControls />
          <EditModeToggle />
        </div>
      </div>

      {/* Top section — Departure Resolver (compact, no scroll) */}
      <div className="shrink-0 border-b border-zinc-700 px-2 py-1">
        <div className="flex items-center gap-2">
          <div className="w-40">
            <FixSearchInput onFixSelected={handleFixSelected} />
          </div>
          {selectedFix && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-100">{selectedFix.fix.name}</span>
              <span className={`text-xs font-medium ${selectedFix.fix.direction === 'NORTH' ? 'text-sky-400' : selectedFix.fix.direction === 'SOUTH' ? 'text-orange-400' : 'text-purple-400'}`}>
                {selectedFix.fix.direction}
              </span>
              {selectedFix.isOmniFallback && (
                <span className="text-[10px] text-amber-300 border border-amber-600 bg-amber-900/40 px-1 py-0.5 rounded">OMNI</span>
              )}
              <span className="text-zinc-600 mx-0.5">|</span>
              {availableRunways.map((rwy) => (
                <button
                  key={rwy}
                  onClick={() => handleRunwayToggle(rwy)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${runwayFilter.has(rwy)
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                >
                  {rwy}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedFix && (
          <div className="mt-1">
            <DepartureResultTable fix={selectedFix.fix} isOmniFallback={selectedFix.isOmniFallback} runwayFilter={runwayFilter} />
          </div>
        )}
        {editMode && (
          <div className="mt-2 border-t border-zinc-700 pt-2">
            <SidEditor />
          </div>
        )}
      </div>

      {/* Bottom section — Phraseology Helper (scrollable) */}
      <div className="flex-1 flex flex-col overflow-y-auto p-3 gap-2 min-h-0">
        <CategoryButtonBar />
        <PhraseEntryList entries={displayedEntries} />
        {editMode && (
          <div className="mt-3 border-t border-zinc-700 pt-3 flex flex-col gap-3">
            <CategoryEditor />
            <PhraseEntryEditor />
          </div>
        )}
      </div>
    </div>
  );
}
