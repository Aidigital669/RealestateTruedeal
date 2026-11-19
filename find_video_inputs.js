const fs = require('fs');
const path = require('path');

function search(dir, out = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === '.next' || item.name === '.git') continue;
    const p = path.join(dir, item.name);
    if (item.isDirectory()) search(p, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(item.name)) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, i) => {
        if (/videoUrl/i.test(l)) out.push(`${p}:${i+1}: ${l.trim()}`);
      });
    }
  }
  return out;
}

const res = search('./src');
console.log(`Found ${res.length} matches:`);
res.forEach(r => console.log(r));
