export interface CrmLead {
  id: string;
  code: string;
  name: string;
  avatar?: string;
  designation?: string;
  company?: string;
  residence?: string;
  phone: string;
  email: string;
  isNri?: boolean;
  nriTag?: string;
  reraVerified?: boolean;
  interest: {
    property: string;
    bhk: string;
    sqft: string;
    budget: string;
    rawBudget: number;
  };
  location: string;
  source: string;
  sourceType: 'website' | 'google_ads' | 'whatsapp' | 'referral' | 'walk_in' | 'bulk_upload' | 'import' | string;
  status: string;
  stage: 'new' | 'contacted' | 'qualified' | 'shortlisted' | 'site_visit' | 'negotiation' | 'converted' | 'lost';
  temperature: 'hot' | 'warm' | 'cold';
  assignedTo: string;
  notes?: string;
  followUp: {
    display: string;
    subtext: string;
    isOverdue?: boolean;
  };
  starred?: boolean;
  funding?: string;
  avatarInitials?: string;
  avatarColor?: string;
  advisorInitials?: string;
  advisorColor?: string;
  intent?: 'hot' | 'warm' | 'cold';
  isChecked?: boolean;
  dna: {
    configuration: string;
    targetBudget: string;
    preferredLocations: string;
    purchasePurpose: string;
    possessionHorizon: string;
    financingStatus: string;
  };
  matchedProperties: {
    id: string;
    name: string;
    subtitle: string;
    tag: string;
    price: string;
    priceNum: number;
    matchScore?: string;
    details: string;
    actionLabel: string;
  }[];
  siteVisit?: {
    scheduledDate: string;
    time: string;
    status: 'CONFIRMED' | 'PENDING' | 'COMPLETED';
    location: string;
    assignedAgent: string;
    cab: {
      model: string;
      plate: string;
      driver: string;
      driverPhone?: string;
    };
  };
  callTimeline: {
    id: string;
    title: string;
    duration: string;
    time: string;
    summary: string;
    recordingFile: string;
  }[];
  // Algorithmic intelligence metrics
  leadScore?: number;
  scoreBreakdown?: {
    budgetPower: number;
    timelineUrgency: number;
    financingHealth: number;
    engagementLevel: number;
    highPatronage: number;
    idlePenalty: number;
  };
  churnRisk?: number;
  churnRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
  nextBestAction?: string;
  nextBestActionSubtext?: string;
  nextBestActionType?: 'call' | 'visit' | 'whatsapp' | 'proposal' | 'nurture';
  slaLabel?: string;
}

export const CRM_LEADS_DATA: CrmLead[] = [];

export const CRM_PIPELINE_STAGES = [
  { id: 'new', name: '1. New Lead', leadsCount: 0, grossValue: '₹0 Cr', color: 'border-blue-500 text-blue-700 bg-blue-50/70' },
  { id: 'contacted', name: '2. Contacted', leadsCount: 0, grossValue: '₹0 Cr', color: 'border-sky-500 text-sky-700 bg-sky-50/70' },
  { id: 'qualified', name: '3. Qualified', leadsCount: 0, grossValue: '₹0 Cr active', isSelected: true, color: 'border-amber-500 text-amber-900 bg-amber-50/90 font-bold' },
  { id: 'shortlisted', name: '4. Shortlisted', leadsCount: 0, grossValue: '₹0 Cr', color: 'border-orange-500 text-orange-700 bg-orange-50/70' },
  { id: 'site_visit', name: '5. Site Visit', leadsCount: 0, grossValue: '₹0 Cr', color: 'border-purple-500 text-purple-700 bg-purple-50/70' },
  { id: 'negotiation', name: '6. Negotiation', leadsCount: 0, grossValue: '₹0 Cr', color: 'border-indigo-500 text-indigo-700 bg-indigo-50/70' },
  { id: 'converted', name: '7. Converted', leadsCount: 0, grossValue: '₹0 Cr', color: 'border-emerald-500 text-emerald-800 bg-emerald-50/80 font-bold' },
  { id: 'lost', name: '8. Lost', leadsCount: 0, grossValue: '₹0 Cr', color: 'border-zinc-300 text-zinc-500 bg-zinc-50' }
];

export const CRM_KPI_METRICS = {
  totalLeads: { value: '0', change: '0%', subtext: 'vs last month', footer: 'Active in Western Corridor' },
  newLeads: { value: '0', todayCount: '0 new today', unassigned: '0 unassigned', footer: 'Avg Response: 0 mins' },
  followUpsToday: { value: '0', overdue: '0 Overdue', pending: '0 pending', footer: 'No pending reminders' },
  siteVisits: { value: '0', confirmed: '0 Confirmed today', upcoming: '0 upcoming', footer: 'Cab dispatch active' },
  convertedDeals: { value: '0', closedValue: '₹0 Cr closed value', change: '(0%)', footer: 'Avg ticket: ₹0 Cr' },
  conversionRate: { value: '0%', change: '0% vs bench', subtext: '(0%)', footer: 'Active Performance Tier' }
};

export interface CrmSalesExecutive {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  title: string;
  territory: string;
  initials: string;
  avatarBg?: string;
  activeLeadsCount: number;
  status?: string;
}

export const CRM_SALES_EXECUTIVES: CrmSalesExecutive[] = [
  {
    id: 'exec-jennifer',
    name: 'Jennifer',
    email: 'jennifer@anvrealty.com',
    password: 'sales123',
    phone: '+91 98200 45678',
    role: 'Sales Executive',
    title: 'Senior Sales Executive',
    territory: 'Pune West (Baner • Balewadi • Mahalunge)',
    initials: 'J',
    avatarBg: 'bg-zinc-950 text-white',
    activeLeadsCount: 14,
    status: 'Active'
  },
  {
    id: 'exec-muskan',
    name: 'Muskan',
    email: 'muskan@anvrealty.com',
    password: 'sales123',
    phone: '+91 98220 54321',
    role: 'Sales Executive',
    title: 'Luxury Sales Executive',
    territory: 'Pune East (Koregaon Park • Kalyani Nagar)',
    initials: 'M',
    avatarBg: 'bg-amber-900 text-amber-100',
    activeLeadsCount: 18,
    status: 'Active'
  }
];

// CRM Valid Passwords for Sales Executives / Advisors
export const VALID_CRM_PASSWORDS = [
  'sales123',
  'jennifer123',
  'muskan123',
  'rohit123',
  'priya123',
  'crm123',
  'anvcrm2026',
  'prem123',
  'admin123',
  'anv2026',
  'password'
];
