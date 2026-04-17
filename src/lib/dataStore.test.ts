import { describe, it, expect, beforeEach } from "vitest";
import {
    loadAll,
    persistFixes,
    persistPhrases,
    persistGlobalVariables,
} from "./dataStore";
import type {
    TransitionFix,
    PhraseCategory,
    PhraseEntry,
    GlobalVariable,
} from "@/types";

beforeEach(() => {
    localStorage.clear();
});

describe("loadAll", () => {
    it("returns empty data with no warning when localStorage is empty", () => {
        const result = loadAll();
        expect(result.data).toEqual({
            fixes: [],
            sidProcedures: [],
            phraseCategories: [],
            phraseEntries: [],
            globalVariables: [],
            version: 1,
        });
        expect(result.warning).toBeNull();
    });

    it("loads valid data from localStorage", () => {
        const fixes: TransitionFix[] = [
            {
                id: "1",
                name: "EPDEP",
                direction: "NORTH",
                departureOptions: [
                    { id: "d1", runway: "11L", sid: "ESBU6A", priority: 1 },
                ],
            },
        ];
        const categories: PhraseCategory[] = [
            { id: "c1", name: "TAXI", sortOrder: 1 },
        ];
        const entries: PhraseEntry[] = [
            {
                id: "e1",
                categoryId: "c1",
                contentPtBr: "Olá",
                contentEn: "Hello",
                sortOrder: 1,
            },
        ];
        const globalVars: GlobalVariable[] = [
            { name: "aeroporto", token: "{aeroporto}", value: "SBGR" },
        ];

        localStorage.setItem("atc_fixes", JSON.stringify(fixes));
        localStorage.setItem("atc_phrase_categories", JSON.stringify(categories));
        localStorage.setItem("atc_phrase_entries", JSON.stringify(entries));
        localStorage.setItem("atc_global_variables", JSON.stringify(globalVars));
        localStorage.setItem("atc_schema_version", JSON.stringify(2));

        const result = loadAll();
        expect(result.data.fixes).toEqual(fixes);
        expect(result.data.phraseCategories).toEqual(categories);
        expect(result.data.phraseEntries).toEqual(entries);
        expect(result.data.globalVariables).toEqual(globalVars);
        expect(result.data.version).toBe(2);
        expect(result.warning).toBeNull();
    });

    it("returns empty arrays and warning for corrupted JSON", () => {
        localStorage.setItem("atc_fixes", "not-valid-json");
        localStorage.setItem("atc_phrase_categories", "{bad}");
        localStorage.setItem("atc_phrase_entries", "123");
        localStorage.setItem("atc_global_variables", '"string"');
        localStorage.setItem("atc_schema_version", "abc");

        const result = loadAll();
        expect(result.data.fixes).toEqual([]);
        expect(result.data.phraseCategories).toEqual([]);
        expect(result.data.phraseEntries).toEqual([]);
        expect(result.data.globalVariables).toEqual([]);
        expect(result.data.version).toBe(1);
        expect(result.warning).not.toBeNull();
        expect(result.warning).toContain("fixes");
        expect(result.warning).toContain("phrase categories");
        expect(result.warning).toContain("phrase entries");
        expect(result.warning).toContain("global variables");
        expect(result.warning).toContain("schema version");
    });

    it("handles partial corruption — loads valid keys, warns about invalid", () => {
        const fixes: TransitionFix[] = [
            {
                id: "1",
                name: "OMNI",
                direction: "MIXED",
                departureOptions: [],
            },
        ];
        localStorage.setItem("atc_fixes", JSON.stringify(fixes));
        localStorage.setItem("atc_phrase_categories", "corrupt!");

        const result = loadAll();
        expect(result.data.fixes).toEqual(fixes);
        expect(result.data.phraseCategories).toEqual([]);
        expect(result.warning).toContain("phrase categories");
    });
});

describe("persistFixes", () => {
    it("writes fixes to localStorage as JSON", () => {
        const fixes: TransitionFix[] = [
            {
                id: "1",
                name: "EPDEP",
                direction: "NORTH",
                departureOptions: [],
            },
        ];
        persistFixes(fixes);
        expect(JSON.parse(localStorage.getItem("atc_fixes")!)).toEqual(fixes);
    });
});

describe("persistPhrases", () => {
    it("writes categories and entries to localStorage as JSON", () => {
        const categories: PhraseCategory[] = [
            { id: "c1", name: "TAXI", sortOrder: 1 },
        ];
        const entries: PhraseEntry[] = [
            {
                id: "e1",
                categoryId: "c1",
                contentPtBr: "Táxi",
                contentEn: "Taxi",
                sortOrder: 1,
            },
        ];
        persistPhrases(categories, entries);
        expect(
            JSON.parse(localStorage.getItem("atc_phrase_categories")!)
        ).toEqual(categories);
        expect(JSON.parse(localStorage.getItem("atc_phrase_entries")!)).toEqual(
            entries
        );
    });
});

describe("persistGlobalVariables", () => {
    it("writes global variables to localStorage as JSON", () => {
        const vars: GlobalVariable[] = [
            { name: "qnh", token: "{qnh}", value: "1013" },
        ];
        persistGlobalVariables(vars);
        expect(
            JSON.parse(localStorage.getItem("atc_global_variables")!)
        ).toEqual(vars);
    });
});
