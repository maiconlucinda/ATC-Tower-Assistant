import icaoData from './icao-data.json';

const data = icaoData as unknown as Record<string, [string, string, string]>;

export interface AirportInfo {
    icao: string;
    name: string;
    city: string;
    country: string;
}

export function lookupIcao(code: string): AirportInfo | null {
    const entry = data[code.toUpperCase()];
    if (!entry) return null;
    return { icao: code.toUpperCase(), name: entry[0], city: entry[1], country: entry[2] };
}

export function searchIcao(query: string, limit = 10): AirportInfo[] {
    if (!query || query.length < 2) return [];
    const q = query.toUpperCase();
    const results: AirportInfo[] = [];
    for (const [icao, [name, city, country]] of Object.entries(data)) {
        if (
            icao.includes(q) ||
            name.toUpperCase().includes(q) ||
            city.toUpperCase().includes(q)
        ) {
            results.push({ icao, name, city, country });
            if (results.length >= limit) break;
        }
    }
    return results;
}
