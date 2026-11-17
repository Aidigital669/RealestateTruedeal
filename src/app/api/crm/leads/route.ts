import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { calculateLeadScore, calculateChurnRisk, calculateNextBestAction } from "@/lib/crm-algorithm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const stage = searchParams.get("stage");

    let sql = `
      SELECT 
        id, code, name, phone, email, avatar, designation, company, residence,
        is_nri AS "isNri", nri_tag AS "nriTag", rera_verified AS "reraVerified",
        location, property_interest AS "propertyInterest", bhk, carpet_sqft AS "carpetSqft",
        budget, budget_raw AS "budgetRaw", source, source_type AS "sourceType",
        status, stage, temperature, assigned_to AS "assignedTo", notes,
        follow_up AS "followUp", dna, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM crm_leads
      WHERE 1=1
    `;
    const params: any[] = [];

    if (stage && stage !== "all") {
      params.push(stage);
      sql += ` AND stage = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length} OR phone ILIKE $${params.length} OR location ILIKE $${params.length})`;
    }

    sql += ` ORDER BY created_at DESC;`;

    const leads = await query(sql, params);

    // Apply Real-time Algorithmic Formulations (Algorithms 1, 4, 5)
    const enrichedLeads = leads.map((l: any) => {
      const createdAt = new Date(l.createdAt || Date.now()).getTime();
      const now = Date.now();
      const hoursAgo = Math.max(1, Math.floor((now - createdAt) / (1000 * 60 * 60)));
      const daysInStage = Math.max(1, Math.floor(hoursAgo / 24));

      const scoreData = calculateLeadScore({
        budgetRaw: l.budgetRaw ? Number(l.budgetRaw) : 17500000,
        budget: l.budget,
        timeline: l.dna?.possessionHorizon,
        dna: l.dna,
        isNri: l.isNri,
        financingStatus: l.dna?.financingStatus,
        stage: l.stage,
        lastContactHoursAgo: hoursAgo
      });

      const churnData = calculateChurnRisk(l.stage || 'new', daysInStage);
      const nbaData = calculateNextBestAction({
        stage: l.stage || 'new',
        score: scoreData.score,
        daysInStage,
        name: l.name || 'Patron'
      });

      return {
        ...l,
        leadScore: scoreData.score,
        scoreTier: scoreData.tier,
        scoreBreakdown: scoreData.breakdown,
        slaLabel: scoreData.recommendedSla,
        churnRisk: churnData.riskScore,
        churnRiskLevel: churnData.riskLevel,
        isStagnant: churnData.isStagnant,
        churnAlert: churnData.alertMessage,
        nextBestAction: nbaData.headline,
        nextBestActionSubtext: nbaData.subtext,
        nextBestActionType: nbaData.actionType,
        nextBestActionButton: nbaData.buttonLabel
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedLeads.length,
      leads: enrichedLeads
    });
  } catch (error: any) {
    console.error("GET /api/crm/leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch CRM leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, phone, email, designation, company, residence, isNri, nriTag,
      location, propertyInterest, bhk, carpetSqft, budget, budgetRaw,
      source, sourceType, stage, temperature, assignedTo, notes
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Name and phone are required for a lead." },
        { status: 400 }
      );
    }

    const code = `LD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLead = await queryOne(`
      INSERT INTO crm_leads (
        code, name, phone, email, designation, company, residence, is_nri, nri_tag,
        location, property_interest, bhk, carpet_sqft, budget, budget_raw,
        source, source_type, status, stage, temperature, assigned_to, notes,
        created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22,
        NOW(), NOW()
      )
      RETURNING 
        id, code, name, phone, email, designation, company, residence,
        is_nri AS "isNri", location, property_interest AS "propertyInterest",
        bhk, carpet_sqft AS "carpetSqft", budget, status, stage, temperature,
        assigned_to AS "assignedTo", notes, created_at AS "createdAt";
    `, [
      code, name, phone, email || null, designation || "Private Investor", company || null, residence || "Pune, Maharashtra",
      !!isNri, nriTag || null, location || "Baner, Pune", propertyInterest || "VTP Altair Residences",
      bhk || "3 BHK", carpetSqft || "1,146 Sq.Ft.", budget || "₹1.5 - 2.5 Cr", budgetRaw ? parseFloat(budgetRaw) : 17500000,
      source || "Direct Intake", sourceType || "walk_in", "New Lead", stage || "new",
      temperature || "hot", assignedTo || "Unassigned", notes || ""
    ]);

    return NextResponse.json({
      success: true,
      message: `Lead ${code} created successfully!`,
      lead: newLead
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/crm/leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create CRM lead" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const rawId = body.id || body.leadId;

    if (!rawId) {
      return NextResponse.json(
        { success: false, error: "Lead ID is required for updating." },
        { status: 400 }
      );
    }

    const cleanId = parseInt(String(rawId).replace(/[^0-9]/g, ''), 10);
    if (!cleanId || isNaN(cleanId)) {
      return NextResponse.json(
        { success: false, error: "Invalid lead ID provided." },
        { status: 400 }
      );
    }

    const updateFields: string[] = [];
    const values: any[] = [];

    const fieldMap: Record<string, string> = {
      name: 'name',
      phone: 'phone',
      email: 'email',
      designation: 'designation',
      company: 'company',
      location: 'location',
      propertyInterest: 'property_interest',
      bhk: 'bhk',
      carpetSqft: 'carpet_sqft',
      budget: 'budget',
      status: 'status',
      stage: 'stage',
      temperature: 'temperature',
      assignedTo: 'assigned_to',
      notes: 'notes'
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
      SET ${updateFields.join(', ')}, updated_at = NOW()
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
    console.error("PATCH /api/crm/leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    let idsToDelete: number[] = [];

    // Check query params
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get("id");
    const queryIds = searchParams.get("ids");

    if (queryIds) {
      idsToDelete = queryIds
        .split(",")
        .map((id) => parseInt(id.replace(/[^0-9]/g, ""), 10))
        .filter((id) => !isNaN(id) && id > 0);
    } else if (queryId) {
      const cleanId = parseInt(queryId.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(cleanId) && cleanId > 0) idsToDelete = [cleanId];
    }

    // If not in query params, inspect body
    if (idsToDelete.length === 0) {
      try {
        const body = await req.json();
        if (Array.isArray(body.ids)) {
          idsToDelete = body.ids
            .map((id: any) => parseInt(String(id).replace(/[^0-9]/g, ""), 10))
            .filter((id: number) => !isNaN(id) && id > 0);
        } else if (body.id) {
          const cleanId = parseInt(String(body.id).replace(/[^0-9]/g, ""), 10);
          if (!isNaN(cleanId) && cleanId > 0) idsToDelete = [cleanId];
        }
      } catch {
        // Body was empty or not JSON
      }
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid lead ID(s) provided for deletion." },
        { status: 400 }
      );
    }

    const deleted = await query(
      `DELETE FROM crm_leads WHERE id = ANY($1::int[]) RETURNING id, code;`,
      [idsToDelete]
    );

    return NextResponse.json({
      success: true,
      count: deleted.length,
      deletedIds: deleted.map((d: any) => d.id),
      message: `Successfully deleted ${deleted.length} lead(s).`
    });
  } catch (error: any) {
    console.error("DELETE /api/crm/leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete lead(s)" },
      { status: 500 }
    );
  }
}
