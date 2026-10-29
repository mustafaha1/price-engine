const AFFILIATE_PROGRAMS = {
  // Amazon domains — COUNTRY-SPECIFIC tracking IDs
  // US tag for Americas/Asia/default | UK tag for UK | EU tag for EU
  'amazon.com': { tag: '?tag=priceeengine08-20' },       // US
  'amazon.co.uk': { tag: '?tag=priceengine21-21' },       // UK
  'amazon.ca': { tag: '?tag=priceeengine08-20' },         // US (same programme)
  'amazon.de': { tag: '?tag=priceengine0d-21' },          // EU (Germany)
  'amazon.fr': { tag: '?tag=priceengine0d-21' },          // EU (France)
  'amazon.it': { tag: '?tag=priceengine0d-21' },          // EU (Italy)
  'amazon.es': { tag: '?tag=priceengine0d-21' },          // EU (Spain)
  'amazon.co.jp': { tag: '?tag=priceeengine08-20' },      // US default
  'amazon.in': { tag: '?tag=priceeengine08-20' },         // US default
  'amazon.com.au': { tag: '?tag=priceeengine08-20' },     // US default
  'amazon.com.br': { tag: '?tag=priceeengine08-20' },     // US default
  'amazon.nl': { tag: '?tag=priceengine0d-21' },          // EU (Netherlands)
  'amazon.se': { tag: '?tag=priceengine0d-21' },          // EU (Sweden)
  'amazon.pl': { tag: '?tag=priceengine0d-21' },          // EU (Poland)
  'amazon.sg': { tag: '?tag=priceeengine08-20' },         // US default
  'amazon.ae': { tag: '?tag=priceeengine08-20' },         // US default
  'amazon.sa': { tag: '?tag=priceeengine08-20' },         // US default
  'amazon.com.tr': { tag: '?tag=priceeengine08-20' },     // US default
  'amazon.com.mx': { tag: '?tag=priceeengine08-20' },     // US (same programme)

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
  'ebay.com.br': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.in': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.co.jp': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },

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
  'shein.co.uk': { tag: '?awc=3122659' },
  'shein.us': { tag: '?awc=3122659' },
  'shein.de': { tag: '?awc=3122659' },
  'shein.fr': { tag: '?awc=3122659' },
  'shein.it': { tag: '?awc=3122659' },
  'shein.es': { tag: '?awc=3122659' },
  'shein.nl': { tag: '?awc=3122659' },
  'shein.pl': { tag: '?awc=3122659' },
  'shein.se': { tag: '?awc=3122659' },
  'shein.com.au': { tag: '?awc=3122659' },
  'shein.co.jp': { tag: '?awc=3122659' },
  'shein.com.mx': { tag: '?awc=3122659' },
  'shein.com.br': { tag: '?awc=3122659' },
  'shein.com.tr': { tag: '?awc=3122659' },
  'shein.ae': { tag: '?awc=3122659' },
  'shein.sa': { tag: '?awc=3122659' },
  'shein.com.sg': { tag: '?awc=3122659' },
  'shein.com.my': { tag: '?awc=3122659' },
  'shein.co.id': { tag: '?awc=3122659' },
  'shein.co.th': { tag: '?awc=3122659' },
  'shein.com.ph': { tag: '?awc=3122659' },
  'shein.vn': { tag: '?awc=3122659' },
  'shein.kr': { tag: '?awc=3122659' },
  'shein.tw': { tag: '?awc=3122659' },
  'shein.hk': { tag: '?awc=3122659' },
  'shein.in': { tag: '?awc=3122659' }
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
  'ebay.com.br': 'ebay.com.br',
  'ebay.in': 'ebay.in',
  'ebay.co.jp': 'ebay.co.jp',

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
  let matchedBySource = false;

  if (product.source) {
    affiliate = getAffiliateBySource(product.source);
    if (affiliate) matchedBySource = true;
  }

  // Fallback: try matching by URL domain (for direct merchant links)
  if (!affiliate) {
    affiliate = getAffiliateByUrl(product.product_url);
  }

  if (affiliate) {
    product.original_url = product.product_url;
    const url = product.product_url;

    // If we matched by source name, verify the URL actually belongs to that merchant.
    // SerpAPI sometimes returns Google Shopping redirect URLs with merchant source names.
    // Don't add eBay campid to Google Shopping URLs!
    if (matchedBySource) {
      const urlAffiliate = getAffiliateByUrl(url);
      if (!urlAffiliate || urlAffiliate.name !== affiliate.name) {
        return product; // URL doesn't match the claimed merchant — skip
      }
    }

    // eBay search pages (/sch/) BREAK when campid is added — skip them
    const isEbaySearchPage = url.includes('ebay.') && url.includes('/sch/');
    if (isEbaySearchPage) {
      return product; // Skip adding affiliate tag to eBay search pages
    }

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
