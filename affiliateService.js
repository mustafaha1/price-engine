const AFFILIATE_PROGRAMS = {
  // Amazon domains (direct links) — all share same affiliate tag
  'amazon.com': { tag: '?tag=priceeengine08-20' },
  'amazon.co.uk': { tag: '?tag=priceeengine08-20' },
  'amazon.ca': { tag: '?tag=priceeengine08-20' },
  'amazon.de': { tag: '?tag=priceeengine08-20' },
  'amazon.fr': { tag: '?tag=priceeengine08-20' },
  'amazon.it': { tag: '?tag=priceeengine08-20' },
  'amazon.es': { tag: '?tag=priceeengine08-20' },
  'amazon.co.jp': { tag: '?tag=priceeengine08-20' },
  'amazon.in': { tag: '?tag=priceeengine08-20' },
  'amazon.com.au': { tag: '?tag=priceeengine08-20' },
  'amazon.com.br': { tag: '?tag=priceeengine08-20' },
  'amazon.nl': { tag: '?tag=priceeengine08-20' },
  'amazon.se': { tag: '?tag=priceeengine08-20' },
  'amazon.pl': { tag: '?tag=priceeengine08-20' },
  'amazon.sg': { tag: '?tag=priceeengine08-20' },
  'amazon.ae': { tag: '?tag=priceeengine08-20' },
  'amazon.sa': { tag: '?tag=priceeengine08-20' },
  'amazon.com.tr': { tag: '?tag=priceeengine08-20' },
  'amazon.com.mx': { tag: '?tag=priceeengine08-20' },

  // eBay domains
  'ebay.com': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.co.uk': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.de': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.fr': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.it': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.es': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.com.au': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.ca': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.nl': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.at': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.be': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.ch': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.ie': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.pl': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },

  // Walmart domains
  'walmart.com': { tag: '?affp1=priceengine' },

  // Target domains
  'target.com': { tag: '?afid=priceengine' },

  // Best Buy domains
  'bestbuy.com': { tag: '?ref=priceengine' },

  // AliExpress
  'aliexpress.com': { tag: '?aff_fcid=priceengine' },

  // Shein (Awin) — Awin Publisher ID: 3122659
  // Format: ?awc=PUBLISHER_ID
  // Note: Full Awin deep links require program ID (awinmid) — update when Shein approves
  'shein.com': { tag: '?awc=3122659' },
  'shein.co.uk': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.us': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.de': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.fr': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.it': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.es': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.nl': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.pl': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.se': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.com.au': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.co.jp': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.com.mx': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.com.br': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.com.tr': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.ae': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.sa': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.com.sg': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.com.my': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.co.id': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.co.th': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.com.ph': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.vn': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.kr': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.tw': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.hk': { tag: '?awc=YOUR_AWIN_ID' },
  'shein.in': { tag: '?awc=YOUR_AWIN_ID' }
};

// Map merchant names from SerpAPI "source" field to affiliate programs
// This is the PRIMARY matching method since SerpAPI returns Google Shopping redirect URLs
const MERCHANT_MAP = {
  // Amazon — all regional domains
  'amazon': 'amazon.com',
  'amazon.com': 'amazon.com',
  'amazon.co.uk': 'amazon.co.uk',
  'amazon.ca': 'amazon.ca',
  'amazon.de': 'amazon.de',
  'amazon.fr': 'amazon.fr',
  'amazon.it': 'amazon.it',
  'amazon.es': 'amazon.es',
  'amazon.co.jp': 'amazon.co.jp',
  'amazon.in': 'amazon.in',
  'amazon.com.au': 'amazon.com.au',
  'amazon.com.br': 'amazon.com.br',
  'amazon.nl': 'amazon.nl',
  'amazon.se': 'amazon.se',
  'amazon.pl': 'amazon.pl',
  'amazon.sg': 'amazon.sg',
  'amazon.ae': 'amazon.ae',
  'amazon.sa': 'amazon.sa',
  'amazon.com.tr': 'amazon.com.tr',
  'amazon.com.mx': 'amazon.com.mx',

  // eBay — all regional domains
  'ebay': 'ebay.com',
  'ebay.com': 'ebay.com',
  'ebay.co.uk': 'ebay.co.uk',
  'ebay.de': 'ebay.de',
  'ebay.fr': 'ebay.fr',
  'ebay.it': 'ebay.it',
  'ebay.es': 'ebay.es',
  'ebay.com.au': 'ebay.com.au',
  'ebay.ca': 'ebay.ca',
  'ebay.nl': 'ebay.nl',
  'ebay.at': 'ebay.at',
  'ebay.be': 'ebay.be',
  'ebay.ch': 'ebay.ch',
  'ebay.ie': 'ebay.ie',
  'ebay.pl': 'ebay.pl',

  // Walmart
  'walmart': 'walmart.com',
  'walmart.com': 'walmart.com',

  // Best Buy
  'best buy': 'bestbuy.com',
  'bestbuy': 'bestbuy.com',
  'bestbuy.com': 'bestbuy.com',

  // Target
  'target': 'target.com',
  'target.com': 'target.com',

  // Staples
  'staples': 'staples.com',
  'staples.com': 'staples.com',

  // Newegg
  'newegg': 'newegg.com',
  'newegg.com': 'newegg.com',

  // AliExpress
  'aliexpress': 'aliexpress.com',
  'aliexpress.com': 'aliexpress.com',

  // Shein — all regional domains
  'shein': 'shein.com',
  'shein.com': 'shein.com',
  'shein.co.uk': 'shein.co.uk',
  'shein.us': 'shein.us',
  'shein.de': 'shein.de',
  'shein.fr': 'shein.fr',
  'shein.it': 'shein.it',
  'shein.es': 'shein.es',
  'shein.nl': 'shein.nl',
  'shein.pl': 'shein.pl',
  'shein.se': 'shein.se',
  'shein.com.au': 'shein.com.au',
  'shein.co.jp': 'shein.co.jp',
  'shein.com.mx': 'shein.com.mx',
  'shein.com.br': 'shein.com.br',
  'shein.com.tr': 'shein.com.tr',
  'shein.ae': 'shein.ae',
  'shein.sa': 'shein.sa',
  'shein.com.sg': 'shein.com.sg',
  'shein.com.my': 'shein.com.my',
  'shein.co.id': 'shein.co.id',
  'shein.co.th': 'shein.co.th',
  'shein.com.ph': 'shein.com.ph',
  'shein.vn': 'shein.vn',
  'shein.kr': 'shein.kr',
  'shein.tw': 'shein.tw',
  'shein.hk': 'shein.hk',
  'shein.in': 'shein.in',

  // HP
  'hp': 'hp.com',
  'hp.com': 'hp.com',

  // Lenovo
  'lenovo': 'lenovo.com',
  'lenovo.com': 'lenovo.com',

  // Microsoft
  'microsoft': 'microsoft.com',
  'microsoft store': 'microsoft.com',
  'microsoft.com': 'microsoft.com',

  // Apple
  'apple': 'apple.com',
  'apple.com': 'apple.com',

  // Office Depot
  'office depot': 'officedepot.com',
  'officedepot.com': 'officedepot.com',

  // Razer
  'razer': 'razer.com',
  'razer.com': 'razer.com',
};

function normalizeMerchantName(source) {
  if (!source) return '';
  // Remove suffixes like "Walmart - Cell Surfers" → "Walmart"
  // Remove domain suffixes like "Newegg.com - DemProductSales" → "Newegg.com"
  return source.split(' - ')[0].trim().toLowerCase();
}

function getAffiliateBySource(source) {
  const normalized = normalizeMerchantName(source);
  const domain = MERCHANT_MAP[normalized];
  return domain ? AFFILIATE_PROGRAMS[domain] : null;
}

function getAffiliateByUrl(urlString) {
  try {
    const url = new URL(urlString);
    const domain = url.hostname.replace(/^www\./, '');
    return AFFILIATE_PROGRAMS[domain] || null;
  } catch (e) {
    return null;
  }
}

function addAffiliateLink(product) {
  if (!product || !product.product_url) return product;

  // Try matching by merchant name (source field) first — this is the primary method
  // because SerpAPI returns Google Shopping redirect URLs, not direct merchant URLs
  let affiliate = null;

  if (product.source) {
    affiliate = getAffiliateBySource(product.source);
  }

  // Fallback: try matching by URL domain (for direct merchant links)
  if (!affiliate) {
    affiliate = getAffiliateByUrl(product.product_url);
  }

  if (affiliate) {
    product.original_url = product.product_url;
    const url = product.product_url;

    if (affiliate.tag.startsWith('?')) {
      const separator = url.includes('?') ? '&' : '?';
      product.product_url = url + separator + affiliate.tag.substring(1);
    } else {
      product.product_url = url + affiliate.tag;
    }
  }

  return product;
}

module.exports = { addAffiliateLink };
