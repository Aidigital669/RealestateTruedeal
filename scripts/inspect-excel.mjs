import XLSX from 'xlsx';
import fs from 'fs';

const buf = fs.readFileSync('153576.xlsx');
const wb = XLSX.read(buf, { type: 'buffer' });
console.log('Worksheet names:', wb.SheetNames);
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];

const rawRows = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });
console.log('Total source records (rows):', rawRows.length);

if (rawRows.length > 0) {
  const headers = Object.keys(rawRows[0]);
  console.log('Total columns count:', headers.length);
  console.log('Headers list:', headers);

  const refNumbers = new Set();
  let duplicateRefCount = 0;
  const duplicateRefs = [];

  const txCounts = { Sale: 0, Rent: 0, 'Joint Development': 0, Other: 0 };
  const nonemptyCounts = {
    Description: 0,
    PropertyName: 0,
    BuildingName: 0,
    SuperAreaName: 0,
    BuiltAreaName: 0,
    CarpetAreaName: 0,
    ExpectedPrice: 0,
    DepositePrice: 0,
    RentPM: 0,
    RentStartDate: 0,
    LockinPeriod: 0,
    LeasePeriod: 0,
    PropertyTax: 0,
    MaintainCharges: 0
  };

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const ref = String(row['RefNumber'] || '').trim();
    if (refNumbers.has(ref)) {
      duplicateRefCount++;
      duplicateRefs.push({ rowIdx: i + 2, ref });
    } else {
      refNumbers.add(ref);
    }

    const tx = String(row['Lease_Sale'] || '').trim();
    if (tx.toLowerCase().includes('joint')) {
      txCounts['Joint Development']++;
    } else if (tx.toLowerCase().includes('sale')) {
      txCounts['Sale']++;
    } else if (tx.toLowerCase().includes('lease') || tx.toLowerCase().includes('rent')) {
      txCounts['Rent']++;
    } else {
      txCounts['Other']++;
    }

    for (const field of Object.keys(nonemptyCounts)) {
      const val = row[field];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        nonemptyCounts[field]++;
      }
    }
  }

  console.log('Unique RefNumber count:', refNumbers.size);
  console.log('Duplicate RefNumber count:', duplicateRefCount);
  console.log('Duplicate Ref samples:', duplicateRefs);
  console.log('Transaction distribution:', txCounts);
  console.log('Non-empty field counts:', nonemptyCounts);
}
