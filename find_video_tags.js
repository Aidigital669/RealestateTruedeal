const fs = require('fs');
const path = require('path');

function searchDir(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      searchDir(fullPath, results);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('<video')) {
          results.push(`${fullPath}:${idx + 1}: ${line.trim()}`);
        }
      });
    }
  }
  return results;
}

const matches = searchDir('./src');
console.log(`Found ${matches.length} matches:`);
matches.forEach(m => console.log(m));
