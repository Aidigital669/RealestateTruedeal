import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanId = parseInt(id.replace(/[^0-9]/g, ""), 10);
    if (!cleanId || isNaN(cleanId)) {
      return NextResponse.json(
        { success: false, error: "Invalid lead ID." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updateFields: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      name: "name",
      phone: "phone",
      email: "email",
      designation: "designation",
      company: "company",
      location: "location",
      propertyInterest: "property_interest",
      bhk: "bhk",
      carpetSqft: "carpet_sqft",
      budget: "budget",
      status: "status",
      stage: "stage",
      temperature: "temperature",
      assignedTo: "assigned_to",
      notes: "notes"
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (body[key] !== undefined) {
        values.push(body[key]);
        updateFields.push(`${col} = $${values.length}`);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields provided to update." },
        { status: 400 }
      );
    }

    values.push(cleanId);
    const sql = `
      UPDATE crm_leads
      SET ${updateFields.join(", ")}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING id, code, name, phone, email, location, property_interest AS "propertyInterest", bhk, budget, status, stage, temperature, assigned_to AS "assignedTo", notes;
    `;

    const updated = await queryOne(sql, values);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Lead not found or update failed." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully",
      lead: updated
    });
  } catch (error: any) {
    console.error("PATCH /api/crm/leads/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanId = parseInt(id.replace(/[^0-9]/g, ""), 10);
    if (!cleanId || isNaN(cleanId)) {
      return NextResponse.json(
        { success: false, error: "Invalid lead ID." },
        { status: 400 }
      );
    }

    const deleted = await queryOne(
      `DELETE FROM crm_leads WHERE id = $1 RETURNING id, code;`,
      [cleanId]
    );

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Lead not found or already deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Lead ${deleted.code || cleanId} deleted successfully.`
    });
  } catch (error: any) {
    console.error("DELETE /api/crm/leads/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete lead" },
      { status: 500 }
    );
  }
}
