const fs = require('fs');
const path = require('path');

const csv = fs.readFileSync('/tmp/airports.csv', 'utf8');
const lines = csv.split('\n');
const result = {};

for (let i = 1; i < lines.length; i++) {
    const row = lines[i].match(/(?:"[^"]*"|[^,]*)(?:,|$)/g);
    if (!row) continue;
    const clean = row.map(f => f.replace(/,$/, '').replace(/^"|"$/g, ''));
    const icao = clean[12];
    if (!icao || icao.length !== 4) continue;
    const name = clean[3];
    const city = clean[10];
    const country = clean[8];
    result[icao] = [name, city, country];
}

const outPath = path.join(__dirname, '..', 'src', 'lib', 'icao-data.json');
fs.writeFileSync(outPath, JSON.stringify(result));
console.log('Generated ' + Object.keys(result).length + ' entries -> ' + outPath);
console.log('Size: ' + (fs.statSync(outPath).size / 1024).toFixed(1) + ' KB');
