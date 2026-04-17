import type { Direction, TransitionFix, DepartureOption, PhraseEntry, SidProcedure } from "@/types";

/**
 * Case-insensitive substring match on fix names from the Fix_Hashmap.
 * Returns all fix names that contain the query as a case-insensitive substring.
 */
export function filterFixNames(
    fixMap: Map<string, TransitionFix>,
    query: string
): string[] {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    const results: string[] = [];
    for (const name of fixMap.keys()) {
        if (name.toLowerCase().includes(lowerQuery)) {
            results.push(name);
        }
    }
    return results;
}

/**
 * O(1) lookup by uppercase name in the Fix_Hashmap.
 */
export function lookupFix(
    fixMap: Map<string, TransitionFix>,
    query: string
): TransitionFix | null {
    return fixMap.get(query.toUpperCase()) ?? null;
}

/**
 * Lookup with OMNI fallback.
 * Tries exact match first, falls back to OMNI entry if no match found.
 */
export function resolveFixOrOmni(
    fixMap: Map<string, TransitionFix>,
    query: string
): { fix: TransitionFix; isOmniFallback: boolean } | null {
    const exact = fixMap.get(query.toUpperCase());
    if (exact) {
        return { fix: exact, isOmniFallback: false };
    }
    const omni = fixMap.get("OMNI");
    if (omni) {
        return { fix: omni, isOmniFallback: true };
    }
    return null;
}

/**
 * Filter departure options by runway and sort by priority ascending.
 */
export function getOptionsForRunway(
    fix: TransitionFix,
    runway: string
): DepartureOption[] {
    return fix.departureOptions
        .filter((opt) => opt.runway === runway)
        .sort((a, b) => a.priority - b.priority);
}

/**
 * Map Direction to highlighted runway arrays.
 * NORTH → ["11L", "29R"], SOUTH → ["11R", "29L"], MIXED → []
 */
export function getHighlightedRunways(direction: Direction): string[] {
    switch (direction) {
        case "NORTH":
            return ["11L", "29R"];
        case "SOUTH":
            return ["11R", "29L"];
        case "MIXED":
            return [];
    }
}

/**
 * Replace global variable tokens in content string.
 * Tokens matching keys in the vars map are replaced with their values.
 * If a global variable value is empty/undefined, the token stays as-is.
 * Dynamic placeholders (tokens not in the global vars map) are preserved unchanged.
 */
export function substituteGlobalVariables(
    content: string,
    vars: Map<string, string>
): string {
    return content.replace(/\{([^}]+)\}/g, (match, key: string) => {
        if (vars.has(key)) {
            const value = vars.get(key)!;
            return value ? value : match;
        }
        return match;
    });
}

/**
 * Case-insensitive keyword search across phrase entry fields:
 * title, contentPtBr, contentEn, and notes.
 */
export function searchPhrases(
    entries: PhraseEntry[],
    keyword: string
): PhraseEntry[] {
    if (!keyword) return [];
    const lowerKeyword = keyword.toLowerCase();
    return entries.filter((entry) => {
        const fields = [
            entry.title ?? "",
            entry.contentPtBr,
            entry.contentEn,
            entry.notes ?? "",
        ];
        return fields.some((field) => field.toLowerCase().includes(lowerKeyword));
    });
}

/**
 * Build TransitionFix array from SidProcedure array.
 * Groups SIDs by fix name, determines fix direction from its SIDs,
 * and creates departure options with per-SID direction.
 */
export function buildFixesFromSids(sids: SidProcedure[]): TransitionFix[] {
    // Group: fixName → array of { sid, runway, direction, priority }
    const fixMap = new Map<string, { sid: string; runway: string; direction: Direction; priority: number }[]>();

    for (const sid of sids) {
        for (const fixName of sid.fixNames) {
            const upper = fixName.toUpperCase();
            if (!fixMap.has(upper)) {
                fixMap.set(upper, []);
            }
            fixMap.get(upper)!.push({
                sid: sid.name,
                runway: sid.runway,
                direction: sid.direction,
                priority: sid.priority,
            });
        }
    }

    const fixes: TransitionFix[] = [];
    for (const [name, options] of fixMap) {
        // Determine fix-level direction from its SIDs
        const dirs = new Set(options.map((o) => o.direction));
        let fixDirection: Direction;
        if (dirs.size === 1) {
            fixDirection = dirs.values().next().value!;
        } else if (dirs.has("NORTH") && dirs.has("SOUTH")) {
            fixDirection = "MIXED";
        } else if (dirs.has("MIXED")) {
            fixDirection = "MIXED";
        } else {
            fixDirection = "MIXED";
        }

        fixes.push({
            id: `fix-${name.toLowerCase()}`,
            name,
            direction: fixDirection,
            departureOptions: options.map((o, i) => ({
                id: `${name.toLowerCase()}-${o.runway.toLowerCase()}-${i + 1}`,
                runway: o.runway,
                sid: o.sid,
                priority: o.priority,
                direction: o.direction,
            })),
        });
    }

    return fixes.sort((a, b) => a.name.localeCompare(b.name));
}
