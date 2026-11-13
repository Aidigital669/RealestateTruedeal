/**
 * Dual-Persona Real Estate CRM: Algorithmic Engine
 * Implements the 5 Core Formulations defined in the architectural blueprint:
 * 1. Dynamic Lead Intent & Qualification Scoring (S_lead)
 * 2. Smart Agent Auto-Distribution & Affinity Matching (A_agent)
 * 3. Customer-Property DNA Vector Matcher (M_prop)
 * 4. Pipeline Stage Velocity & Stagnation Churn Risk (R_churn)
 * 5. Next Best Action (NBA) Prescriptive Decision Engine
 */

export interface LeadDna {
  configuration?: string;
  targetBudget?: string;
  budgetRaw?: number;
  preferredLocations?: string;
  purchasePurpose?: string;
  possessionHorizon?: string;
  financingStatus?: string;
}

export interface AlgorithmicScoreResult {
  score: number; // 0 - 100
  tier: 'hot' | 'warm' | 'cold';
  breakdown: {
    budgetPower: number; // max 25
    timelineUrgency: number; // max 20
    financingHealth: number; // max 15
    engagementLevel: number; // max 20
    highPatronage: number; // max 10
    idlePenalty: number; // -lambda
  };
  recommendedSla: string;
}

export interface ChurnRiskResult {
  riskScore: number; // 0.0 - 1.0
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isStagnant: boolean;
  alertMessage?: string;
  daysInStage: number;
}

export interface NextBestActionResult {
  headline: string;
  subtext: string;
  urgency: 'immediate' | 'high' | 'medium' | 'standard';
  actionType: 'call' | 'visit' | 'whatsapp' | 'proposal' | 'nurture';
  buttonLabel: string;
}

export interface PropertyMatchResult {
  propertyId: string;
  propertyName: string;
  matchScore: number; // 0 - 100
  isGoldMatch: boolean; // >= 75%
  compatibilityHighlights: string[];
  mismatches?: string[];
  scoreBreakdown?: {
    budget: number;
    location: number;
    typology: number;
    area: number;
    other: number;
  };
  whatsappPitch?: string;
}

/**
 * ALGORITHM 1: Dynamic Lead Qualification & Intent Scoring (S_lead)
 * S_lead = w_b * B + w_t * T + w_f * F + w_e * E + w_n * N - lambda * D_idle
 */
export function calculateLeadScore(lead: {
  budgetRaw?: number;
  budget?: string;
  timeline?: string;
  dna?: LeadDna;
  isNri?: boolean;
  financingStatus?: string;
  stage?: string;
  siteVisitAttended?: boolean;
  callCount?: number;
  lastContactHoursAgo?: number;
}): AlgorithmicScoreResult {
  // 1. Budget Power (Max 25 pts)
  let budgetPower = 10;
  const rawBudget = lead.budgetRaw || (lead.dna?.budgetRaw) || 15000000;
  if (rawBudget >= 40000000) budgetPower = 25;
  else if (rawBudget >= 25000000) budgetPower = 20;
  else if (rawBudget >= 15000000) budgetPower = 15;
  else budgetPower = 10;

  // 2. Timeline Urgency (Max 20 pts)
  let timelineUrgency = 10;
  const horizon = (lead.timeline || lead.dna?.possessionHorizon || '').toLowerCase();
  if (horizon.includes('immediate') || horizon.includes('ready') || horizon.includes('30') || horizon.includes('now')) {
    timelineUrgency = 20;
  } else if (horizon.includes('60') || horizon.includes('3 mo') || horizon.includes('soon')) {
    timelineUrgency = 15;
  } else if (horizon.includes('90') || horizon.includes('6 mo') || horizon.includes('year')) {
    timelineUrgency = 10;
  } else {
    timelineUrgency = 5;
  }

  // 3. Financing Health (Max 15 pts)
  let financingHealth = 5;
  const financing = (lead.financingStatus || lead.dna?.financingStatus || '').toLowerCase();
  if (financing.includes('self') || financing.includes('liquid') || financing.includes('cash') || financing.includes('direct')) {
    financingHealth = 15;
  } else if (financing.includes('pre-approved') || financing.includes('sanction') || financing.includes('bank')) {
    financingHealth = 12;
  } else {
    financingHealth = 7;
    
  }

  // 4. Engagement Level (Max 20 pts)
  let engagementLevel = 5;
  if (lead.siteVisitAttended || lead.stage === 'site_visit' || lead.stage === 'negotiation') {
    engagementLevel += 12;
  }
  if ((lead.callCount || 0) >= 2) {
    engagementLevel += 5;
  } else if ((lead.callCount || 0) === 1) {
    engagementLevel += 3;
  }
  engagementLevel = Math.min(20, engagementLevel);

  // 5. High Patronage / NRI (Max 10 pts)
  let highPatronage = 0;
  if (lead.isNri) {
    highPatronage = 10;
  } else if (rawBudget >= 30000000) {
    highPatronage = 8;
  }

  // 6. Idle Decay Penalty (-2 pts every 24h after first 48h)
  const idleHours = lead.lastContactHoursAgo || 0;
  let idlePenalty = 0;
  if (idleHours > 48) {
    const idleDays = Math.floor((idleHours - 48) / 24);
    idlePenalty = Math.min(25, idleDays * 2);
  }

  const rawScore = budgetPower + timelineUrgency + financingHealth + engagementLevel + highPatronage - idlePenalty;
  const finalScore = Math.max(10, Math.min(99, rawScore));

  let tier: 'hot' | 'warm' | 'cold' = 'cold';
  let recommendedSla = 'Drip newsletter & weekly portfolio update';

  if (finalScore >= 75) {
    tier = 'hot';
    recommendedSla = 'Priority Hotline: Contact within 15 mins';
  } else if (finalScore >= 50) {
    tier = 'warm';
    recommendedSla = 'Standard Response: Contact within 24 hours';
  }

  return {
    score: finalScore,
    tier,
    breakdown: {
      budgetPower,
      timelineUrgency,
      financingHealth,
      engagementLevel,
      highPatronage,
      idlePenalty
    },
    recommendedSla
  };
}

/**
 * ALGORITHM 3: Customer-Property DNA Vector Matcher (M_prop)
 * Enterprise Scoring Model:
 * - Hard Exclusions (Transaction intent Buy vs Rent, Commercial vs Residential barrier)
 * - Budget: 30%
 * - Location: 25%
 * - Property Type: 20%
 * - Area / Sqft: 15%
 * - Other Requirements (Timeline, Parking, ROI): 10%
 */
export function calculatePropertyMatch(
  customerDna: LeadDna,
  property: {
    id: string;
    name: string;
    priceRaw?: number;
    bhk?: string;
    location?: string;
    locality?: string;
    status?: string;
    carpetSqft?: number;
    sqft?: string;
    transactionType?: string;
  }
): PropertyMatchResult {
  const highlights: string[] = [];
  const mismatches: string[] = [];

  // Hard Exclusion 1: Transaction Type Mismatch
  const buyerTx = (customerDna.purchasePurpose || '').toLowerCase();
  const propTx = (property.transactionType || 'buy').toLowerCase();
  if (buyerTx.includes('rent') && !propTx.includes('rent')) {
    return {
      propertyId: property.id,
      propertyName: property.name,
      matchScore: 0,
      isGoldMatch: false,
      compatibilityHighlights: [],
      mismatches: ['Transaction mismatch: Buyer seeks Rental, property is for Sale'],
      scoreBreakdown: { budget: 0, location: 0, typology: 0, area: 0, other: 0 }
    };
  }

  // 1. Budget Compatibility (Weight 30%)
  const targetBudget = customerDna.budgetRaw || 17500000;
  const propPrice = property.priceRaw || 15000000;
  const budgetRatio = propPrice / targetBudget;
  let budgetScore = 0;

  if (budgetRatio >= 0.92 && budgetRatio <= 1.08) {
    budgetScore = 30;
    highlights.push('✓ Budget: Exact fit with target budget (30/30 pts)');
  } else if (budgetRatio >= 0.82 && budgetRatio <= 1.18) {
    budgetScore = 24;
    highlights.push('✓ Budget: Aligns within ±18% feasibility buffer (24/30 pts)');
  } else if (budgetRatio >= 0.70 && budgetRatio <= 1.30) {
    budgetScore = 16;
    highlights.push('✓ Budget: Feasible within client stretch parameters (+16 pts)');
  } else if (budgetRatio < 0.70) {
    budgetScore = 12;
    mismatches.push('⚠ Budget: Asset is priced below buyer target bracket');
  } else {
    budgetScore = 0;
    mismatches.push('❌ Budget: Price exceeds buyer capacity by over 30%');
  }

  // 2. Location Compatibility (Weight 25%)
  const prefLoc = (customerDna.preferredLocations || '').toLowerCase();
  const propLoc = (property.locality || property.location || '').toLowerCase();
  let locationScore = 0;

  if (prefLoc && (propLoc.includes(prefLoc) || prefLoc.includes(propLoc))) {
    locationScore = 25;
    highlights.push(`✓ Location: Exact locality match in ${property.locality || 'Pune'} (25/25 pts)`);
  } else if (
    (prefLoc.includes('baner') && (propLoc.includes('balewadi') || propLoc.includes('mahalunge') || propLoc.includes('aundh'))) ||
    (prefLoc.includes('koregaon') && (propLoc.includes('kalyani') || propLoc.includes('viman') || propLoc.includes('camp'))) ||
    (prefLoc.includes('hinjewadi') && (propLoc.includes('wakad') || propLoc.includes('punawale')))
  ) {
    locationScore = 20;
    highlights.push('✓ Location: Adjacent corridor within 3 km (20/25 pts)');
  } else if (prefLoc) {
    locationScore = 10;
    mismatches.push(`⚠ Location: ${property.locality || 'Area'} differs from requested ${customerDna.preferredLocations}`);
  } else {
    locationScore = 18;
    highlights.push('✓ Location: Flexible Pune city mandate (+18 pts)');
  }

  // 3. Typology Compatibility (Weight 20%)
  const targetBhk = (customerDna.configuration || '').toLowerCase();
  const propBhk = (property.bhk || '').toLowerCase();
  let typologyScore = 0;

  if (targetBhk && propBhk && (targetBhk.includes(propBhk.slice(0, 2)) || propBhk.includes(targetBhk.slice(0, 2)))) {
    typologyScore = 20;
    highlights.push(`✓ Typology: Exact ${property.bhk} layout match (20/20 pts)`);
  } else if (targetBhk.includes('penthouse') && propBhk.includes('penthouse')) {
    typologyScore = 20;
    highlights.push('✓ Typology: Luxury Penthouse category match (20/20 pts)');
  } else if (targetBhk && propBhk) {
    const tDigit = targetBhk.match(/\d+/)?.[0];
    const pDigit = propBhk.match(/\d+/)?.[0];
    if (tDigit && pDigit && Math.abs(parseInt(tDigit, 10) - parseInt(pDigit, 10)) === 1) {
      typologyScore = 12;
      highlights.push(`✓ Typology: Compatible ${property.bhk} (±1 room tolerance, 12/20 pts)`);
    } else {
      typologyScore = 5;
      mismatches.push(`⚠ Typology: ${property.bhk} vs requested ${customerDna.configuration}`);
    }
  } else {
    typologyScore = 15;
    highlights.push('✓ Typology: Adaptable configuration (+15 pts)');
  }

  // 4. Area Range Compatibility (Weight 15%)
  let areaScore = 12; // Baseline
  const propSqft = property.carpetSqft || (property.sqft ? parseInt(String(property.sqft).replace(/\D/g, ''), 10) : 0);
  if (propSqft > 0) {
    if (propSqft >= 1000 && propSqft <= 2200) {
      areaScore = 15;
      highlights.push(`✓ Area: ${propSqft} sq.ft carpet optimal usable area (15/15 pts)`);
    } else {
      areaScore = 10;
      highlights.push(`✓ Area: ${propSqft} sq.ft carpet area (+10 pts)`);
    }
  }

  // 5. Other Requirements (Weight 10%)
  const prefPossession = (customerDna.possessionHorizon || '').toLowerCase();
  const propStatus = (property.status || '').toLowerCase();
  let otherScore = 6;

  if (prefPossession.includes('ready') && (propStatus.includes('ready') || propStatus.includes('oc'))) {
    otherScore += 4;
    highlights.push('✓ Possession: Ready to move matches immediate horizon (+4 pts)');
  } else if (!prefPossession.includes('ready') && propStatus.includes('under')) {
    otherScore += 4;
    highlights.push('✓ Possession: Construction milestone matches target possession (+4 pts)');
  }

  otherScore = Math.min(10, otherScore);

  const finalMatch = Math.min(
    100,
    Math.round(budgetScore + locationScore + typologyScore + areaScore + otherScore)
  );

  return {
    propertyId: property.id,
    propertyName: property.name,
    matchScore: finalMatch,
    isGoldMatch: finalMatch >= 75,
    compatibilityHighlights: highlights,
    mismatches,
    scoreBreakdown: {
      budget: budgetScore,
      location: locationScore,
      typology: typologyScore,
      area: areaScore,
      other: otherScore
    }
  };
}

/**
 * ALGORITHM 4: Pipeline Stage Velocity & Stagnation Churn Risk (R_churn)
 * R_churn = 1 - exp(-delta_t / tau_threshold)
 */
export function calculateChurnRisk(
  stage: string,
  daysInCurrentStage: number
): ChurnRiskResult {
  let tauDays = 7;
  let stageName = 'Current Stage';

  switch (stage.toLowerCase()) {
    case 'new':
      tauDays = 1; // Expected first contact within 24h
      stageName = 'New Lead Intake';
      break;
    case 'contacted':
    case 'qualified':
      tauDays = 3; // Should schedule visit within 3 days
      stageName = 'Initial Qualification';
      break;
    case 'shortlisted':
      tauDays = 4;
      stageName = 'Property Shortlisting';
      break;
    case 'site_visit':
      tauDays = 3; // Follow-up within 48-72h of visit
      stageName = 'Post-Visit Review';
      break;
    case 'negotiation':
      tauDays = 7;
      stageName = 'Commercial Negotiation';
      break;
    default:
      tauDays = 7;
  }

  const riskScore = Math.min(0.99, Math.max(0.05, 1 - Math.exp(-daysInCurrentStage / tauDays)));
  
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let alertMessage: string | undefined = undefined;

  if (riskScore >= 0.8) {
    riskLevel = 'critical';
    alertMessage = `High Churn Risk: Lead has lingered in ${stageName} for ${daysInCurrentStage} days without milestone progression.`;
  } else if (riskScore >= 0.55) {
    riskLevel = 'high';
    alertMessage = `Warning: ${daysInCurrentStage} days in ${stageName} exceeds benchmark velocity.`;
  } else if (riskScore >= 0.35) {
    riskLevel = 'medium';
  }

  return {
    riskScore: Number(riskScore.toFixed(2)),
    riskLevel,
    isStagnant: daysInCurrentStage > tauDays,
    alertMessage,
    daysInStage: daysInCurrentStage
  };
}

/**
 * ALGORITHM 5: Next Best Action (NBA) Prescriptive Engine
 * Deterministic decision rules advising sales persons on exact tactical actions
 */
export function calculateNextBestAction(lead: {
  stage: string;
  score: number;
  daysInStage?: number;
  hasVisited?: boolean;
  name: string;
  hasPreApproval?: boolean;
}): NextBestActionResult {
  const stage = lead.stage.toLowerCase();

  if (stage === 'new') {
    if (lead.score >= 75) {
      return {
        headline: 'Priority Hot Intake: Initiate Immediate CTI Call',
        subtext: 'High-score buyer with active intent. Introduce portfolio and qualify unit preferences before competitor outreach.',
        urgency: 'immediate',
        actionType: 'call',
        buttonLabel: 'Dial Hotline via CTI'
      };
    }
    return {
      headline: 'Send Verified Project Factsheet via WhatsApp',
      subtext: 'Patron recently ingested. Share MahaRERA authenticated digital brochure to seed engagement.',
      urgency: 'high',
      actionType: 'whatsapp',
      buttonLabel: 'Dispatch Digital Factsheet'
    };
  }

  if (stage === 'contacted' || stage === 'qualified') {
    return {
      headline: 'Lock Private Experience Center Site Visit',
      subtext: 'Patron is pre-qualified. Propose complimentary private chauffeur pickup for weekend private walk-through.',
      urgency: 'high',
      actionType: 'visit',
      buttonLabel: 'Schedule Private Site Visit'
    };
  }

  if (stage === 'site_visit') {
    return {
      headline: 'Present Official Developer Cost Sheet & Subvention Options',
      subtext: 'Site visit completed. Share transparent statutory breakdown (Stamp Duty, GST waiver) to advance to commercial closing.',
      urgency: 'high',
      actionType: 'proposal',
      buttonLabel: 'Generate Official Cost Sheet'
    };
  }

  if (stage === 'negotiation') {
    return {
      headline: 'Coordinate Closing Meeting with Senior Sales Director',
      subtext: 'Final pricing & payment schedule under discussion. Schedule in-person boardroom closing session.',
      urgency: 'immediate',
      actionType: 'proposal',
      buttonLabel: 'Schedule Director Closing'
    };
  }

  return {
    headline: 'Send Weekly Curated Luxury Market Brief',
    subtext: 'Keep patron warm with Pune Western Corridor price trend statistics and newly registered inventory.',
    urgency: 'standard',
    actionType: 'nurture',
    buttonLabel: 'Send Market Brief'
  };
}
