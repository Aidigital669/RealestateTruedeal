const { query } = require('./src/lib/db.ts');

async function test() {
  try {
    const rows = await query(`
      SELECT p.id, p.name, p.price, p.sqft_num, p.configuration, p.locality, p."publishStatus", p.description
      FROM "Property" p
      WHERE p.name ILIKE '%Undri%' OR p.locality ILIKE '%Undri%'
      LIMIT 10;
    `);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
