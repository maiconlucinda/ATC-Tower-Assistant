export type Direction = "NORTH" | "SOUTH" | "MIXED";

export interface DepartureOption {
    id: string;
    runway: string;
    sid: string;
    priority: number;
    direction?: Direction;
}

export interface TransitionFix {
    id: string;
    name: string;
    direction: Direction;
    departureOptions: DepartureOption[];
}

export interface PhraseCategory {
    id: string;
    name: string;
    sortOrder: number;
}

export interface PhraseEntry {
    id: string;
    categoryId: string;
    title?: string;
    contentPtBr: string;
    contentEn: string;
    notes?: string;
    sortOrder: number;
}

export interface GlobalVariable {
    name: string;
    token: string;
    value: string;
}

export interface SidProcedure {
    id: string;
    name: string;       // e.g. "ESBU6A"
    runway: string;     // e.g. "11L"
    direction: Direction;
    fixNames: string[]; // e.g. ["EPDEP", "PULUV", "ILKUS", "UGUGA", "PABUM", "KOGDI"]
    priority: number;   // lower = preferred
}

export interface AppData {
    fixes: TransitionFix[];
    sidProcedures?: SidProcedure[];
    phraseCategories: PhraseCategory[];
    phraseEntries: PhraseEntry[];
    globalVariables: GlobalVariable[];
    version: number;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    data?: AppData;
}
