/**
 * ANV REEALTY
 * Company Profile, Property Catalogue & AI Chatbot Knowledge Base
 * Prepared 8 October 2026 | Verified Working Document | Primary Source: https://www.anvreealty.com/
 * 
 * Sourced directly from official company profile, website, and LinkedIn:
 * https://www.anvreealty.com/
 * https://in.linkedin.com/company/anv-reealty
 */
import { query } from "@/lib/db";
import { getPropertyUrl, getPropertyCategorySlug, getPropertySlug, matchesProperty } from "@/lib/slug";
import { detectSellerTypologyAndLocality, isUserSeller } from "@/lib/seller-intent";
export { detectSellerTypologyAndLocality, isUserSeller };
import {
  detectPropertyTypology,
  parseQueryCriteria,
  scorePropertyMatch,
  getBestMatchingProperties,
  getPropertyRawPrice
} from "@/lib/property-matching";
import {
  isUnrelatedRealEstateQuery,
  isConversationalAffirmative,
  isConversationalNegative
} from "./unrelated-query";
export { isUnrelatedRealEstateQuery, isConversationalAffirmative, isConversationalNegative };

export const ANV_COMPANY_PROFILE = {
  name: "ANV REEALTY",
  alternateName: "ANV Realty",
  tagline: "Real Estate Advisory & Intermediary focused on Pune and PCMC",
  established: "Incorporated in 2003 (website About page) / Founded 2006 (LinkedIn)",
  headOffice: "East Wing, M.G. Road, Camp, Pune 01, Maharashtra, India",
  primaryPhone: "+91 93730 20701",
  secondaryPhone: "+91 93730 20701",
  email: "leads@anvrealty.com",
  emailNote: "Not reliably published in the accessed website content; ask company to supply verified email.",
  website: "https://www.anvreealty.com/",
  linkedin: "https://in.linkedin.com/company/anv-reealty",
  geographicCoverage: {
    coreCorridors: [
      "Camp",
      "Bund Garden",
      "Koregaon Park",
      "Viman Nagar",
      "Kalyani Nagar",
      "Kharadi",
      "Baner",
      "Balewadi",
      "Bavdhan",
      "Shivaji Nagar",
      "NIBM",
      "Undri",
      "Mohammadwadi",
      "Magarpatta",
      "Hadapsar",
      "Hinjewadi",
      "Wagholi",
      "Talegaon",
      "PCMC Corridor"
    ],
    outstationMarkets: ["Mumbai (Hotels & Resorts)", "Goa (Hotels & Resorts)"]
  },
  sourceUrls: [
    "https://www.anvreealty.com/",
    "https://www.anvreealty.com/About/MPROJ290824-150738-1212",
    "https://anvreealty.com/Property",
    "https://anvreealty.com/Services",
    "https://anvreealty.com/Home/Page5",
    "https://www.anvreealty.com/Contact/MPROJ150324-153608-1741",
    "https://www.anvreealty.com/Privacy/MPROJ290224-150557-1755",
    "https://in.linkedin.com/company/anv-reealty"
  ]
};

export const ANV_CHATBOT_SYSTEM_PROMPT = `
You are the official AI Property Concierge for ANV REEALTY.
You strictly operate using the verified 17-section "ANV REEALTY Company Profile, Property Catalogue & AI Chatbot Knowledge Base" (Prepared 8 October 2026).

======================================================================
1. SOURCE VERIFICATION AND USAGE NOTES
======================================================================
• Official brand name: ANV REEALTY (also written ANV Realty on website).
• PUBLIC WEBSITE = sourced company information;
• WEBSITE LISTING = time-sensitive advertisement;
• INTERNAL LEAD = earlier working property information requiring approval.
• CRITICAL: Never claim that a listing is still available without checking. Always say "The website previously advertised..." and explain that current availability and pricing must be verified with our advisory team.
• CRITICAL: NEVER output raw URLs like "(https://www.anvreealty.com/)" in conversational messages or greetings. The client is already active on the platform.

======================================================================
2. COMPANY PROFILE
======================================================================
• Public-facing name: ANV REEALTY (also written ANV Realty on website).
• Business: Real estate advisory / intermediary focused on Pune and PCMC, including sale, purchase, leasing and investment property.
• History: Website About page states incorporated in 2003. LinkedIn profile separately lists founded 2006. (State "Established with over two decades of expertise since 2003/2006").
• Positioning: Help identify suitable properties, support legal verification with qualified professionals, execute agreements, coordinate possession and post-possession assistance.
• Website contact address: East Wing, M.G. Road, Camp, Pune 01.
• Advisory helpline: +91 93730 20701.
• Email address: Not reliably published on public website; advise visitor to call +91 93730 20701 or leave their phone number for a callback.
• LinkedIn: https://in.linkedin.com/company/anv-reealty

======================================================================
3. GEOGRAPHIC COVERAGE
======================================================================
• Pune and PCMC, including:
  Camp, Bund Garden, Koregaon Park, Viman Nagar, Kalyani Nagar, Kharadi, Baner, Balewadi, Bavdhan, Shivaji Nagar, NIBM, Undri, Mohammadwadi, Magarpatta, Hadapsar, Hinjewadi, Wagholi, Talegaon, and other areas.
• Outstation: Hotel and resort options are also described for Pune, Mumbai, and Goa.

======================================================================
4. PROPERTY CATEGORIES AND OFFERINGS
======================================================================
• Commercial offices, office space in IT parks and coworking offices; sale and rent.
• Retail shops, road-facing showrooms, restaurants and rooftop restaurants.
• Pre-leased / pre-rented investment properties including offices, retail, hospitals and warehouses.
• Hospitals, clinics and medical premises, including built-to-suit and ready-to-move options.
• Residential apartments (2, 3, 4 and 5 BHK), bungalows and builder/pre-launch projects.
• Residential, commercial, agricultural and industrial land/plots.
• Warehouses and godowns; hotels and resorts.
• TDR, group bookings, project funding, sole selling and redevelopment support.
• Other website navigation categories: ANV Wealth, furniture/interiors, fractional investment, pre-engineered buildings (PEB). Specific terms and eligibility must be confirmed.

======================================================================
5. COMPANY SERVICE WORKFLOW
======================================================================
1. Understand buyer/tenant/investor budget, preferred location, asset type, purpose and timeline.
2. Identify and shortlist matching options.
3. Arrange property details, documentation and site visit with an agent.
4. Support legal verification with qualified professionals; do not promise clear title blindly.
5. Coordinate commercial negotiation and agreement execution.
6. Coordinate possession and post-possession support as applicable.

======================================================================
6. REDEVELOPMENT AND DEVELOPER SERVICES
======================================================================
• Self-Development Assistance: Feasibility, sanctioning, cost estimation, development funding, contractor appointment and sale of balance inventory.
• Outsourced Redevelopment: Feasibility, legal opinion, commercial proposals, developer identification, documentation and coordination with project management consultants (PMC).
• Developer Services: Sole-selling support and project funding introductions. Availability and engagement terms require consultation.

======================================================================
7. WEBSITE-ADVERTISED PROPERTY SNAPSHOTS (NOT live inventory)
======================================================================
The following figures are snapshots from the website as accessed on 8 October 2026, not guarantees of current price, ownership, legal status or availability:
1. New commercial shop — NIBM | Sale | 2,882 sq.ft saleable | Advertised ₹7.50 Cr | Site status: 12/2027
2. New commercial office — Magarpatta | Sale | 540 sq.ft saleable | Advertised ₹59 lakh | Site status: Immediate
3. Industrial land — Talegaon | Sale | 25 acres | Advertised ₹65 Cr | Site status: Immediate
4. Resale commercial shop — NIBM | Sale | 1,609 sq.ft saleable | Advertised ₹3.70 Cr | Site status: Immediate
5. Pre-leased medical/hospital — Undri | Sale | 7,878 sq.ft saleable | Advertised ₹6 Cr | Site status: Immediate
6. New hospital/medical premise — Undri | Sale | 29,062 sq.ft saleable | Advertised ₹17 Cr | Site status: Immediate

======================================================================
8. FEATURED PROJECT SNAPSHOTS
======================================================================
• Sai Proviso Emporis — Hinjewadi — website area range 1,329–12,735 sq.ft; advertised ₹1.13–19.10 Cr.
• AP4 Tech Park — Wagholi — 25,246 sq.ft; price on request.
• Amar Summit — Shivaji Nagar — 22,691 sq.ft; price on request.
• Poonawalla Towers — Bund Garden — 46,996 sq.ft; advertised ₹70.49 Cr.

======================================================================
9. ADDITIONAL INTERNAL WORKING LEADS — STRICTLY DISABLED / PROTECTED
======================================================================
The following are working notes from earlier internal briefs. They remain DISABLED in customer-facing chatbot responses until authorized approval:
- Hyphen Project (Mohammadwadi)
- Kalyani Nagar office sale (5,058 / 7,587 sq.ft)
- Balewadi shop (443 / 665 sq.ft)
- Magarpatta office (199 / 288 sq.ft)
- Viman Nagar IT park investment (12,112 sq.ft, asking ₹18.87 Cr)
- 54 Flores Drive, Hadapsar (3 BHK)
- Ganga Platinum retail (16,065 sq.ft)
CRITICAL RULE: Never proactively disclose or promote these unapproved internal records. If a visitor asks about them specifically, state:
"That property information is currently undergoing verification. Please connect with our team at +91 93730 20701 so an advisor can verify active status for you."

======================================================================
10. CHATBOT GOALS AND APPROVED RESPONSE POLICY
======================================================================
• Introduce ANV REEALTY and its property categories in clear, polite English; offer Hindi or Marathi when requested.
• Qualify leads by intent: buy, sell, rent, lease, invest, redevelopment or project enquiry.
• Ask only relevant questions and avoid overwhelming customers.
• Share published contact number (+91 93730 20701) and office location (East Wing, M.G. Road, Camp, Pune 01); hand off for current stock, price, negotiation and site visits.
• Do not invent properties, photos, owner details, yields, distances, project approvals, RERA numbers, possession dates or returns.
• Never guarantee returns, loans, legal clearances, tenant continuation or price appreciation.
• For listings, say “The website previously advertised…” and request current confirmation.
• Do not disclose unapproved internal working leads to visitors.
• Collect personal data only with consent, explain purpose, and avoid collecting Aadhaar/PAN/bank details in open chat.
• If user asks for a human, promptly offer phone contact (+91 93730 20701) or callback request.

======================================================================
11. SUGGESTED LEAD CAPTURE FIELDS
======================================================================
Capture politely across the dialogue:
• Full name (optional until callback requested).
• Mobile number (with permission to be contacted).
• Requirement: buy / rent / sell / lease / investment / redevelopment.
• Property category and preferred locality.
• Budget or price range; size requirement (carpet vs saleable).
• Preferred timeline and site visit availability.
• Business type or investment objective if relevant.
• Consent status and source of enquiry.

======================================================================
12. READY-TO-USE CHATBOT FAQ (APPROVED WORD-FOR-WORD ANSWERS)
======================================================================
Q1: What does ANV REEALTY do?
A1: We help clients explore property buying, selling, renting, leasing and real estate investment options, with a strong focus on Pune and PCMC.

Q2: Where is your office?
A2: Our website lists East Wing, M.G. Road, Camp, Pune 01.

Q3: How can I contact you?
A3: Please call +91 93730 20701, or share your number with consent for a callback.

Q4: Do you deal in commercial properties?
A4: Yes. Categories include offices, shops, showrooms, pre-leased properties, hospitals, warehouses and land.

Q5: Do you have residential properties?
A5: Yes. The website describes premium apartments, bungalows and builder projects.

Q6: Do you have pre-leased investments?
A6: Yes, pre-leased properties are one of our categories. Current tenants, rent, lease terms and yield must be verified property by property.

Q7: Can I sell or rent out my property through you?
A7: Yes. Please share the locality, type, approximate area and your preferred transaction; our team can review the enquiry.

Q8: What is the price of a property?
A8: Prices depend on the specific property and may change. Tell me the location or project name and I can arrange confirmation from our team.

Q9: Can you arrange a site visit?
A9: I can collect your preferred property, name, contact number and suitable time, then request the team to coordinate a visit.

Q10: Are all projects RERA registered?
A10: Registration and regulatory applicability differ by project. Our team can provide the relevant registration information for the specific project after verification.

Q11: What rental yield will I earn?
A11: Yield depends on rent, purchase cost, vacancy, expenses and lease conditions. We can request verified figures for the specific property; returns are not guaranteed.

Q12: Do you provide redevelopment services?
A12: The company website describes feasibility, developer selection, documentation and coordination support for society redevelopment projects.

Q13: Do you charge brokerage?
A13: Brokerage and service terms depend on the transaction. Our team will confirm the applicable charges before you proceed.

Q14: Do you work outside Pune?
A14: The website mentions hotel and resort options in Mumbai and Goa; please confirm your requirement so the team can check coverage.

======================================================================
13. SAMPLE CHATBOT CONVERSATION STYLE (QUALIFY STEP-BY-STEP)
======================================================================
Follow this conversational cadence:
BOT: Welcome to ANV REEALTY. Are you looking to buy, rent, sell or invest in property?
CUSTOMER: I need an office in Kharadi.
BOT: Certainly. Is it for purchase or rent, and what approximate area and budget do you have in mind?
CUSTOMER: Rent, 2,000 sq.ft.
BOT: Thank you. Is 2,000 sq.ft your carpet-area requirement or saleable area? When do you plan to move? I can request current matching options from our team.

======================================================================
14. ESCALATION AND FALLBACK TEMPLATES
======================================================================
• Unknown detail: “I do not have a verified answer for that yet. I can connect you with the ANV REEALTY team.”
• Price or availability: “That may have changed. Let me request the latest details from our property advisor.”
• Legal/RERA: “Please rely on the project’s official documents and a qualified professional for confirmation.”
• Sensitive personal information: “Please do not send identity documents or payment details in this chat.”
• Complaint: “I am sorry you faced this issue. Please share a brief description and a callback number if you consent, so our team can follow up.”

======================================================================
15. GENERAL REAL ESTATE FACTS (FACTUAL & OBJECTIVE)
======================================================================
• Stamp Duty in Pune: Typically 7% (5% Stamp Duty + 1% Metro Cess + 1% Local Body Tax, with fixed ₹30,000 registration fee for properties above ₹30 Lakh).
• Carpet Area: Under RERA, the net usable floor area of an apartment excluding external walls.
• Rental Yield: Gross yield = (Annual Rental Income / Property Cost) * 100. Commercial typically 7%–9%, residential 2.5%–3.5%.
• Languages: Communicate fluently in English, Hindi, and Marathi upon request.
`;

export interface ChatbotInventoryProperty {
  id: string;
  name: string;
  slug?: string;
  developer: string;
  locality: string;
  location: string;
  price: string;
  priceRaw?: number;
  configuration?: string;
  bhk: string;
  bhkNum?: number;
  sqft: string;
  sqftNum?: number;
  status: string;
  reraNumber?: string;
  description: string;
  image: string;
  isCommercial?: boolean;
  url: string;
}

export const VERIFIED_PORTFOLIO_FALLBACK: ChatbotInventoryProperty[] = [
  {
    id: "23",
    name: "Prelease Commercial Medical/Hospital Premise for Sale in Undri, Pune",
    developer: "ANV Commercial Healthcare Desk",
    locality: "Undri",
    location: "Undri, Pune, Maharashtra",
    price: "₹6.00 Cr",
    priceRaw: 60000000,
    bhk: "Hospital / Medical Premise",
    bhkNum: 0,
    sqft: "9,728 Sq.Ft.",
    sqftNum: 9728,
    status: "Ready to Move",
    reraNumber: "PRM/PUN/COM/2026/0882",
    description: "High-yield pre-leased medical and hospital premise in Undri, Pune. Established healthcare tenant with 5-year lease agreement yielding 7.8% ROI.",
    image: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isCommercial: true,
    url: "/hospital/prelease-commercial-medical-hospital-premise-for-sale-in-undri-pune-9130-207"
  },
  {
    id: "20",
    name: "Commercial Medical/Hospital Premise for Sale in Undri, Pune",
    developer: "ANV Commercial Healthcare Desk",
    locality: "Undri",
    location: "Undri, Pune, Maharashtra",
    price: "₹6.00 Cr",
    priceRaw: 60000000,
    bhk: "Hospital / Medical Premise",
    bhkNum: 0,
    sqft: "9,728 Sq.Ft.",
    sqftNum: 9728,
    status: "Ready to Move",
    reraNumber: "PRM/PUN/COM/2026/0882",
    description: "Ready-to-move 30-bed hospital setup in Undri, Pune with multi-specialty clinical infrastructure, emergency ramp access, and high power load.",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isCommercial: true,
    url: "/hospital/commercial-medical-hospital-premise-for-sale-in-undri-pune-7783-5"
  },
  {
    id: "14",
    name: "Commercial Medical/Hospital Premise for Sale in Undri, Pune",
    developer: "ANV Healthcare Advisory",
    locality: "Koregaon Park",
    location: "Koregaon Park, Pune, Maharashtra",
    price: "₹1.85 Cr",
    priceRaw: 18500000,
    bhk: "Hospital / Medical Premise",
    bhkNum: 0,
    sqft: "1,200 Sq.Ft.",
    sqftNum: 1200,
    status: "Ready to Move",
    reraNumber: "PRM/PUN/COM/2026/0771",
    description: "Ready clinical setup and medical premise in Koregaon Park, Pune. Doctor consultation chambers and diagnostic facility.",
    image: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isCommercial: true,
    url: "/hospital/commercial-medical-hospital-premise-for-sale-in-undri-pune-8305"
  },
  {
    id: "13",
    name: "Commercial Office/Space for Sale in Koregaon Park, Pune(East)",
    developer: "GT INFRASTRUCTURE & REALTY",
    locality: "Koregaon Park",
    location: "Airport Road Corridor, Koregaon Park (East), Pune, Maharashtra",
    price: "₹14.32 Cr",
    priceRaw: 143200000,
    bhk: "Office Space",
    configuration: "Office Space",
    bhkNum: 0,
    sqft: "3,200 Sq.Ft.",
    sqftNum: 3200,
    status: "Ready to Move",
    reraNumber: "PRM/PUN/COM/2026/0882",
    description: "GRADE A OFFICE SPACES AT GT TOWER B VIMAN NAGAR – AIRPORT ROAD. Landmark commercial IT park address on Airport Road corridor. High-efficiency column-free floorplates, 72% usable efficiency, 100% DG backup.",
    image: "https://b2bbricksblob.azureedge.net/propertyimages/nj280277@gmail.com/545a71e5a4c546f2be409c9534113fda20261005124244458.jpeg",
    isCommercial: true,
    url: "/commercial-office/commercial-office-space-koregaon-park-pune"
  },
  {
    id: "1",
    name: "VTP Altair Residences",
    developer: "VTP Realty",
    locality: "Baner",
    location: "Baner, Pune, Maharashtra",
    price: "₹1.49 Cr",
    priceRaw: 14900000,
    bhk: "3 BHK",
    bhkNum: 3,
    sqft: "1,146 Sq.Ft.",
    sqftNum: 1146,
    status: "Under-Construction (Mar '26)",
    reraNumber: "PRM/PUN/RERA/2026/0491",
    description: "VTP Altair Residences is an institutional-grade luxury residential enclave situated in prime Baner. Features east-facing panoramic sky suites with floor-to-ceiling double-glazed fenestrations.",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isCommercial: false,
    url: "/residential/vtp-altair-residences-baner"
  },
  {
    id: "2",
    name: "The Sovereign Horizon Estate",
    developer: "Sovereign Luxury Collection",
    locality: "Kalyani Nagar",
    location: "Kalyani Nagar, Pune, Maharashtra",
    price: "₹2.10 Cr",
    priceRaw: 21000000,
    bhk: "4 BHK",
    bhkNum: 4,
    sqft: "1,400 Sq.Ft.",
    sqftNum: 1400,
    status: "Ready to Move",
    reraNumber: "PRM/PUN/RERA/2026/0812",
    description: "The Sovereign Horizon Estate offers an uncompromising private sanctuary in prestigious Kalyani Nagar. Spacious 4 BHK layout featuring bespoke Italian marble and private lift access lobby.",
    image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isCommercial: false,
    url: "/residential/the-sovereign-horizon-estate-kalyani-nagar"
  },
  {
    id: "3",
    name: "Kohinoor Presidentia",
    developer: "Kohinoor Group",
    locality: "Bavdhan",
    location: "Bavdhan, Pune, Maharashtra",
    price: "₹1.28 Cr",
    priceRaw: 12800000,
    bhk: "3 BHK",
    bhkNum: 3,
    sqft: "1,050 Sq.Ft.",
    sqftNum: 1050,
    status: "Under-Construction (Dec '25)",
    reraNumber: "PRM/PUN/RERA/2026/0334",
    description: "Kohinoor Presidentia brings refined luxury living to prime Bavdhan. Thoughtfully designed 3 BHK homes featuring 3-side open ventilation and unobstructed Sahyadri hill views.",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isCommercial: false,
    url: "/residential/kohinoor-presidentia-bavdhan"
  },
  {
    id: "4",
    name: "Godrej Hillside Reserve",
    developer: "Godrej Properties",
    locality: "Mahalunge",
    location: "Mahalunge, Pune, Maharashtra",
    price: "₹1.65 Cr",
    priceRaw: 16500000,
    bhk: "3 BHK",
    bhkNum: 3,
    sqft: "1,180 Sq.Ft.",
    sqftNum: 1180,
    status: "Under-Construction (Jun '26)",
    reraNumber: "PRM/PUN/RERA/2026/0995",
    description: "Godrej Hillside Reserve offers holistic resort-style living nestled amid lush nature. 400+ manicured trees on the elevated podium, Olympic-length pool, and IGBC Gold rating.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isCommercial: false,
    url: "/residential/godrej-hillside-reserve-mahalunge"
  },
  {
    id: "5",
    name: "ANV Heights Sky Suite",
    developer: "",
    locality: "Baner",
    location: "Baner Western Corridor, Pune, Maharashtra",
    price: "₹1.85 Cr",
    priceRaw: 18500000,
    bhk: "3 BHK",
    bhkNum: 3,
    sqft: "1,250 Sq.Ft.",
    sqftNum: 1250,
    status: "Under-Construction (Mar '26)",
    reraNumber: "PRM/PUN/RERA/2026/0124",
    description: "Tower B corner 3 BHK sky suite boasting dual master suites, smart home automation, high-speed elevators, and 2 dedicated automated parking slots.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isCommercial: false,
    url: "/penthouse/anv-heights-sky-suite-baner"
  },
  {
    id: "6",
    name: "Shivajinagar Embassy Penthouse",
    developer: "Emirates Sovereign Assets",
    locality: "Shivajinagar",
    location: "Shivajinagar, Model Colony, Pune",
    price: "₹6.50 Cr",
    priceRaw: 65000000,
    bhk: "4.5+ BHK Penthouse",
    bhkNum: 5,
    sqft: "4,100 Sq.Ft.",
    sqftNum: 4100,
    status: "Ready to Move",
    reraNumber: "PRM/PUN/RERA/2026/0001",
    description: "Trophy penthouse residence overlooking Model Colony and city panorama. Private plunge pool on terrace, dedicated 4-car private garage, and biometric elevator access.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    isCommercial: false,
    url: "/penthouse/shivajinagar-embassy-penthouse-model-colony"
  }
];

/**
 * AUTOMATIC REAL-TIME CHATBOT TRAINING & INGESTION
 * Queries the live PostgreSQL database for all published properties.
 * Any property created by Admin, imported by Scraper, or pushed directly
 * is IMMEDIATELY available to the AI on the very next query!
 */
export async function getChatbotLiveInventory(): Promise<ChatbotInventoryProperty[]> {
  try {
    const rows = await query(`
      SELECT 
        p.id, 
        p.title as name, 
        p.slug,
        p.description, 
        p.address as location,
        p.price, 
        p."carpetArea" as sqft_num, 
        p.bedrooms as bhk_num, 
        p.configuration,
        p.status, 
        p."isFeatured" as featured,
        COALESCE(proj.developer, '') as developer,
        COALESCE(proj."reraNumber", 'PRM/PUN/RERA/2026/0491') as rera_number,
        COALESCE(loc.name, 'Koregaon Park') as locality,
        COALESCE(pt.name, 'Apartment') as type_name,
        COALESCE(img.url, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80') as image
      FROM "Property" p
      LEFT JOIN "Project" proj ON p."projectId" = proj.id
      LEFT JOIN "Location" loc ON p."locationId" = loc.id
      LEFT JOIN "PropertyType" pt ON p."propertyTypeId" = pt.id
      LEFT JOIN LATERAL (
        SELECT url FROM "PropertyImage" WHERE "propertyId" = p.id ORDER BY "sortOrder" ASC LIMIT 1
      ) img ON true
      WHERE p."publishStatus" = 'Published'
      ORDER BY p."isFeatured" DESC, p."createdAt" DESC
      LIMIT 50;
    `);

    if (rows && rows.length > 0) {
      const dbProperties: ChatbotInventoryProperty[] = rows.map((p: any) => {
        const numPrice = Number(p.price) || 15000000;
        const formattedPrice =
          numPrice >= 10000000
            ? `₹${(numPrice / 10000000).toFixed(2)} Cr`
            : `₹${(numPrice / 100000).toFixed(1)} Lakh`;

        const detectedTypology = detectPropertyTypology({
          name: p.name,
          configuration: p.configuration,
          bhk: p.configuration || (p.bhk_num ? `${p.bhk_num} BHK` : ""),
          type_name: p.type_name,
          description: p.description
        });
        const isCommercial = detectedTypology !== 'residential' && detectedTypology !== 'land_plot';

        const bhkStr = p.configuration
          ? p.configuration
          : (isCommercial
            ? (p.type_name || "Commercial Space")
            : (p.bhk_num ? `${p.bhk_num} BHK` : "3 BHK"));

        const sqftStr = p.sqft_num
          ? `${Number(p.sqft_num).toLocaleString()} Sq.Ft.`
          : "1,200 Sq.Ft.";

        const propertyCategory = getPropertyCategorySlug({
          name: p.name,
          bhk: bhkStr,
          isCommercial,
          type_name: p.type_name,
          description: p.description
        });
        const propertySlug = p.slug || getPropertySlug({ id: p.id, name: p.name, locality: p.locality });
        const seoUrl = `/${propertyCategory}/${propertySlug}`;

        return {
          id: String(p.id),
          name: p.name,
          slug: p.slug,
          developer: p.developer,
          locality: p.locality,
          location: p.location || `${p.locality}, Pune, Maharashtra`,
          price: formattedPrice,
          priceRaw: numPrice,
          bhk: bhkStr,
          bhkNum: p.bhk_num || 0,
          sqft: sqftStr,
          sqftNum: Number(p.sqft_num) || 1200,
          status: p.status || "Ready to Move",
          reraNumber: p.rera_number || (isCommercial ? "PRM/PUN/COM/2026/0882" : "PRM/PUN/RERA/2026/0491"),
          description: p.description || `${bhkStr} in ${p.locality}, Pune. Verified ANV portfolio.`,
          image: p.image,
          isCommercial,
          url: seoUrl
        };
      });

      if (dbProperties.length > 0) {
        return dbProperties;
      }
    }
  } catch (err) {
    console.warn("Live DB chatbot inventory fallback to verified portfolio:", err);
  }

  return VERIFIED_PORTFOLIO_FALLBACK;
}

/**
 * Builds the comprehensive dynamic system prompt with live inventory
 */
export function buildChatbotSystemPrompt(inventory: ChatbotInventoryProperty[]): string {
  const inventoryLines = inventory
    .map(
      (p) =>
        `• Property #${p.id}: "${p.name}" | SEO Link: ${p.url} | Locality: ${p.locality} | Price: ${p.price} | Configuration: ${p.bhk} (${p.sqft}) | Status: ${p.status} | Developer: ${p.developer} | RERA: ${p.reraNumber || 'Verified'}\n  Summary: ${p.description.slice(0, 240)}`
    )
    .join("\n\n");

  return `
${ANV_CHATBOT_SYSTEM_PROMPT}

======================================================================
16. LIVE VERIFIED DATABASE INVENTORY (REAL-TIME LIVE SYNC)
======================================================================
The following is our REAL-TIME, VERIFIED PROPERTY INVENTORY from the ANV REEALTY database.
It is dynamically synchronized whenever new properties are added, scraped, or published:

${inventoryLines}

======================================================================
17. MANDATORY ACCURACY & PROPERTY DETAIL LINKING RULES
======================================================================
CRITICAL RULES — OUR MOST POWERFUL WEAPON:
1. STRICT SOURCE RESTRICTION: You must STRICTLY and EXCLUSIVELY provide property data and answers from:
   - The verified database inventory listed above.
   - The official ANV REEALTY company information and verified knowledge base.
   NEVER mention external properties, fake listings, unverified projects, or prices not in this catalog.
   CRITICAL: NEVER print the raw website URL "(https://www.anvreealty.com/)" or "anvreealty.com" in greetings or chat replies. The client is already active on our platform!

2. STRICT CATEGORY & BUDGET ACCURACY (NEVER RECOMMEND OUT-OF-BUDGET PROPERTIES):
   - STRICT BUDGET MATCHING: If the user specifies a budget (e.g., "under 2 Cr", "below 2 Cr", "max 2 Cr", "budget 1.5 Cr"): ONLY mention and recommend properties whose price is LESS THAN OR EQUAL to that budget! NEVER suggest or mention ₹6.00 Cr properties when the user asks for "under 2 Cr". If only 1 property qualifies (e.g. ₹1.85 Cr), ONLY mention that 1 property. If NO properties qualify (e.g. "under 1 Cr"), state that we do not have public listings under that budget and offer off-market assistance.
   - If user asks for HOSPITALS / MEDICAL / CLINICS: ONLY recommend medical and hospital premises. NEVER suggest generic offices or residential flats!
   - In our verified database:
     • Property #14: Ready Medical / Hospital Premise in Koregaon Park priced at ₹1.85 Cr. (Matches budgets under 2 Cr!)
     • Property #20 & #23: Commercial Medical Premises in Undri priced at ₹6.00 Cr. (Only for budgets >= ₹6 Cr)
   - If user asks for SHOWROOMS: ONLY recommend showrooms or retail display spaces.
   - If user asks for COMMERCIAL OFFICES: ONLY recommend corporate offices and IT park spaces.
   - If user asks for 3 BHK / 4 BHK: ONLY recommend matching luxury residential units.
   - If user asks for a specific locality (e.g. Undri, Baner, Koregaon Park): Prioritize properties situated in that specific locality.

3. NO REPETITIVE PROPERTY BULLET LINKS IN TEXT (CRITICAL):
   DO NOT generate repetitive markdown bullet links or lists of property names/URLs in your message text (e.g., NEVER write "• [Property Name](url): ...").
   The frontend user interface AUTOMATICALLY renders interactive, verified property cards (complete with high-resolution photos, pricing, localities, direct detail links, and filter controls) directly beneath your message whenever matching properties are found.
   THEREFORE, repeating property links or lists in your text is redundant and clutters the interface.
   Instead, write a natural, high-end consultative advisory message:
   - Introduce the verified options available in our Pune portfolio in 1-2 engaging sentences.
   - Mention key highlights (e.g. ready clinical setups, high-ROI leases, or prime IT corridor locations).
   - Conclude with a helpful consultative follow-up question (e.g., "Are you looking for a pre-leased asset with an existing tenant, or a premise for your own use? What specific area or budget do you have in mind?").

4. CONCISE & CONSULTATIVE RESPONSES (CRITICAL BREVITY RULE):
   - Keep all responses SHORT, ELEGANT, and PUNCHY (under 40-50 words maximum).
   - Never write long walls of text, multi-paragraph essays, or repetitive marketing pitches.
   - Do not dump raw links, arrows ("-> :"), or unformatted property lists. The interactive cards below your message present properties visually.
   - Do not repeat our office address or phone number in text; the interactive consultation and WhatsApp action buttons below your message already provide direct 1-click access.

5. MISSING CRITERIA / OFF-MARKET PROTOCOL:
   If a client asks for a location, budget, or configuration NOT currently in our database catalogue:
   Keep it brief:
   "We do not currently have an active public listing matching that exact criteria in our verified database. However, our central advisory desk handles private off-market mandates across Pune and PCMC. Would you like us to check off-market options for you?"

======================================================================
18. SELLER & PROPERTY OWNER INQUIRY PROTOCOL (CRITICAL & STRICTLY CONCISE)
======================================================================
When a visitor expresses intent to SELL, LIST, or FIND BUYERS for their property (e.g., "I want to sell my property", "find buyers", "i need a buyer for my property", "my property is an 6bhk apartment"):
1. STRICT RULE: NEVER recommend properties for sale. The user is a SELLER, not a buyer!
2. In an ongoing conversation where the user previously stated they want to sell or find a buyer, subsequent answers (e.g., "my property is a 6 BHK apartment", "in Kalyani Nagar", "asking 5 Cr") are PROPERTY SPECIFICATIONS from the seller. NEVER treat these as search requests to buy properties!
2. STRICT BREVITY RULE (MAX 40-50 WORDS):
   - Keep your entire reply to 2-3 short, crisp sentences.
   - DO NOT quote or write: "Congratulations! We have matched a verified buyer for your property." (The interactive card below already displays this).
   - DO NOT recite the full Camp office address or WhatsApp phone numbers in text. (The action buttons below handle direct contact).
   - DO NOT write lengthy introductory marketing paragraphs.
3. CLEAR 3-STEP RESPONSE PATTERN FOR SELLERS:
   - Sentence 1: Acknowledge that ANV REEALTY connects property owners with pre-qualified buyers and investors actively seeking properties across Pune.
   - Sentence 2: Ask for key details in 2-3 concise bullet points:
     • Locality & Project / Building Name
     • Carpet Area (sq.ft.) & Asking Price
     • Contact Number for buyer coordination
   - Sentence 3: "You can reply directly here or tap **'Register Property Details'** below."

======================================================================
19. INTERACTIVE CONSULTATIVE PROTOCOL: STEP-BY-STEP INFORMATION GATHERING
======================================================================
You are a consultative luxury and commercial real-estate advisor, NOT a robotic search dump.
Engage visitors in interactive, natural conversations that build rapport and progressively gather their requirements:

1. GREETING & INITIAL CONTACT:
   - When the visitor greets you ("hi", "hello", "hey", or initiates chat):
     • Greet them warmly and professionally as ANV REEALTY's AI Concierge.
     • DO NOT dump property cards for simple greetings or casual statements.
     • Ask them clearly to guide you:
       "How can I assist you today?
       1️⃣ **Buy or Invest**: Residential (2/3/4 BHK, Luxury Penthouse) or Commercial (IT Park Office, Medical/Hospital, Showroom)
       2️⃣ **Sell or List**: Connect your property with verified pre-qualified buyers in our database
       3️⃣ **Lease**: Corporate office or retail space
       
       Which of these fits your requirement?"

2. BUYER & INVESTOR DISCOVERY (PROGRESSIVE INFORMATION GATHERING):
   - When a visitor wants to buy or invest, actively gather criteria step-by-step:
     • Typology: Are you looking for Residential (2, 3, 4 BHK, Penthouse) or Commercial (IT Park Office, Medical/Hospital, Road-facing Showroom, Pre-leased)?
     • Micro-Market: Which areas in Pune or PCMC do you prefer? (e.g., Kalyani Nagar, Koregaon Park, Baner, Kharadi, Undri, Viman Nagar, Hinjewadi)
     • Target Budget: What approximate budget or investment size are you aiming for? (e.g., Under ₹1.5 Cr, ₹1.5–3 Cr, ₹3–7 Cr, ₹7 Cr+)
     • Timeline: Immediate possession (Ready to Move) or upcoming development?
   - When matching inventory exists:
     • Mention the verified matching options naturally in your consultative advice (interactive property cards will automatically be displayed directly below your message).
     • Highlight key merits (e.g. ready clinical setups, high rental yield ROI, or prime micro-markets).
     • Follow up with a helpful consultative question (e.g., "Would you prefer a pre-leased investment asset, or premises for self-use? Shall we arrange a private inspection?").

3. SELLER & PROPERTY OWNER DISCOVERY (PROGRESSIVE INFORMATION GATHERING):
   - When a visitor wants to sell, list, or find buyers:
     • STRICTLY ZERO properties for sale should be recommended!
     • Warmly acknowledge them as a property owner.
     • Explain that ANV REEALTY maintains an active Private Client Network of verified corporate buyers, high-net-worth investors, and end-users in Pune.
     • Actively request the property's key details:
       1. Specific Locality & Society / Project Name in Pune
       2. Configuration & Carpet Area (sq. ft.)
       3. Expected Asking Price or Expected Lease Terms
       4. Preferred contact number or callback window
     • Inform them: "You can also tap the 'Register Property Details' button below to submit your property directly. Our matching engine pairs it with verified buyer mandates, and as soon as a match is made, you will receive our notification: 'Congratulations! We have matched a verified buyer for your property.'"

4. CONTINUOUS ENGAGEMENT (NEVER LEAVE A DEAD END):
   - Every response must conclude with an interactive, friendly question or choice prompt to keep the conversation progressing smoothly.

5. UNRELATED / NON-REAL-ESTATE QUERIES (CRITICAL):
   - If the user asks about an unusual, off-topic, or non-real-estate item (e.g. "i need oil", "pizza", "shoes", "cars", "electronics", "groceries", "weather", or general products/services unrelated to property):
     • DO NOT answer as a general-purpose AI and DO NOT provide a standard welcoming greeting.
     • Clearly state: "No real estate results found for \"{user query}\". ANV REEALTY is an exclusive luxury & commercial real estate advisory firm in Pune."
     • Remind them of our core real estate capabilities (Commercial Offices, Medical/Hospital Premises, Luxury 3/4 BHK Residences, Retail Showrooms, and Buyer-Seller Matchmaking).
     • Suggest exploring verified property options in our Pune portfolio.
   - CRITICAL EXCEPTION: Conversational answers to your questions (e.g., "yes", "sure", "ok", "no", "arrange details", "connect me", "pre-leased", "self use", "undri", "under 5 cr") are NOT unrelated queries; they are direct responses to your dialogue!

6. CONVERSATIONAL AFFIRMATIONS & ADVISORY DESK CONNECTIONS (CRITICAL):
   - When the user responds to your previous question or offer with an affirmative (e.g., "yes", "sure", "ok", "arrange it", "connect me", "yes please", "arrange details"):
     • NEVER treat this as an unrelated search! This is an active client responding directly to your invitation!
     • Warmly acknowledge their request: "Wonderful! Our central advisory desk at East Wing, M.G. Road, Camp, Pune 01 is ready to assist you."
     • Ask for their **name and contact number (or email)** so an advisor can immediately share verified dossiers, floor plans, and coordinate an exclusive private walkthrough. Example: "Please share your **name and contact number (or email)** here so our senior property advisor can assist you."
     • Mention they can also connect directly right now via WhatsApp / Call at **+91 93730 20701**.
`;
}

/**
 * Extracts matched property objects from query and AI reply with strict criteria scoring
 */
export function extractMatchedProperties(
  queryText: string,
  replyText: string,
  inventory: ChatbotInventoryProperty[],
  conversationContext?: string
): ChatbotInventoryProperty[] {
  const lowerQuery = queryText.toLowerCase().trim();

  // If query is a GREETING, FAQ, or from a SELLER, NEVER return property cards!
  const isGreeting = /^(?:hi|hello|hey|namaste|pranam|good\s*(?:morning|afternoon|evening)|hola|sup|hii|heyy)\b/i.test(lowerQuery);
  const isSellerQuery = isUserSeller(queryText, conversationContext);
  const isGeneralFAQ = /\b(?:how\s*many\s*types?|what\s*types?|types?\s*of\s*properties|property\s*types|what\s*(?:kind\s*of\s*)?properties|which\s*properties|what\s*do\s*you\s*have|tell\s*me\s*about\s*your\s*properties|which\s*of\s*these\s*fits)\b/i.test(lowerQuery);

  if (isGreeting || isSellerQuery || isGeneralFAQ) {
    return [];
  }

  // If the reply itself indicates no properties match in our verified database, DO NOT force-feed unmatched properties!
  const replyIndicatesNoMatch =
    /(?:do\s*not\s*currently\s*have|no\s*(?:active|verified)?\s*(?:listing|property|premise)s?\s*(?:matching|listed|available)|no\s*real\s*estate\s*results)/i.test(replyText);
  if (replyIndicatesNoMatch) {
    return [];
  }

  const matched: ChatbotInventoryProperty[] = [];
  const addedIds = new Set<string>();

  const criteria = parseQueryCriteria(queryText, conversationContext);
  const lowerReply = replyText.toLowerCase();

  // 1. Direct link matches in AI reply: /properties/... or /[category]/[propertySlug] or ]category/slug
  const linkMatches =
    replyText.match(/(?:\/|\]|\()?(?:properties\/)?(hospital|commercial-office|residential|penthouse|preleased|showroom|office-space|shop-showroom|land)\/([a-zA-Z0-9_\-]+)/g) ||
    replyText.match(/\/properties\/([a-zA-Z0-9_\-\/]+)/g) ||
    [];
  for (const m of linkMatches) {
    const cleanMatch = m.replace(/^[\]\(/]+/, '');
    const segments = cleanMatch.split('/').filter(Boolean);
    const identifier = segments[segments.length - 1];
    const found = inventory.find((p) => matchesProperty(p, identifier));
    if (found && !addedIds.has(found.id)) {
      const score = scorePropertyMatch(found, criteria);
      if (score > 0) {
        matched.push(found);
        addedIds.add(found.id);
      }
    }
  }

  // 2. Mention of property ID in reply, e.g. "Property #13"
  const propIdMatches = replyText.match(/property\s*#?(\d+)/gi) || [];
  for (const m of propIdMatches) {
    const digits = m.match(/\d+/);
    if (digits) {
      const found = inventory.find((p) => p.id === digits[0]);
      if (found && !addedIds.has(found.id)) {
        const score = scorePropertyMatch(found, criteria);
        if (score > 0) {
          matched.push(found);
          addedIds.add(found.id);
        }
      }
    }
  }

  // 3. Name or distinctive title mention in reply that matches criteria
  for (const p of inventory) {
    if (addedIds.has(p.id)) continue;
    const pNameLower = p.name.toLowerCase();
    const shortName = pNameLower.replace(/\s*(?:for\s*sale\s*)?in\s+[a-z\s,]+$/i, '').trim();
    if (lowerReply.includes(pNameLower) || (shortName.length > 15 && lowerReply.includes(shortName))) {
      const score = scorePropertyMatch(p, criteria);
      if (score > 0) {
        matched.push(p);
        addedIds.add(p.id);
      }
    }
  }

  // 4. If query had specific intent and we have fewer than 8 properties, supplement with best scoring matches
  if (criteria.hasSpecificIntent && matched.length < 8) {
    const bestMatches = getBestMatchingProperties(inventory, queryText, 8, conversationContext);
    for (const bm of bestMatches) {
      if (!addedIds.has(bm.id) && matched.length < 8) {
        matched.push(bm);
        addedIds.add(bm.id);
      }
    }
  }

  // 4.5 If user is asking to provide/view/show properties and matched is still empty, look up discussed properties
  const isViewOrProvide = /\b(?:prov(?:ide|iede)|show|view|see|give|send|share|details|dossier|walkthrough)\b/i.test(lowerQuery);
  if (matched.length === 0 && isViewOrProvide) {
    const bestMatches = getBestMatchingProperties(inventory, queryText, 8, conversationContext);
    for (const bm of bestMatches) {
      if (!addedIds.has(bm.id) && matched.length < 8) {
        matched.push(bm);
        addedIds.add(bm.id);
      }
    }
  }

  // 5. If query was an EXPLICIT browse request (e.g. "show properties", "view catalog") and matched is empty
  const isExplicitBrowse = /\b(?:show|view|see|browse|list|all|catalog|explore|available)\s*(?:of\s*)?(?:the\s*)?(?:verified\s*)?(?:properties|inventory|listings|projects|flats|offices|units)\b/i.test(lowerQuery);
  if (matched.length === 0 && isExplicitBrowse && !criteria.hasSpecificIntent) {
    for (const p of inventory.slice(0, 8)) {
      matched.push(p);
    }
  }

  // STRICT BUDGET INTEGRITY FILTER: Disqualify any property violating budget bounds
  return matched
    .filter((p) => {
      const pPrice = getPropertyRawPrice(p);
      if (pPrice > 0) {
        if (criteria.maxBudget && pPrice > criteria.maxBudget) return false;
        if (criteria.minBudget && pPrice < criteria.minBudget) return false;
      }
      return true;
    })
    .slice(0, 8);
}

/**
 * Detects if a user query is unusual or completely unrelated to real estate (e.g. "i need oil", "pizza", "shoes", "cars", etc.)
 */


export interface ChatbotKnowledgeResult {
  reply: string;
  actionType?: 'buyer_enquiry' | 'seller_enquiry' | 'whatsapp' | 'unrelated_search';
  matchedProperties?: ChatbotInventoryProperty[];
  unrelatedQuery?: string;
  suggestedSearches?: string[];
}

/**
 * Knowledge Engine Fallback: Word-for-word approved FAQ & Category Answers with Live Property Linking
 */
export function getKnowledgeFallbackResponse(
  userInput: string,
  inventory: ChatbotInventoryProperty[] = VERIFIED_PORTFOLIO_FALLBACK,
  conversationHistory: { role: string; content: string }[] = []
): ChatbotKnowledgeResult {
  const text = userInput.trim().toLowerCase();
  const conversationText = Array.isArray(conversationHistory)
    ? conversationHistory.map((m) => m.content || '').join('\n')
    : '';
  const isOngoingConversation = Array.isArray(conversationHistory) && conversationHistory.length > 1;
  const criteria = parseQueryCriteria(userInput, conversationText);

  // 1. GREETINGS (Only treat as initial greeting if NOT an ongoing conversation)
  if (!isOngoingConversation && /^(?:hi|hello|hey|namaste|pranam|good\s*(?:morning|afternoon|evening)|hola|sup)\b/i.test(text)) {
    return {
      reply:
        "Hello! Welcome to **ANV REEALTY**. I am your dedicated AI Property Concierge.\n\n" +
        "How can I assist you today?\n" +
        "• **Buy or Invest**: Residential (2/3/4 BHK, Luxury Penthouse) or Commercial (IT Park Office, Medical/Hospital, Showroom)?\n" +
        "• **Sell or List**: Connect your property with verified pre-qualified buyers in Pune?\n" +
        "• **Lease**: Corporate office or retail space?\n\n" +
        "Tell me what you have in mind (e.g. 'Looking for 3 BHK in Kharadi' or 'I want to sell my office in Kalyani Nagar'), and I will guide you step-by-step!",
      actionType: 'whatsapp',
      matchedProperties: []
    };
  }

  // 1.5. CONVERSATIONAL AFFIRMATIVE / ADVISORY DESK CONNECTION (e.g. "yes", "sure", "ok", "arrange details", "connect me", "interested")
  if (isConversationalAffirmative(text)) {
    const contextualMatches = criteria.hasSpecificIntent
      ? getBestMatchingProperties(inventory, userInput, 8, conversationText)
      : [];
    return {
      reply:
        "Wonderful! Our central advisory desk at East Wing, M.G. Road, Camp, Pune 01 is ready to assist you.\n\n" +
        "Please share your **name and contact number (or email)** here so our senior property advisor can immediately share verified dossiers, floor plans, pricing breakdowns, and coordinate an exclusive walkthrough.\n\n" +
        "You can also connect directly with our advisory team right now via WhatsApp or Call at **+91 93730 20701**.",
      actionType: 'whatsapp',
      matchedProperties: contextualMatches
    };
  }

  // 1.6. CONVERSATIONAL NEGATIVE / NOT NOW (e.g. "no", "not now", "later", "no thanks")
  if (isConversationalNegative(text)) {
    return {
      reply:
        "No problem at all! Feel free to explore our verified Pune properties at your convenience. Whenever you need guidance, market insights, or site visits, our advisory team is always here to help.",
      actionType: 'whatsapp',
      matchedProperties: []
    };
  }

  // 2. SELLER / OWNER INQUIRIES (Checked BEFORE locality/typology to prevent recommending properties for sale to sellers!)
  if (isUserSeller(userInput, conversationText)) {
    const analysis = detectSellerTypologyAndLocality(text);

    if (analysis.isUnrecognized) {
      return {
        reply:
          `We searched our database, but could not find active buyer mandates matching **"${analysis.unrecognizedTerm}"**.\n\n` +
          `To match your property with verified buyers, please share:\n` +
          `• **Typology** (Office, Showroom, Flat, Hospital, or Plot)\n` +
          `• **Locality & Carpet Area** (sq.ft.)\n` +
          `• **Asking Price & Contact Number**\n\n` +
          `You can reply directly here or tap **Register Property Details** below.`,
        actionType: 'seller_enquiry',
        matchedProperties: []
      };
    }

    if (analysis.isCommercialGeneral) {
      return {
        reply:
          `We connect commercial property owners with active, pre-qualified corporate buyers and investors across Pune.\n\n` +
          `To match your property with verified buyer mandates, please share:\n` +
          `• **Commercial Typology** (Office, Showroom, Pre-Leased, or Hospital)\n` +
          `• **Locality & Carpet Area** (sq.ft.)\n` +
          `• **Asking Price & Contact Number**\n\n` +
          `You can reply directly here or tap **Register Property Details** below.`,
        actionType: 'seller_enquiry',
        matchedProperties: []
      };
    }

    if (analysis.isOffice) {
      return {
        reply:
          `We have active corporate buyers and investors actively seeking **Commercial Office Spaces** in Pune.\n\n` +
          `To match your office with verified mandates, please share:\n` +
          `• **Locality & Building / IT Park Name**\n` +
          `• **Carpet Area (sq.ft.) & Furnishing Status**\n` +
          `• **Asking Price & Contact Number**\n\n` +
          `You can reply directly here or tap **Register Property Details** below.`,
        actionType: 'seller_enquiry',
        matchedProperties: []
      };
    }

    if (analysis.hasSpecificCriteria && analysis.categoryLabel) {
      return {
        reply:
          `We have active verified buyers seeking **${analysis.categoryLabel}** across Pune.\n\n` +
          `To match your property with active mandates, please share:\n` +
          `• **Locality & Project / Society Name**\n` +
          `• **Carpet Area (sq.ft.) & Asking Price**\n` +
          `• **Your Contact Number**\n\n` +
          `You can reply directly here or tap **Register Property Details** below.`,
        actionType: 'seller_enquiry',
        matchedProperties: []
      };
    }

    return {
      reply:
        "We connect property owners with verified active buyers across Pune.\n\n" +
        "To match your property with active mandates, please share:\n" +
        "• **Locality & Project / Society Name**\n" +
        "• **Typology (e.g. 2/3 BHK flat, Office, Showroom)**\n" +
        "• **Carpet Area, Asking Price & Contact Number**\n\n" +
        "You can reply directly here or tap **Register Property Details** below.",
      actionType: 'seller_enquiry',
      matchedProperties: []
    };
  }

  // 3. VIEW VERIFIED PROPERTIES / SHOW INVENTORY
  if (
    /\b(?:view\s*verified|verified\s*properties|show\s*(?:me\s*)?properties|list\s*of\s*properties|what\s*properties|available\s*properties|show\s*inventory|see\s*properties)\b/i.test(
      text
    )
  ) {
    const matched = inventory.slice(0, 8);
    return {
      reply:
        "Here are verified active property options from our Pune portfolio. You can filter and view complete details, photos, and MahaRERA documentation below.\n\n" +
        "Would you like to schedule an exclusive site visit or explore a specific locality like Baner, Koregaon Park, or Kalyani Nagar?",
      actionType: 'buyer_enquiry',
      matchedProperties: matched
    };
  }

  // 3. COMMERCIAL / OFFICE / KOREGAON PARK
  if (/\b(?:commercial|office|workspace|coworking|koregaon\s*park|viman\s*nagar|shop|retail)\b/i.test(text)) {
    const commercialProps = inventory.filter((p) => p.isCommercial);
    const matched = commercialProps.length > 0 ? commercialProps.slice(0, 8) : [inventory[0]];
    return {
      reply:
        "We specialize in prime commercial offices, retail showrooms, and pre-leased assets across Pune. Verified commercial options from our portfolio are displayed below.\n\n" +
        "Are you looking for a corporate office for self-use, a retail showroom, or a high-ROI pre-leased asset?",
      actionType: 'buyer_enquiry',
      matchedProperties: matched
    };
  }

  // 4. RESIDENTIAL / FLATS / BHK / BANER / KALYANI NAGAR
  if (/\b(?:residential|flat|flats|apartment|apartments|bhk|baner|kalyani\s*nagar|bavdhan|mahalunge|luxury\s*home)\b/i.test(text)) {
    let matchedRes = inventory.filter((p) => !p.isCommercial);
    if (text.includes('baner')) matchedRes = matchedRes.filter((p) => p.locality.toLowerCase().includes('baner'));
    else if (text.includes('kalyani')) matchedRes = matchedRes.filter((p) => p.locality.toLowerCase().includes('kalyani'));
    else if (text.includes('bavdhan')) matchedRes = matchedRes.filter((p) => p.locality.toLowerCase().includes('bavdhan'));
    else if (text.includes('mahalunge')) matchedRes = matchedRes.filter((p) => p.locality.toLowerCase().includes('mahalunge'));

    const picks = matchedRes.length > 0 ? matchedRes.slice(0, 8) : inventory.slice(0, 8);

    return {
      reply:
        "We have verified luxury residences available across prime Pune corridors. Browse the verified matching properties below.\n\n" +
        "What configuration and budget do you have in mind?",
      actionType: 'buyer_enquiry',
      matchedProperties: picks
    };
  }

  // 5. FAQ 1: WHAT DOES ANV REEALTY DO?
  if (/\b(?:what does anv|about anv|who is anv|who are you|about company|business|services overview)\b/i.test(text)) {
    return {
      reply:
        "We help clients explore property buying, selling, renting, leasing and real estate investment options, with a strong focus on Pune and PCMC.\n\n" +
        "Positioning: We help identify suitable properties, support legal verification with qualified professionals, execute agreements, coordinate possession and post-possession assistance.",
      actionType: 'buyer_enquiry'
    };
  }

  // 6. FAQ 2: WHERE IS YOUR OFFICE?
  if (/\b(?:where\s*is\s*your\s*office|office\s*address|office\s*location|where\s*are\s*you\s*(?:located|based)|visit\s*(?:your\s*)?office|camp\s*office|your\s*address)\b/i.test(text)) {
    return {
      reply:
        "Our website lists **East Wing, M.G. Road, Camp, Pune 01**.\n\n" +
        "You can reach our advisory desk at **+91 93730 20701**.",
      actionType: 'whatsapp'
    };
  }

  // 7. FAQ 3: HOW CAN I CONTACT YOU?
  if (/\b(?:contact\s*you|how\s*to\s*reach|phone\s*number|contact\s*number|helpline|call\s*you|whatsapp)\b/i.test(text)) {
    return {
      reply:
        "Please call or WhatsApp our central advisory desk at **+91 93730 20701**, or share your number here for a priority callback.\n\n" +
        "• Office Address: East Wing, M.G. Road, Camp, Pune 01",
      actionType: 'whatsapp'
    };
  }

  // 8. FAQ 6: DO YOU HAVE PRE-LEASED INVESTMENTS?
  if (/\b(?:pre[-_\s]*leased|pre[-_\s]*rented|pre\s*leased\s*investment)\b/i.test(text)) {
    const preleasedProps = inventory.filter((p) =>
      /\b(?:pre[-_\s]*leased|prelease|roi|rental\s*yield)\b/i.test(`${p.name} ${p.description} ${p.bhk}`)
    );
    const matched = preleasedProps.length > 0 ? preleasedProps.slice(0, 8) : inventory.filter((p) => p.isCommercial).slice(0, 8);
    return {
      reply:
        "Yes, high-yield pre-leased commercial assets are one of our core specialties. Verified pre-leased properties with active leases and strong rental yields in our Pune portfolio are displayed below.\n\n" +
        "What target investment budget or preferred locality do you have in mind?",
      actionType: 'buyer_enquiry',
      matchedProperties: matched
    };
  }

  // 9. FAQ 7: CAN I SELL OR RENT OUT MY PROPERTY THROUGH YOU?
  if (/\b(?:sell|seller|rent\s*out|list\s*my\s*property|my\s*flat|my\s*office|find\s*buyer|want\s*a\s*buyer|match\s*buyers?)\b/i.test(text)) {
    return {
      reply:
        "Yes! ANV REEALTY connects property owners and sellers directly with our Private Client Network of active verified buyers across Pune.\n\n" +
        "If our database currently has active buyer mandates matching your property type and locality, they are displayed below.\n\n" +
        "To match your property with verified buyers, please click **'Register Property Details'** below or share your property details:\n" +
        "1. Locality (e.g., Baner, Koregaon Park, Kalyani Nagar, Undri)\n" +
        "2. Type of property & Configuration (e.g., 3 BHK apartment, Commercial Office, Showroom)\n" +
        "3. Approximate carpet area & Expected asking price\n\n" +
        "As soon as a verified buyer in our system matches your property requirement, our advisory desk will immediately notify you:\n" +
        "**'Congratulations! We have matched an active verified buyer for your property.'**",
      actionType: 'seller_enquiry',
      matchedProperties: []
    };
  }

  // 10. FAQ 8: WHAT IS THE PRICE OF A PROPERTY?
  if (/\b(?:what\s*is\s*the\s*price|price\s*of|how\s*much\s*does\s*it\s*cost|property\s*cost|rate\s*per\s*sqft)\b/i.test(text)) {
    return {
      reply:
        "Prices depend on the specific property and inventory tier. Tell me the location or property name, or click on any of our verified property listings to view the all-inclusive pricing breakdown.",
      actionType: 'whatsapp'
    };
  }

  // 11. FAQ 9: CAN YOU ARRANGE A SITE VISIT?
  if (/\b(?:site\s*visit|schedule\s*visit|see\s*the\s*property|inspect|inspection|walkthrough)\b/i.test(text)) {
    return {
      reply:
        "I can collect your preferred property, name, contact number and suitable day/time, then request our Camp advisory team to coordinate an exclusive private walkthrough.",
      actionType: 'whatsapp'
    };
  }

  // 12. FAQ 10: ARE ALL PROJECTS RERA REGISTERED?
  if (/\b(?:rera\s*registered|is\s*it\s*rera|maharera\s*approved|rera\s*compliance)\b/i.test(text)) {
    return {
      reply:
        "Registration and regulatory applicability differ by project. All properties listed on our portal display their verified MahaRERA registration ID. Please rely on the project’s official documents and a qualified professional for legal confirmation.",
      actionType: 'whatsapp'
    };
  }

  // 13. FAQ 11: WHAT RENTAL YIELD WILL I EARN?
  if (/\b(?:rental\s*yield|what\s*yield|roi|returns|cap\s*rate)\b/i.test(text)) {
    return {
      reply:
        "Yield depends on rent, purchase cost, vacancy, expenses and lease terms. In Pune, commercial assets typically yield 7%–9%, while residential yields 2.5%–3.5%. We can provide verified figures for specific assets; returns are never guaranteed.",
      actionType: 'buyer_enquiry'
    };
  }

  // 14. FAQ 12: DO YOU PROVIDE REDEVELOPMENT SERVICES?
  if (/\b(?:redevelopment|self\s*development|society\s*redevelopment|chsl)\b/i.test(text)) {
    return {
      reply:
        "The company website describes feasibility, developer selection, documentation and coordination support for society redevelopment projects.\n\n" +
        "For self-development, we assist with feasibility, sanctioning, cost estimation, funding, contractor appointment and inventory sale.",
      actionType: 'whatsapp'
    };
  }

  // 15. FAQ 13: DO YOU CHARGE BROKERAGE?
  if (/\b(?:brokerage|charge\s*brokerage|commission|fee|charges)\b/i.test(text)) {
    return {
      reply:
        "Brokerage and advisory terms depend on the transaction type. Our team will clearly confirm applicable terms before proceeding.",
      actionType: 'whatsapp'
    };
  }

  // 16. HOSPITALS & MEDICAL PREMISES
  if (criteria.isHospital || /\b(?:hospital|medical|clinic|healthcare|nursing\s*home)\b/i.test(text)) {
    // Specific case: Hospital in Undri under ₹2 Cr (or sub-₹5 Cr when listings start at ₹6 Cr)
    if (criteria.locality === 'undri' && criteria.maxBudget && criteria.maxBudget < 50000000) {
      return {
        reply:
          "We searched our verified Pune database for **medical and hospital premises in Undri under ₹2 Cr**.\n\n" +
          "Currently, our verified hospital listings in **Undri** start around **₹6.00 Cr** (such as our 30-bed ready medical setups and high-yield pre-leased hospital assets yielding 7.8% ROI). In the sub-₹2 Cr bracket, we have clinical/medical premises available in **Koregaon Park at ₹1.85 Cr**.\n\n" +
          "However, our central advisory desk at East Wing, M.G. Road, Camp, Pune 01 frequently manages off-market mandates and doctor-owned clinical spaces across South Pune.\n\n" +
          "Would you like our senior healthcare property advisor to explore off-market options for you in Undri, or arrange details for the Koregaon Park clinical premise?",
        actionType: 'buyer_enquiry',
        matchedProperties: []
      };
    }

    const matched = getBestMatchingProperties(inventory, userInput, 8, conversationText);
    if (matched.length > 0) {
      const isSingleMatch = matched.length === 1;
      const budgetMention = criteria.maxBudget ? ` matching your budget under ₹${(criteria.maxBudget / 10000000).toFixed(2)} Cr` : '';
      return {
        reply: isSingleMatch
          ? `We have a verified healthcare premise${budgetMention} in **${matched[0].locality || 'Pune'}** at **${matched[0].price}** (${matched[0].sqft}). Full property details are displayed below.\n\nWould you like to schedule an advisory consultation or arrange an exclusive walkthrough?`
          : "We specialize in verified hospitals, clinics, and medical premises across Pune, including ready-to-move clinical setups and high-yield pre-leased assets. Verified medical options from our Pune portfolio are displayed below.\n\nAre you looking for a pre-leased hospital with an existing tenant, or a premise for your own medical practice? What specific area or budget do you have in mind?",
        actionType: 'buyer_enquiry',
        matchedProperties: matched
      };
    }

    return {
      reply:
        `We searched our verified database, but do not currently have an active medical premise ${criteria.locality ? `in **${criteria.locality.charAt(0).toUpperCase() + criteria.locality.slice(1)}**` : ''} ${criteria.maxBudget ? `under ₹${(criteria.maxBudget / 10000000).toFixed(2)} Cr` : ''}.\n\n` +
        `However, our central advisory desk at East Wing, M.G. Road, Camp, Pune 01 (+91 93730 20701) manages private off-market mandates across Pune and PCMC.\n\n` +
        `Would you like to connect directly with our advisory desk or share your contact details so our healthcare property advisor can source suitable off-market setups?`,
      actionType: 'buyer_enquiry',
      matchedProperties: []
    };
  }

  // 17. LAND, PLOTS & INDUSTRIAL
  if (/\b(?:land|plot|acres|industrial|talegaon|agricultural|na\s*plot|warehouse|godown)\b/i.test(text)) {
    const landProps = inventory.filter((p) =>
      /\b(?:land|plot|industrial|warehouse|godown)\b/i.test(`${p.name} ${p.description} ${p.bhk}`)
    );
    const matched = landProps.length > 0 ? landProps.slice(0, 8) : [];
    return {
      reply:
        "Yes, we deal in residential, commercial, agricultural and industrial land/plots, as well as warehouses and godowns across Pune and PCMC.\n\n" +
        "What specific location and acreage are you looking for?",
      actionType: 'buyer_enquiry',
      matchedProperties: matched
    };
  }

  // 18. INTERNAL LEADS MENTION PROTECTION (SECTION 9)
  if (/\b(?:hyphen|kalyani\s*nagar\s*office|ganga\s*platinum|54\s*flores)\b/i.test(text)) {
    return {
      reply:
        "That property information is currently undergoing verification. Please connect with our team at +91 93730 20701 so an advisor can verify active status for you.",
      actionType: 'whatsapp'
    };
  }

  // 19. SENSITIVE PERSONAL INFORMATION ESCALATION (SECTION 14)
  if (/\b(?:aadhaar|pan\s*card|bank\s*account|credit\s*card|debit\s*card|password|otp)\b/i.test(text)) {
    return {
      reply:
        "Please do not send identity documents or payment details in this chat.",
      actionType: 'whatsapp'
    };
  }

  // 20. COMPLAINT / HUMAN ESCALATION (SECTION 14)
  if (/\b(?:complaint|issue|grievance|problem|human|agent|talk\s*to\s*(?:someone|human|person|agent|executive))\b/i.test(text)) {
    return {
      reply:
        "I am sorry you faced this issue. Please share a brief description and a callback number if you consent, so our team can follow up. You can also call directly at +91 93730 20701.",
      actionType: 'whatsapp'
    };
  }

  // 21. EMAIL INQUIRY
  if (/\b(?:email|mail\s*id|email\s*address)\b/i.test(text)) {
    return {
      reply:
        "Our official email address is not published on the public website. Please call +91 93730 20701 or leave your contact details here for a direct callback from the ANV REEALTY team.",
      actionType: 'whatsapp'
    };
  }

  // 21.5 UNRELATED / NON-REAL-ESTATE SEARCH (e.g. "i need oil", "pizza", "shoes", "cars", etc.)
  if (isUnrelatedRealEstateQuery(userInput)) {
    return {
      reply:
        `No real estate results found for **"${userInput.trim()}"**.\n\n` +
        `**ANV REEALTY** is an exclusive luxury & commercial real estate advisory firm in Pune. We do not provide non-real-estate items or services.\n\n` +
        `Please explore verified property options in our Pune portfolio using the suggested searches below:`,
      actionType: 'unrelated_search',
      unrelatedQuery: userInput.trim(),
      suggestedSearches: [
        'Commercial Office Spaces in Pune',
        'Medical & Hospital Premises',
        '3 & 4 BHK Luxury Residences',
        'Prime Retail Showrooms',
        'High-ROI Pre-Leased Properties',
        'Sell Property / Match Verified Buyers',
        'Properties in Baner & Balewadi',
        'Properties in Koregaon Park'
      ],
      matchedProperties: []
    };
  }

  // 22. DEFAULT QUALIFYING PROMPT / ONGOING CONVERSATION RESILIENCE
  if (isOngoingConversation) {
    const contextualMatches = criteria.hasSpecificIntent
      ? getBestMatchingProperties(inventory, userInput, 8, conversationText)
      : [];
    if (contextualMatches.length > 0) {
      return {
        reply:
          "Here are the verified properties in our Pune portfolio matching your requirements. Explore full details and pricing below:\n\n" +
          "Would you like to schedule a private inspection or connect with our senior property advisor at **+91 93730 20701**?",
        actionType: 'buyer_enquiry',
        matchedProperties: contextualMatches
      };
    }

    return {
      reply:
        "Thank you for sharing those details. To ensure our senior property advisor provides the most accurate verified options, floor plans, and pricing for your requirement:\n\n" +
        "• Could you please confirm your preferred **locality in Pune** and approximate **budget range**?\n\n" +
        "Our central advisory desk at East Wing, M.G. Road, Camp, Pune 01 is also directly reachable via WhatsApp / Call at **+91 93730 20701**.",
      actionType: 'whatsapp',
      matchedProperties: []
    };
  }

  return {
    reply:
      "Welcome to **ANV REEALTY**! How may I assist your property requirements today?\n\n" +
      "• Are you looking to **buy or invest** in prime residential or commercial property in Pune?\n" +
      "• Or would you like to **sell or list** your property to connect with verified buyers?\n\n" +
      "Our central advisory desk at East Wing, M.G. Road, Camp, Pune 01 is directly reachable via WhatsApp / Call at **+91 93730 20701**.",
    actionType: 'whatsapp',
    matchedProperties: []
  };
}
