import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  try {
    console.log('Adding columns to "Property" table if not exists...');
    await pool.query(`
      ALTER TABLE "Property"
        ADD COLUMN IF NOT EXISTS "refNumber" TEXT,
        ADD COLUMN IF NOT EXISTS "propertyName" TEXT,
        ADD COLUMN IF NOT EXISTS "buildingName" TEXT,
        ADD COLUMN IF NOT EXISTS "plotArea" NUMERIC,
        ADD COLUMN IF NOT EXISTS "minArea" NUMERIC,
        ADD COLUMN IF NOT EXISTS "maxArea" NUMERIC,
        ADD COLUMN IF NOT EXISTS "ratePsf" NUMERIC,
        ADD COLUMN IF NOT EXISTS "securityDeposit" NUMERIC,
        ADD COLUMN IF NOT EXISTS "maintenanceCharges" TEXT,
        ADD COLUMN IF NOT EXISTS "propertyTax" TEXT,
        ADD COLUMN IF NOT EXISTS "facing" TEXT,
        ADD COLUMN IF NOT EXISTS "propertyAge" TEXT,
        ADD COLUMN IF NOT EXISTS "transactionClassification" TEXT,
        ADD COLUMN IF NOT EXISTS "possessionName" TEXT,
        ADD COLUMN IF NOT EXISTS "availabilityStatus" TEXT,
        ADD COLUMN IF NOT EXISTS "roi" TEXT,
        ADD COLUMN IF NOT EXISTS "monthlyRent" NUMERIC,
        ADD COLUMN IF NOT EXISTS "rentStartDate" TEXT,
        ADD COLUMN IF NOT EXISTS "lockinPeriod" TEXT,
        ADD COLUMN IF NOT EXISTS "leasePeriod" TEXT,
        ADD COLUMN IF NOT EXISTS "searchKeywords" TEXT,
        ADD COLUMN IF NOT EXISTS "branchName" TEXT,
        ADD COLUMN IF NOT EXISTS "sourceName" TEXT,
        ADD COLUMN IF NOT EXISTS "customerName" TEXT,
        ADD COLUMN IF NOT EXISTS "customerMobile" TEXT,
        ADD COLUMN IF NOT EXISTS "customerEmail" TEXT,
        ADD COLUMN IF NOT EXISTS "employeeName" TEXT,
        ADD COLUMN IF NOT EXISTS "employeeMobile" TEXT,
        ADD COLUMN IF NOT EXISTS "employeeEmail" TEXT,
        ADD COLUMN IF NOT EXISTS "dossierData" JSONB,
        ADD COLUMN IF NOT EXISTS "rawExcelId" INT;

      CREATE INDEX IF NOT EXISTS "idx_property_refnumber" ON "Property"("refNumber");
      CREATE INDEX IF NOT EXISTS "idx_property_buildingname" ON "Property"("buildingName");
      CREATE INDEX IF NOT EXISTS "idx_property_propertyname" ON "Property"("propertyName");
      CREATE INDEX IF NOT EXISTS "idx_property_rawexcelid" ON "Property"("rawExcelId");
    `);

    console.log('Property table schema successfully enhanced with all 48 Excel columns!');
  } catch (err) {
    console.error('Schema upgrade error:', err);
  } finally {
    await pool.end();
  }
}

main();
