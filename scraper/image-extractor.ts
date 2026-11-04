/**
 * ============================================================================
 * TrueDeal Superpowerful Image & Media Intelligence Engine
 * ============================================================================
 * Extracts 100% authentic, high-resolution product and website imagery across:
 * - Lazy-loaded attributes (data-src, data-original, data-lazy, data-zoom-image, data-zoom, data-high-res-src, data-large-img, data-desktop-src, data-srcset, data-bg, etc.)
 * - HTML5 <picture> and <source srcset="..."> elements
 * - Next.js SSR Hydration State (<script id="__NEXT_DATA__">, /_next/image optimizer)
 * - Nuxt, Vite, React, Vue and SPA State (<script id="__NUXT__">, window.__INITIAL_STATE__)
 * - Schema.org JSON-LD graph nodes (Product, RealEstateListing, Offer, ImageObject, ItemList)
 * - Embedded JavaScript stores (Shopify meta.product, WooCommerce variations, BigCommerce, Magento, Wix, Squarespace)
 * - Deep raw HTML regex scanner for known high-bandwidth image CDNs
 * - High-res upgrader (Shopify, Amazon, WordPress, WooCommerce, Cloudinary, Wix, Squarespace, Webflow, Imgix, Contentful, Azure Blob, S3)
 * - Intelligent anti-junk filter (removes 1x1 tracking pixels, payment badges, social icons, UI arrows)
 * ============================================================================
 */

import * as cheerio from "cheerio";

export interface ExtractedMedia {
  primaryImage: string;
  images: string[];
}

/**
 * Resolves any relative URL to an absolute URL
 */
export function makeAbsoluteUrl(relativeUrl: string, baseUrl: string): string {
  if (!relativeUrl) return "";
  let clean = relativeUrl.trim();

  // Strip wrapping quotes/escapes often found in inline JS/JSON/CSS
  clean = clean
    .replace(/^['"\\]+|['"\\]+$/g, "")
    .replace(/\\u002f/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");

  // Handle Next.js Image Optimizer: /_next/image?url=...&w=...&q=...
  if (clean.includes("/_next/image")) {
    try {
      const parsed = new URL(clean, baseUrl || "https://placeholder.com");
      const innerUrl = parsed.searchParams.get("url");
      if (innerUrl) {
        clean = decodeURIComponent(innerUrl);
      }
    } catch {}
  }

  // Handle protocol-relative URL: //cdn.shopify.com/...
  if (clean.startsWith("//")) {
    return `https:${clean}`;
  }

  // Already absolute HTTP/HTTPS URL
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  try {
    const baseObj = new URL(baseUrl);
    // If clean starts with '/', resolve directly to origin
    if (clean.startsWith("/")) {
      return new URL(clean, baseObj.origin).href;
    }
    // If clean is a root asset path (does not start with ./ or ../), resolve directly against origin
    if (!clean.startsWith("./") && !clean.startsWith("../")) {
      return new URL(`/${clean}`, baseObj.origin).href;
    }
    return new URL(clean, baseUrl).href;
  } catch {
    return clean;
  }
}

/**
 * Upgrade low-res thumbnail image URLs to full high-resolution assets
 */
export function upgradeImageUrl(url: string, baseUrl?: string): string {
  if (!url) return "";
  let fullUrl = baseUrl ? makeAbsoluteUrl(url, baseUrl) : url;

  // 1. Next.js image URL extractor: /_next/image?url=...&w=...
  if (fullUrl.includes("/_next/image")) {
    try {
      const u = new URL(fullUrl);
      const inner = u.searchParams.get("url");
      if (inner) {
        fullUrl = baseUrl ? makeAbsoluteUrl(decodeURIComponent(inner), baseUrl) : decodeURIComponent(inner);
      }
    } catch {}
  }

  // 2. Shopify CDN upgrade:
  // e.g. product_100x100.jpg -> product_2048x2048.jpg, or remove size suffix
  if (fullUrl.includes("cdn.shopify.com") || fullUrl.includes("/cdn/shop/")) {
    fullUrl = fullUrl.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|100x100|200x200|300x300|400x400|500x500|600x600|800x800|1024x1024|crop_center)(?=[._])/gi, "_2048x2048");
    fullUrl = fullUrl.replace(/_(?:\d+x\d+)(?=[._])/gi, "_2048x2048");
  }

  // 3. Amazon Image CDN upgrade:
  // e.g. ._AC_SR100,100_.jpg or ._SX300_.jpg -> ._AC_SL1500_.jpg
  if (fullUrl.includes("media-amazon.com") || fullUrl.includes("images-amazon.com") || fullUrl.includes("ssl-images-amazon.com")) {
    fullUrl = fullUrl.replace(/\._[A-Z0-9_,]+_\./i, "._AC_SL1500_.");
  }

  // 4. WordPress / WooCommerce Uploads upgrade:
  // e.g. image-150x150.jpg, image-300x300.jpg, image-768x512.jpg -> image.jpg
  if (fullUrl.includes("/wp-content/uploads/")) {
    fullUrl = fullUrl.replace(/-\d{2,4}x\d{2,4}(?=\.[a-z]{3,4})/i, "");
  }

  // 5. Cloudinary CDN upgrade:
  if (fullUrl.includes("res.cloudinary.com")) {
    fullUrl = fullUrl.replace(/\/w_\d+,h_\d+,c_[a-z]+\//i, "/w_1600,q_auto,f_auto/");
    fullUrl = fullUrl.replace(/\/w_\d+\//i, "/w_1600/");
    fullUrl = fullUrl.replace(/\/h_\d+\//i, "/h_1600/");
  }

  // 6. Wix Static CDN upgrade:
  // e.g. static.wixstatic.com/media/.../v1/fill/w_100,h_100... -> /v1/fill/w_1400,h_1400...
  if (fullUrl.includes("static.wixstatic.com/media/")) {
    fullUrl = fullUrl.replace(/\/v1\/fill\/w_\d+,h_\d+[^/]+/i, "/v1/fill/w_1400,h_1400,q_85,usm_0.66_1.00_0.01");
  }

  // 7. Squarespace CDN upgrade:
  // e.g. images.squarespace-cdn.com/content/v1/...?format=300w -> ?format=1500w
  if (fullUrl.includes("images.squarespace-cdn.com")) {
    fullUrl = fullUrl.replace(/format=\d+w/i, "format=1500w");
  }

  // 8. Webflow CDN upgrade:
  // e.g. ...-p-500.jpeg -> .jpeg
  if (fullUrl.includes("assets.website-files.com") || fullUrl.includes("cdn.prod.website-files.com")) {
    fullUrl = fullUrl.replace(/-p-\d+(?=\.[a-z]{3,4})/i, "");
  }

  // 9. Imgix CDN upgrade:
  if (fullUrl.includes(".imgix.net")) {
    fullUrl = fullUrl.replace(/([?&])w=\d+/i, "$1w=1600").replace(/([?&])h=\d+/i, "$1h=1600");
  }

  // 10. Unsplash upgrade:
  if (fullUrl.includes("images.unsplash.com")) {
    fullUrl = fullUrl.replace(/w=\d+/i, "w=1400").replace(/q=\d+/i, "q=85");
    if (!fullUrl.includes("w=1400")) {
      fullUrl += (fullUrl.includes("?") ? "&" : "?") + "w=1400&q=85";
    }
  }

  // 11. Contentful CDN (ctfassets.net) upgrade:
  if (fullUrl.includes("images.ctfassets.net") || fullUrl.includes("ctfassets.net")) {
    fullUrl = fullUrl.replace(/([?&])w=\d+/i, "$1w=1400");
    if (!fullUrl.includes("w=1400") && !fullUrl.includes("w=1920")) {
      fullUrl += (fullUrl.includes("?") ? "&" : "?") + "w=1400&fm=jpg&q=85";
    }
    fullUrl = fullUrl.replace(/([?&])width=\d+/i, "$1w=1400");
  } else {
    // 12. Generic dimension query params
    fullUrl = fullUrl.replace(/([?&])width=\d+/i, "$1width=1400");
    fullUrl = fullUrl.replace(/([?&])w=\d+/i, "$1w=1400");
    fullUrl = fullUrl.replace(/([?&])height=\d+/i, "$1height=1400");
    fullUrl = fullUrl.replace(/([?&])h=\d+/i, "$1h=1400");
    fullUrl = fullUrl.replace(/([?&])max_width=\d+/i, "$1max_width=1400");
  }

  return fullUrl;
}

// Junk keywords that indicate non-product graphics, tracking pixels, badges, UI elements
const JUNK_IMAGE_KEYWORDS = [
  "1x1", "pixel", "blank.gif", "spacer", "tracking", "transparent",
  "data:image/gif;base64,R0lGOD", "data:image/svg+xml",
  "visa", "mastercard", "amex", "discover", "paypal", "paytm", "gpay", "rupay", "applepay", "payment-methods", "payment_icons", "payment-icons",
  "trust-badge", "secure-checkout", "money-back", "guarantee-badge", "ssl-seal", "norton", "mcafee",
  "facebook.svg", "twitter.svg", "instagram.svg", "whatsapp.svg", "youtube.svg", "linkedin.svg", "social-icons",
  "star.svg", "star-rating", "rating-star", "arrow-right", "arrow-left", "chevron", "close.svg", "menu.svg", "search.svg", "cart.svg", "shopping-bag.svg",
  "loading.gif", "spinner.gif", "loader.gif", "placeholder", "default-avatar", "avatar-", "author-", "user-icon",
  "testi-def", "testi-", "testimonial-avatar", "avatar-def", "user-def", "author-def", "dummy-user",
  "no-image", "noimage", "no_image", "notfound", "not-found", "sample-logo",
  "badge-", "icon-", "icon_", "-icon.", "_icon.",
  "/logo.", "-logo.", "_logo.", "logo-", "logo_", "brand-logo", "header-logo", "footer-logo"
];

/**
 * Validates if an image URL is an authentic, high-quality product/catalog asset
 */
export function isValidProductImage(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim().toLowerCase();

  // Must be valid URL length and format
  if (clean.length < 8) return false;
  if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("//") && !clean.startsWith("/")) return false;

  // Reject template placeholders like " + record.Url + " or ${...} or undefined/null/no-image/logo
  if (
    clean.includes("record.url") || 
    clean.includes('"+') || 
    clean.includes("'+") || 
    clean.includes("${") || 
    clean.includes("<%") || 
    clean.includes("undefined") || 
    clean.includes("null") || 
    clean.includes("no-image") || 
    clean.includes("noimage") ||
    clean.includes("ref.png") ||
    clean.includes("no-image-312x220") ||
    clean.includes("/images/logo.") ||
    clean.includes("/logo.") ||
    clean.endsWith("/logo.png") ||
    clean.endsWith("/logo.svg") ||
    clean.endsWith("/logo.jpeg") ||
    clean.endsWith("/logo.jpg") ||
    clean.endsWith("/logo.webp") ||
    clean.endsWith("/logo.avif")
  ) {
    return false;
  }

  // Check known junk/tracking keywords (match path-level or filename-level appropriately)
  const filename = clean.split('?')[0].split('/').pop() || clean;
  for (const junk of JUNK_IMAGE_KEYWORDS) {
    if (junk.startsWith("icon") || junk.startsWith("badge") || junk.startsWith("logo") || junk.endsWith("logo.")) {
      if (filename.includes(junk) || filename.startsWith(junk)) return false;
    } else {
      if (clean.includes(junk)) return false;
    }
  }

  // Must not be an inline base64 image unless substantial size (> 3KB)
  if (clean.startsWith("data:image")) {
    if (clean.includes("data:image/svg+xml") || clean.length < 3000) return false;
  }

  // Check valid image file extension or known image CDN / bucket
  const hasImageExt = /\.(?:jpe?g|png|webp|avif|gif|heic)(?:\?.*)?$/i.test(clean);
  const isImageCdn = clean.includes("cdn.") || 
                     clean.includes("images.") || 
                     clean.includes("cloudinary") || 
                     clean.includes("unsplash") || 
                     clean.includes("img.") || 
                     clean.includes("static.wixstatic.com") ||
                     clean.includes("squarespace-cdn.com") ||
                     clean.includes("website-files.com") ||
                     clean.includes("shopify.com") ||
                     clean.includes("/uploads/") || 
                     clean.includes("/products/") || 
                     clean.includes("/product/") || 
                     clean.includes("/media/") || 
                     clean.includes("/images/") || 
                     clean.includes("/photos/") || 
                     clean.includes("/assets/") || 
                     clean.includes("/catalog/") || 
                     clean.includes("/storage/") ||
                     clean.includes("b2bbricksblob") ||
                     clean.includes("blob.core.windows.net") ||
                     clean.includes("azureedge.net") ||
                     clean.includes("s3.amazonaws.com") ||
                     clean.includes("cloudfront.net") ||
                     clean.includes("r2.dev") ||
                     clean.includes("supabase.co") ||
                     clean.includes("digitaloceanspaces.com") ||
                     clean.includes("googleusercontent.com") ||
                     clean.includes("staticmb.com") ||
                     clean.includes("magicbricks") ||
                     clean.includes("housingcdn.com") ||
                     clean.includes("housing.com") ||
                     clean.includes("99acres") ||
                     clean.includes("nobroker") ||
                     clean.includes("squareyards") ||
                     clean.includes("proptiger") ||
                     clean.includes("anvrealty") ||
                     clean.includes("anvreealty") ||
                     clean.includes("wp-content");

  return hasImageExt || isImageCdn;
}

/**
 * Parse a srcset attribute string and extract all high-resolution URLs sorted descending
 * Example srcset: "img-small.jpg 300w, img-medium.jpg 600w, img-large.jpg 1200w"
 */
export function parseSrcset(srcset: string, baseUrl: string): string[] {
  if (!srcset) return [];
  const entries = srcset.split(/,\s+(?=[^,]+\s+\d+[wx])/).map(s => s.trim()).filter(Boolean);
  const candidates: { url: string; width: number }[] = [];

  for (const entry of entries) {
    const parts = entry.split(/\s+/);
    if (parts.length > 0) {
      const rawUrl = parts[0];
      let width = 0;
      if (parts[1]) {
        const wMatch = parts[1].match(/^(\d+)w$/i);
        const xMatch = parts[1].match(/^(\d+(?:\.\d+)?)x$/i);
        if (wMatch) width = parseInt(wMatch[1], 10);
        else if (xMatch) width = Math.round(parseFloat(xMatch[1]) * 600);
      }
      const abs = makeAbsoluteUrl(rawUrl, baseUrl);
      if (isValidProductImage(abs)) {
        candidates.push({ url: upgradeImageUrl(abs, baseUrl), width });
      }
    }
  }

  // Sort descending by resolution (highest quality first)
  candidates.sort((a, b) => b.width - a.width);
  return candidates.map(c => c.url);
}

/**
 * Extract images from HTML5 <picture> and <source> elements
 */
function extractPictureSourceImages($: cheerio.CheerioAPI, baseUrl: string, scope?: cheerio.Cheerio<any>): string[] {
  const images: string[] = [];
  const target = scope || $("body");

  target.find("picture source, source[srcset]").each((_, el) => {
    const srcset = $(el).attr("srcset") || $(el).attr("data-srcset");
    if (srcset) {
      const parsed = parseSrcset(srcset, baseUrl);
      for (const img of parsed) {
        if (!images.includes(img)) images.push(img);
      }
    }
  });

  return images;
}

/**
 * Comprehensive DOM Image Attribute Priority List
 */
const DOM_IMAGE_ATTRIBUTES = [
  "data-zoom-image",
  "data-zoom",
  "data-high-res-src",
  "data-hires",
  "data-large-img",
  "data-large",
  "data-full-url",
  "data-full",
  "data-original",
  "data-src",
  "data-lazy-src",
  "data-lazy",
  "data-image",
  "data-img",
  "data-thumb",
  "data-desktop-src",
  "data-fallback-src",
  "data-preview",
  "data-bg",
  "data-background",
  "src"
];

/**
 * Extract images from standard DOM <img> elements scanning all lazy-load attributes
 */
function extractDomImages($: cheerio.CheerioAPI, baseUrl: string, scope?: cheerio.Cheerio<any>): string[] {
  const images: string[] = [];
  const target = scope || $("body");

  // 1. Check images, picture sources, and containers
  target.find("img, [class*='image'] img, [class*='product'] img, [class*='gallery'] img, [class*='slider'] img, [class*='carousel'] img, figure img, a[data-image], div[data-src], div[data-bg]").each((_, el) => {
    // Check srcset first for highest resolution
    const srcset = $(el).attr("srcset") || $(el).attr("data-srcset");
    if (srcset) {
      const parsed = parseSrcset(srcset, baseUrl);
      for (const img of parsed) {
        if (!images.includes(img) && images.length < 20) {
          images.push(img);
        }
      }
    }

    // Check prioritized lazy-load and zoom attributes
    for (const attr of DOM_IMAGE_ATTRIBUTES) {
      const val = $(el).attr(attr);
      if (val && !val.includes("data:image/gif") && !val.includes("data:image/svg")) {
        const abs = makeAbsoluteUrl(val, baseUrl);
        if (isValidProductImage(abs)) {
          const upgraded = upgradeImageUrl(abs, baseUrl);
          if (!images.includes(upgraded) && images.length < 20) {
            images.push(upgraded);
            break;
          }
        }
      }
    }
  });

  // 2. Extract CSS background images: style="background-image: url('...')" or data-bg="..."
  target.find("[style*='background-image'], [style*='background:'], [data-bg], [data-background]").each((_, el) => {
    const style = $(el).attr("style") || "";
    const dataBg = $(el).attr("data-bg") || $(el).attr("data-background") || "";
    
    let rawBg = "";
    if (dataBg) {
      rawBg = dataBg;
    } else {
      const bgMatch = style.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      if (bgMatch && bgMatch[1]) {
        rawBg = bgMatch[1];
      }
    }

    if (rawBg) {
      const abs = makeAbsoluteUrl(rawBg, baseUrl);
      if (isValidProductImage(abs)) {
        const upgraded = upgradeImageUrl(abs, baseUrl);
        if (!images.includes(upgraded) && images.length < 20) {
          images.push(upgraded);
        }
      }
    }
  });

  return images;
}

/**
 * Extract high-resolution product images from Schema.org JSON-LD structured data
 */
function extractJsonLdImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const images: string[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).html();
      if (!text) return;
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : data["@graph"] ? data["@graph"] : [data];

      for (const item of items) {
        const candidates = item["@graph"] ? item["@graph"] : [item];
        for (const node of candidates) {
          // Check product, real estate, accommodation, service, offer, itemlist
          const imgProp = node.image || node.photo || node.photos || node.thumbnail || node.primaryImageOfPage || node.images;
          if (imgProp) {
            const rawImgs = Array.isArray(imgProp) ? imgProp : [imgProp];
            for (const imgItem of rawImgs) {
              let rawUrl = "";
              if (typeof imgItem === "string") {
                rawUrl = imgItem;
              } else if (typeof imgItem === "object" && imgItem !== null) {
                rawUrl = imgItem.url || imgItem.contentUrl || imgItem.thumbnailUrl || imgItem.src || "";
              }

              if (rawUrl) {
                const abs = makeAbsoluteUrl(rawUrl, baseUrl);
                if (isValidProductImage(abs)) {
                  const upgraded = upgradeImageUrl(abs, baseUrl);
                  if (!images.includes(upgraded) && images.length < 20) {
                    images.push(upgraded);
                  }
                }
              }
            }
          }

          // Handle ItemList schema elements
          if (node.itemListElement && Array.isArray(node.itemListElement)) {
            for (const itemEl of node.itemListElement) {
              const innerItem = itemEl.item || itemEl;
              const innerImg = innerItem.image || innerItem.photo || innerItem.thumbnail;
              if (innerImg) {
                const rawUrl = typeof innerImg === "string" ? innerImg : (innerImg.url || innerImg.contentUrl || "");
                if (rawUrl) {
                  const abs = makeAbsoluteUrl(rawUrl, baseUrl);
                  if (isValidProductImage(abs)) {
                    const upgraded = upgradeImageUrl(abs, baseUrl);
                    if (!images.includes(upgraded) && images.length < 20) {
                      images.push(upgraded);
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch {}
  });

  return images;
}

/**
 * Checks if an image is authentic and relevant to the specific product being scraped
 * (prevents cross-pollinating related product images like Moringa on Chocolate or Mushroom)
 */
export function isImageRelevantToProduct(imageUrl: string, title?: string): boolean {
  if (!imageUrl) return false;
  if (!title || title.length < 3) return true;

  const lowerUrl = imageUrl.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // If this is a real estate property, always accept valid property/architectural photos
  const isRealEstate = /bhk|apartment|flat|residence|villa|penthouse|office|showroom|shop|warehouse|hospital|land|plot|commercial|residential|property|elevation|floorplan|amenity/i.test(lowerTitle) ||
                       /property|realestate|project|tower|estate/i.test(lowerUrl);
  if (isRealEstate) {
    return true;
  }

  // Distinct flavor & product tokens for FMCG
  const productTokens = [
    "moringa", "chocolate", "choco", "mushroom", "vanilla", 
    "strawberry", "mango", "turmeric", "haldi", "ashwagandha", 
    "amla", "triphala", "spirulina", "tulsi", "ragi", "millet"
  ];

  for (const token of productTokens) {
    // If image filename/URL contains a specific product flavor/keyword,
    // but the target product title does NOT contain that keyword, reject it!
    if (lowerUrl.includes(token) && !lowerTitle.includes(token)) {
      return false;
    }
  }

  return true;
}

/**
 * Extract product images from Next.js SSR State (`__NEXT_DATA__`) and SPA state
 */
function extractNextDataImages($: cheerio.CheerioAPI, baseUrl: string, targetTitle?: string): string[] {
  const images: string[] = [];

  $('script#__NEXT_DATA__, script#__NUXT__, script[type="application/json"]').each((_, el) => {
    try {
      const raw = $(el).html();
      if (!raw || raw.length < 20) return;

      const jsonImgMatches = Array.from(
        raw.matchAll(/(?:["']?(?:image|image1|image2|image3|image4|img|images|photos|gallery|thumbnail|featured_image|hero_image|src|url|full_src)["']?\s*:\s*["']([^"']+\.(?:jpe?g|png|webp|avif|heic)[^"']*)["'])/gi)
      );
      
      for (const match of jsonImgMatches) {
        if (match[1]) {
          const abs = makeAbsoluteUrl(match[1], baseUrl);
          if (isValidProductImage(abs) && isImageRelevantToProduct(abs, targetTitle)) {
            const upgraded = upgradeImageUrl(abs, baseUrl);
            if (!images.includes(upgraded) && images.length < 15) {
              images.push(upgraded);
            }
          }
        }
      }
    } catch {}
  });

  return images;
}

/**
 * Deep Regex Fallback Scanner: Scans the entire raw HTML for any valid product images
 */
function scanRawHtmlImages(html: string, baseUrl: string, targetTitle?: string): string[] {
  const images: string[] = [];
  if (!html) return images;

  // Regex targeting product and CDN image URLs
  const CDN_IMAGE_REGEX = /(?:https?:)?\/\/[^\s"'<>\\]+?\.(?:jpe?g|png|webp|avif)(?:\?[^\s"'<>\\]*)?/gi;
  const matches = Array.from(html.matchAll(CDN_IMAGE_REGEX));

  for (const m of matches) {
    const raw = m[0];
    const abs = makeAbsoluteUrl(raw, baseUrl);
    if (isValidProductImage(abs) && isImageRelevantToProduct(abs, targetTitle)) {
      const lower = abs.toLowerCase();
      if (
        lower.includes("product") ||
        lower.includes("item") ||
        lower.includes("catalog") ||
        lower.includes("upload") ||
        lower.includes("media") ||
        lower.includes("gallery") ||
        lower.includes("b2bbricksblob") ||
        lower.includes("shopify") ||
        lower.includes("cloudinary") ||
        lower.includes("property") ||
        lower.includes("assets") ||
        lower.includes("photos")
      ) {
        const upgraded = upgradeImageUrl(abs, baseUrl);
        if (!images.includes(upgraded) && images.length < 12) {
          images.push(upgraded);
        }
      }
    }
  }

  return images;
}

/**
 * Intelligent Fallback Generator for products that have zero photography
 */
export function getCategoryFallbackImage(category: string, title: string): string {
  const text = `${category || ""} ${title || ""}`.toLowerCase();
  
  if (text.includes("real estate") || text.includes("property") || text.includes("commercial") || text.includes("office") || text.includes("shop") || text.includes("showroom") || text.includes("sq.ft") || text.includes("sqft") || text.includes("pune") || text.includes("apartment") || text.includes("flat") || text.includes("villa") || text.includes("land") || text.includes("plot") || text.includes("premise") || text.includes("warehouse")) {
    if (text.includes("shop") || text.includes("showroom") || text.includes("retail")) {
      return "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1400&q=85";
    }
    if (text.includes("medical") || text.includes("hospital")) {
      return "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1400&q=85";
    }
    if (text.includes("residential") || text.includes("apartment") || text.includes("villa")) {
      return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=85";
    }
    return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&q=85";
  }

  if (text.includes("vps") || text.includes("server") || text.includes("cloud") || text.includes("hosting") || text.includes("datacenter") || text.includes("kvm") || text.includes("nvme")) {
    return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1400&q=85";
  }

  if (text.includes("seo") || text.includes("marketing") || text.includes("consulting") || text.includes("agency") || text.includes("service") || text.includes("advisory") || text.includes("development") || text.includes("design") || text.includes("website")) {
    return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1400&q=85";
  }

  if (text.includes("food") || text.includes("malt") || text.includes("drink") || text.includes("snack") || text.includes("beverage") || text.includes("powder") || text.includes("organic") || text.includes("tea") || text.includes("coffee") || text.includes("ayurveda") || text.includes("ayur") || text.includes("soup") || text.includes("mix")) {
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&q=85";
  }

  if (text.includes("clothing") || text.includes("apparel") || text.includes("fashion") || text.includes("dress") || text.includes("shirt") || text.includes("wear") || text.includes("shoe")) {
    return "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1400&q=85";
  }

  if (text.includes("tile") || text.includes("stone") || text.includes("marble") || text.includes("granite") || text.includes("floor") || text.includes("paving") || text.includes("paver") || text.includes("wall") || text.includes("cladding") || text.includes("slate") || text.includes("ceramic") || text.includes("porcelain")) {
    return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=85";
  }

  if (text.includes("home") || text.includes("living") || text.includes("chair") || text.includes("table") || text.includes("sofa") || text.includes("furniture") || text.includes("decor") || text.includes("kitchen") || text.includes("lighting")) {
    return "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=85";
  }

  if (text.includes("laptop") || text.includes("computer") || text.includes("phone") || text.includes("gadget") || text.includes("electronics") || text.includes("headphone") || text.includes("audio")) {
    return "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1400&q=85";
  }

  return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&q=85";
}

/**
 * Universal Master Image Extraction Pipeline:
 * Discovers and consolidates all authentic high-resolution images from any web page.
 */
export function extractSuperpowerfulImages(
  $: cheerio.CheerioAPI,
  html: string,
  targetUrl: string,
  options: {
    title?: string;
    category?: string;
    productScope?: cheerio.Cheerio<any>;
    maxImages?: number;
  } = {}
): ExtractedMedia {
  const maxImages = options.maxImages || 10;
  const discoveredImages: string[] = [];

  const addUnique = (urlList: string[]) => {
    for (const u of urlList) {
      if (u && isValidProductImage(u) && isImageRelevantToProduct(u, options.title)) {
        const upgraded = upgradeImageUrl(u, targetUrl);
        const baseKey = upgraded.split("?")[0].toLowerCase();
        const alreadyExists = discoveredImages.some(existing => existing.split("?")[0].toLowerCase() === baseKey);
        if (!alreadyExists && discoveredImages.length < maxImages) {
          discoveredImages.push(upgraded);
        }
      }
    }
  };

  // 1. Dedicated Product Gallery / Slider / PDP Containers
  const galleryScope = $(
    ".product-gallery, .product-images, .pdp-image, .pdp-gallery, .product-media, .product-slider, .slick-slider, .swiper-wrapper, #product-gallery, [class*='pdp-gallery'], [class*='product-gallery'], [class*='property-gallery'], [class*='gallery-slider'], .fotorama, .slider-for, .slider-nav"
  );
  if (galleryScope.length > 0) {
    const cleanGallery = galleryScope.clone();
    cleanGallery.find("header, nav, footer, .related, .recommended, .cross-sell, .up-sell").remove();
    addUnique(extractPictureSourceImages($, targetUrl, cleanGallery));
    addUnique(extractDomImages($, targetUrl, cleanGallery));
  }

  // 2. Scoped Product PDP Container Images
  if (options.productScope && options.productScope.length > 0) {
    const cleanScope = options.productScope.clone();
    cleanScope.find("header, nav, footer, .related, .recommended, .cross-sell, .up-sell, .upsell, .related-products, .cart, .sidebar, [class*='related'], [class*='recommend'], [class*='featured-products'], [class*='other-products'], [class*='similar']").remove();
    addUnique(extractPictureSourceImages($, targetUrl, cleanScope));
    addUnique(extractDomImages($, targetUrl, cleanScope));
  }

  // 3. Schema.org JSON-LD Structured Data Images
  addUnique(extractJsonLdImages($, targetUrl));

  // 4. Next.js SSR / React / Nuxt State Extraction (__NEXT_DATA__)
  addUnique(extractNextDataImages($, targetUrl, options.title));

  // 5. OpenGraph & Twitter Meta Image (Often pristine 1200x630 product photo)
  const metaImages = [
    $('meta[property="og:image:secure_url"]').attr("content"),
    $('meta[property="og:image"]').attr("content"),
    $('meta[property="og:image:url"]').attr("content"),
    $('meta[name="twitter:image"]').attr("content"),
    $('meta[name="twitter:image:src"]').attr("content"),
    $('link[rel="image_src"]').attr("href")
  ].filter(Boolean) as string[];

  addUnique(metaImages.map(m => makeAbsoluteUrl(m, targetUrl)));

  // 6. Global DOM Image Scanner if we still need more images
  if (discoveredImages.length < 3) {
    addUnique(extractPictureSourceImages($, targetUrl));
    addUnique(extractDomImages($, targetUrl));
  }

  // 7. Fallback Deep HTML Regex Scanner ONLY if zero images were found
  if (discoveredImages.length === 0) {
    addUnique(scanRawHtmlImages(html, targetUrl, options.title));
  }

  // 8. Fallback for image-less services/hosting
  if (discoveredImages.length === 0) {
    const fallback = getCategoryFallbackImage(options.category || "", options.title || "");
    discoveredImages.push(fallback);
  }

  return {
    primaryImage: discoveredImages[0] || "",
    images: discoveredImages
  };
}

