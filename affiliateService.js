class AffiliateService {
  constructor() {
    this.amazonTag = process.env.AMAZON_ASSOCIATE_TAG || null;
    this.ebayCampaignId = process.env.EBAY_CAMPAIGN_ID || null;
    this.aliExpressId = process.env.ALIEXPRESS_ID || null;
    this.walmartId = process.env.WALMART_ID || null;
    this.bestBuyId = process.env.BESTBUY_ID || null;
  }

  addAffiliateLink(product) {
    if (!product || !product.product_url) return product;
    if (!product.product_url.startsWith('http')) return product;

    try {
      var url = new URL(product.product_url);
    } catch (e) {
      return product;
    }

    var domain = url.hostname.toLowerCase();

    // Amazon
    if (domain.includes('amazon') || domain.includes('amzn')) {
      if (this.amazonTag) {
        url.searchParams.set('tag', this.amazonTag);
        product.product_url = url.toString();
        product.affiliate_applied = true;
        product.affiliate_network = 'Amazon Associates';
      }
    }
    // eBay
    else if (domain.includes('ebay')) {
      if (this.ebayCampaignId) {
        url.searchParams.set('campid', this.ebayCampaignId);
        url.searchParams.set('toolid', '10001');
        product.product_url = url.toString();
        product.affiliate_applied = true;
        product.affiliate_network = 'eBay Partner Network';
      }
    }
    // AliExpress
    else if (domain.includes('aliexpress')) {
      if (this.aliExpressId) {
        url.searchParams.set('aff_fcid', this.aliExpressId);
        product.product_url = url.toString();
        product.affiliate_applied = true;
        product.affiliate_network = 'AliExpress Portals';
      }
    }
    // Walmart
    else if (domain.includes('walmart')) {
      if (this.walmartId) {
        url.searchParams.set('affilsrc', this.walmartId);
        product.product_url = url.toString();
        product.affiliate_applied = true;
        product.affiliate_network = 'Walmart Affiliate';
      }
    }
    // Best Buy
    else if (domain.includes('bestbuy')) {
      if (this.bestBuyId) {
        url.searchParams.set('ref', this.bestBuyId);
        product.product_url = url.toString();
        product.affiliate_applied = true;
        product.affiliate_network = 'Best Buy Affiliate';
      }
    }

    return product;
  }
}

module.exports = new AffiliateService();
