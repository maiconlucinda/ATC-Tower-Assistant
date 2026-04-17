'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useAppStore } from '@/store';
import { searchPhrases } from '@/lib/utils';
import type { TransitionFix } from '@/types';

import GlobalVariablesBar from '@/components/GlobalVariablesBar';
import EditModeToggle from '@/components/EditModeToggle';
import FixSearchInput from '@/components/FixSearchInput';
import DepartureResultTable from '@/components/DepartureResultTable';
import SidEditor from '@/components/SidEditor';
import PhraseSearchInput from '@/components/PhraseSearchInput';
import CategoryButtonBar from '@/components/CategoryButtonBar';
import PhraseEntryList from '@/components/PhraseEntryList';
import CategoryEditor from '@/components/CategoryEditor';
import PhraseEntryEditor from '@/components/PhraseEntryEditor';
import ImportExportControls from '@/components/ImportExportControls';

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [selectedFix, setSelectedFix] = useState<{ fix: TransitionFix; isOmniFallback: boolean } | null>(null);
  const [leftPanelPercent, setLeftPanelPercent] = useState(35);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const hydrate = useAppStore((s) => s.hydrate);
  const warning = useAppStore((s) => s.warning);
  const editMode = useAppStore((s) => s.editMode);
  const phraseSearchQuery = useAppStore((s) => s.phraseSearchQuery);
  const selectedCategoryId = useAppStore((s) => s.selectedCategoryId);
  const phraseEntries = useAppStore((s) => s.phraseEntries);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  const handleFixSelected = useCallback((fix: TransitionFix, isOmniFallback: boolean) => {
    setSelectedFix({ fix, isOmniFallback });
  }, []);

  const handleMouseDown = useCallback(() => {
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPanelPercent(Math.min(Math.max(pct, 15), 85));
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const displayedEntries = useMemo(() => {
    if (phraseSearchQuery) {
      return searchPhrases(phraseEntries, phraseSearchQuery);
    }
    if (selectedCategoryId) {
      return phraseEntries.filter((e) => e.categoryId === selectedCategoryId);
    }
    return [];
  }, [phraseSearchQuery, phraseEntries, selectedCategoryId]);

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
          <ImportExportControls />
          <EditModeToggle />
        </div>
      </div>

      {/* Two-panel split with draggable resizer */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel — Departure Resolver */}
        <div style={{ width: `${leftPanelPercent}%` }} className="flex flex-col overflow-y-auto p-4 gap-4 shrink-0">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Departure Resolver
          </h2>
          <FixSearchInput onFixSelected={handleFixSelected} />
          {selectedFix && (
            <DepartureResultTable fix={selectedFix.fix} isOmniFallback={selectedFix.isOmniFallback} />
          )}
          {editMode && (
            <div className="mt-4 border-t border-zinc-700 pt-4">
              <SidEditor />
            </div>
          )}
        </div>

        {/* Draggable resizer */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 shrink-0 cursor-col-resize bg-zinc-800 hover:bg-blue-600 active:bg-blue-500 transition-colors flex items-center justify-center group"
          title="Arrastar para redimensionar"
        >
          <div className="w-0.5 h-8 bg-zinc-600 group-hover:bg-blue-300 rounded-full transition-colors" />
        </div>

        {/* Right panel — Phraseology Helper */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4 min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Phraseology Helper
          </h2>
          <PhraseSearchInput />
          <CategoryButtonBar />
          <PhraseEntryList entries={displayedEntries} />
          {editMode && (
            <div className="mt-4 border-t border-zinc-700 pt-4 flex flex-col gap-4">
              <CategoryEditor />
              <PhraseEntryEditor />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
