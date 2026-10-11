const AFFILIATE_PROGRAMS = {
  // Amazon domains (direct links)
  'amazon.com': { tag: '?tag=priceeengine08-20' },
  'amazon.co.uk': { tag: '?tag=priceeengine08-20' },
  'amazon.ca': { tag: '?tag=priceeengine08-20' },
  'amazon.de': { tag: '?tag=priceeengine08-20' },

  // eBay domains
  'ebay.com': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },
  'ebay.co.uk': { tag: '?campid=5339220900&mkevt=1&toolid=80005&mkcid=1' },

  // Walmart domains
  'walmart.com': { tag: '?affp1=priceengine' },

  // Target domains
  'target.com': { tag: '?afid=priceengine' },

  // Best Buy domains
  'bestbuy.com': { tag: '?ref=priceengine' },

  // AliExpress
  'aliexpress.com': { tag: '?aff_fcid=' }
};

// Map merchant names from SerpAPI "source" field to affiliate programs
// This is the PRIMARY matching method since SerpAPI returns Google Shopping redirect URLs
const MERCHANT_MAP = {
  // Amazon
  'amazon': 'amazon.com',
  'amazon.com': 'amazon.com',

  // eBay
  'ebay': 'ebay.com',
  'ebay.com': 'ebay.com',

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
