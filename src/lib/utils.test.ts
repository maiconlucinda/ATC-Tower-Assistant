import { describe, it, expect } from "vitest";
import {
    filterFixNames,
    lookupFix,
    resolveFixOrOmni,
    getOptionsForRunway,
    getHighlightedRunways,
    substituteGlobalVariables,
    searchPhrases,
} from "./utils";
import type { TransitionFix, PhraseEntry } from "@/types";

function makeFixMap(
    fixes: TransitionFix[]
): Map<string, TransitionFix> {
    const map = new Map<string, TransitionFix>();
    for (const fix of fixes) {
        map.set(fix.name, fix);
    }
    return map;
}

const EPDEP: TransitionFix = {
    id: "1",
    name: "EPDEP",
    direction: "NORTH",
    departureOptions: [
        { id: "d1", runway: "11L", sid: "ESBU6A", priority: 1 },
        { id: "d2", runway: "11L", sid: "ESBU6B", priority: 2 },
        { id: "d3", runway: "29R", sid: "ESBU6C", priority: 1 },
    ],
};

const GNV: TransitionFix = {
    id: "2",
    name: "GNV",
    direction: "SOUTH",
    departureOptions: [
        { id: "d4", runway: "11R", sid: "GNV1A", priority: 2 },
        { id: "d5", runway: "11R", sid: "GNV1B", priority: 1 },
    ],
};

const OMNI: TransitionFix = {
    id: "3",
    name: "OMNI",
    direction: "MIXED",
    departureOptions: [
        { id: "d6", runway: "11L", sid: "OMNI1", priority: 1 },
        { id: "d7", runway: "29R", sid: "OMNI2", priority: 1 },
    ],
};

describe("filterFixNames", () => {
    const fixMap = makeFixMap([EPDEP, GNV, OMNI]);

    it("returns matching names case-insensitively", () => {
        expect(filterFixNames(fixMap, "ep")).toEqual(["EPDEP"]);
        expect(filterFixNames(fixMap, "EP")).toEqual(["EPDEP"]);
    });

    it("returns multiple matches", () => {
        const result = filterFixNames(fixMap, "n");
        expect(result.sort()).toEqual(["GNV", "OMNI"].sort());
    });

    it("returns empty for no match", () => {
        expect(filterFixNames(fixMap, "XYZ")).toEqual([]);
    });

    it("returns empty for empty query", () => {
        expect(filterFixNames(fixMap, "")).toEqual([]);
    });
});

describe("lookupFix", () => {
    const fixMap = makeFixMap([EPDEP, GNV, OMNI]);

    it("finds fix by uppercase name", () => {
        expect(lookupFix(fixMap, "epdep")).toBe(EPDEP);
        expect(lookupFix(fixMap, "EPDEP")).toBe(EPDEP);
    });

    it("returns null for missing fix", () => {
        expect(lookupFix(fixMap, "MISSING")).toBeNull();
    });
});

describe("resolveFixOrOmni", () => {
    const fixMap = makeFixMap([EPDEP, GNV, OMNI]);

    it("returns exact match with isOmniFallback false", () => {
        const result = resolveFixOrOmni(fixMap, "EPDEP");
        expect(result).toEqual({ fix: EPDEP, isOmniFallback: false });
    });

    it("falls back to OMNI for unmatched query", () => {
        const result = resolveFixOrOmni(fixMap, "MISSING");
        expect(result).toEqual({ fix: OMNI, isOmniFallback: true });
    });

    it("returns null when no match and no OMNI", () => {
        const noOmniMap = makeFixMap([EPDEP]);
        expect(resolveFixOrOmni(noOmniMap, "MISSING")).toBeNull();
    });
});

describe("getOptionsForRunway", () => {
    it("filters by runway and sorts by priority ascending", () => {
        const result = getOptionsForRunway(GNV, "11R");
        expect(result).toHaveLength(2);
        expect(result[0].sid).toBe("GNV1B"); // priority 1
        expect(result[1].sid).toBe("GNV1A"); // priority 2
    });

    it("returns empty for non-existent runway", () => {
        expect(getOptionsForRunway(EPDEP, "99X")).toEqual([]);
    });
});

describe("getHighlightedRunways", () => {
    it("NORTH → [11L, 29R]", () => {
        expect(getHighlightedRunways("NORTH")).toEqual(["11L", "29R"]);
    });

    it("SOUTH → [11R, 29L]", () => {
        expect(getHighlightedRunways("SOUTH")).toEqual(["11R", "29L"]);
    });

    it("MIXED → []", () => {
        expect(getHighlightedRunways("MIXED")).toEqual([]);
    });
});

describe("substituteGlobalVariables", () => {
    it("replaces global variable tokens with values", () => {
        const vars = new Map([["aeroporto", "SBGR"], ["qnh", "1013"]]);
        const result = substituteGlobalVariables(
            "Aeroporto {aeroporto}, QNH {qnh}",
            vars
        );
        expect(result).toBe("Aeroporto SBGR, QNH 1013");
    });

    it("preserves dynamic placeholders not in vars map", () => {
        const vars = new Map([["aeroporto", "SBGR"]]);
        const result = substituteGlobalVariables(
            "{aeroporto} {callsign} {squawk}",
            vars
        );
        expect(result).toBe("SBGR {callsign} {squawk}");
    });

    it("preserves tokens when global variable value is empty", () => {
        const vars = new Map([["aeroporto", ""]]);
        const result = substituteGlobalVariables("Airport: {aeroporto}", vars);
        expect(result).toBe("Airport: {aeroporto}");
    });

    it("handles content with no tokens", () => {
        const vars = new Map([["aeroporto", "SBGR"]]);
        expect(substituteGlobalVariables("No tokens here", vars)).toBe(
            "No tokens here"
        );
    });
});

describe("searchPhrases", () => {
    const entries: PhraseEntry[] = [
        {
            id: "1",
            categoryId: "c1",
            title: "Clearance",
            contentPtBr: "Autorizado",
            contentEn: "Cleared",
            sortOrder: 1,
        },
        {
            id: "2",
            categoryId: "c1",
            contentPtBr: "Pista livre",
            contentEn: "Runway clear",
            notes: "Check wind",
            sortOrder: 2,
        },
        {
            id: "3",
            categoryId: "c2",
            title: "Taxi instruction",
            contentPtBr: "Taxi via Alpha",
            contentEn: "Taxi via Alpha",
            sortOrder: 1,
        },
    ];

    it("matches in title", () => {
        expect(searchPhrases(entries, "clearance")).toHaveLength(1);
        expect(searchPhrases(entries, "clearance")[0].id).toBe("1");
    });

    it("matches in contentPtBr", () => {
        expect(searchPhrases(entries, "pista")).toHaveLength(1);
    });

    it("matches in contentEn", () => {
        const result = searchPhrases(entries, "runway");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("2");
    });

    it("matches in notes", () => {
        const result = searchPhrases(entries, "wind");
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("2");
    });

    it("case-insensitive matching", () => {
        // "TAXI" appears only in entry 3 (title + both content fields)
        expect(searchPhrases(entries, "TAXI")).toHaveLength(1);
        expect(searchPhrases(entries, "TAXI")[0].id).toBe("3");
    });

    it("returns empty for no match", () => {
        expect(searchPhrases(entries, "nonexistent")).toEqual([]);
    });

    it("returns empty for empty keyword", () => {
        expect(searchPhrases(entries, "")).toEqual([]);
    });
});
