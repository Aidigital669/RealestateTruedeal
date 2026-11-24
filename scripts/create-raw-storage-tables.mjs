import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "ExcelImportBatch" (
        id SERIAL PRIMARY KEY,
        "batchId" VARCHAR(64) UNIQUE NOT NULL,
        "fileName" VARCHAR(255) NOT NULL,
        "sheetName" VARCHAR(255) NOT NULL,
        "totalRows" INT NOT NULL,
        "totalColumns" INT NOT NULL,
        "uniqueRefs" INT NOT NULL,
        "duplicateRefs" INT NOT NULL,
        "status" VARCHAR(50) DEFAULT 'completed',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "RawExcelProperty" (
        id SERIAL PRIMARY KEY,
        "batchId" VARCHAR(64) NOT NULL,
        "fileName" VARCHAR(255) NOT NULL,
        "sheetName" VARCHAR(255) NOT NULL,
        "rowNumber" INT NOT NULL,
        "refNumber" VARCHAR(255),
        "checksum" VARCHAR(64) NOT NULL,
        "transactionType" VARCHAR(100),
        "rawData" JSONB NOT NULL,
        "importStatus" VARCHAR(50) DEFAULT 'preserved',
        "validationErrors" TEXT[],
        "conflictNotes" TEXT,
        "propertyId" INT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS "idx_raw_excel_batch" ON "RawExcelProperty"("batchId");
      CREATE INDEX IF NOT EXISTS "idx_raw_excel_ref" ON "RawExcelProperty"("refNumber");
      CREATE INDEX IF NOT EXISTS "idx_raw_excel_row" ON "RawExcelProperty"("rowNumber");
      CREATE INDEX IF NOT EXISTS "idx_raw_excel_checksum" ON "RawExcelProperty"("checksum");
    `);

    console.log('RawExcelProperty and ExcelImportBatch tables verified/created successfully!');
  } catch (err) {
    console.error('Error creating raw storage tables:', err);
  } finally {
    await pool.end();
  }
}

main();
