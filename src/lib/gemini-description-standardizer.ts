/**
 * Gemini AI Description Standardizer
 * 
 * Standardizes property descriptions into an executive, highly-readable dossier
 * strictly ordered according to the 42-point commercial/residential real estate hierarchy.
 * 
 * RULE: Headings are ONLY displayed if actual values are present in the source data.
 */

import { generateWithGemini } from '@/lib/gemini';

export interface PropertyContext {
  title?: string;
  location?: string;
  city?: string;
  price?: string;
  sqft?: string;
  bhk?: string;
  status?: string;
  developer?: string;
  transactionType?: string;
  possession?: string;
  age?: string;
  facing?: string;
  furnishing?: string;
  totalFloors?: string;
  floor?: string;
  parking?: string;
  suitableFor?: string;
  features?: string[];
  deposit?: string;
  rent?: string;
}

export const DESCRIPTION_FIELD_HIERARCHY = [
  { id: 1, field: 'Posted Date', remark: 'Created / Listed Date' },
  { id: 2, field: 'Property Title', remark: 'e.g. 2,200 Sq.Ft. Commercial Shop for Rent in Nana Peth' },
  { id: 3, field: 'Landmark, City', remark: 'Landmarks, junctions, arterial roads and city' },
  { id: 4, field: 'Property Age', remark: 'Age of structure (e.g. 0-2 Years, Under Construction)' },
  { id: 5, field: 'Possession', remark: 'Possession timeline (e.g. Ready to Move, Dec 2026)' },
  { id: 6, field: 'Expected Price', remark: 'Sale price or quoted valuation' },
  { id: 7, field: 'JV Ratio', remark: 'Joint Venture sharing ratio if applicable' },
  { id: 8, field: 'Transaction', remark: 'Transaction type: Rent / Lease / Resale / Sale / New Launch' },
  { id: 9, field: 'Ownership', remark: 'Ownership: Freehold, Leasehold, Society' },
  { id: 10, field: 'Building Name', remark: 'Name of the commercial/residential complex' },
  { id: 11, field: 'Property/Developer Name', remark: 'Builder or developer firm' },
  { id: 12, field: 'Area : Carpet : Saleable', remark: 'Detailed area breakdown (Carpet, Saleable, Super, Built-up, Basement, Mezzanine)' },
  { id: 13, field: 'No of Bedroom', remark: 'Bedrooms or typology (e.g. 1 BHK, 2 BHK, Commercial Office, Showroom)' },
  { id: 14, field: 'Parking Spaces', remark: 'Display with symbols: 🚗 Four Wheeler & 🛵 Two Wheeler' },
  { id: 15, field: 'Furnishing', remark: 'Display under: WS (Workstations) : Cabins : Conference : Reception or Bare Shell / Furnished' },
  { id: 16, field: 'H : W : D', remark: 'Dimensions: Ceiling Height : Frontage/Width : Depth : Road Width' },
  { id: 17, field: 'Total Floors', remark: 'Total floors in building (e.g. G + 7 Floors)' },
  { id: 18, field: 'Property on Floor', remark: 'Floor of unit (Only in case of Resale / Unit specific)' },
  { id: 19, field: 'Suitable For', remark: 'Permitted usages: Retail, Showroom, Clinic, Bank, Corporate, etc.' },
  { id: 20, field: 'Unique Feature', remark: 'Key architectural or strategic USPs (Road-Touch, High Footfall)' },
  { id: 21, field: 'Lease Period (Month)', remark: 'Lease duration in months or years' },
  { id: 22, field: 'Lock-in Period (Year)', remark: 'Lock-in period terms' },
  { id: 23, field: 'Rent Start Date', remark: 'Rent commencement date or rent-free fitout period' },
  { id: 24, field: 'Rent Per Month', remark: 'Expected monthly rent' },
  { id: 25, field: 'Rent Escalation %', remark: 'Annual or 3-year rent escalation percentage' },
  { id: 26, field: 'Maintenance Charges', remark: 'Society / CAM maintenance charges per month or per sq.ft.' },
  { id: 27, field: 'Security Deposit', remark: 'Refundable security deposit (e.g. 3 Months or 6 Months rent)' },
  { id: 28, field: 'Property Tax', remark: 'Property tax payment terms' },
  { id: 29, field: 'ROI %', remark: 'Gross or net rental yield percentage' },
  { id: 30, field: 'Facing', remark: 'Directional facing (East, North, Main Road Facing)' },
  { id: 31, field: 'Lifts', remark: 'Passenger, service or bed elevators' },
  { id: 32, field: 'Flooring', remark: 'Flooring type (Vitrified, Laser-Screed FM2, Bare Concrete)' },
  { id: 33, field: 'Power (kVA)', remark: 'Connected electrical sanctioned load' },
  { id: 34, field: 'Backup Power (kVA)', remark: 'DG power backup capacity' },
  { id: 35, field: 'Pollution Color Zone', remark: 'Industrial zoning color: Green, White, Orange, Red' },
  { id: 36, field: 'Racking Capacity (EOT) - tonnes', remark: 'EOT crane or industrial racking tonnage' },
  { id: 37, field: 'Floor Strength - ton per meter cube', remark: 'Floor load-bearing capacity' },
  { id: 38, field: 'STP/ETP Capacity - litres', remark: 'Effluent or sewage treatment capacity' },
  { id: 39, field: 'No of loading bays', remark: 'Dedicated truck/trailer loading docks' },
  { id: 40, field: 'Canopy Details (Length - Width)', remark: 'All-weather PEB canopy dimensions' },
  { id: 41, field: 'Fire NOC', remark: 'Fire safety compliance & sprinkler status' },
  { id: 42, field: 'Dock Levellers', remark: 'Hydraulic or automated dock levelers' }
] as const;

const GEMINI_SYSTEM_PROMPT = `You are the master executive real estate description structuring engine for ANV REEALTY Pune.

Your mission is to analyze unstructured property narratives, broker WhatsApp broadcasts, and listings, and re-order them into the strict 42-point hierarchy below.

HIERARCHY ORDER (1 to 42):
1. Posted Date
2. Property Title
3. Landmark, City
4. Property Age
5. Possession
6. Expected Price
7. JV Ratio
8. Transaction
9. Ownership
10. Building Name
11. Property/Developer Name
12. Area : Carpet : Saleable
13. No of Bedroom / Configuration
14. Parking Spaces
15. Furnishing
16. H : W : D (Height : Width : Depth)
17. Total Floors
18. Property on Floor
19. Suitable For
20. Unique Feature
21. Lease Period (Month)
22. Lock-in Period (Year)
23. Rent Start Date
24. Rent Per Month
25. Rent Escalation %
26. Maintenance Charges
27. Security Deposit
28. Property Tax
29. ROI %
30. Facing
31. Lifts
32. Flooring
33. Power (kVA)
34. Backup Power (kVA)
35. Pollution Color Zone
36. Racking Capacity (EOT) - tonnes
37. Floor Strength - ton per meter cube
38. STP/ETP Capacity - litres
39. No of loading bays
40. Canopy Details (Length - Width)
41. Fire NOC
42. Dock Levellers

MANDATORY RULES:
1. STRICT VALUE RULE: ONLY include a heading if an actual value exists in the source text or property context! If there is no value for a field (e.g. no JV Ratio, no Dock Levellers), DO NOT output that heading. Never output 'N/A' or empty headings.
2. NEW LINE FORMAT: Every included field MUST start on a brand new line starting with '# ' (e.g. '# Property Title: 2,200 Sq.Ft. Commercial Shop for Rent in Nana Peth').
3. CLEAN UP HASHTAGS: Remove unreadable merged hashtags (e.g. '#reatailshopsatundri' -> map to '# Suitable For: Retail Shops in Undri').
4. PARKING FORMAT: When parking is mentioned, use symbols: 🚗 Four Wheeler: X | 🛵 Two Wheeler: Y.
5. FURNISHING FORMAT: For commercial offices with fitouts, format under: WS: [count] | Cabins: [count] | Conference: [count] | Reception: [Yes/No] (or 'Bare Shell' / 'Warm Shell' / 'Furnished' as applicable).
6. AREA FORMAT: Group all area metrics together under Area (e.g. '# Area: Carpet Area: 620 Sq.Ft. | Saleable Area: 900 Sq.Ft. | Basement: 1,100 Sq.Ft.').
7. OUTPUT ONLY: Output strictly the lines starting with '# '. No intro, no outro, no markdown codeblocks (\`\`\`).`;

/**
 * Uses Gemini AI to structure raw property descriptions according to the 42-point hierarchy.
 */
export async function geminiStandardizeDescription(
  rawDescription: string = '',
  context: PropertyContext = {}
): Promise<string | null> {
  if (!rawDescription && !context.title) {
    return '';
  }

  const promptInput = `
SOURCE TEXT / BROKER BROADCAST:
${rawDescription}

KNOWN PROPERTY METADATA:
${context.title ? `Title: ${context.title}` : ''}
${context.location ? `Location: ${context.location}` : ''}
${context.city ? `City: ${context.city || 'Pune'}` : ''}
${context.price ? `Price: ${context.price}` : ''}
${context.sqft ? `Sq.Ft.: ${context.sqft}` : ''}
${context.bhk ? `Configuration/Typology: ${context.bhk}` : ''}
${context.status ? `Status: ${context.status}` : ''}
${context.developer ? `Developer/Brand: ${context.developer}` : ''}
${context.possession ? `Possession: ${context.possession}` : ''}
${context.deposit ? `Deposit: ${context.deposit}` : ''}
${context.rent ? `Rent: ${context.rent}` : ''}

Please structure the description strictly according to the 42-point hierarchy. ONLY output fields with values. Each field on its own line starting with '# '.
`.trim();

  try {
    const aiResult = await generateWithGemini({
      preferredModel: 'gemini-2.5-flash',
      systemPrompt: GEMINI_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: promptInput }],
      temperature: 0.1,
      maxOutputTokens: 1000
    });

    if (aiResult && aiResult.trim()) {
      // Clean any accidental markdown code fences
      const cleaned = aiResult
        .replace(/```(?:markdown|text)?/gi, '')
        .replace(/```/g, '')
        .trim();

      // Ensure every line starts with '# ' and has single newline separation
      return cleaned
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => (l.startsWith('#') ? l : `# ${l}`))
        .join('\n');
    }
  } catch (err: any) {
    console.warn('Gemini description standardizer notice:', err?.message || err);
  }

  return null;
}

/**
 * Fast deterministic fallback parser that sorts raw hashtag text into the 42-point order
 * without requiring external network calls.
 */
export function fastDeterministicStandardizeDescription(
  rawDescription: string = '',
  context: PropertyContext = {}
): string {
  if (!rawDescription) return '';

  // Extract raw hashtag segments or lines
  const rawSegments = rawDescription
    .replace(/\r/g, '')
    .split(/(?:^|\n|\s+)#/)
    .map(s => s.trim().replace(/^#+/, '').trim())
    .filter(Boolean);

  if (rawSegments.length === 0 && !context.title) {
    return rawDescription.trim();
  }

  const buckets: { [key: number]: string } = {};

  const addBucket = (id: number, text: string) => {
    if (!text || !text.trim()) return;
    const clean = text.trim();
    if (buckets[id]) {
      // Avoid duplicate text in same bucket
      if (!buckets[id].toLowerCase().includes(clean.toLowerCase())) {
        buckets[id] += ' | ' + clean;
      }
    } else {
      buckets[id] = clean;
    }
  };

  // Seed with available context
  if (context.title) addBucket(2, `Property Title: ${context.title}`);
  if (context.location) addBucket(3, `Landmark, City: ${context.location}${context.city ? `, ${context.city}` : ''}`);
  if (context.price && !/request/i.test(context.price)) addBucket(6, `Expected Price: ${context.price}`);
  if (context.developer) addBucket(11, `Property/Developer Name: ${context.developer}`);
  if (context.sqft) addBucket(12, `Carpet Area: ${context.sqft}`);
  if (context.bhk) addBucket(13, `No of Bedroom / Configuration: ${context.bhk}`);
  if (context.possession) addBucket(5, `Possession: ${context.possession}`);
  if (context.deposit) addBucket(27, `Security Deposit: ${context.deposit}`);
  if (context.rent) addBucket(24, `Rent Per Month: ${context.rent}`);

  // Analyze raw segments
  for (const seg of rawSegments) {
    let s = seg.trim();
    if (!s) continue;

    // Separate merged hashtags like #retailshopsatundri into readable words
    if (/^[a-z0-9]+$/i.test(s) && s.length > 10) {
      s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
    }

    if (/project\s*name\s*[:\-]/i.test(s) || /building\s*name\s*[:\-]/i.test(s)) {
      const val = s.replace(/(?:project|building)\s*name\s*[:\-]/i, '').trim();
      addBucket(10, `Building Name: ${val}`);
    } else if (/(?:commercial\s*shop|office\s*space|showroom|warehouse|bhk|penthouse|apartment)\s*(?:available|for\s*rent|for\s*sale)?/i.test(s) && !buckets[2]) {
      addBucket(2, `Property Title: ${s.replace(/^(?:property\s*title\s*[:\-])?\s*/i, '')}`);
    } else if (/(?:shop|office|showroom|space)\s*available\s*in\s*([^,#|]+)/i.test(s)) {
      const locMatch = s.match(/(?:available\s*in)\s*([^,#|]+)/i);
      if (locMatch && locMatch[1]) {
        addBucket(3, `Landmark, City: ${locMatch[1].trim()}, Pune`);
      }
      addBucket(19, `Suitable For: ${s}`);
    } else if (/near\s+|opposite\s+|chowk|crossroad|metro|highway|expressway|corridor|towards\s+/i.test(s) && !/road\s*width|facing/i.test(s)) {
      addBucket(3, `Landmark, City: ${s}`);
    } else if (/carpet\s*area|saleable\s*area|super\s*area|built\s*up|total\s*(?:stated\s*)?area|basement|mezzanine/i.test(s)) {
      addBucket(12, s.startsWith('Area') ? s : `Area: ${s}`);
    } else if (/car\s*parking|two\s*wheeler|parking\s*space|car\s*park/i.test(s)) {
      const formatted = s
        .replace(/(\d+)\s*(?:car|four\s*wheel(?:er)?)\s*parking/gi, '🚗 $1 Four Wheeler Parking')
        .replace(/(\d+)\s*two\s*wheeler/gi, '🛵 $1 Two Wheeler Parking');
      addBucket(14, `Parking Spaces: ${formatted}`);
    } else if (/furnish|bare\s*shell|warm\s*shell|workstation|cabin|conference|reception/i.test(s)) {
      addBucket(15, s.startsWith('Furnishing') ? s : `Furnishing: ${s}`);
    } else if (/wide\s*road|ceiling\s*height|frontage|depth|80\s*ft|100\s*ft|height\s*[:\-]/i.test(s)) {
      addBucket(16, `H : W : D: ${s}`);
    } else if (/total\s*floors?|floors?\s*building/i.test(s)) {
      addBucket(17, `Total Floors: ${s}`);
    } else if (/on\s*floor|floor\s*no|(\d+)(?:st|nd|rd|th)\s*floor/i.test(s)) {
      addBucket(18, `Property on Floor: ${s}`);
    } else if (/suitable\s*for/i.test(s) || /(?:retail|showroom|clinic|bank|corporate|commercial\s*business|godown|storage)/i.test(s)) {
      addBucket(19, s.startsWith('Suitable For') ? s : `Suitable For: ${s}`);
    } else if (/lock[\s\-]*in/i.test(s)) {
      addBucket(22, `Lock-in Period: ${s}`);
    } else if (/lease\s*period|agreement\s*period/i.test(s)) {
      addBucket(21, `Lease Period: ${s}`);
    } else if (/expected\s*rent|rent\s*per\s*month|per\s*month|\brent\s*[:\-]/i.test(s)) {
      addBucket(24, s.startsWith('Rent') ? s : `Rent Per Month: ${s}`);
    } else if (/escalation/i.test(s)) {
      addBucket(25, `Rent Escalation %: ${s}`);
    } else if (/maintenance/i.test(s)) {
      addBucket(26, `Maintenance Charges: ${s}`);
    } else if (/deposit/i.test(s)) {
      addBucket(27, s.startsWith('Security Deposit') ? s : `Security Deposit: ${s}`);
    } else if (/roi|rental\s*yield/i.test(s)) {
      addBucket(29, `ROI %: ${s}`);
    } else if (/facing/i.test(s) || /road\s*facing/i.test(s)) {
      addBucket(30, s.startsWith('Facing') ? s : `Facing: ${s}`);
    } else if (/lift|elevator/i.test(s)) {
      addBucket(31, `Lifts: ${s}`);
    } else if (/flooring|tile/i.test(s)) {
      addBucket(32, `Flooring: ${s}`);
    } else if (/kva|power\s*backup|generator|dg\s*backup/i.test(s)) {
      if (/backup|dg/i.test(s)) {
        addBucket(34, `Backup Power (kVA): ${s}`);
      } else {
        addBucket(33, `Power (kVA): ${s}`);
      }
    } else if (/dock\s*level/i.test(s)) {
      addBucket(42, `Dock Levellers: ${s}`);
    } else if (/loading\s*bay/i.test(s)) {
      addBucket(39, `No of loading bays: ${s}`);
    } else if (/fire\s*noc|sprinkler/i.test(s)) {
      addBucket(41, `Fire NOC: ${s}`);
    } else if (/prime\s*location|road\-touch|main\s*road|water\s*supply|washroom|toilet|cctv|security/i.test(s)) {
      addBucket(20, `Unique Feature: ${s}`);
    } else {
      // General highlight / feature
      addBucket(20, s);
    }
  }

  // Build ordered output matching 1..42
  const outputLines: string[] = [];
  for (let i = 1; i <= 42; i++) {
    if (buckets[i]) {
      outputLines.push(`# ${buckets[i]}`);
    }
  }

  return outputLines.length > 0 ? outputLines.join('\n') : rawDescription.trim();
}

/**
 * Master standardizer: Runs Gemini AI first, falls back smoothly to deterministic parser.
 */
export async function standardizePropertyDescription(
  rawDescription: string = '',
  context: PropertyContext = {}
): Promise<string> {
  if (!rawDescription && !context.title) return '';

  const aiResult = await geminiStandardizeDescription(rawDescription, context);
  if (aiResult && aiResult.trim()) {
    return aiResult.trim();
  }

  return fastDeterministicStandardizeDescription(rawDescription, context);
}
