import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const buyers = body.buyers;

    if (!buyers || !Array.isArray(buyers) || buyers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid buyer records received for import." },
        { status: 400 }
      );
    }

    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < buyers.length; i++) {
      const b = buyers[i];
      const name = (b.name || `Verified Buyer ${i + 1}`).trim();
      const phone = (b.phone || "9373020701").trim();
      const email = (b.email || "leads@anvrealty.com").trim();
      const locality = (b.locality || "Pune Prime").trim();
      const bhk = (b.bhk || "3 BHK").trim();
      const budget = (b.budget || "₹1.50 Cr - ₹2.50 Cr").trim();
      const purpose = (b.purpose || "Self-Use / Investment").trim();
      const timeline = (b.timeline || "Ready to Move / 60 Days").trim();
      const status = (b.status || "Verified Active Buyer").trim();
      const requirements = (b.requirements || `Looking for ${bhk} in ${locality} with budget ${budget}. Purpose: ${purpose}.`).trim();
      const refCode = b.referenceCode || `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      try {
        // 1. Insert into crm_leads table
        await queryOne(`
          INSERT INTO crm_leads (
            code, name, phone, email, designation, residence, is_nri,
            location, property_interest, bhk, budget, source, source_type,
            status, stage, temperature, assigned_to, notes, created_at, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, false,
            $7, $8, $9, $10, 'Excel/PDF Bulk Upload', 'import',
            $11, 'new', 'hot', 'Unassigned', $12, NOW(), NOW()
          )
          ON CONFLICT DO NOTHING
          RETURNING id;
        `, [
          refCode,
          name,
          phone,
          email,
          purpose,
          locality,
          locality,
          `${bhk} in ${locality}`,
          bhk,
          budget,
          status,
          requirements
        ]);

        // 2. Also register into WebsiteEnquiry so unified enquiries dashboard shows it
        const detailedMsg = [
          `Target Locality: ${locality}`,
          `Configuration: ${bhk}`,
          `Budget: ${budget}`,
          `Buying Purpose: ${purpose}`,
          `Timeline: ${timeline}`,
          `Client Notes: ${requirements}`
        ].join(" | ");

        await queryOne(`
          INSERT INTO "WebsiteEnquiry" (
            name, email, phone, subject, message, source, status, "createdAt", "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, 'Bulk Buyer Import (Excel/PDF)', 'New', NOW(), NOW())
          RETURNING id;
        `, [
          name,
          email,
          phone,
          `Buyer Mandate: ${bhk} in ${locality} (${budget})`,
          detailedMsg
        ]);

        insertedCount++;
      } catch (err: any) {
        console.error(`Error inserting buyer row ${i}:`, err.message);
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      count: insertedCount,
      totalSubmitted: buyers.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${insertedCount} verified buyer requirements into CRM & Live Demands.`
    });
  } catch (error: any) {
    console.error("POST /api/admin/buyers/import error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to import buyer records." },
      { status: 500 }
    );
  }
}
