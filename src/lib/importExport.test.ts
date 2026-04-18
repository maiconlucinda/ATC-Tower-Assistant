import { describe, it, expect, beforeEach } from "vitest";
import { exportAll, validateImportData, importAll } from "./importExport";
import type {
    TransitionFix,
    PhraseCategory,
    PhraseEntry,
    GlobalVariable,
    AppData,
} from "@/types";
import { persistFixes, persistPhrases, persistGlobalVariables } from "./dataStore";

function makeValidAppData(): AppData {
    return {
        fixes: [
            {
                id: "f1",
                name: "EPDEP",
                direction: "NORTH",
                departureOptions: [
                    { id: "d1", runway: "11L", sid: "ESBU6A" },
                ],
            },
        ],
        phraseCategories: [{ id: "c1", name: "TAXI", sortOrder: 1 }],
        phraseEntries: [
            {
                id: "e1",
                categoryId: "c1",
                contentPtBr: "Táxi para pista",
                contentEn: "Taxi to runway",
                sortOrder: 1,
            },
        ],
        globalVariables: [
            { name: "aeroporto", token: "{aeroporto}", value: "SBGR" },
        ],
        version: 1,
    };
}

beforeEach(() => {
    localStorage.clear();
});

describe("validateImportData", () => {
    it("accepts valid AppData", () => {
        const data = makeValidAppData();
        const result = validateImportData(data);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.data).toEqual(data);
    });

    it("rejects non-object input", () => {
        const result = validateImportData("not an object");
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Import data must be an object");
    });

    it("rejects null input", () => {
        const result = validateImportData(null);
        expect(result.valid).toBe(false);
    });

    it("rejects missing top-level fields", () => {
        const result = validateImportData({});
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(5);
        expect(result.errors.some((e) => e.includes("fixes"))).toBe(true);
        expect(result.errors.some((e) => e.includes("phraseCategories"))).toBe(true);
        expect(result.errors.some((e) => e.includes("phraseEntries"))).toBe(true);
        expect(result.errors.some((e) => e.includes("globalVariables"))).toBe(true);
        expect(result.errors.some((e) => e.includes("version"))).toBe(true);
    });

    it("rejects fix with invalid direction", () => {
        const data = makeValidAppData();
        data.fixes[0].direction = "INVALID" as any;
        const result = validateImportData(data);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes("direction"))).toBe(true);
    });

    it("rejects fix with missing departureOptions", () => {
        const data = makeValidAppData();
        (data.fixes[0] as any).departureOptions = "not-array";
        const result = validateImportData(data);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes("departureOptions"))).toBe(true);
    });

    it("rejects departure option with wrong types", () => {
        const data = makeValidAppData();
        (data.fixes[0].departureOptions[0] as any).sid = 123;
        const result = validateImportData(data);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes("sid"))).toBe(true);
    });

    it("rejects category with missing sortOrder", () => {
        const data = makeValidAppData();
        (data.phraseCategories[0] as any).sortOrder = undefined;
        const result = validateImportData(data);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes("sortOrder"))).toBe(true);
    });

    it("rejects entry with non-string title", () => {
        const data = makeValidAppData();
        (data.phraseEntries[0] as any).title = 123;
        const result = validateImportData(data);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes("title"))).toBe(true);
    });

    it("accepts entry with optional title and notes as strings", () => {
        const data = makeValidAppData();
        data.phraseEntries[0].title = "My Title";
        data.phraseEntries[0].notes = "Some notes";
        const result = validateImportData(data);
        expect(result.valid).toBe(true);
    });

    it("accepts entry without optional title and notes", () => {
        const data = makeValidAppData();
        delete (data.phraseEntries[0] as any).title;
        delete (data.phraseEntries[0] as any).notes;
        const result = validateImportData(data);
        expect(result.valid).toBe(true);
    });

    it("rejects global variable with missing token", () => {
        const data = makeValidAppData();
        (data.globalVariables[0] as any).token = 42;
        const result = validateImportData(data);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes("token"))).toBe(true);
    });

    it("rejects version as string", () => {
        const data: any = { ...makeValidAppData(), version: "1" };
        const result = validateImportData(data);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes("version"))).toBe(true);
    });
});

describe("exportAll", () => {
    it("returns JSON string of current AppData from localStorage", () => {
        const fixes: TransitionFix[] = [
            {
                id: "f1",
                name: "OMNI",
                direction: "MIXED",
                departureOptions: [],
            },
        ];
        const categories: PhraseCategory[] = [
            { id: "c1", name: "DECOLAGEM", sortOrder: 1 },
        ];
        const entries: PhraseEntry[] = [];
        const vars: GlobalVariable[] = [
            { name: "qnh", token: "{qnh}", value: "1013" },
        ];

        persistFixes(fixes);
        persistPhrases(categories, entries);
        persistGlobalVariables(vars);

        const json = exportAll();
        const parsed = JSON.parse(json);

        expect(parsed.fixes).toEqual(fixes);
        expect(parsed.phraseCategories).toEqual(categories);
        expect(parsed.phraseEntries).toEqual(entries);
        expect(parsed.globalVariables).toEqual(vars);
        expect(parsed.version).toBe(1);
    });

    it("returns empty data when localStorage is empty", () => {
        const json = exportAll();
        const parsed = JSON.parse(json);

        expect(parsed.fixes).toEqual([]);
        expect(parsed.phraseCategories).toEqual([]);
        expect(parsed.phraseEntries).toEqual([]);
        expect(parsed.globalVariables).toEqual([]);
        expect(parsed.version).toBe(1);
    });
});

describe("importAll", () => {
    it("persists valid data to localStorage and returns valid result", () => {
        const data = makeValidAppData();
        const result = importAll(data);

        expect(result.valid).toBe(true);
        expect(result.data).toEqual(data);

        // Verify data was persisted
        expect(JSON.parse(localStorage.getItem("atc_fixes")!)).toEqual(
            data.fixes
        );
        expect(
            JSON.parse(localStorage.getItem("atc_phrase_categories")!)
        ).toEqual(data.phraseCategories);
        expect(
            JSON.parse(localStorage.getItem("atc_phrase_entries")!)
        ).toEqual(data.phraseEntries);
        expect(
            JSON.parse(localStorage.getItem("atc_global_variables")!)
        ).toEqual(data.globalVariables);
    });

    it("rejects invalid data without modifying localStorage", () => {
        // Seed some existing data
        persistFixes([
            { id: "old", name: "OLD", direction: "NORTH", departureOptions: [] },
        ]);

        const result = importAll({ bad: "data" });

        expect(result.valid).toBe(false);
        // Existing data should remain untouched
        const existing = JSON.parse(localStorage.getItem("atc_fixes")!);
        expect(existing[0].name).toBe("OLD");
    });

    it("replaces existing data on valid import", () => {
        // Seed old data
        persistFixes([
            { id: "old", name: "OLD", direction: "SOUTH", departureOptions: [] },
        ]);

        const newData = makeValidAppData();
        importAll(newData);

        const stored = JSON.parse(localStorage.getItem("atc_fixes")!);
        expect(stored).toEqual(newData.fixes);
        expect(stored[0].name).toBe("EPDEP");
    });
});
