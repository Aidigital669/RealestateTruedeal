import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export const maxDuration = 60;

const PUNE_LOCALITIES = [
  "Baner",
  "Balewadi",
  "Koregaon Park",
  "Kalyani Nagar",
  "Viman Nagar",
  "Kharadi",
  "Wakad",
  "Hinjewadi",
  "Undri",
  "NIBM",
  "Bavdhan",
  "Mahalunge",
  "Shivajinagar",
  "Camp",
  "Aundh",
  "Magarpatta",
  "Hadapsar",
  "Wagholi",
  "Model Colony",
  "Prabhat Road",
  "SB Road",
  "FC Road",
  "Boat Club Road",
  "Kothrud",
  "Dhanori",
  "Pashan"
];

const TYPOLOGY_PATTERNS = [
  { match: /\b1\s*bhk\b/i, value: "1 BHK" },
  { match: /\b2\s*bhk\b/i, value: "2 BHK" },
  { match: /\b3\s*bhk\b/i, value: "3 BHK" },
  { match: /\b4\s*bhk\b/i, value: "4 BHK" },
  { match: /\b(?:5\+?\s*bhk|penthouse)\b/i, value: "4.5+ BHK Penthouse" },
  { match: /\b(?:hospital|medical|clinic|healthcare)\b/i, value: "Hospital / Healthcare" },
  { match: /\b(?:commercial\s*office|office\s*space|it\s*park|corporate)\b/i, value: "Commercial Office" },
  { match: /\b(?:showroom|retail|shop|store)\b/i.test, value: "Showroom / Retail" },
  { match: /\b(?:land|plot)\b/i, value: "Land / Commercial Plot" },
  { match: /\b(?:villa|bungalow|row\s*house)\b/i, value: "Luxury Villa" }
];

function maskBuyerName(name: string | null | undefined): string {
  if (!name || !name.trim()) return "Verified Patron (Pune)";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const p = parts[0];
    return p.length > 2 ? `${p.slice(0, 2)}*** (Verified Buyer)` : "Verified Buyer";
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || "";
  return `${first} ${lastInitial}.*** (Verified Buyer)`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Please select a valid PDF file to upload." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF text using PDFParse
    const parser = new PDFParse({ data: buffer });
    const textRes = await parser.getText();
    const fullText = textRes.text || "";

    if (!fullText.trim()) {
      return NextResponse.json(
        { success: false, error: "The uploaded PDF contains no readable text (it may be a scanned image)." },
        { status: 422 }
      );
    }

    // Split text into candidate entries (by numbered lists, double newlines, or lines)
    const rawBlocks = fullText
      .split(/(?:\n\s*\n|\r\n\s*\r\n|(?=\b\d{1,3}[\.\)]\s+))/g)
      .map((b) => b.trim())
      .filter((b) => b.length > 20);

    const parsedBuyers: any[] = [];
    let entryIdx = 1;

    for (const block of rawBlocks) {
      // 1. Phone extraction
      const phoneMatch = block.match(/(?:(?:\+?91)|0)?[ -]?[6-9]\d{4}[ -]?\d{5}\b/) || block.match(/\b[6-9]\d{9}\b/);
      const phone = phoneMatch ? phoneMatch[0].replace(/[^0-9]/g, "").slice(-10) : "";

      // 2. Email extraction
      const emailMatch = block.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      const email = emailMatch ? emailMatch[0].toLowerCase() : "";

      // 3. Locality detection
      let locality = "Pune Prime";
      for (const loc of PUNE_LOCALITIES) {
        if (new RegExp(`\\b${loc}\\b`, "i").test(block)) {
          locality = loc;
          break;
        }
      }

      // 4. Typology detection
      let bhk = "3 BHK";
      for (const t of TYPOLOGY_PATTERNS) {
        if (typeof t.match === "function" ? t.match(block) : (t.match as RegExp).test(block)) {
          bhk = t.value;
          break;
        }
      }

      // 5. Budget extraction
      let budget = "₹1.50 Cr - ₹2.50 Cr";
      const budgetMatch = block.match(/₹?\s*\d+(?:\.\d+)?\s*(?:-\s*₹?\s*\d+(?:\.\d+)?)?\s*(?:Cr|Crore|Lakh|Lac)\b/i) ||
                          block.match(/budget[:\s]+([^\n,;|]+)/i);
      if (budgetMatch) {
        budget = budgetMatch[0].replace(/budget[:\s]+/i, "").trim();
        if (!budget.startsWith("₹") && /\d/.test(budget)) budget = `₹${budget}`;
      }

      // 6. Name extraction
      let name = `Verified Buyer ${entryIdx}`;
      const nameMatch = block.match(/(?:name|client|buyer|mr\.|mrs\.|dr\.)[:\s]+([A-Za-z\s]+?)(?=[,\n\r\t;|]|$)/i) ||
                        block.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/);
      if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2) {
        name = nameMatch[1].trim().replace(/^(?:name|client|buyer)[:\s]+/i, "");
      }

      // 7. Purpose detection
      let purpose = "Self-Use";
      if (/investment|roi|rental|yield/i.test(block)) purpose = "Investment / ROI";
      if (/corporate|commercial|office|expansion/i.test(block)) purpose = "Corporate Expansion";
      if (/healthcare|hospital|clinic/i.test(block)) purpose = "Healthcare Facility";

      // 8. Timeline
      let timeline = "Ready to Move / 60 Days";
      if (/immediate|urgent|active|ready/i.test(block)) timeline = "Immediate / 30 Days";
      if (/under construction|launch|next year/i.test(block)) timeline = "Under Construction / 1 Year";

      // 9. Clean requirements summary
      const cleanReq = block
        .replace(/\s+/g, " ")
        .slice(0, 180)
        .trim();

      parsedBuyers.push({
        id: `pdf-buyer-${Date.now()}-${entryIdx}`,
        referenceCode: `REQ-${new Date().getFullYear()}-${String(100 + entryIdx).padStart(3, "0")}`,
        name,
        maskedName: maskBuyerName(name),
        phone: phone || "9373020701",
        email: email || "leads@anvrealty.com",
        locality,
        bhk,
        budget,
        purpose,
        timeline,
        requirements: cleanReq || `Looking for ${bhk} in ${locality} with budget ${budget}.`,
        status: "Verified Active Buyer",
        isValid: true
      });

      entryIdx++;
    }

    // If no distinct blocks were detected, create at least one parsed record from full text if keywords match
    if (parsedBuyers.length === 0 && fullText.length > 10) {
      parsedBuyers.push({
        id: `pdf-buyer-${Date.now()}-1`,
        referenceCode: `REQ-${new Date().getFullYear()}-001`,
        name: "Verified Patron Lead",
        maskedName: "Verified Patron (Pune)",
        phone: "9373020701",
        email: "leads@anvrealty.com",
        locality: "Baner",
        bhk: "3 BHK",
        budget: "₹1.50 Cr - ₹2.50 Cr",
        purpose: "Self-Use / Investment",
        timeline: "Ready to Move / 60 Days",
        requirements: fullText.slice(0, 180).trim(),
        status: "Verified Active Buyer",
        isValid: true
      });
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      totalDetected: parsedBuyers.length,
      buyers: parsedBuyers
    });
  } catch (error: any) {
    console.error("POST /api/admin/buyers/parse-pdf error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to parse PDF file." },
      { status: 500 }
    );
  }
}
