export interface PremiumAdItem {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  badge?: string;
  image: string;
  videoUrl?: string;
  ctaText: string;
  ctaMessage: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface PremiumAdsConfig {
  crownImage: string;
  crownTitle: string;
  promoteWhatsAppNumber: string;
  promoteMessage: string;
  ads: PremiumAdItem[];
}

export const DEFAULT_PREMIUM_ADS: PremiumAdItem[] = [
  {
    id: 'opus-video',
    name: 'Opus',
    category: 'Signature Luxury Living',
    tagline: 'Opus Luxury Residences & Penthouses',
    description:
      'Experience premier ultra-luxury architecture, curated landscape views, and bespoke craftsmanship at Opus. Schedule an exclusive private walkthrough and access institutional pre-launch inventory pricing.',
    badge: 'Sponsored',
    image: '/opus-thumb.jpg',
    videoUrl: '/Opusvideo.mp4',
    ctaText: 'Explore Opus & Schedule Visit',
    ctaMessage:
      'Hello ANV Realty advisory, I watched the Opus video ad and would like to schedule an exclusive site visit and receive pricing brochure for Opus.',
    isActive: true,
    sortOrder: 1
  },
  {
    id: 'ai-digital',
    name: 'AI Digital',
    category: 'Digital Marketing Partner',
    tagline: 'AI Meta & Google Ads • 3D Virtual Walkthroughs',
    description:
      'Premier performance marketing partner for real estate builders, channel partners, and developers. Specializing in high-intent buyer acquisition, AI meta lead funnels, and photorealistic 3D architectural renders.',
    badge: 'Official Partner',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    videoUrl: '/AiDigital.mp4',
    ctaText: 'Get Free Project Audit',
    ctaMessage:
      'Hello AI Digital team, I saw your promotional ad on ANV Realty and would like a Free Project Audit for real estate digital marketing.',
    isActive: true,
    sortOrder: 2
  },
  {
    id: 'hdfc-loans',
    name: 'Home Loan',
    category: 'Banking & Mortgages',
    tagline: '8.40% ROI • 48-Hour Instant In-Principle Sanction',
    description:
      'Fast-track institutional home loans and balance transfers for luxury residential and commercial properties in Pune with zero processing fees and doorstep documentation.',
    badge: 'Banking Desk',
    image:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    ctaText: 'Check Eligibility',
    ctaMessage:
      'Hello ANV Realty advisory, I would like to check home loan eligibility and lowest ROI for Pune properties.',
    isActive: true,
    sortOrder: 3
  },
  {
    id: 'luxury-interiors',
    name: 'Interiors',
    category: 'Luxury Architecture',
    tagline: 'Turnkey Modular Kitchens & Italian Decor',
    description:
      'End-to-end bespoke interior architecture, smart home automation, Italian marble flooring, and customized modular interiors with a 10-year warranty.',
    badge: 'Design Partner',
    image:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
    ctaText: 'Get 3D Design Consultation',
    ctaMessage:
      'Hello, I am interested in interior design and modular layout planning for my Pune property.',
    isActive: true,
    sortOrder: 4
  },
  {
    id: 'legal-audit',
    name: 'Legal Due',
    category: 'Title Search & RERA',
    tagline: '30-Year Title Verification & RERA Compliance',
    description:
      'Independent institutional legal scrutiny, search reports, encumbrance verification, and agreement vetting by senior High Court real estate advocates.',
    badge: 'Legal Mandate',
    image:
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80',
    ctaText: 'Request Legal Scrutiny',
    ctaMessage:
      'Hello ANV Realty legal cell, I would like to verify property title and legal documentation.',
    isActive: true,
    sortOrder: 5
  },
  {
    id: 'vastu-shastra',
    name: 'Vastu',
    category: 'Vastu & Energy',
    tagline: 'Scientific Vastu for Penthouses & Commercial',
    description:
      'Non-demolition Vastu remedies, entrance energy balancing, and directional optimization for business prosperity and peaceful family residences.',
    badge: 'Vastu Advisory',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    ctaText: 'Book Vastu Consultation',
    ctaMessage:
      'Hello, I would like to consult a Vastu expert for my residential / commercial property in Pune.',
    isActive: true,
    sortOrder: 6
  },
  {
    id: 'preleased-leasing',
    name: 'MNC Lease',
    category: 'Commercial Pre-Leased',
    tagline: 'Grade-A Corporate Tenants with 8.5%+ Yield',
    description:
      'Connect with institutional corporate tenants, IT/ITeS firms, and retail brands looking for long-term lease commitments across prime Pune IT corridors.',
    badge: 'Commercial Lease',
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    ctaText: 'View Leasing Demand',
    ctaMessage:
      'Hello ANV Realty leasing division, I want to explore MNC pre-leased commercial opportunities in Pune.',
    isActive: true,
    sortOrder: 7
  }
];

export const DEFAULT_PREMIUM_CONFIG: PremiumAdsConfig = {
  crownImage: '/premium-crown.png',
  crownTitle: 'Premium Collection',
  promoteWhatsAppNumber: '919373020701',
  promoteMessage:
    'Hello ANV Realty team, I would like to feature our company ad in your website Ads strip for Pune property buyers and investors.',
  ads: DEFAULT_PREMIUM_ADS
};
