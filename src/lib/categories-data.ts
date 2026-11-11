export interface CategoryItem {
  slug: string;
  title: string;
  shortTitle: string;
  iconName: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  group: 'commercial' | 'residential' | 'land' | 'specialized';
  groupLabel: string;
  badge: string;
  overview: string;
  detailedContent: string[];
  features: string[];
  investmentBenefits: string[];
  popularLocalities: string[];
  heroImage: string;
  propertyTypeFilter?: string; // used to query database
  faqs: { question: string; answer: string }[];
}

export const CATEGORIES_DATA: CategoryItem[] = [
  {
    slug: 'office-space',
    title: 'Office Space',
    shortTitle: 'Office Space',
    iconName: 'Building2',
    tagline: 'Grade-A Commercial Offices, IT Park Campuses & Managed Coworking Spaces across Pune',
    metaTitle: 'Office Space for Sale & Rent in Pune | Grade-A Commercial, IT Parks & Coworking | ANV Reealty',
    metaDescription: 'Explore verified commercial office spaces for sale and lease across Pune. Grade-A bare-shell, IT tech parks, plug-and-play coworking, and corporate offices with zero brokerage.',
    group: 'commercial',
    groupLabel: 'Commercial Real Estate',
    badge: 'High Demand',
    overview: 'Pune is one of India\'s premier corporate and technology powerhouses. ANV Reealty offers comprehensive institutional-grade office spaces — ranging from agile coworking desks and managed enterprise suites to expansive corporate headquarters and SEZ/non-SEZ IT tech park campuses across Baner, Kalyani Nagar, Hinjewadi, Kharadi, and Shivaji Nagar.',
    detailedContent: [
      'Institutional advisory for corporates, MNCs, IT tech firms, and growing enterprises seeking Grade-A office addresses in Pune.',
      'Flexible specifications including Bare Shell, Warm Shell, IT Tech Park floor plates, and Bespoke Plug-and-Play Coworking Fitouts.',
      'Comprehensive zoning vetting, STPI/SEZ compliance, fire NOC, occupancy certificates (OC), and developer title checks.'
    ],
    features: [
      'Grade-A Tech Parks & IGBC / LEED Certified Green Towers',
      'Plug-and-Play Managed Coworking Suites & Enterprise Bare Shells',
      'High-Speed Smart Destination Elevators with 100% DG Power Backup',
      'Dedicated Reserved Parking, Multi-Level Basements & EV Charging Stations',
      'Grand Double-Height Entrance Lobbies with 24/7 Security & Concierge'
    ],
    investmentBenefits: [
      'Steady 7.5% - 10.5% rental yields in prime corporate and IT corridors',
      'Strong institutional tenant demand from Fortune 500 GCCs and IT conglomerates',
      'Consistent capital appreciation driven by Pune Metro and Ring Road infrastructure'
    ],
    popularLocalities: ['Baner', 'Kalyani Nagar', 'Hinjewadi', 'Kharadi', 'Bund Garden', 'Shivaji Nagar', 'Balewadi', 'Viman Nagar'],
    heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'commercial',
    faqs: [
      {
        question: 'What types of office spaces are available in Pune through ANV Reealty?',
        answer: 'We curate bare-shell, warm-shell, IT tech park floor plates, and fully furnished plug-and-play coworking spaces for purchase or lease.'
      },
      {
        question: 'What are the typical commercial rental yields in Pune?',
        answer: 'Grade-A commercial office assets in prime corridors like Baner, Kharadi, and Kalyani Nagar typically yield between 7.5% and 9.5% annually.'
      },
      {
        question: 'Do you assist with commercial lease negotiations and legal vetting?',
        answer: 'Yes. Our specialized corporate real estate advisors assist with LOI drafting, lease structuring (5-9 year tenures), registration, and title verification.'
      }
    ]
  },
  {
    slug: 'preleased-properties',
    title: 'Preleased Properties',
    shortTitle: 'Preleased',
    iconName: 'BadgePercent',
    tagline: 'High-Yield Pre-Rented Commercial & Retail Investment Assets',
    metaTitle: 'Preleased Commercial Properties for Sale in Pune | 7-9% ROI | ANV Reealty',
    metaDescription: 'Invest in verified pre-leased commercial and retail properties in Pune. Immediate rental income from Fortune 500 tenants, banks, and MNCs with 7% to 9% yields.',
    group: 'commercial',
    groupLabel: 'Investment Assets',
    badge: 'Immediate ROI',
    overview: 'Pre-leased real estate is the premier asset class for discerning HNIs, family offices, and institutional investors seeking predictable, inflation-beating cash flows from Day 1. Every property in our portfolio is backed by vetted corporate leases, robust lock-ins, and multinational tenancy.',
    detailedContent: [
      'Day-1 cash flow generation with legally registered lease agreements and institutional tenant covenants.',
      'Tenants include Fortune 500 tech firms, Tier-1 scheduled banks, leading retail brands, and healthcare giants.',
      'Complete yield due diligence: net rental yield, escalations (15% every 3 years), and security deposit transfers.'
    ],
    features: [
      'Registered 9-to-15 Year Tripartite Lease Agreements',
      'Minimum 3 to 5 Year Non-Breakable Lock-in Periods',
      '3 to 6 Months Rent Security Deposits Held',
      'Automated 15% Rental Escalation Every 3 Years',
      '100% Clear Title & Non-Encumbrance Certification'
    ],
    investmentBenefits: [
      'Guaranteed immediate returns without development or leasing delays',
      'Higher returns than traditional fixed deposits with asset ownership',
      'Long-term capital gains coupled with monthly cash inflows'
    ],
    popularLocalities: ['Koregaon Park', 'Baner', 'Kalyani Nagar', 'Hinjewadi', 'Viman Nagar', 'Kharadi'],
    heroImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'commercial',
    faqs: [
      {
        question: 'What is a pre-leased property?',
        answer: 'A pre-leased property is a commercial, retail, or industrial asset that already has an operational tenant under a signed lease agreement, delivering immediate rental income to the buyer from the day of purchase.'
      },
      {
        question: 'What happens to the existing lease when I buy a pre-leased property?',
        answer: 'The lease agreement and tenant rights are seamlessly transferred to you via an official Novation or Tripartite Agreement. The tenant pays rent and security deposit directly to your bank account.'
      },
      {
        question: 'What is the minimum ticket size for pre-leased investments in Pune?',
        answer: 'High-quality pre-leased assets in Pune typically start from ₹1.50 Crore for boutique retail/office suites up to ₹50+ Crore for entire commercial floors and bank branches.'
      }
    ]
  },
  {
    slug: 'shop-showroom',
    title: 'Shop/Showroom',
    shortTitle: 'Shop/Showroom',
    iconName: 'Store',
    tagline: 'High-Street Retail Shops & Double-Height Showrooms with Premier Visibility',
    metaTitle: 'Retail Shops & Showrooms for Sale & Rent in Pune | ANV Reealty',
    metaDescription: 'Find high-street retail shops and luxury showrooms for sale and lease across Pune prime commercial corridors. High footfall, grand frontage, and zero brokerage options.',
    group: 'commercial',
    groupLabel: 'Commercial Real Estate',
    badge: 'High Footfall',
    overview: 'Capitalize on Pune\'s surging consumer spending with prime retail assets. ANV Reealty showcases road-facing double-height retail showrooms and high-street shops in dense, affluent residential catchments with unmatched street visibility and foot traffic.',
    detailedContent: [
      'Strategic ground and upper-floor retail spaces engineered for luxury fashion, automotive, electronics, and lifestyle flagships.',
      'Wide glass frontage, prominent signage rights, and seamless customer valet parking access.',
      'Locations chosen for high daily traffic, affluent consumer density, and metro connectivity.'
    ],
    features: [
      'Double-Height Ceiling Clearances (14 to 18 Ft.) with Mezzanine Options',
      'Zero Obstruction Wide Road Frontage and Prominent Branding Facias',
      'Heavy 3-Phase Commercial Power & Dedicated Generator Backup',
      'Dedicated Customer Parking Bays and Valet Staging Corridors',
      'Sanctioned Commercial Trade & Water Connection Licenses'
    ],
    investmentBenefits: [
      'Premium rental appreciation from marquee lifestyle brands',
      'Superior capital appreciation compared to standard commercial offices',
      'Dual utility: High rental returns or self-occupied flagship business'
    ],
    popularLocalities: ['FC Road', 'JM Road', 'MG Road, Camp', 'Baner High Street', 'Aundh', 'Koregaon Park'],
    heroImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'commercial',
    faqs: [
      {
        question: 'Which areas in Pune have the highest retail rental demand?',
        answer: 'Baner High Street, Koregaon Park North Main Road, FC Road, JM Road, and MG Road Camp are the most sought-after retail high-streets with the highest foot traffic.'
      },
      {
        question: 'Are double-height showrooms suitable for automotive or jewelry flagships?',
        answer: 'Yes. Our catalog includes commercial properties with 14 to 18 ft clear heights and expansive 40+ ft road frontages specifically approved for jewelers, car dealerships, and lifestyle flagships.'
      }
    ]
  },


  {
    slug: 'residential-apartment',
    title: 'Residential Apartment',
    shortTitle: 'Apartments',
    iconName: 'Home',
    tagline: 'Luxury 2, 3, 4 & 5 BHK Sanctuaries in Gated Communities',
    metaTitle: 'Luxury Apartments for Sale in Pune | 2, 3, 4 & 5 BHK Flats | ANV Reealty',
    metaDescription: 'Discover verified luxury residential apartments and penthouses for sale in Pune. Curated MahaRERA registered projects in Koregaon Park, Baner, Kalyani Nagar with zero brokerage.',
    group: 'residential',
    groupLabel: 'Residential Properties',
    badge: 'Verified Homes',
    overview: 'ANV Reealty represents Pune\'s most prestigious residential developments. From serene riverside residences in Koregaon Park to sky villas overlooking the Baner hills, our residential portfolio features verified clear-title properties with resort-style amenities.',
    detailedContent: [
      '100% MahaRERA compliant verified inventory with sanctioned architectural plans.',
      'Direct developer partnerships ensuring lowest official price quotes with zero brokerage.',
      'Comprehensive legal due diligence, title search, and end-to-end home loan assistance.'
    ],
    features: [
      'Double-Height Private Balconies with Panoramic City Views',
      'Clubhouses with Infinity Pools, Gyms, Squash Courts & Spas',
      'Vastu-Compliant East-West Facing Architectural Floor Plates',
      'Italian Marble Flooring & Premium Kohler / Grohe Sanitaryware',
      'Smart Home Automation with Video Door Phones & Digital Locks'
    ],
    investmentBenefits: [
      'Steady 3.5% - 4.5% residential rental yields in IT corridor catchments',
      'High capital appreciation in Pune prime corridors outperforming inflation',
      'Liquid resale market backed by steady influx of corporate executives'
    ],
    popularLocalities: ['Koregaon Park', 'Baner', 'Kalyani Nagar', 'Balewadi', 'Bavdhan', 'Mahalunge'],
    heroImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'residential',
    faqs: [
      {
        question: 'Does ANV Reealty charge brokerage on new developer residential apartments?',
        answer: 'No. We provide 100% zero-brokerage advisory on all direct builder and primary developer inventories.'
      },
      {
        question: 'Are all residential projects on ANV Reealty MahaRERA approved?',
        answer: 'Yes. Every project in our portfolio is verified with official MahaRERA registration numbers and verified sanctioned plans.'
      }
    ]
  },
  {
    slug: 'residential-bungalow',
    title: 'Residential Bunglow',
    shortTitle: 'Bungalow & Villas',
    iconName: 'Castle',
    tagline: 'Ultra-Luxury Independent Villas, Row Houses & Private Estates',
    metaTitle: 'Luxury Bungalows & Villas for Sale in Pune | Private Estates | ANV Reealty',
    metaDescription: 'Explore exclusive independent bungalows, luxury villas, and private row houses in Pune. Gated villa communities in Koregaon Park, Baner, and Aundh with private gardens.',
    group: 'residential',
    groupLabel: 'Residential Properties',
    badge: 'Ultra Luxury',
    overview: 'For patrons who demand uncompromised privacy and generous land footprints, ANV Reealty curates private bungalows, architectural villas, and bespoke row houses in Pune\'s most distinguished old-money and luxury suburban enclaves.',
    detailedContent: [
      'Independent clear-title plots with private ownership of land and superstructure.',
      'Expansive multi-level layouts featuring private swimming pools, home elevators, and landscaped lawns.',
      'Located in secured low-density gated communities or prestigious heritage Pune sectors.'
    ],
    features: [
      'Private Landscaped Lawns, Terrace Gazebos & Private Plunge Pools',
      'Independent Private Elevators Connecting All Levels',
      'Dedicated Servant Quarters, Driver Dorms & 3-4 Covered Car Parks',
      'VRV Air Conditioning & Italian Marble Throughout',
      'Perimeter Electric Fencing & 24/7 Armed Security Gated Enclaves'
    ],
    investmentBenefits: [
      'Highest land-to-asset value ratio ensuring generational wealth preservation',
      'Limited villa supply in prime Pune city limits creating exponential scarcity value',
      'Complete architectural autonomy to remodel, expand, and personalize'
    ],
    popularLocalities: ['Koregaon Park', 'Aundh', 'Baner Hills', 'Prabhat Road', 'Bavdhan', 'Boat Club Road'],
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'residential',
    faqs: [
      {
        question: 'Where can I buy independent bungalows in Pune?',
        answer: 'Prime locations for independent luxury bungalows include Koregaon Park, Boat Club Road, Prabhat Road, Aundh, and gated hilltop villa projects in Baner and Bavdhan.'
      },
      {
        question: 'What is the price range for luxury villas in Pune?',
        answer: 'Independent bungalows typically range from ₹5 Crore for suburban gated community villas to ₹30+ Crore for heritage land estates in central Pune.'
      }
    ]
  },
  {
    slug: 'pre-launch-projects',
    title: 'Pre- Launch Projects',
    shortTitle: 'Pre-Launch',
    iconName: 'Rocket',
    tagline: 'Exclusive Early-Bird Access to Pune\'s Most Anticipated Real Estate Launches',
    metaTitle: 'Pre-Launch Real Estate Projects in Pune | Early Bird Prices | ANV Reealty',
    metaDescription: 'Get VIP early-bird access to pre-launch residential and commercial projects in Pune. Lock in lowest pricing, choice inventory, and flexible payment plans with top developers.',
    group: 'residential',
    groupLabel: 'New Launches',
    badge: 'Early Bird',
    overview: 'Securing an asset during the pre-launch or early-access phase offers the highest upside potential in real estate. ANV Reealty provides patrons with VIP priority access to Tier-1 builder launches before general public releases, unlocking premier pricing and preferred unit selection.',
    detailedContent: [
      'First-pick access to coveted corner residences, high-floor penthouses, and road-front commercial retail.',
      'Attractive launch payment schemes (e.g. 10:90, 20:80, or construction-linked flexi milestones).',
      'Full legal due diligence: MahaRERA application numbers, IOD, land sanctions, and builder track records.'
    ],
    features: [
      'Pre-Launch Price Discounts of 8% to 15% Below Public Inauguration Rates',
      'Choice Selection of Best Vastu-Compliant Units & Scenic Mountain Views',
      'Builder Buyback Commitments & Flexible Assignment Rights',
      'Staggered Construction-Linked Milestone Payment Schedules',
      'Exclusive Launch Goodies (Modular Kitchens, ACs, Club Memberships)'
    ],
    investmentBenefits: [
      'Maximum capital appreciation between launch and completion phases',
      'Lower upfront equity requirement through builder subvention options',
      'High resale velocity upon project structural milestone completions'
    ],
    popularLocalities: ['Baner-Balewadi', 'Mahalunge', 'Kharadi Annex', 'Koregaon Park Annexe', 'Mundhwa', 'Wakad'],
    heroImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'residential',
    faqs: [
      {
        question: 'Is it safe to invest in pre-launch projects?',
        answer: 'Under MahaRERA regulations, developers can only market projects once registration is in place. We strictly vet developer credentials, environmental clearances, and legal title before curating any launch.'
      },
      {
        question: 'How much price escalation typically occurs from pre-launch to possession?',
        answer: 'Well-located projects by reputable Grade-A developers in Pune historically experience 25% to 45% capital appreciation from initial launch through to final handover.'
      }
    ]
  },
  {
    slug: 'restaurant',
    title: 'Restaurant',
    shortTitle: 'F&B & Dining',
    iconName: 'UtensilsCrossed',
    tagline: 'Approved F&B Premises, Rooftop Lounges & Dine-In Commercial Spaces',
    metaTitle: 'Restaurant & F&B Commercial Spaces for Sale & Lease in Pune | ANV Reealty',
    metaDescription: 'Find approved restaurant, pub, and rooftop dining commercial spaces in Pune. Fitted with commercial kitchen exhausts, gas banks, grease traps, and liquor license approvals.',
    group: 'commercial',
    groupLabel: 'Commercial Real Estate',
    badge: 'F&B Approved',
    overview: 'Pune\'s vibrant nightlife and dining culture make hospitality and F&B real estate highly lucrative. ANV Reealty curates sanctioned F&B commercial properties equipped with heavy utility infrastructure, rooftop terraces, and municipal restaurant clearances in Koregaon Park, Baner, and Balewadi High Street.',
    detailedContent: [
      'Pre-vetted premises with Food Safety (FSSAI), Fire NOC, and Excise license structural compliance.',
      'Specialized engineering: dedicated grease traps, high-volume exhaust risers, and heavy electrical loads.',
      'Options include indoor fine dining, microbrewery setups, QSR outlets, and scenic open-air rooftop lounges.'
    ],
    features: [
      'Dedicated Commercial Kitchen Exhaust Ducting to Building Terrace',
      'External Gas Bank Storage Area with Safety Fire Isolation',
      'Heavy-Duty Grease Traps & High-Capacity Drainage Connections',
      'Heavy 3-Phase Commercial Power (50kVA to 150kVA+)',
      'Valet Staging Corridors & Separate Goods Delivery Entrances'
    ],
    investmentBenefits: [
      'High rental rates commanded by prime F&B premises (often 25-40% above standard office rates)',
      'Revenue-share leasing models (Minimum Guarantee + Turnover Percentage)',
      'Long tenant tenure due to heavy fitout investment by restaurant operators'
    ],
    popularLocalities: ['Koregaon Park', 'Baner High Street', 'Balewadi High Street', 'Viman Nagar', 'FC Road', 'Kalyani Nagar'],
    heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'commercial',
    faqs: [
      {
        question: 'What licenses are needed for a commercial restaurant space in Pune?',
        answer: 'Premises require PMC Health Trade License, Fire Department NOC, FSSAI Food License, Police Eating House License, and State Excise License (for liquor service).'
      },
      {
        question: 'Can rooftop spaces be legally operated as restaurants in Pune?',
        answer: 'Yes, provided the rooftop terrace has approved commercial usage sanctions, non-combustible structural permissions, and requisite fire safety clearances from the municipal corporation.'
      }
    ]
  },
  {
    slug: 'hospital',
    title: 'Hospital',
    shortTitle: 'Hospital & Healthcare',
    iconName: 'HeartPulse',
    tagline: 'Healthcare-Compliant Medical Centers, Clinics & Multi-Specialty Facilities',
    metaTitle: 'Hospital Properties for Buy & Hospital Properties for Rent in Pune | ANV Reealty',
    metaDescription: 'Browse healthcare compliant commercial buildings, diagnostic centers, and multi-specialty hospitals for sale and lease in Pune. Pre-fitted for NABH, medical gas, and bed lifts.',
    group: 'specialized',
    groupLabel: 'Specialized Real Estate',
    badge: 'NABH Compliant',
    overview: 'Healthcare infrastructure demands rigorous architectural standards. ANV Reealty advises hospital networks, medical trusts, and diagnostic operators on securing standalone hospital buildings and specialized healthcare spaces designed to satisfy NABH, fire safety, and medical elevator requirements.',
    detailedContent: [
      'Sanctioned medical use properties with approved biomedical waste management and radiation shielding.',
      'Wide corridors, stretcher-compatible elevators, and medical oxygen pipeline routing shafts.',
      'Options available for 20-bed boutique maternity centers to 200+ bed tertiary multi-specialty hospitals.'
    ],
    features: [
      'Stretcher & Bed Lifts with Dedicated Medical Emergency Power Backups',
      'Biomedical Waste Treatment Plant & Segregated Disposal Zones',
      'Medical Gas Pipeline System (MGPS) Shafts & Cryogenic Tank Staging',
      'Radiation Shielded Bunkers for Radiology, CT Scan, and MRI Suites',
      '24/7 Ambulance Drive-Thru Drop-Off & Triage Casualty Bays'
    ],
    investmentBenefits: [
      'Recession-proof asset class with exceptionally resilient cash flows',
      'Long-term institutional leases spanning 15 to 25+ years with established healthcare operators',
      'Social impact investment delivering attractive risk-adjusted financial returns'
    ],
    popularLocalities: ['Shivaji Nagar', 'Hadapsar', 'Baner', 'Pimpri-Chinchwad', 'Kothrud', 'Wagholi'],
    heroImage: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'commercial',
    faqs: [
      {
        question: 'What are the architectural requirements for a hospital building in Pune?',
        answer: 'Hospital buildings must comply with National Building Code (NBC) Part 4 medical norms, featuring 2.4-meter wide corridors, dual fire escape staircases, bed lifts, and biomedical waste management facilities.'
      },
      {
        question: 'Does ANV Reealty facilitate built-to-suit hospital development?',
        answer: 'Yes. We partner with landholders and healthcare operators to construct customized healthcare facilities matching specific bed capacities and clinical specialties.'
      }
    ]
  },
  {
    slug: 'hotel-resort',
    title: 'Hotel / Resort',
    shortTitle: 'Hotels & Resorts',
    iconName: 'Hotel',
    tagline: 'Business Hotels, Heritage Retreats & Holiday Resorts across Pune, Lonavala & Goa',
    metaTitle: 'Hotels & Resorts for Sale in Pune, Lonavala & Goa | ANV Reealty',
    metaDescription: 'Acquire verified hospitality assets, business hotels, and leisure resorts in Pune, Lonavala, Mumbai, and Goa. Operational and greenfield opportunities with full title clearance.',
    group: 'specialized',
    groupLabel: 'Hospitality Assets',
    badge: 'Hospitality',
    overview: 'The hospitality sector in western India is witnessing record average room rates (ARR) and occupancy. ANV Reealty acts as an institutional advisor for hotel acquisitions, resort divestments, and operator management contract introductions across Pune, Mumbai, Lonavala, and Goa.',
    detailedContent: [
      'Operational and greenfield 3-star, 4-star, and 5-star inventory with verified financial track records.',
      'Leisure eco-resorts, wellness sanctuaries, and business conference hotels near key industrial corridors.',
      'Advisory on hotel operator search, franchise onboarding, and sale-and-leaseback transactions.'
    ],
    features: [
      'Operational Room Inventories (30 to 250+ Keys) with Complete FF&E',
      'Banqueting Halls, Conference Auditoriums & Open-Air Wedding Lawns',
      'Multi-Cuisine Restaurants, Bars & Swimming Pool Facilities',
      'Tourism Department Clearances & Environmental Consents',
      'Dedicated Staff Accommodations & Commercial Laundry Infrastructure'
    ],
    investmentBenefits: [
      'Dual revenue stream: High RevPAR (Revenue Per Available Room) plus luxury banqueting income',
      'Rapidly appreciating scenic land footprints in high-barrier tourist corridors',
      'Global brand partnership opportunities with leading international chains'
    ],
    popularLocalities: ['Pune Airport Corridor', 'Lonavala / Khandala', 'Mulshi', 'Mahabaleshwar', 'North & South Goa'],
    heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'commercial',
    faqs: [
      {
        question: 'Are the hotel properties offered by ANV Reealty operational or greenfield?',
        answer: 'We represent both operational cash-flow-generating hotels with established balance sheets and clear-title greenfield land parcels approved for resort development.'
      },
      {
        question: 'Can you help connect an independent hotel owner with a national hospitality brand?',
        answer: 'Yes. We assist property owners with operator searches, negotiating management contracts, and franchise agreements with major hospitality groups.'
      }
    ]
  },
  {
    slug: 'residential-commercial-land-plot',
    title: 'Residential/Commercial Land/Plot',
    shortTitle: 'Land & Plots',
    iconName: 'MapPin',
    tagline: 'Clear-Title NA Sanctioned Residential & Commercial Plots for Development',
    metaTitle: 'Residential & Commercial Plots for Sale in Pune | Clear Title Land | ANV Reealty',
    metaDescription: 'Buy clear-title NA sanctioned residential and commercial plots in Pune prime expansion corridors. FSI compliant land parcels with legal due diligence and zero encumbrances.',
    group: 'land',
    groupLabel: 'Land & Development',
    badge: 'Clear Title',
    overview: 'Land is the fundamental basis of real estate wealth. ANV Reealty conducts exhaustive 30-year search report due diligence to present institutional developers and private investors with clear-title, litigation-free residential and commercial land parcels across Pune growth axes.',
    detailedContent: [
      'Non-Agricultural (NA) sanctioned plots ready for high-rise residential or commercial development.',
      'FSI / TDR potential analysis, zoning classification checks, and road widening setback verifications.',
      'Comprehensive documentation including 7/12 extracts, demarcation sheets, and title certificates.'
    ],
    features: [
      'Non-Agricultural (NA) Sanctioned & Demarcated Land Boundaries',
      '30-Year Certified Title Search Report by Senior High Court Advocates',
      'Direct Frontage on Sanctioned DP (Development Plan) & Highway Corridors',
      'Accessible Water Connection Mains, Storm Drains & High-Tension Lines',
      'Immediate Development Eligibility with FSI Calculations'
    ],
    investmentBenefits: [
      'Maximum uncompromised asset appreciation over medium-to-long horizons',
      'No building depreciation or maintenance overheads',
      'High liquidity for prime parcels located along upcoming Metro & Ring Road routes'
    ],
    popularLocalities: ['Wagholi', 'Bavdhan Annex', 'Sus / Mahalunge', 'Pirangut', 'Chakan', 'Uruli Kanchan'],
    heroImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'commercial',
    faqs: [
      {
        question: 'What is a 30-year title search for land in Pune?',
        answer: 'A 30-year title search inspects official revenue records, mutation entries, index-II records, and court registries for the past 30 years to verify complete ownership continuity without encumbrances.'
      },
      {
        question: 'What is the difference between Agricultural and NA Land?',
        answer: 'Agricultural land is legally restricted for farming use only. Non-Agricultural (NA) land has received official government sanction for residential, commercial, or industrial construction.'
      }
    ]
  },
  {
    slug: 'agriculture-farm-land',
    title: 'Agriculture Farm Land',
    shortTitle: 'Farm Land',
    iconName: 'Trees',
    tagline: 'Fertile Agricultural Acreages, Gated Farmhouse Plots & Agro-Estates',
    metaTitle: 'Agricultural Land & Farmhouse Plots for Sale in Pune | ANV Reealty',
    metaDescription: 'Find fertile agricultural land and gated farmhouse plots near Pune. Serene estate plots in Mulshi, Velhe, Talegaon with natural water sources and clear 7/12 extracts.',
    group: 'land',
    groupLabel: 'Land & Development',
    badge: 'Green Estates',
    overview: 'Escape urban density with private agricultural acreage or a scenic weekend farmhouse plot. ANV Reealty guides patrons through Maharashtra agricultural land purchase regulations, offering verified farm land parcels with perennial water sources, mountain backdrops, and fertile soils.',
    detailedContent: [
      'Guidance on legal farmer certificate eligibility requirements in Maharashtra.',
      'Properties located in peaceful scenic valleys: Mulshi, Bhor, Paud, Velhe, and Shirwal.',
      'Ideal for organic farming, luxury farmhouses, horticulture, or long-term land banking.'
    ],
    features: [
      'Perennial Water Sources: River Frontages, Natural Streams, or Borewells',
      'Clear 7/12 Land Extracts with Demarcated Physical Fencing',
      'Fertile Black Cotton and Red Loam Soils Suitable for Orchards',
      'All-Weather Tar Road Connectivity to the Plot Boundary',
      'Proximity to Pune City (within 45 to 90 minutes driving time)'
    ],
    investmentBenefits: [
      'Tax-exempt agricultural income under Indian Income Tax Act',
      'Serene lifestyle asset for family retreats and organic wellness living',
      'Significant capital gains as urban expansion brings city limits closer'
    ],
    popularLocalities: ['Mulshi', 'Paud', 'Velhe', 'Bhor', 'Talegaon Dabhade', 'Shirwal'],
    heroImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'commercial',
    faqs: [
      {
        question: 'Can a non-farmer buy agricultural land in Maharashtra?',
        answer: 'Under the Maharashtra Tenancy and Agricultural Lands Act, only certified agriculturalists can purchase farm land. We provide complete advisory on legal eligibility norms and procedures.'
      },
      {
        question: 'What are the best areas near Pune for buying a weekend farmhouse?',
        answer: 'Mulshi, Paud, Bhor, Velhe, and the outskirts of Talegaon are highly favored for their natural beauty, clean air, dams, and proximity to Pune city.'
      }
    ]
  },
  {
    slug: 'industrial-land',
    title: 'Industrial Land',
    shortTitle: 'Industrial Land',
    iconName: 'Factory',
    tagline: 'MIDC Sanctioned & Private Industrial Plots for Manufacturing & Processing',
    metaTitle: 'Industrial Land & MIDC Plots for Sale in Pune | Manufacturing Hubs | ANV Reealty',
    metaDescription: 'Explore verified MIDC and private industrial land parcels in Chakan, Talegaon, and Ranjangaon, Pune. Heavy power, effluent treatment, and expressway access.',
    group: 'land',
    groupLabel: 'Industrial & Logistics',
    badge: 'MIDC Approved',
    overview: 'Pune is the automotive and heavy engineering capital of India. ANV Reealty represents verified industrial land parcels in premier industrial belts including Chakan, Talegaon, Bhosari, and Ranjangaon, engineered for manufacturing plants, assembly facilities, and research centers.',
    detailedContent: [
      'MIDC leasehold transfers and private freehold industrial land acquisitions.',
      'Heavy power allocation (11kV / 22kV / 33kV express industrial feeders) and industrial water supply.',
      'Direct connectivity to the Mumbai-Pune Expressway, JNPT Port corridor, and upcoming Ring Road.'
    ],
    features: [
      'Heavy Industrial (I-Zone) Sanctions for Red, Orange, and Green Category Units',
      'CETP (Common Effluent Treatment Plant) Connectivity & Industrial Drainage',
      'Wide Internal Industrial Road Networks for Multi-Axle Heavy Trailers',
      'Sub-Station Proximity for High-Load Power Feeder Connections',
      'Complete Environmental Clearance (EC) & Factory Inspectorate Compliance'
    ],
    investmentBenefits: [
      'Anchor location benefits in India\'s most mature automotive and auto-ancillary hub',
      'Substantial industrial lease rental demand from global MNC manufacturers',
      'Robust logistical integration with seaport and air cargo terminals'
    ],
    popularLocalities: ['Chakan Phase 1-4', 'Talegaon MIDC', 'Ranjangaon MIDC', 'Bhosari', 'Supa MIDC', 'Shikrapur'],
    heroImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'commercial',
    faqs: [
      {
        question: 'What is the procedure for an MIDC plot transfer in Pune?',
        answer: 'MIDC plot transfers require obtaining consent from MIDC, clearing development dues, executing a deed of assignment, and securing updated lease agreements.'
      },
      {
        question: 'Which industrial zones in Pune have access to natural gas pipelines?',
        answer: 'Chakan and Talegaon industrial parks have active MNGL industrial natural gas connections for manufacturing and furnace operations.'
      }
    ]
  },
  {
    slug: 'warehouse',
    title: 'Warehouse',
    shortTitle: 'Warehouse & Logistics',
    iconName: 'Warehouse',
    tagline: 'Grade-A Logistics Parks, PEB Godowns & Cold Storage Facilities',
    metaTitle: 'Warehouses & Logistics Spaces for Lease & Sale in Pune | ANV Reealty',
    metaDescription: 'Find Grade-A warehouses, logistics parks, and PEB godowns for lease and sale across Pune. FM2 floors, dock levelers, high eaves heights, and expressway connectivity.',
    group: 'commercial',
    groupLabel: 'Industrial & Logistics',
    badge: 'Grade-A Logistics',
    overview: 'With the exponential rise of 3PL (third-party logistics), e-commerce, and quick-commerce, modern Grade-A warehousing in Pune commands premium valuations. ANV Reealty delivers engineered logistics parks and distribution centers compliant with international supply chain standards.',
    detailedContent: [
      'Pre-engineered building (PEB) structures featuring 12m to 14m clear eaves heights.',
      'Laser-screed FM2 grade industrial floors engineered for heavy racking and robotic reach trucks.',
      'Hydraulic dock levelers, fire sprinkler systems (K-17 / ESFR), and 50-meter truck turnaround aprons.'
    ],
    features: [
      'ESFR (Early Suppression Fast Response) Ceiling Sprinkler Systems',
      'FM2 / FM3 Heavy Load Bearing Concrete Floors (6 to 8 Ton/Sq.M.)',
      'Hydraulic Automated Dock Levelers with Insulated Shutter Doors',
      'Pre-Engineered Building (PEB) with Standing Seam Leak-Proof Roofs',
      'Dedicated Driver Resting Lounges, Weighbridges & Security Guardposts'
    ],
    investmentBenefits: [
      'Strong 8% - 10% rental yields driven by institutional 3PL and e-commerce giants',
      'Long-term master leases (9 to 15 years) providing defensive portfolio stability',
      'Strategic national location on the Golden Quadrilateral transport corridor'
    ],
    popularLocalities: ['Chakan', 'Talegaon', 'Wagholi', 'Lonikand', 'Shikrapur', 'Phaltan / Shirwal'],
    heroImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'commercial',
    faqs: [
      {
        question: 'What is the difference between Grade-A and Grade-B warehouses?',
        answer: 'Grade-A warehouses feature 12m+ clear heights, laser-screed FM2 flooring, ESFR fire sprinklers, hydraulic docks, and wide truck aprons, whereas Grade-B godowns typically lack advanced fire suppression and high racking capability.'
      },
      {
        question: 'What areas in Pune are the primary logistics corridors?',
        answer: 'Chakan-Talegaon in the north-west and Wagholi-Lonikand along the Pune-Nagar highway are Pune\'s two primary warehousing corridors.'
      }
    ]
  },
  {
    slug: 'tdr',
    title: 'TDR',
    shortTitle: 'TDR / FSI Trading',
    iconName: 'Coins',
    tagline: 'Transferable Development Rights (TDR) & Development Rights Certificates (DRC)',
    metaTitle: 'TDR in Pune | Transferable Development Rights for PMC & PCMC | ANV Reealty',
    metaDescription: 'Institutional advisory for buying and selling Transferable Development Rights (TDR) and Development Rights Certificates (DRC) in PMC and PCMC, Pune. Clean title and fast transfer.',
    group: 'specialized',
    groupLabel: 'Developer Advisory',
    badge: 'Developer Asset',
    overview: 'Transferable Development Rights (TDR) are essential for real estate developers looking to maximize FSI (Floor Space Index) and construct additional floors in PMC and PCMC jurisdictions. ANV Reealty acts as a trusted intermediary, facilitating verified, hassle-free TDR trading.',
    detailedContent: [
      'Direct sourcing and placement of DRCs (Development Rights Certificates) issued by PMC and PCMC.',
      'Clear title verification at municipal corporation town planning departments.',
      'Advisory on Slum TDR, Road Widening TDR, Amenity TDR, and Heritage TDR utilization guidelines under UDCPR.'
    ],
    features: [
      '100% Genuine, Verified DRCs Issued by PMC / PCMC Municipal Corporations',
      'End-to-End Town Planning Corporation Transfer Paperwork Support',
      'UDCPR (Unified Development Control Regulations) Compliance Advisory',
      'Competitive Market Rates per Sq.Meter with Transparent Escrow Processing',
      'Fast Turnaround for Timely Project Sanctioning & Commencement'
    ],
    investmentBenefits: [
      'Substantially lowers overall project construction cost compared to government premium FSI',
      'Unlocks critical extra square footage and penthouse floors in high-demand residential towers',
      'Liquid market with continuous developer demand across Pune metropolitan regions'
    ],
    popularLocalities: ['PMC Limits', 'PCMC Limits', 'Baner', 'Kothrud', 'Hadapsar', 'Wakad'],
    heroImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'commercial',
    faqs: [
      {
        question: 'What is TDR (Transferable Development Rights) in Pune?',
        answer: 'TDR is an instrument issued by municipal authorities (PMC/PCMC) in lieu of land surrendered for public amenities or road widening. Developers purchase TDR to build additional floor area beyond standard base FSI.'
      },
      {
        question: 'How is TDR transferred from seller to buyer in Maharashtra?',
        answer: 'The transfer is executed via an official transfer application submitted to the Town Planning Department along with original DRC certificates and requisite municipal transfer fees.'
      }
    ]
  },
  {
    slug: 'group-booking',
    title: 'Group Booking',
    shortTitle: 'Group Booking',
    iconName: 'Briefcase',
    tagline: 'Syndicated Group Purchases & Bulk Investor Deals at Below-Market Rates',
    metaTitle: 'Group Booking in Pune Real Estate | Bulk Investor Pricing | ANV Reealty',
    metaDescription: 'Join exclusive group booking syndicates for residential and commercial projects in Pune. Leverage bulk bargaining power to unlock 10% to 20% discounts below market price.',
    group: 'specialized',
    groupLabel: 'Investor Syndicates',
    badge: 'Bulk Discount',
    overview: 'Bargaining power multiplies in numbers. ANV Reealty convenes corporate buyer syndicates, doctors\' associations, IT employee groups, and high-net-worth investor clubs to negotiate bulk residential and commercial inventory acquisitions directly with Tier-1 developers at institutional wholesale pricing.',
    detailedContent: [
      'Substantial price savings (typically 8% to 18% below retail launch rates) achieved through collective volume.',
      'Priority unit selection across prime towers: top floor views, contiguous office blocks, and preferential parking.',
      'End-to-end syndicate structuring: individual unit registration with customized developer payment flexibilities.'
    ],
    features: [
      'Volume-Negotiated Wholesale Rates Unattainable by Individual Buyers',
      'Preferred Tower Selection & Contiguous Multi-Apartment Clusters',
      'Dedicated Dedicated Legal Counsel for Syndicate Agreement Terms',
      'Specialized Bank Home Loan Syndication with Preferential Interest Rates',
      'Single-Window Point of Contact for All Group Documentation & Handover'
    ],
    investmentBenefits: [
      'Instant equity buffer from Day 1 due to discounted purchase base price',
      'Cohesive community of like-minded corporate peers and professional neighbors',
      'Enhanced exit liquidity through synchronized secondary resale positioning'
    ],
    popularLocalities: ['Baner', 'Balewadi', 'Kharadi', 'Hinjewadi', 'Kalyani Nagar', 'Punawale'],
    heroImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    propertyTypeFilter: 'residential',
    faqs: [
      {
        question: 'How many buyers are required to qualify for a Group Booking deal?',
        answer: 'Typically, a minimum of 5 to 10 buyers (or a cumulative booking volume of ₹10+ Crore) is required to unlock institutional group discount pricing with tier-1 developers.'
      },
      {
        question: 'Does each buyer in a group booking get their own individual registered deed?',
        answer: 'Yes. Each member has their own independent Agreement to Sale and registered title. Only the pricing and commercial terms are negotiated collectively.'
      }
    ]
  }
];

export function getCategoryBySlug(slug: string): CategoryItem | undefined {
  if (slug === 'office-in-it-park' || slug === 'coworking-office-space') {
    return CATEGORIES_DATA.find((c) => c.slug === 'office-space');
  }
  return CATEGORIES_DATA.find((c) => c.slug === slug);
}

export const CATEGORY_OPTIONS = [
  'Office Space',
  'Preleased Properties',
  'Shop/Showroom',
  'Residential Apartment',
  'Residential Bunglow',
  'Pre- Launch Projects',
  'Restaurant',
  'Hospital',
  'Hotel / Resort',
  'Residential/Commercial Land/Plot',
  'Agriculture Farm Land',
  'Industrial Land',
  'Warehouse',
  'TDR',
  'Group Booking'
] as const;

export const CATEGORY_MATCH_PATTERNS: Record<string, string[]> = {
  'office-space': ['%office space%', '%commercial office%', '%office%', '%it park%', '%tech park%', '%cybercity%', '%coworking%', '%co-working%', '%shared office%'],
  'preleased-properties': ['%prelease%', '%pre-lease%', '%pre-rented%', '%prerented%'],
  'shop-showroom': ['%shop%', '%showroom%', '%retail%'],
  'residential-apartment': ['%residential apartment%', '%apartment%', '%flat%', '%bhk%', '%penthouse%', '%residence%'],
  'residential-bungalow': ['%residential bunglow%', '%bungalow%', '%bunglow%', '%villa%', '%row house%'],
  'pre-launch-projects': ['%pre-launch%', '%pre launch%', '%new launch%'],
  'restaurant': ['%restaurant%', '%cafe%', '%f&b%', '%dining%'],
  'hospital': ['%hospital%', '%clinic%', '%healthcare%', '%medical%'],
  'hotel-resort': ['%hotel%', '%resort%', '%hospitality%'],
  'residential-commercial-land-plot': ['%land/plot%', '%plot%', '%land%'],
  'agriculture-farm-land': ['%agriculture%', '%farm land%', '%agricultural%'],
  'industrial-land': ['%industrial land%', '%industrial plot%', '%midc%'],
  'warehouse': ['%warehouse%', '%godown%', '%logistics%'],
  'tdr': ['%tdr%', '%transferable development%'],
  'group-booking': ['%group booking%', '%bulk booking%']
};

export function findMatchingCategorySlug(queryText: string): string | null {
  if (!queryText) return null;
  const lower = queryText.toLowerCase().trim();

  // 1. Direct slug or title exact match
  for (const cat of CATEGORIES_DATA) {
    if (
      lower === cat.slug ||
      lower === cat.title.toLowerCase() ||
      lower === cat.shortTitle.toLowerCase()
    ) {
      return cat.slug;
    }
  }

  // 2. Multi-Category or Multi-BHK Detection: If the user searches more than one category,
  // do NOT collapse to a single category slug so that all matching properties are seen together.
  const bhkMatches = Array.from(lower.matchAll(/\b([1-5])\s*bhk\b/gi));
  if (bhkMatches.length > 1) {
    return null;
  }

  const matchedCategories = new Set<string>();
  if (/\b(?:hospital|hospitals|clinic|clinics|medical|healthcare|doctor)\b/i.test(lower)) matchedCategories.add('hospital');
  if (/\b(?:prelease|pre-lease|preleased|pre-leased|pre-rented|prerented|rental yield|high-roi)\b/i.test(lower)) matchedCategories.add('preleased-properties');
  if (/\b(?:it park|tech park|cybercity|coworking|co-working|shared office|office|offices|commercial office|workspace|office space)\b/i.test(lower)) matchedCategories.add('office-space');
  if (/\b(?:showroom|retail|shop|shops|store)\b/i.test(lower)) matchedCategories.add('shop-showroom');
  if (/\b(?:restaurant|cafe|dining|pub|f&b|rooftop lounge)\b/i.test(lower)) matchedCategories.add('restaurant');
  if (/\b(?:hotel|resort|hospitality)\b/i.test(lower)) matchedCategories.add('hotel-resort');
  if (/\b(?:farm land|agriculture|agricultural|farmhouse)\b/i.test(lower)) matchedCategories.add('agriculture-farm-land');
  if (/\b(?:industrial land|midc|factory)\b/i.test(lower)) matchedCategories.add('industrial-land');
  if (/\b(?:warehouse|godown|logistics)\b/i.test(lower)) matchedCategories.add('warehouse');
  if (/\b(?:tdr|fsi trading)\b/i.test(lower)) matchedCategories.add('tdr');
  if (/\b(?:group booking|bulk booking)\b/i.test(lower)) matchedCategories.add('group-booking');
  if (/\b(?:bungalow|bunglow|villa|row house)\b/i.test(lower)) matchedCategories.add('residential-bungalow');
  if (/\b(?:land|plot|plots)\b/i.test(lower) && !matchedCategories.has('agriculture-farm-land') && !matchedCategories.has('industrial-land')) matchedCategories.add('residential-commercial-land-plot');
  if (/\b(?:bhk|apartment|flat|flats|penthouse|residence)\b/i.test(lower) && !matchedCategories.has('residential-bungalow')) matchedCategories.add('residential-apartment');

  if (matchedCategories.size > 1) {
    return null;
  }

  // 3. High-priority explicit keyword matches
  if (matchedCategories.has('hospital')) return 'hospital';
  if (matchedCategories.has('preleased-properties')) return 'preleased-properties';
  if (matchedCategories.has('shop-showroom')) return 'shop-showroom';
  if (matchedCategories.has('office-space')) return 'office-space';
  if (matchedCategories.has('restaurant')) return 'restaurant';
  if (matchedCategories.has('hotel-resort')) return 'hotel-resort';
  if (matchedCategories.has('agriculture-farm-land')) return 'agriculture-farm-land';
  if (matchedCategories.has('industrial-land')) return 'industrial-land';
  if (matchedCategories.has('warehouse')) return 'warehouse';
  if (matchedCategories.has('tdr')) return 'tdr';
  if (matchedCategories.has('group-booking')) return 'group-booking';
  if (matchedCategories.has('residential-bungalow')) return 'residential-bungalow';
  if (matchedCategories.has('residential-commercial-land-plot')) return 'residential-commercial-land-plot';
  if (matchedCategories.has('residential-apartment')) return 'residential-apartment';

  // 3. Fallback pattern matching
  for (const [slug, patterns] of Object.entries(CATEGORY_MATCH_PATTERNS)) {
    for (const pat of patterns) {
      const cleanPat = pat.replace(/%/g, '').toLowerCase();
      if (cleanPat && lower.includes(cleanPat)) {
        return slug;
      }
    }
  }

  return null;
}


