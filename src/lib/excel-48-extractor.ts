/**
 * Comprehensive 48-Field Excel Data Extractor & Normalizer
 * Shared between Client CRM Upload Modal & Server Bulk Import API
 */

export interface Excel48ColumnDef {
  key: string;
  label: string;
  shortLabel?: string;
  group: 'Core' | 'Specs' | 'Location' | 'Area' | 'Pricing' | 'Contacts' | 'Lease & CRM';
  aliases: string[];
  type?: 'text' | 'price' | 'area' | 'badge' | 'number' | 'phone' | 'email' | 'percent';
}

export const EXCEL_48_COLUMNS: Excel48ColumnDef[] = [
  // 1-5: Core Identification & Typology
  {
    key: 'Title',
    label: 'Property Title',
    shortLabel: 'Title',
    group: 'Core',
    type: 'text',
    aliases: ['title', 'propertytitle', 'heading', 'proptitle', 'listingtitle']
  },
  {
    key: 'RefNumber',
    label: 'Reference Number',
    shortLabel: 'Ref #',
    group: 'Core',
    type: 'badge',
    aliases: ['refnumber', 'refno', 'reference', 'referencenumber', 'ref_number', 'refnum', 'propertyid', 'listingid']
  },
  {
    key: 'Lease_Sale',
    label: 'Lease / Sale',
    shortLabel: 'Lease/Sale',
    group: 'Core',
    type: 'badge',
    aliases: ['leasesale', 'lease_sale', 'forleaseorsale', 'transaction', 'salerent', 'listingtype']
  },
  {
    key: 'PropertyTypeName',
    label: 'Property Type',
    shortLabel: 'Prop Type',
    group: 'Core',
    type: 'badge',
    aliases: ['propertytypename', 'propertytype', 'category', 'type', 'typology', 'configuration', 'bhk']
  },
  {
    key: 'PropertyName',
    label: 'Property / Project Name',
    shortLabel: 'Project',
    group: 'Core',
    type: 'text',
    aliases: ['propertyname', 'projectname', 'project', 'project_name', 'property']
  },

  // 6-14: Address & Geography
  {
    key: 'AddressName',
    label: 'Address Details',
    shortLabel: 'Address',
    group: 'Location',
    type: 'text',
    aliases: ['addressname', 'address', 'fulladdress', 'siteaddress']
  },
  {
    key: 'FlatNo',
    label: 'Flat / Unit No',
    shortLabel: 'Flat/Unit',
    group: 'Specs',
    type: 'text',
    aliases: ['flatno', 'flatnumber', 'unitno', 'unitnumber', 'shopno', 'officeno', 'suite']
  },
  {
    key: 'BuildingName',
    label: 'Building / Tower',
    shortLabel: 'Building',
    group: 'Location',
    type: 'text',
    aliases: ['buildingname', 'building', 'tower', 'towername', 'complex', 'wing', 'bldg', 'bldgname', 'building_name', 'tower_name']
  },
  {
    key: 'Landmark',
    label: 'Landmark',
    shortLabel: 'Landmark',
    group: 'Location',
    type: 'text',
    aliases: ['landmark', 'vicinity', 'near', 'nearby']
  },
  {
    key: 'SocietyName',
    label: 'Society Name',
    shortLabel: 'Society',
    group: 'Location',
    type: 'text',
    aliases: ['societyname', 'society', 'community', 'township', 'society_name']
  },
  {
    key: 'Street',
    label: 'Street / Road',
    shortLabel: 'Street',
    group: 'Location',
    type: 'text',
    aliases: ['street', 'streetname', 'road', 'roadname', 'lane']
  },
  {
    key: 'LocationName',
    label: 'Location / Micro-Market',
    shortLabel: 'Location',
    group: 'Location',
    type: 'text',
    aliases: ['locationname', 'location', 'locality', 'suburb', 'micromarket', 'areaname']
  },
  {
    key: 'CityName',
    label: 'City',
    shortLabel: 'City',
    group: 'Location',
    type: 'text',
    aliases: ['cityname', 'city']
  },
  {
    key: 'StateName',
    label: 'State',
    shortLabel: 'State',
    group: 'Location',
    type: 'text',
    aliases: ['statename', 'state']
  },

  // 15: Furnishing
  {
    key: 'FurnishingName',
    label: 'Furnishing Status',
    shortLabel: 'Furnishing',
    group: 'Specs',
    type: 'badge',
    aliases: ['furnishingname', 'furnishing', 'furnishedstatus', 'furnishstatus', 'fitout']
  },

  // 16-21: Area Measurements
  {
    key: 'SuperAreaName',
    label: 'Super Area (Sq.Ft.)',
    shortLabel: 'Super Area',
    group: 'Area',
    type: 'area',
    aliases: ['superareaname', 'superarea', 'superbuiltuparea', 'saleablearea', 'sbua']
  },
  {
    key: 'BuiltAreaName',
    label: 'Built Area (Sq.Ft.)',
    shortLabel: 'Built Area',
    group: 'Area',
    type: 'area',
    aliases: ['builtareaname', 'builtarea', 'builtuparea', 'bua']
  },
  {
    key: 'CarpetAreaName',
    label: 'Carpet Area (Sq.Ft.)',
    shortLabel: 'Carpet Area',
    group: 'Area',
    type: 'area',
    aliases: ['carpetareaname', 'carpetarea', 'carpet', 'usablearea', 'carpetareasqft', 'sqft']
  },
  {
    key: 'PlotSizeName',
    label: 'Plot Size',
    shortLabel: 'Plot Size',
    group: 'Area',
    type: 'area',
    aliases: ['plotsizename', 'plotsize', 'plotarea', 'landsize']
  },
  {
    key: 'MaxAreaName',
    label: 'Max Area',
    shortLabel: 'Max Area',
    group: 'Area',
    type: 'area',
    aliases: ['maxareaname', 'maxarea', 'maximumarea']
  },
  {
    key: 'MinAreaName',
    label: 'Min Area',
    shortLabel: 'Min Area',
    group: 'Area',
    type: 'area',
    aliases: ['minareaname', 'minarea', 'minimumarea']
  },

  // 22-24: Pricing & Deposits
  {
    key: 'PricePerUnitArea',
    label: 'Rate / Sq.Ft. (PSF)',
    shortLabel: 'Rate/PSF',
    group: 'Pricing',
    type: 'price',
    aliases: ['priceperunitarea', 'rate', 'ratepersqft', 'ratesqft', 'psf', 'pricepsf']
  },
  {
    key: 'ExpectedPrice',
    label: 'Expected Price',
    shortLabel: 'Price',
    group: 'Pricing',
    type: 'price',
    aliases: ['expectedprice', 'price', 'totalprice', 'budget', 'cost', 'amount', 'askingprice']
  },
  {
    key: 'DepositePrice',
    label: 'Deposit Price',
    shortLabel: 'Deposit',
    group: 'Pricing',
    type: 'price',
    aliases: ['depositeprice', 'depositprice', 'deposit', 'securitydeposit']
  },

  // 25-27: Customer / Owner Contact
  {
    key: 'CustomerFullName',
    label: 'Customer / Owner Name',
    shortLabel: 'Owner Name',
    group: 'Contacts',
    type: 'text',
    aliases: ['customerfullname', 'customername', 'ownername', 'clientname', 'sellername', 'contactperson']
  },
  {
    key: 'CustomerMobile',
    label: 'Customer Mobile',
    shortLabel: 'Owner Mobile',
    group: 'Contacts',
    type: 'phone',
    aliases: ['customermobile', 'customerphone', 'ownerphone', 'ownermobile', 'clientphone', 'mobile']
  },
  {
    key: 'CustomerEmail',
    label: 'Customer Email',
    shortLabel: 'Owner Email',
    group: 'Contacts',
    type: 'email',
    aliases: ['customeremail', 'owneremail', 'clientemail', 'email']
  },

  // 28: Description
  {
    key: 'Description',
    label: 'Description',
    shortLabel: 'Description',
    group: 'Core',
    type: 'text',
    aliases: ['description', 'details', 'remarks', 'overview', 'summary']
  },

  // 29-31: Employee / Agent Assignment
  {
    key: 'EmployeeName',
    label: 'Assigned Agent / RM',
    shortLabel: 'Agent Name',
    group: 'Contacts',
    type: 'text',
    aliases: ['employeename', 'agentname', 'rmname', 'assignedto', 'executive', 'brokername']
  },
  {
    key: 'EmployeeMobile',
    label: 'Agent Mobile',
    shortLabel: 'Agent Mobile',
    group: 'Contacts',
    type: 'phone',
    aliases: ['employeemobile', 'agentmobile', 'agentphone', 'rmphone']
  },
  {
    key: 'EmployeeEmail',
    label: 'Agent Email',
    shortLabel: 'Agent Email',
    group: 'Contacts',
    type: 'email',
    aliases: ['employeeemail', 'agentemail', 'rmemail']
  },

  // 32-36: Timeline, Status & Source
  {
    key: 'PropertyAge',
    label: 'Property Age',
    shortLabel: 'Age',
    group: 'Specs',
    type: 'text',
    aliases: ['propertyage', 'ageofproperty', 'constructionage', 'age', 'buildingage']
  },
  {
    key: 'SourceName',
    label: 'Lead Source',
    shortLabel: 'Source',
    group: 'Lease & CRM',
    type: 'badge',
    aliases: ['sourcename', 'source', 'leadsource', 'leadchannel']
  },
  {
    key: 'TransactionName',
    label: 'Transaction Model',
    shortLabel: 'Transaction',
    group: 'Lease & CRM',
    type: 'badge',
    aliases: ['transactionname', 'transactiontype', 'transaction', 'dealtype']
  },
  {
    key: 'PossessionName',
    label: 'Possession Date',
    shortLabel: 'Possession',
    group: 'Specs',
    type: 'badge',
    aliases: ['possessionname', 'possession', 'possessionstatus', 'possessiondate']
  },
  {
    key: 'Status',
    label: 'Status',
    shortLabel: 'Status',
    group: 'Core',
    type: 'badge',
    aliases: ['status', 'availability', 'listingstatus']
  },

  // 37-41: Unit Specifications & Search
  {
    key: 'ParkingDetails',
    label: 'Parking Details',
    shortLabel: 'Parking',
    group: 'Specs',
    type: 'text',
    aliases: ['parkingdetails', 'parking', 'parkingspaces', 'carparks', 'carparking']
  },
  {
    key: 'FloorNumber',
    label: 'Floor Number',
    shortLabel: 'Floor',
    group: 'Specs',
    type: 'text',
    aliases: ['floornumber', 'floor', 'floorno', 'floorlevel']
  },
  {
    key: 'SearchKeyword',
    label: 'Search Keywords',
    shortLabel: 'Keywords',
    group: 'Lease & CRM',
    type: 'text',
    aliases: ['searchkeyword', 'keywords', 'searchkeywords', 'tags']
  },
  {
    key: 'FacingText',
    label: 'Facing / Orientation',
    shortLabel: 'Facing',
    group: 'Specs',
    type: 'text',
    aliases: ['facingtext', 'facing', 'orientation', 'roadfacing']
  },
  {
    key: 'BranchName',
    label: 'Branch Name',
    shortLabel: 'Branch',
    group: 'Lease & CRM',
    type: 'badge',
    aliases: ['branchname', 'branch', 'office', 'desk']
  },

  // 42-48: Commercial Financials & Lease Contract
  {
    key: 'ROI',
    label: 'ROI %',
    shortLabel: 'ROI %',
    group: 'Pricing',
    type: 'percent',
    aliases: ['roi', 'returnoninvestment', 'yield', 'roiperc']
  },
  {
    key: 'RentPM',
    label: 'Monthly Rent',
    shortLabel: 'Rent/Mo',
    group: 'Pricing',
    type: 'price',
    aliases: ['rentpm', 'monthlyrent', 'rentpermonth', 'rent']
  },
  {
    key: 'RentStartDate',
    label: 'Rent Start Date',
    shortLabel: 'Rent Start',
    group: 'Lease & CRM',
    type: 'text',
    aliases: ['rentstartdate', 'leasecommencement', 'rentstart']
  },
  {
    key: 'LockinPeriod',
    label: 'Lock-in Period',
    shortLabel: 'Lock-in',
    group: 'Lease & CRM',
    type: 'text',
    aliases: ['lockinperiod', 'lockin', 'lockinmonths', 'lockinyears']
  },
  {
    key: 'LeasePeriod',
    label: 'Lease Tenure',
    shortLabel: 'Tenure',
    group: 'Lease & CRM',
    type: 'text',
    aliases: ['leaseperiod', 'leasetenure', 'tenure', 'leasemonths']
  },
  {
    key: 'PropertyTax',
    label: 'Property Tax',
    shortLabel: 'Tax',
    group: 'Pricing',
    type: 'text',
    aliases: ['propertytax', 'tax', 'propertytaxliability']
  },
  {
    key: 'MaintainCharges',
    label: 'Maintenance / CAM',
    shortLabel: 'CAM/Maint',
    group: 'Pricing',
    type: 'text',
    aliases: ['maintaincharges', 'maintenancecharges', 'maintenance', 'cam', 'camcharges']
  }
];

// Pre-compute alias lookup map for ultra-fast matching
const ALIAS_LOOKUP_MAP = new Map<string, string>();
for (const col of EXCEL_48_COLUMNS) {
  // canonical key normalized
  ALIAS_LOOKUP_MAP.set(col.key.toLowerCase().replace(/[^a-z0-9]/g, ''), col.key);
  for (const alias of col.aliases) {
    ALIAS_LOOKUP_MAP.set(alias.toLowerCase().replace(/[^a-z0-9]/g, ''), col.key);
  }
}

/**
 * Extracts and maps all 48 custom Excel fields from any raw spreadsheet row.
 * Handles messy headers, whitespace, casing, and symbol discrepancies.
 */
export function extract48Fields(rawRow: Record<string, any>): Record<string, any> {
  if (!rawRow || typeof rawRow !== 'object') return {};

  const normalizedInput = new Map<string, any>();

  // Map every raw key in row into clean normalized forms
  for (const [k, v] of Object.entries(rawRow)) {
    if (v === undefined || v === null) continue;
    const cleanStr = typeof v === 'string' ? v.trim() : v;
    if (cleanStr === '') continue;

    // 1. Direct trimmed key
    normalizedInput.set(k.trim(), cleanStr);

    // 2. Lowercase alphanumeric slug
    const alphaKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (alphaKey) {
      normalizedInput.set(alphaKey, cleanStr);
    }
  }

  const result: Record<string, any> = {};

  for (const col of EXCEL_48_COLUMNS) {
    // Check direct key first
    if (normalizedInput.has(col.key)) {
      result[col.key] = normalizedInput.get(col.key);
      continue;
    }

    // Check lowercase alphanumeric canonical key
    const colAlpha = col.key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedInput.has(colAlpha)) {
      result[col.key] = normalizedInput.get(colAlpha);
      continue;
    }

    // Check all configured aliases
    let matched = false;
    for (const alias of col.aliases) {
      const aliasAlpha = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedInput.has(aliasAlpha)) {
        result[col.key] = normalizedInput.get(aliasAlpha);
        matched = true;
        break;
      }
    }

    if (!matched) {
      result[col.key] = '';
    }
  }

  return result;
}

/**
 * Detects which of the 48 columns have at least one non-empty value across parsed rows.
 */
export function detectActive48Columns(rows: { extracted48?: Record<string, any> }[]): Excel48ColumnDef[] {
  if (!rows || rows.length === 0) return EXCEL_48_COLUMNS;

  const activeKeys = new Set<string>();

  for (const row of rows) {
    if (!row.extracted48) continue;
    for (const col of EXCEL_48_COLUMNS) {
      const val = row.extracted48[col.key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        activeKeys.add(col.key);
      }
    }
  }

  // If no specific 48 fields found (or all present), return all
  if (activeKeys.size === 0) return EXCEL_48_COLUMNS;

  return EXCEL_48_COLUMNS.filter(col => activeKeys.has(col.key));
}

/**
 * Formats values for display inside the full 48-column preview table
 */
export function format48ValueForTable(key: string, val: any): string {
  if (val === undefined || val === null || String(val).trim() === '') {
    return '—';
  }

  const s = String(val).trim();

  // Price formatting
  if (['ExpectedPrice', 'DepositePrice'].includes(key)) {
    let num = 0;
    if (/(?:cr|crore)/i.test(s)) {
      const match = s.match(/[\d.]+/);
      if (match) num = Math.round(parseFloat(match[0]) * 10000000);
    } else if (/(?:lakh|lac)/i.test(s)) {
      const match = s.match(/[\d.]+/);
      if (match) num = Math.round(parseFloat(match[0]) * 100000);
    } else if (/(?:th|thousand|k)\b/i.test(s)) {
      const match = s.match(/[\d.]+/);
      if (match) num = Math.round(parseFloat(match[0]) * 1000);
    } else {
      num = parseFloat(s.replace(/[^0-9.]/g, ''));
    }

    if (!isNaN(num) && num > 0) {
      if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
      if (num >= 100000) return `₹${(num / 100000).toFixed(1)} Lakh`;
      return `₹${num.toLocaleString('en-IN')}`;
    }
    return s;
  }

  // Rent formatting
  if (key === 'RentPM') {
    const num = parseFloat(s.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L/mo`;
      return `₹${num.toLocaleString('en-IN')}/mo`;
    }
    return s;
  }

  // Rate per unit area
  if (key === 'PricePerUnitArea') {
    const num = parseFloat(s.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      return `₹${num.toLocaleString('en-IN')} / sqft`;
    }
    return s;
  }

  // Area formatting
  if (['CarpetAreaName', 'BuiltAreaName', 'SuperAreaName', 'PlotSizeName'].includes(key)) {
    const num = parseFloat(s.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) {
      return `${num.toLocaleString('en-IN')} sqft`;
    }
    return s;
  }

  // ROI formatting
  if (key === 'ROI') {
    const clean = s.replace(/%/g, '').trim();
    return clean ? `${clean}%` : '—';
  }

  return s;
}
