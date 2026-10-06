const AFFILIATE_PROGRAMS = {
  'amazon.com': { tag: '?tag=priceengine-20' },
  'amazon.co.uk': { tag: '?tag=priceengine-21' },
  'amazon.ca': { tag: '?tag=priceengine0d-20' },
  'amazon.de': { tag: '?tag=priceengine08-21' },
  'ebay.com': { tag: '?campid=5338728001' },
  'walmart.com': { tag: '?affp1=priceengine' },
  'target.com': { tag: '?afid=priceengine' },
  'bestbuy.com': { tag: '?ref=priceengine' },
  'aliexpress.com': { tag: '?aff_fcid=' }
};

function addAffiliateLink(product) {
  if (!product || !product.product_url) return product;

  try {
    var url = new URL(product.product_url);
    var domain = url.hostname.replace(/^www\./, '');
    var affiliate = AFFILIATE_PROGRAMS[domain];

    if (affiliate && !url.searchParams.has('tag') && !url.searchParams.has('campid')) {
      product.original_url = product.product_url;
      if (affiliate.tag.startsWith('?')) {
        product.product_url = product.product_url + (product.product_url.includes('?') ? '&' : '?') + affiliate.tag.substring(1);
      } else {
        product.product_url = product.product_url + affiliate.tag;
      }
    }
  } catch (e) {
    // Invalid URL, skip affiliate injection
  }

  return product;
}

module.exports = { addAffiliateLink };
