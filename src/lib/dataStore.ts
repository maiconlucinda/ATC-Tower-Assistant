import type {
    TransitionFix,
    PhraseCategory,
    PhraseEntry,
    GlobalVariable,
    SidProcedure,
    AppData,
} from "@/types";

const STORAGE_KEYS = {
    fixes: "atc_fixes",
    sidProcedures: "atc_sid_procedures",
    phraseCategories: "atc_phrase_categories",
    phraseEntries: "atc_phrase_entries",
    globalVariables: "atc_global_variables",
    schemaVersion: "atc_schema_version",
} as const;

const DEFAULT_SCHEMA_VERSION = 1;

export interface LoadResult {
    data: AppData;
    warning: string | null;
}

function parseJsonOrNull<T>(raw: string | null): T | null {
    if (raw === null) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function loadAll(): LoadResult {
    const warnings: string[] = [];

    const rawFixes = localStorage.getItem(STORAGE_KEYS.fixes);
    const rawCategories = localStorage.getItem(STORAGE_KEYS.phraseCategories);
    const rawEntries = localStorage.getItem(STORAGE_KEYS.phraseEntries);
    const rawGlobalVars = localStorage.getItem(STORAGE_KEYS.globalVariables);
    const rawVersion = localStorage.getItem(STORAGE_KEYS.schemaVersion);

    let fixes: TransitionFix[] = [];
    let sidProcedures: SidProcedure[] = [];
    let phraseCategories: PhraseCategory[] = [];
    let phraseEntries: PhraseEntry[] = [];
    let globalVariables: GlobalVariable[] = [];
    let version: number = DEFAULT_SCHEMA_VERSION;

    if (rawFixes !== null) {
        const parsed = parseJsonOrNull<TransitionFix[]>(rawFixes);
        if (Array.isArray(parsed)) {
            fixes = parsed;
        } else {
            warnings.push("Could not parse fixes data.");
        }
    }

    const rawSids = localStorage.getItem(STORAGE_KEYS.sidProcedures);
    if (rawSids !== null) {
        const parsed = parseJsonOrNull<SidProcedure[]>(rawSids);
        if (Array.isArray(parsed)) {
            sidProcedures = parsed;
        } else {
            warnings.push("Could not parse SID procedures data.");
        }
    }

    if (rawCategories !== null) {
        const parsed = parseJsonOrNull<PhraseCategory[]>(rawCategories);
        if (Array.isArray(parsed)) {
            phraseCategories = parsed;
        } else {
            warnings.push("Could not parse phrase categories data.");
        }
    }

    if (rawEntries !== null) {
        const parsed = parseJsonOrNull<PhraseEntry[]>(rawEntries);
        if (Array.isArray(parsed)) {
            phraseEntries = parsed;
        } else {
            warnings.push("Could not parse phrase entries data.");
        }
    }

    if (rawGlobalVars !== null) {
        const parsed = parseJsonOrNull<GlobalVariable[]>(rawGlobalVars);
        if (Array.isArray(parsed)) {
            globalVariables = parsed;
        } else {
            warnings.push("Could not parse global variables data.");
        }
    }

    if (rawVersion !== null) {
        const parsed = parseJsonOrNull<number>(rawVersion);
        if (typeof parsed === "number" && Number.isFinite(parsed)) {
            version = parsed;
        } else {
            warnings.push("Could not parse schema version.");
        }
    }

    return {
        data: { fixes, sidProcedures, phraseCategories, phraseEntries, globalVariables, version },
        warning: warnings.length > 0 ? warnings.join(" ") : null,
    };
}

export function persistFixes(fixes: TransitionFix[]): void {
    localStorage.setItem(STORAGE_KEYS.fixes, JSON.stringify(fixes));
}

export function persistSidProcedures(sids: SidProcedure[]): void {
    localStorage.setItem(STORAGE_KEYS.sidProcedures, JSON.stringify(sids));
}

export function persistPhrases(
    categories: PhraseCategory[],
    entries: PhraseEntry[]
): void {
    localStorage.setItem(
        STORAGE_KEYS.phraseCategories,
        JSON.stringify(categories)
    );
    localStorage.setItem(STORAGE_KEYS.phraseEntries, JSON.stringify(entries));
}

export function persistGlobalVariables(vars: GlobalVariable[]): void {
    localStorage.setItem(STORAGE_KEYS.globalVariables, JSON.stringify(vars));
}
