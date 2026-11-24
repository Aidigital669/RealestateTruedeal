import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { executeServerSideExcelImport } from '../src/lib/excel-import-engine.ts';

async function main() {
  console.log('====================================================');
  console.log('STARTING PHASE 4 EXCEL IMPORT & RECONCILIATION');
  console.log('====================================================');

  const startTime = Date.now();

  try {
    const result = await executeServerSideExcelImport('153576.xlsx', {
      batchSize: 200,
      onProgress: (stage, current, total, msg) => {
        const pct = total > 0 ? ((current / total) * 100).toFixed(1) : 0;
        console.log(`[${stage}] ${current}/${total} (${pct}%) ${msg || ''}`);
      }
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('====================================================');
    console.log(`IMPORT COMPLETED IN ${elapsed} SECONDS`);
    console.log('====================================================');
    console.log('Batch ID:', result.batchId);
    console.log('Total Source Rows:', result.totalSourceRows);
    console.log('Preserved Raw Rows in DB:', result.preservedRawRows);
    console.log('Normalized Property Rows in DB:', result.normalizedRows);
    console.log('Duplicate Ref Count:', result.duplicateRefCount);
    console.log('Reconciliation Status:', result.reconciliation.reconciliationPassed ? '100% PASSED' : 'DISCREPANCY FOUND');
    console.log('Field Positions Checked:', result.reconciliation.fieldPositionsChecked);
    console.log('Field Positions Matched:', result.reconciliation.fieldPositionsMatched);
    console.log('Truncated Descriptions:', result.reconciliation.truncatedDescriptions);
    console.log('Transaction Distribution:', result.reconciliation.transactionCounts);
    console.log('Non-Empty Counts:', result.reconciliation.nonemptyFieldCounts);

    if (result.reconciliation.discrepancies.length > 0) {
      console.log('Discrepancies:', result.reconciliation.discrepancies.slice(0, 10));
    }
  } catch (err) {
    console.error('Import failed with error:', err);
  }

  process.exit(0);
}

main();
