/**
 * Description Sanitizer & Point-Format Parser
 * 
 * Converts raw Excel/CRM property descriptions into clean, bulleted point format.
 * Strictly masks/scrubs all personal information (phone numbers, email addresses, contact labels)
 * to prevent leaking confidential owner or agent details to public users.
 */

/**
 * Scrubs email addresses and phone numbers from raw text.
 */
export function scrubPersonalInfo(text: string): string {
  if (!text) return '';
  return text
    // 1. Remove all email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '')
    // 2. Remove Indian mobile numbers with optional country code (+91, 91), spaces, hyphens, dots
    .replace(/(?:\+?91[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}\b/g, '')
    .replace(/(?:\+?91[\s.-]?)?[6-9]\d{9}\b/g, '')
    // 3. Remove 10-12 digit numbers formatted with dashes or spaces
    .replace(/\b\d{5}[\s.-]\d{5}\b/g, '')
    .replace(/\b\d{3,4}[\s.-]\d{3,4}[\s.-]\d{3,4}\b/g, '')
    // 4. Remove landline numbers (e.g., 020-12345678, 022-87654321)
    .replace(/\b0\d{2,4}[\s.-]?\d{6,8}\b/g, '')
    // 5. Clean up dangling contact phrases after phone/email was scrubbed (e.g., "Contact: ", "Call Mr. Sharma: ")
    .replace(/\b(?:call|contact|whatsapp|wa|mobile|mob|phone|ph|tel|email|mail)\s*[:–-]?\s*(?:[A-Za-z]+\s*)?$/gim, '')
    .replace(/\b(?:call|contact|whatsapp|wa|mobile|mob|phone|ph|tel|email|mail)\s*[:–-]?\s*$/gim, '')
    .trim();
}

/**
 * Splits raw description text by newlines and hash-marks (#) into clean bullet points.
 * Strips leading '#', '*', '-', '•', and numeric bullet prefixes.
 * Scrubs all personal contact numbers and email addresses.
 */
export function parseDescriptionBulletPoints(rawText: string): string[] {
  if (!rawText) return [];

  // Normalize inline hashes `#` to newlines so "#Shop #Prime Location #Road" splits properly
  const normalized = rawText
    .replace(/([^\n])#/g, '$1\n#')
    .replace(/([^\n])(?=[*•]\s+)/g, '$1\n')
    .replace(/^[ \t]*[*•]\s+/gm, '\n');

  return normalized
    .split(/\r?\n/)
    .map(line => {
      // First scrub personal info from this line
      const scrubbed = scrubPersonalInfo(line);
      // Strip leading bullet markers (#, *, -, •, 1., 1), etc.)
      const stripped = scrubbed
        .replace(/^[#*\-•\s\d.)]+/, '')
        .replace(/^[*_\s"']+|[*_\s"']+$/g, '')
        .trim();
      return stripped;
    })
    .filter(line => {
      // Omit empty or near-empty lines
      if (!line || line.length < 2) return false;
      // Omit lines that consist solely of contact prompts
      if (/^(?:contact|phone|mobile|email|call|whatsapp|ph|tel|mob|inquire|enquiry|rm)[\s:–-]*$/i.test(line)) return false;
      // Omit internal comment tags
      if (line.startsWith('<!--') || line.includes('DOSSIER_DATA:')) return false;
      return true;
    });
}
