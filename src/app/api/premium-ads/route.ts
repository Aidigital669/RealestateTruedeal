import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import {
  DEFAULT_PREMIUM_CONFIG,
  PremiumAdsConfig,
  PremiumAdItem
} from '@/lib/premium-ads-constants';

const SETTING_KEY = 'premium_clients_ads';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('admin') === 'true' || searchParams.get('all') === 'true';

    // Query GlobalSetting for the ads configuration
    const row = await queryOne<{ value: PremiumAdsConfig }>(
      `SELECT "value" FROM "GlobalSetting" WHERE "key" = $1 LIMIT 1;`,
      [SETTING_KEY]
    );

    let config: PremiumAdsConfig;

    if (row && row.value && Array.isArray(row.value.ads)) {
      config = row.value;
    } else {
      // First-time initialize with default config in database
      config = DEFAULT_PREMIUM_CONFIG;
      try {
        await query(
          `INSERT INTO "GlobalSetting" ("key", "value", "group", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT ("key") DO NOTHING;`,
          [SETTING_KEY, JSON.stringify(DEFAULT_PREMIUM_CONFIG), 'advertising']
        );
      } catch (insertErr) {
        console.warn('Could not auto-seed GlobalSetting:', insertErr);
      }
    }

    // Sort ads by sortOrder ascending
    const sortedAds = [...config.ads].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    if (!isAdmin) {
      // Public site: filter out inactive/hidden ads
      return NextResponse.json({
        success: true,
        config: {
          ...config,
          ads: sortedAds.filter((ad) => ad.isActive !== false)
        }
      });
    }

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        ads: sortedAds
      }
    });
  } catch (error: any) {
    console.error('GET /api/premium-ads error:', error);
    // Graceful fallback to default config so frontend never crashes
    return NextResponse.json({
      success: true,
      config: DEFAULT_PREMIUM_CONFIG,
      warning: 'Using offline default config'
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const incomingConfig = body.config || body;

    if (!incomingConfig || !Array.isArray(incomingConfig.ads)) {
      return NextResponse.json(
        { success: false, error: 'Invalid config payload: ads array is required' },
        { status: 400 }
      );
    }

    // Normalize and clean each ad item
    const cleanedAds: PremiumAdItem[] = incomingConfig.ads.map((ad: any, index: number) => ({
      id: String(ad.id || `ad-${Date.now()}-${index}`),
      name: String(ad.name || 'Premium Partner').trim(),
      category: String(ad.category || 'Featured Partner').trim(),
      tagline: String(ad.tagline || '').trim(),
      description: String(ad.description || '').trim(),
      badge: ad.badge ? String(ad.badge).trim() : undefined,
      image: String(ad.image || '/opus-thumb.jpg').trim(),
      videoUrl: ad.videoUrl ? String(ad.videoUrl).trim() : undefined,
      ctaText: String(ad.ctaText || 'Connect Now').trim(),
      ctaMessage: String(ad.ctaMessage || 'Hello, I would like more information.').trim(),
      linkUrl: ad.linkUrl ? String(ad.linkUrl).trim() : undefined,
      isActive: ad.isActive !== false,
      sortOrder: typeof ad.sortOrder === 'number' ? ad.sortOrder : index + 1
    }));

    const finalConfig: PremiumAdsConfig = {
      crownImage: incomingConfig.crownImage || DEFAULT_PREMIUM_CONFIG.crownImage,
      crownTitle: incomingConfig.crownTitle || DEFAULT_PREMIUM_CONFIG.crownTitle,
      promoteWhatsAppNumber:
        incomingConfig.promoteWhatsAppNumber || DEFAULT_PREMIUM_CONFIG.promoteWhatsAppNumber,
      promoteMessage:
        incomingConfig.promoteMessage || DEFAULT_PREMIUM_CONFIG.promoteMessage,
      ads: cleanedAds
    };

    // Upsert into GlobalSetting
    await query(
      `INSERT INTO "GlobalSetting" ("key", "value", "group", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT ("key") DO UPDATE
       SET "value" = EXCLUDED."value",
           "updatedAt" = NOW();`,
      [SETTING_KEY, JSON.stringify(finalConfig), 'advertising']
    );

    return NextResponse.json({
      success: true,
      message: 'Premium Clients & Ads strip updated successfully!',
      config: finalConfig
    });
  } catch (error: any) {
    console.error('PUT /api/premium-ads error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update premium ads' },
      { status: 500 }
    );
  }
}
