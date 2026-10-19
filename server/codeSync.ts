import fs from 'fs';
import path from 'path';
import type { DatabaseSchema, DBProduct, DBCategory, DBSiteSettings, DBRealBride } from './db.ts';

export interface EditableImageItem {
  id: string;
  name: string;
  section: 'Products' | 'Categories' | 'Hero & Banners' | 'Bespoke Embroidery' | 'Real Brides' | 'Journal' | 'Brand Identity';
  type: 'product' | 'category' | 'setting' | 'real-bride' | 'journal' | 'canonical';
  targetId: string;
  imageIndex?: number;
  currentUrl: string;
  secondaryUrl?: string;
  codeFile: string;
  description: string;
  recommendedAspect?: string;
}

const PRODUCTS_TS_PATH = path.join(process.cwd(), 'src', 'data', 'products.ts');
const CATEGORIES_TS_PATH = path.join(process.cwd(), 'src', 'data', 'categories.ts');
const SETTINGS_TS_PATH = path.join(process.cwd(), 'src', 'data', 'siteSettings.ts');
const IMAGE_DEFAULTS_TS_PATH = path.join(process.cwd(), 'src', 'constants', 'imageDefaults.ts');
const REAL_BRIDES_TS_PATH = path.join(process.cwd(), 'src', 'data', 'realBrides.ts');
const JOURNAL_TS_PATH = path.join(process.cwd(), 'src', 'data', 'journal.ts');
const DB_JSON_PATH = path.join(process.cwd(), 'data', 'db.json');

/**
 * Synchronize products directly into src/data/products.ts
 */
export function syncProductsCode(products: DBProduct[]): boolean {
  try {
    if (!Array.isArray(products) || products.length === 0) return false;

    const fileContent = `import { Product } from '../types';

export const PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};
`;

    fs.writeFileSync(PRODUCTS_TS_PATH, fileContent, 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to sync products to code file (src/data/products.ts):', err);
    return false;
  }
}

/**
 * Synchronize categories directly into src/data/categories.ts
 */
export function syncCategoriesCode(categories: DBCategory[]): boolean {
  try {
    if (!Array.isArray(categories) || categories.length === 0) return false;

    const fileContent = `import { CategoryMeta } from '../types';

export const CATEGORIES: CategoryMeta[] = ${JSON.stringify(categories, null, 2)};
`;

    fs.writeFileSync(CATEGORIES_TS_PATH, fileContent, 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to sync categories to code file (src/data/categories.ts):', err);
    return false;
  }
}

/**
 * Synchronize site settings directly into src/data/siteSettings.ts
 */
export function syncSiteSettingsCode(settings: DBSiteSettings): boolean {
  try {
    if (!settings || typeof settings !== 'object') return false;

    const fileContent = `import { SiteSettings } from '../types';

export const DEFAULT_SITE_SETTINGS: SiteSettings = ${JSON.stringify(settings, null, 2)};
`;

    fs.writeFileSync(SETTINGS_TS_PATH, fileContent, 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to sync site settings to code file (src/data/siteSettings.ts):', err);
    return false;
  }
}

/**
 * Synchronize canonical defaults and category/setting hero images into src/constants/imageDefaults.ts
 */
export function syncImageDefaultsCode(
  settings?: DBSiteSettings,
  categories?: DBCategory[],
  overrides?: Record<string, string>
): boolean {
  try {
    if (!fs.existsSync(IMAGE_DEFAULTS_TS_PATH)) return false;

    let content = fs.readFileSync(IMAGE_DEFAULTS_TS_PATH, 'utf8');

    // Build replacement map with canonical overrides
    const storedOverrides = (settings as any)?.canonicalOverrides || {};
    const replacements: Record<string, string> = {
      ...storedOverrides,
      ...(overrides || {}),
    };

    if (settings?.homeHeroImage) {
      replacements.HERO_MAIN = settings.homeHeroImage;
      replacements.CATEGORY_BRIDAL = settings.homeHeroImage;
    }
    if (settings?.laidePortraitImage) {
      replacements.FOUNDER_PORTRAIT = settings.laidePortraitImage;
      replacements.ADMIN_AVATAR = settings.laidePortraitImage;
    }
    if (settings?.brandLogoImage) {
      replacements.LOGO_EMBLEM = settings.brandLogoImage;
    }

    if (Array.isArray(categories)) {
      for (const cat of categories) {
        if (!cat.heroImage) continue;
        const norm = cat.id.toLowerCase();
        if (norm === 'bridal' || norm === 'bridal-robes') replacements.CATEGORY_BRIDAL = cat.heroImage;
        else if (norm === 'bridesmaids') replacements.CATEGORY_BRIDESMAIDS = cat.heroImage;
        else if (norm === 'sets' || norm === 'party') {
          replacements.CATEGORY_SETS = cat.heroImage;
          replacements.CATEGORY_PARTY = cat.heroImage;
        }
        else if (norm === 'adire') replacements.CATEGORY_ADIRE = cat.heroImage;
        else if (norm === 'pyjamas' || norm === 'sleepwear') replacements.CATEGORY_SLEEPWEAR = cat.heroImage;
        else if (norm === 'accessories') replacements.CATEGORY_ACCESSORIES = cat.heroImage;
        else if (norm === 'personalised' || norm === 'custom') replacements.CATEGORY_CUSTOM = cat.heroImage;
        else if (norm === 'boudoir') replacements.CATEGORY_BOUDOIR = cat.heroImage;
      }
    }

    // Apply regex replacements for key properties in CANONICAL_DEFAULTS
    for (const [key, val] of Object.entries(replacements)) {
      if (!val || typeof val !== 'string') continue;
      const cleanVal = val.trim();
      const reg = new RegExp(`(${key}:\\s*['"])([^'"]*)(['"])`, 'g');
      content = content.replace(reg, `$1${cleanVal}$3`);
    }

    fs.writeFileSync(IMAGE_DEFAULTS_TS_PATH, content, 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to sync image defaults to code file (src/constants/imageDefaults.ts):', err);
    return false;
  }
}

/**
 * Synchronize real brides stories directly into src/data/realBrides.ts
 */
export function syncRealBridesCode(realBrides?: DBRealBride[]): boolean {
  try {
    if (!Array.isArray(realBrides) || realBrides.length === 0) return false;

    const fileContent = `import { RealBrideStory } from '../types';

export const REAL_BRIDES: RealBrideStory[] = ${JSON.stringify(realBrides, null, 2)};
`;

    fs.writeFileSync(REAL_BRIDES_TS_PATH, fileContent, 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to sync real brides to code file (src/data/realBrides.ts):', err);
    return false;
  }
}

/**
 * Synchronize journal article image directly into src/data/journal.ts
 */
export function syncJournalCode(articleId: string, newUrl: string): boolean {
  try {
    if (!fs.existsSync(JOURNAL_TS_PATH)) return false;
    let content = fs.readFileSync(JOURNAL_TS_PATH, 'utf8');

    // Target the specific article by id and update its image field
    const articleRegex = new RegExp(`(id:\\s*['"]${articleId}['"][\\s\\S]*?image:\\s*['"])([^'"]*)(['"])`);
    if (articleRegex.test(content)) {
      content = content.replace(articleRegex, `$1${newUrl}$3`);
      fs.writeFileSync(JOURNAL_TS_PATH, content, 'utf8');
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to sync journal image to code file (src/data/journal.ts):', err);
    return false;
  }
}

/**
 * Master sync function that writes to data/db.json AND all corresponding TypeScript code files
 */
export function syncAllCode(db: DatabaseSchema): { success: boolean; filesUpdated: string[]; timestamp: number } {
  const filesUpdated: string[] = [];

  // 1. data/db.json
  try {
    const dir = path.dirname(DB_JSON_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_JSON_PATH, JSON.stringify(db, null, 2), 'utf8');
    filesUpdated.push('data/db.json');
  } catch (err) {
    console.error('Error writing data/db.json:', err);
  }

  // 2. src/data/products.ts
  if (db.products && Array.isArray(db.products) && db.products.length > 0) {
    if (syncProductsCode(db.products)) {
      filesUpdated.push('src/data/products.ts');
    }
  }

  // 3. src/constants/imageDefaults.ts
  if (syncImageDefaultsCode(db.settings, db.categories)) {
    filesUpdated.push('src/constants/imageDefaults.ts');
  }

  // 4. src/data/categories.ts
  if (db.categories && Array.isArray(db.categories) && db.categories.length > 0) {
    if (syncCategoriesCode(db.categories)) {
      filesUpdated.push('src/data/categories.ts');
    }
  }

  // 5. src/data/siteSettings.ts
  if (db.settings && typeof db.settings === 'object') {
    if (syncSiteSettingsCode(db.settings)) {
      filesUpdated.push('src/data/siteSettings.ts');
    }
  }

  // 6. src/data/realBrides.ts
  if (db.realBrides && Array.isArray(db.realBrides) && db.realBrides.length > 0) {
    if (syncRealBridesCode(db.realBrides)) {
      filesUpdated.push('src/data/realBrides.ts');
    }
  }

  return {
    success: filesUpdated.length > 0,
    filesUpdated,
    timestamp: Date.now(),
  };
}

/**
 * Helper to parse canonical defaults from src/constants/imageDefaults.ts
 */
function getCanonicalDefaultsMap(): Record<string, string> {
  const defaults: Record<string, string> = {};
  try {
    if (fs.existsSync(IMAGE_DEFAULTS_TS_PATH)) {
      const content = fs.readFileSync(IMAGE_DEFAULTS_TS_PATH, 'utf8');
      const matches = content.matchAll(/([A-Z_]+):\s*['"]([^'"]+)['"]/g);
      for (const m of matches) {
        defaults[m[1]] = m[2];
      }
    }
  } catch {}
  return defaults;
}

/**
 * Return an exhaustive, organized inventory of all images across the website
 */
export function getAllEditableImages(db: DatabaseSchema): EditableImageItem[] {
  const items: EditableImageItem[] = [];
  const canonical = getCanonicalDefaultsMap();

  // 1. Hero & Banners Section
  items.push({
    id: 'setting-home-hero',
    name: 'Storefront Hero Main Image',
    section: 'Hero & Banners',
    type: 'setting',
    targetId: 'homeHeroImage',
    currentUrl: db.settings?.homeHeroImage || canonical.HERO_MAIN || '/uploads/bridal_couch_hero_1788951504284.jpg',
    codeFile: 'src/constants/imageDefaults.ts & data/db.json',
    description: 'Primary visual in the Shop Hero header section (bride in satin robe on cream sofa).',
    recommendedAspect: '2:3 or 3:4 portrait',
  });

  items.push({
    id: 'canonical-hero-bg',
    name: 'Storefront Hero Background Fabric',
    section: 'Hero & Banners',
    type: 'canonical',
    targetId: 'HERO_BACKGROUND',
    currentUrl: canonical.HERO_BACKGROUND || '/uploads/hero_bridal_bg_1788959544066.jpg',
    codeFile: 'src/constants/imageDefaults.ts',
    description: 'Textured ivory and gold drape backdrop behind the hero headline.',
    recommendedAspect: '16:9 widescreen landscape',
  });

  items.push({
    id: 'canonical-hero-portrait',
    name: 'Storefront Hero Bride Cutout Portrait',
    section: 'Hero & Banners',
    type: 'canonical',
    targetId: 'HERO_PORTRAIT',
    currentUrl: canonical.HERO_PORTRAIT || '/uploads/bridal_hero_cutout_1788871988678.jpg',
    codeFile: 'src/constants/imageDefaults.ts',
    description: 'Couture bride silhouette overlay cutout featured in hero editorial composition.',
    recommendedAspect: '3:4 or 4:5 portrait',
  });

  // 2. Brand Identity
  items.push({
    id: 'setting-brand-logo',
    name: 'Brand Emblem & Crest (Favicon & Touch Icon)',
    section: 'Brand Identity',
    type: 'setting',
    targetId: 'brandLogoImage',
    currentUrl: db.settings?.brandLogoImage || canonical.LOGO_EMBLEM || '/uploads/lariel_brand_logo_1788970256407.jpg',
    codeFile: 'src/constants/imageDefaults.ts & data/db.json',
    description: 'Emblem used in header navigation, favicon, touch icon, and luxury packaging stamps.',
    recommendedAspect: '1:1 square',
  });

  items.push({
    id: 'canonical-logo-wordmark',
    name: 'Brand Wordmark Luxury Header',
    section: 'Brand Identity',
    type: 'canonical',
    targetId: 'LOGO_WORDMARK',
    currentUrl: canonical.LOGO_WORDMARK || '/uploads/lariel_wordmark_logo_1788970271070.jpg',
    codeFile: 'src/constants/imageDefaults.ts',
    description: 'Full typographic wordmark displayed in header and luxury certification cards.',
    recommendedAspect: '4:1 wide banner',
  });

  items.push({
    id: 'setting-founder-portrait',
    name: 'Founder Portrait (Laide Adeleke)',
    section: 'Brand Identity',
    type: 'setting',
    targetId: 'laidePortraitImage',
    currentUrl: db.settings?.laidePortraitImage || canonical.FOUNDER_PORTRAIT || '/uploads/laide_founder_portrait_1789650582034.jpg',
    codeFile: 'src/constants/imageDefaults.ts & data/db.json',
    description: 'Featured in Founder Story Section on Home and The Lariel World view.',
    recommendedAspect: '4:5 portrait',
  });

  // 3. Bespoke Embroidery & Monogramming
  items.push({
    id: 'feature-monogram-detail',
    name: 'Bespoke Embroidery Couture Close-up',
    section: 'Bespoke Embroidery',
    type: 'canonical',
    targetId: 'MONOGRAM_DETAIL',
    currentUrl: canonical.MONOGRAM_DETAIL || '/uploads/regenerated_image_1791793258450.jpg',
    codeFile: 'src/components/PersonalisedRobesFeature.tsx & imageDefaults.ts',
    description: 'Gold-embroidered heirloom monogram close-up photography in Section 08.',
    recommendedAspect: '4:5 portrait',
  });

  items.push({
    id: 'canonical-bespoke-swatch',
    name: 'Bespoke Couture Silk Swatch',
    section: 'Bespoke Embroidery',
    type: 'canonical',
    targetId: 'BESPOKE_SWATCH',
    currentUrl: canonical.BESPOKE_SWATCH || '/uploads/regenerated_image_1788962692419.jpg',
    codeFile: 'src/constants/imageDefaults.ts',
    description: 'Lustrous Mulberry silk texture swatch in Custom Design and Monogram suite.',
    recommendedAspect: '1:1 square',
  });

  items.push({
    id: 'canonical-fallback',
    name: 'Universal Global Fallback Image',
    section: 'Bespoke Embroidery',
    type: 'canonical',
    targetId: 'FALLBACK',
    currentUrl: canonical.FALLBACK || '/uploads/bridal_couch_hero_1788951504284.jpg',
    codeFile: 'src/constants/imageDefaults.ts',
    description: 'Safety fallback photograph if any remote CDN image ever fails to load.',
    recommendedAspect: '3:4 portrait',
  });

  // 4. Categories (All 9 Collections)
  if (Array.isArray(db.categories)) {
    for (const cat of db.categories) {
      items.push({
        id: `category-${cat.id}`,
        name: `${cat.name} Hero Banner`,
        section: 'Categories',
        type: 'category',
        targetId: cat.id,
        currentUrl: cat.heroImage || canonical[`CATEGORY_${cat.id.toUpperCase()}`] || '/uploads/bridal_couch_hero_1788951504284.jpg',
        codeFile: 'src/constants/imageDefaults.ts & data/db.json',
        description: `Header hero photograph shown at the top of the ${cat.name} collection page.`,
        recommendedAspect: '16:9 or 21:9 banner',
      });
    }
  }

  // 5. Products (All products, Primary & Secondary images)
  if (Array.isArray(db.products)) {
    for (const p of db.products) {
      const primary = p.images?.[0] || '/uploads/bridal_couch_hero_1788951504284.jpg';
      const secondary = p.images?.[1] || primary;

      items.push({
        id: `product-${p.id}-primary`,
        name: `${p.name} (Primary Photo)`,
        section: 'Products',
        type: 'product',
        targetId: p.id,
        imageIndex: 0,
        currentUrl: primary,
        secondaryUrl: secondary,
        codeFile: 'src/data/products.ts & data/db.json',
        description: `Default card and detail image for ${p.name} (${p.category} collection).`,
        recommendedAspect: '3:4 editorial portrait',
      });

      if (p.images && p.images.length > 1) {
        items.push({
          id: `product-${p.id}-secondary`,
          name: `${p.name} (Hover / Secondary Photo)`,
          section: 'Products',
          type: 'product',
          targetId: p.id,
          imageIndex: 1,
          currentUrl: secondary,
          codeFile: 'src/data/products.ts & data/db.json',
          description: `Second photo shown when hovering over ${p.name} card in catalog.`,
          recommendedAspect: '3:4 editorial portrait',
        });
      }

      // Any additional gallery images (index 2+)
      if (p.images && p.images.length > 2) {
        for (let i = 2; i < p.images.length; i++) {
          items.push({
            id: `product-${p.id}-gallery-${i}`,
            name: `${p.name} (Gallery Photo #${i + 1})`,
            section: 'Products',
            type: 'product',
            targetId: p.id,
            imageIndex: i,
            currentUrl: p.images[i],
            codeFile: 'src/data/products.ts & data/db.json',
            description: `Additional gallery detail photograph #${i + 1} for ${p.name}.`,
            recommendedAspect: '3:4 editorial portrait',
          });
        }
      }
    }
  }

  // 6. Real Brides Lookbook (All 6 stories)
  if (Array.isArray(db.realBrides)) {
    for (const b of db.realBrides) {
      items.push({
        id: `bride-${b.id}`,
        name: `Real Bride: ${b.brideName}`,
        section: 'Real Brides',
        type: 'real-bride',
        targetId: b.id,
        currentUrl: b.image || '/uploads/regenerated_image_1788954098680.jpg',
        codeFile: 'src/data/realBrides.ts & data/db.json',
        description: `${b.robeWorn} in ${b.location} (${b.category}).`,
        recommendedAspect: '4:5 or 3:4 portrait',
      });
    }
  }

  // 7. Editorial Journal Articles (6 stories)
  try {
    if (fs.existsSync(JOURNAL_TS_PATH)) {
      const journalContent = fs.readFileSync(JOURNAL_TS_PATH, 'utf8');
      const articleMatches = [...journalContent.matchAll(/id:\s*['"]([^'"]+)['"][\s\S]*?title:\s*['"]([^'"]+)['"][\s\S]*?image:\s*['"]([^'"]+)['"]/g)];
      for (const m of articleMatches) {
        const aId = m[1];
        const aTitle = m[2];
        const aImg = m[3];
        items.push({
          id: `journal-${aId}`,
          name: `Journal: ${aTitle}`,
          section: 'Journal',
          type: 'journal',
          targetId: aId,
          currentUrl: aImg,
          codeFile: 'src/data/journal.ts',
          description: `Editorial article cover photography for "${aTitle}".`,
          recommendedAspect: '16:9 or 4:3 banner',
        });
      }
    }
  } catch {}

  return items;
}

/**
 * Edit ANY image on the website and save it directly to the corresponding code files
 */
export async function updateImageDirectlyInCode(
  db: DatabaseSchema,
  params: {
    type: 'product' | 'category' | 'setting' | 'real-bride' | 'journal' | 'canonical';
    targetId: string;
    imageIndex?: number;
    newUrl: string;
  }
): Promise<{ success: boolean; item: any; filesUpdated: string[]; timestamp: number }> {
  const { type, targetId, imageIndex = 0, newUrl } = params;
  if (!newUrl || typeof newUrl !== 'string') {
    throw new Error('Valid new image URL is required.');
  }

  const cleanUrl = newUrl.trim();
  let updatedItem: any = null;

  if (type === 'product') {
    const prod = db.products.find((p) => p.id === targetId || p.slug === targetId);
    if (!prod) throw new Error(`Product not found with ID ${targetId}`);

    if (!Array.isArray(prod.images)) prod.images = [];
    if (imageIndex >= 0 && imageIndex < prod.images.length) {
      prod.images[imageIndex] = cleanUrl;
    } else {
      prod.images.push(cleanUrl);
    }
    prod.updatedAt = new Date().toISOString();
    updatedItem = prod;
  } else if (type === 'category') {
    const cat = db.categories.find((c) => c.id === targetId || c.slug === targetId);
    if (!cat) throw new Error(`Category not found with ID ${targetId}`);

    cat.heroImage = cleanUrl;
    updatedItem = cat;
  } else if (type === 'setting') {
    if (!db.settings) db.settings = {};
    (db.settings as any)[targetId] = cleanUrl;
    if (!(db.settings as any).canonicalOverrides) (db.settings as any).canonicalOverrides = {};
    if (targetId === 'homeHeroImage') (db.settings as any).canonicalOverrides.HERO_MAIN = cleanUrl;
    if (targetId === 'laidePortraitImage') {
      (db.settings as any).canonicalOverrides.FOUNDER_PORTRAIT = cleanUrl;
      (db.settings as any).canonicalOverrides.ADMIN_AVATAR = cleanUrl;
    }
    if (targetId === 'brandLogoImage') (db.settings as any).canonicalOverrides.LOGO_EMBLEM = cleanUrl;
    updatedItem = db.settings;
  } else if (type === 'real-bride') {
    if (!db.realBrides) db.realBrides = [];
    const bride = db.realBrides.find((b) => b.id === targetId);
    if (bride) {
      bride.image = cleanUrl;
      updatedItem = bride;
    } else {
      throw new Error(`Real bride story not found with ID ${targetId}`);
    }
  } else if (type === 'canonical') {
    if (!db.settings) db.settings = {};
    if (!(db.settings as any).canonicalOverrides) (db.settings as any).canonicalOverrides = {};
    (db.settings as any).canonicalOverrides[targetId] = cleanUrl;
    if (targetId === 'HERO_MAIN') db.settings.homeHeroImage = cleanUrl;
    if (targetId === 'FOUNDER_PORTRAIT' || targetId === 'ADMIN_AVATAR') db.settings.laidePortraitImage = cleanUrl;
    if (targetId === 'LOGO_EMBLEM') db.settings.brandLogoImage = cleanUrl;
    syncImageDefaultsCode(db.settings, db.categories, (db.settings as any).canonicalOverrides);
    updatedItem = { key: targetId, url: cleanUrl };
  } else if (type === 'journal') {
    syncJournalCode(targetId, cleanUrl);
    updatedItem = { id: targetId, image: cleanUrl };
  }

  // Master synchronization directly to disk code files!
  const syncResult = syncAllCode(db);
  if (type === 'journal' && !syncResult.filesUpdated.includes('src/data/journal.ts')) {
    syncResult.filesUpdated.push('src/data/journal.ts');
  }

  return {
    success: true,
    item: updatedItem,
    filesUpdated: syncResult.filesUpdated,
    timestamp: syncResult.timestamp,
  };
}
