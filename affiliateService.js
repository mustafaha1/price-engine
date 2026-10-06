const AFFILIATE_PROGRAMS = {
  'amazon.com': { tag: '?tag=priceeengine08-20' },
  'amazon.co.uk': { tag: '?tag=priceeengine08-20' },
  'amazon.ca': { tag: '?tag=priceeengine08-20' },
  'amazon.de': { tag: '?tag=priceeengine08-20' },
  'ebay.com': { tag: '?campid=5338728001' },
  'walmart.com': { tag: '?affp1=priceengine' },
  'target.com': { tag: '?afid=priceengine' },
  'bestbuy.com': { tag: '?ref=priceengine' },
  'aliexpress.com': { tag: '?aff_fcid=' }
};

const MERCHANT_MAP = {
  'amazon': 'amazon.com',
  'ebay': 'ebay.com',
  'walmart': 'walmart.com',
  'best buy': 'bestbuy.com',
  'bestbuy': 'bestbuy.com',
  'target': 'target.com',
  'staples': 'staples.com',
  'newegg': 'newegg.com',
  'newegg.com': 'newegg.com',
  'aliexpress': 'aliexpress.com',
  'hp': 'hp.com',
  'lenovo': 'lenovo.com',
  'microsoft': 'microsoft.com',
  'microsoft store': 'microsoft.com',
  'apple': 'apple.com',
  'office depot': 'officedepot.com',
  'razer': 'razer.com'
};

function normalizeMerchantName(source) {
  if (!source) return '';
  return source.split(' - ')[0].trim().toLowerCase();
}

function addAffiliateLink(product) {
  if (!product || !product.product_url) return product;

  let affiliate = null;

  // Match by merchant name (source field) — PRIMARY method
  if (product.source) {
    const normalized = normalizeMerchantName(product.source);
    const domain = MERCHANT_MAP[normalized];
    if (domain) affiliate = AFFILIATE_PROGRAMS[domain];
  }

  // Fallback: match by URL domain
  if (!affiliate) {
    try {
      const url = new URL(product.product_url);
      const domain = url.hostname.replace(/^www\./, '');
      affiliate = AFFILIATE_PROGRAMS[domain];
    } catch (e) {}
  }

  if (affiliate) {
    product.original_url = product.product_url;
    const url = product.product_url;
    const separator = url.includes('?') ? '&' : '?';
    product.product_url = url + separator + affiliate.tag.substring(1);
  }

  return product;
}

module.exports = { addAffiliateLink };
