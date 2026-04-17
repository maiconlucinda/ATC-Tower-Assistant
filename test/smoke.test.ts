import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Project setup smoke test', () => {
    it('vitest runs correctly', () => {
        expect(1 + 1).toBe(2);
    });

    it('fast-check is available', () => {
        fc.assert(
            fc.property(fc.integer(), (n) => {
                return n + 0 === n;
            }),
            { numRuns: 10 }
        );
    });

    it('jsdom environment is available', () => {
        expect(document).toBeDefined();
        expect(window).toBeDefined();
    });
});
