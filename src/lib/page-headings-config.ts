/**
 * Shared page headings types & defaults.
 * This file is imported by BOTH the client hook AND the server API route.
 * It must NOT import anything server-only (no db, no fs, no pg).
 */

export const DEFAULT_PAGE_HEADINGS = {
  // Footer nav columns
  footer_col_commercial: 'Showroom & Office',
  footer_col_residential: 'Residential & Land',
  footer_col_specialized: 'Specialized & Advisory',
  footer_col_portals: 'Portals & Access',

  // Homepage section headings
  home_hero_title: 'Premium Real Estate in Pune',
  home_hero_subtitle: 'Find your perfect property with ANV Reealty',
  home_featured_title: 'Featured Properties',
  home_featured_subtitle: 'Handpicked premium listings',
  home_active_buyers_title: 'Active Buyers',
  home_why_us_title: 'Why Choose ANV Reealty',
  home_explore_title: 'Explore by Category',

  // Properties listing page
  properties_page_title: 'All Properties',
  properties_page_subtitle: 'Browse our complete portfolio',

  // Category page
  category_page_subtitle: 'Explore verified listings',

  // Buyer section
  buyers_section_title: 'Active Buyers',
  buyers_section_subtitle: 'Connect with verified buyers looking for properties',

  // Property detail page sections
  detail_location_title: 'Location & Connectivity',
  detail_amenities_title: 'Amenities & Features',
  detail_schedule_title: 'Schedule Site Visit',
  detail_similar_title: 'Similar Properties',
} as const;

export type PageHeadings = typeof DEFAULT_PAGE_HEADINGS;
export type PageHeadingKey = keyof PageHeadings;
