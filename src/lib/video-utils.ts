/**
 * Universal video URL normalizer and embed generator.
 * Handles all formats of YouTube (Standard, Shorts, Embed, youtu.be, Live, Mobile, and pasted <iframe> tags),
 * Vimeo, and direct MP4/WebM video files.
 */

export interface ParsedVideoInfo {
  type: 'youtube' | 'vimeo' | 'direct' | 'unknown';
  videoId?: string;
  embedUrl: string | null;
  normalizedUrl: string;
  isValid: boolean;
  isShorts?: boolean;
}

export function parseAndNormalizeVideoUrl(rawUrl?: string | null): ParsedVideoInfo {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { type: 'unknown', embedUrl: null, normalizedUrl: '', isValid: false, isShorts: false };
  }

  let url = rawUrl.trim();
  if (!url) {
    return { type: 'unknown', embedUrl: null, normalizedUrl: '', isValid: false, isShorts: false };
  }

  // 1. If user pasted a full HTML <iframe> code, extract src
  const iframeSrcMatch = url.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    url = iframeSrcMatch[1].trim();
  }

  // Clean trailing punctuation, angle brackets, or quotes if user pasted from chat/email
  url = url.replace(/^[<"']+|[>"']+$/g, '').trim();

  // Decode any HTML entities like &amp; to &
  url = url.replace(/&amp;/g, '&');

  // 2. YouTube Parsing: Support all formats
  // - https://www.youtube.com/shorts/ID
  // - https://youtube.com/shorts/ID?feature=share
  // - https://www.youtube.com/watch?v=ID
  // - https://www.youtube.com/watch?feature=share&v=ID
  // - https://youtu.be/ID
  // - https://www.youtube.com/embed/ID
  // - https://www.youtube.com/live/ID
  // - https://m.youtube.com/watch?v=ID
  let ytId: string | null = null;
  let isShorts = false;

  // Check specifically for YouTube Shorts first: /shorts/ID
  const shortsMatch = url.match(/(?:shorts)\/([a-zA-Z0-9_-]+)/i);
  if (shortsMatch && shortsMatch[1]) {
    ytId = shortsMatch[1].slice(0, 11);
    isShorts = true;
  }

  // Pattern A: v= query parameter anywhere in query string
  if (!ytId) {
    const vParamMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
    if (vParamMatch && vParamMatch[1]) {
      ytId = vParamMatch[1];
    }
  }

  // Pattern B: youtu.be shortlinks
  if (!ytId) {
    const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (youtuBeMatch && youtuBeMatch[1]) {
      ytId = youtuBeMatch[1];
    }
  }

  // Pattern C: /embed/ID, /v/ID, /live/ID
  if (!ytId) {
    const pathActionMatch = url.match(/(?:embed|v|live)\/([a-zA-Z0-9_-]{11})/i);
    if (pathActionMatch && pathActionMatch[1]) {
      ytId = pathActionMatch[1];
    }
  }

  // Pattern D: generic youtube URL containing an 11-char ID
  if (!ytId && (url.includes('youtube.com') || url.includes('youtu.be'))) {
    const generalMatch = url.match(/([a-zA-Z0-9_-]{11})/);
    if (generalMatch && generalMatch[1]) {
      ytId = generalMatch[1];
    }
  }

  if (ytId) {
    return {
      type: 'youtube',
      videoId: ytId,
      embedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`,
      normalizedUrl: isShorts ? `https://www.youtube.com/shorts/${ytId}` : `https://www.youtube.com/watch?v=${ytId}`,
      isValid: true,
      isShorts,
    };
  }

  // 3. Vimeo Parsing
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const vId = vimeoMatch[1];
    return {
      type: 'vimeo',
      videoId: vId,
      embedUrl: `https://player.vimeo.com/video/${vId}?autoplay=1`,
      normalizedUrl: `https://vimeo.com/${vId}`,
      isValid: true,
    };
  }

  // 4. Direct video files (.mp4, .webm, .ogg, .mov, or absolute path starting with /)
  if (
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) ||
    url.startsWith('/Opusvideo') ||
    url.startsWith('/AiDigital') ||
    url.startsWith('/')
  ) {
    return {
      type: 'direct',
      embedUrl: url,
      normalizedUrl: url,
      isValid: true,
    };
  }

  // 5. Any generic URL (http/https)
  if (/^https?:\/\//i.test(url)) {
    return {
      type: 'unknown',
      embedUrl: url,
      normalizedUrl: url,
      isValid: true,
    };
  }

  return {
    type: 'unknown',
    embedUrl: null,
    normalizedUrl: url,
    isValid: false,
  };
}
