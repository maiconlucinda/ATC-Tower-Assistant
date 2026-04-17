import type {
    AppData,
    ValidationResult,
    TransitionFix,
    DepartureOption,
    PhraseCategory,
    PhraseEntry,
    GlobalVariable,
} from "@/types";
import {
    loadAll,
    persistFixes,
    persistSidProcedures,
    persistPhrases,
    persistGlobalVariables,
} from "./dataStore";

const VALID_DIRECTIONS = ["NORTH", "SOUTH", "MIXED"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateDepartureOption(
    opt: unknown,
    fixName: string,
    index: number
): string[] {
    const errors: string[] = [];
    const prefix = `fixes[${fixName}].departureOptions[${index}]`;

    if (!isObject(opt)) {
        errors.push(`${prefix}: must be an object`);
        return errors;
    }

    if (typeof opt.id !== "string") {
        errors.push(`${prefix}.id: must be a string`);
    }
    if (typeof opt.runway !== "string") {
        errors.push(`${prefix}.runway: must be a string`);
    }
    if (typeof opt.sid !== "string") {
        errors.push(`${prefix}.sid: must be a string`);
    }
    if (typeof opt.priority !== "number") {
        errors.push(`${prefix}.priority: must be a number`);
    }
    if (opt.direction !== undefined) {
        if (typeof opt.direction !== "string" || !(VALID_DIRECTIONS as readonly string[]).includes(opt.direction)) {
            errors.push(`${prefix}.direction: must be one of NORTH, SOUTH, MIXED if present`);
        }
    }

    return errors;
}

function validateFix(fix: unknown, index: number): string[] {
    const errors: string[] = [];
    const prefix = `fixes[${index}]`;

    if (!isObject(fix)) {
        errors.push(`${prefix}: must be an object`);
        return errors;
    }

    if (typeof fix.id !== "string") {
        errors.push(`${prefix}.id: must be a string`);
    }
    if (typeof fix.name !== "string") {
        errors.push(`${prefix}.name: must be a string`);
    }
    if (
        typeof fix.direction !== "string" ||
        !(VALID_DIRECTIONS as readonly string[]).includes(fix.direction)
    ) {
        errors.push(
            `${prefix}.direction: must be one of NORTH, SOUTH, MIXED`
        );
    }
    if (!Array.isArray(fix.departureOptions)) {
        errors.push(`${prefix}.departureOptions: must be an array`);
    } else {
        const fixName = typeof fix.name === "string" ? fix.name : String(index);
        for (let i = 0; i < fix.departureOptions.length; i++) {
            errors.push(
                ...validateDepartureOption(fix.departureOptions[i], fixName, i)
            );
        }
    }

    return errors;
}

function validateCategory(cat: unknown, index: number): string[] {
    const errors: string[] = [];
    const prefix = `phraseCategories[${index}]`;

    if (!isObject(cat)) {
        errors.push(`${prefix}: must be an object`);
        return errors;
    }

    if (typeof cat.id !== "string") {
        errors.push(`${prefix}.id: must be a string`);
    }
    if (typeof cat.name !== "string") {
        errors.push(`${prefix}.name: must be a string`);
    }
    if (typeof cat.sortOrder !== "number") {
        errors.push(`${prefix}.sortOrder: must be a number`);
    }

    return errors;
}

function validateEntry(entry: unknown, index: number): string[] {
    const errors: string[] = [];
    const prefix = `phraseEntries[${index}]`;

    if (!isObject(entry)) {
        errors.push(`${prefix}: must be an object`);
        return errors;
    }

    if (typeof entry.id !== "string") {
        errors.push(`${prefix}.id: must be a string`);
    }
    if (typeof entry.categoryId !== "string") {
        errors.push(`${prefix}.categoryId: must be a string`);
    }
    if (typeof entry.contentPtBr !== "string") {
        errors.push(`${prefix}.contentPtBr: must be a string`);
    }
    if (typeof entry.contentEn !== "string") {
        errors.push(`${prefix}.contentEn: must be a string`);
    }
    if (typeof entry.sortOrder !== "number") {
        errors.push(`${prefix}.sortOrder: must be a number`);
    }
    if (entry.title !== undefined && typeof entry.title !== "string") {
        errors.push(`${prefix}.title: must be a string if present`);
    }
    if (entry.notes !== undefined && typeof entry.notes !== "string") {
        errors.push(`${prefix}.notes: must be a string if present`);
    }

    return errors;
}

function validateGlobalVariable(v: unknown, index: number): string[] {
    const errors: string[] = [];
    const prefix = `globalVariables[${index}]`;

    if (!isObject(v)) {
        errors.push(`${prefix}: must be an object`);
        return errors;
    }

    if (typeof v.name !== "string") {
        errors.push(`${prefix}.name: must be a string`);
    }
    if (typeof v.token !== "string") {
        errors.push(`${prefix}.token: must be a string`);
    }
    if (typeof v.value !== "string") {
        errors.push(`${prefix}.value: must be a string`);
    }

    return errors;
}

/**
 * Validate that the given data has the correct structure for import.
 * Returns a ValidationResult with errors if invalid, or the parsed AppData if valid.
 */
export function validateImportData(data: unknown): ValidationResult {
    const errors: string[] = [];

    if (!isObject(data)) {
        return { valid: false, errors: ["Import data must be an object"] };
    }

    // Check required top-level fields exist and are correct types
    if (!Array.isArray(data.fixes)) {
        errors.push("Missing or invalid required field: fixes (expected array)");
    }
    if (!Array.isArray(data.phraseCategories)) {
        errors.push(
            "Missing or invalid required field: phraseCategories (expected array)"
        );
    }
    if (!Array.isArray(data.phraseEntries)) {
        errors.push(
            "Missing or invalid required field: phraseEntries (expected array)"
        );
    }
    if (!Array.isArray(data.globalVariables)) {
        errors.push(
            "Missing or invalid required field: globalVariables (expected array)"
        );
    }
    if (typeof data.version !== "number") {
        errors.push(
            "Missing or invalid required field: version (expected number)"
        );
    }

    // If top-level structure is wrong, return early
    if (errors.length > 0) {
        return { valid: false, errors };
    }

    // Validate each element in the arrays
    const fixes = data.fixes as unknown[];
    for (let i = 0; i < fixes.length; i++) {
        errors.push(...validateFix(fixes[i], i));
    }

    const categories = data.phraseCategories as unknown[];
    for (let i = 0; i < categories.length; i++) {
        errors.push(...validateCategory(categories[i], i));
    }

    const entries = data.phraseEntries as unknown[];
    for (let i = 0; i < entries.length; i++) {
        errors.push(...validateEntry(entries[i], i));
    }

    const globalVars = data.globalVariables as unknown[];
    for (let i = 0; i < globalVars.length; i++) {
        errors.push(...validateGlobalVariable(globalVars[i], i));
    }

    // Validate optional sidProcedures
    let sidProcedures: unknown[] | undefined;
    if (data.sidProcedures !== undefined) {
        if (!Array.isArray(data.sidProcedures)) {
            errors.push("Invalid field: sidProcedures (expected array)");
        } else {
            sidProcedures = data.sidProcedures as unknown[];
            for (let i = 0; i < sidProcedures.length; i++) {
                const sid = sidProcedures[i];
                const prefix = `sidProcedures[${i}]`;
                if (!isObject(sid)) {
                    errors.push(`${prefix}: must be an object`);
                    continue;
                }
                if (typeof sid.id !== "string") errors.push(`${prefix}.id: must be a string`);
                if (typeof sid.name !== "string") errors.push(`${prefix}.name: must be a string`);
                if (typeof sid.runway !== "string") errors.push(`${prefix}.runway: must be a string`);
                if (typeof sid.direction !== "string" || !(VALID_DIRECTIONS as readonly string[]).includes(sid.direction)) {
                    errors.push(`${prefix}.direction: must be one of NORTH, SOUTH, MIXED`);
                }
                if (!Array.isArray(sid.fixNames)) errors.push(`${prefix}.fixNames: must be an array`);
                if (typeof sid.priority !== "number") errors.push(`${prefix}.priority: must be a number`);
            }
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        errors: [],
        data: {
            fixes: fixes as unknown as TransitionFix[],
            sidProcedures: sidProcedures as unknown as import("@/types").SidProcedure[] | undefined,
            phraseCategories: categories as unknown as PhraseCategory[],
            phraseEntries: entries as unknown as PhraseEntry[],
            globalVariables: globalVars as unknown as GlobalVariable[],
            version: data.version as number,
        },
    };
}

/**
 * Export all current AppData from localStorage as a JSON string.
 */
export function exportAll(): string {
    const { data } = loadAll();
    return JSON.stringify(data);
}

/**
 * Validate and import data, replacing all current state in localStorage.
 * Returns the ValidationResult from validation.
 */
export function importAll(data: unknown): ValidationResult {
    const result = validateImportData(data);

    if (!result.valid || !result.data) {
        return result;
    }

    const appData = result.data;
    persistFixes(appData.fixes);
    // sidProcedures are persisted by the caller (ImportExportControls)
    persistPhrases(appData.phraseCategories, appData.phraseEntries);
    persistGlobalVariables(appData.globalVariables);

    return result;
}
