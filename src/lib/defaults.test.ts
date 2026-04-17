import { describe, it, expect } from 'vitest';
import { getDefaultCategories, getDefaultGlobalVariables } from './defaults';

describe('getDefaultCategories', () => {
    it('returns 6 categories in correct order', () => {
        const categories = getDefaultCategories();
        expect(categories).toHaveLength(6);
        expect(categories.map(c => c.name)).toEqual([
            'AUTORIZAÇÃO',
            'PUSHBACK E ACIONAMENTO',
            'TAXI',
            'DECOLAGEM',
            'POUSO',
            'PÓS-POUSO',
        ]);
    });

    it('has ascending sortOrder from 1 to 6', () => {
        const categories = getDefaultCategories();
        categories.forEach((cat, i) => {
            expect(cat.sortOrder).toBe(i + 1);
        });
    });

    it('has unique IDs', () => {
        const categories = getDefaultCategories();
        const ids = categories.map(c => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('returns a new array on each call', () => {
        expect(getDefaultCategories()).not.toBe(getDefaultCategories());
    });
});

describe('getDefaultGlobalVariables', () => {
    it('returns 7 global variables', () => {
        const vars = getDefaultGlobalVariables();
        expect(vars).toHaveLength(7);
        expect(vars.map(v => v.name)).toEqual([
            'aeroporto',
            'pista_decolagem',
            'pista_pouso',
            'direcao_vento',
            'velocidade_vento',
            'qnh',
            'frequencia_saida',
        ]);
    });

    it('all values are empty strings', () => {
        const vars = getDefaultGlobalVariables();
        vars.forEach(v => {
            expect(v.value).toBe('');
        });
    });

    it('tokens match {name} format', () => {
        const vars = getDefaultGlobalVariables();
        vars.forEach(v => {
            expect(v.token).toBe(`{${v.name}}`);
        });
    });

    it('returns a new array on each call', () => {
        expect(getDefaultGlobalVariables()).not.toBe(getDefaultGlobalVariables());
    });
});
