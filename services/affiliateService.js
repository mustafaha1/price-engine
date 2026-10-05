class AffiliateService {
  constructor() {
    this.amazonTag = process.env.AMAZON_ASSOCIATE_TAG || 'globalprice-20';
    this.ebayCampaignId = process.env.EBAY_CAMPAIGN_ID || '123456789';
    this.walmartLinkshareId = process.env.WALMART_LINKSHARE_ID || '';
    this.aliexpressAffiliateId = process.env.ALIEXPRESS_AFFILIATE_ID || '';
    this.rakutenAffiliateId = process.env.RAKUTEN_AFFILIATE_ID || '';
    this.etsyAffiliateId = process.env.ETSY_AFFILIATE_ID || '';
    this.bestBuyAffiliateId = process.env.BESTBUY_AFFILIATE_ID || '';
    this.neweggAffiliateId = process.env.NEWEGG_AFFILIATE_ID || '';
    this.targetAffiliateId = process.env.TARGET_AFFILIATE_ID || '';
    this.sheinAffiliateId = process.env.SHEIN_AFFILIATE_ID || '';
    this.temuAffiliateId = process.env.TEMU_AFFILIATE_ID || '';
  }

  addAffiliateLink(product) {
    if (!product || !product.product_url) return product;
    if (!product.product_url.startsWith('http')) return product;

    try {
      var url = new URL(product.product_url);
    } catch (e) { return product; }
    var domain = url.hostname.toLowerCase();

    if (domain.includes('amazon')) {
      product.product_url = this._addAmazonTag(product.product_url);
    } else if (domain.includes('ebay')) {
      product.product_url = this._addEbayCampaign(product.product_url);
    } else if (domain.includes('walmart')) {
      product.product_url = this._addWalmartTag(product.product_url);
    } else if (domain.includes('aliexpress')) {
      product.product_url = this._addAliexpressTag(product.product_url);
    } else if (domain.includes('rakuten')) {
      product.product_url = this._addRakutenTag(product.product_url);
    } else if (domain.includes('etsy')) {
      product.product_url = this._addEtsyTag(product.product_url);
    } else if (domain.includes('bestbuy')) {
      product.product_url = this._addBestBuyTag(product.product_url);
    } else if (domain.includes('newegg')) {
      product.product_url = this._addNeweggTag(product.product_url);
    } else if (domain.includes('target')) {
      product.product_url = this._addTargetTag(product.product_url);
    } else if (domain.includes('shein')) {
      product.product_url = this._addSheinTag(product.product_url);
    } else if (domain.includes('temu')) {
      product.product_url = this._addTemuTag(product.product_url);
    }

    return product;
  }

  _addAmazonTag(url) {
    try {
      var u = new URL(url);
      u.searchParams.set('tag', this.amazonTag);
      return u.toString();
    } catch (e) { return url; }
  }

  _addEbayCampaign(url) {
    try {
      const u = new URL(url);
      u.searchParams.set('campid', this.ebayCampaignId);
      return u.toString();
    } catch (e) { return url; }
  }

  _addWalmartTag(url) {
    try {
      const u = new URL(url);
      u.searchParams.set('wmlspartner', this.walmartLinkshareId || 'walmart_default');
      return u.toString();
    } catch (e) { return url; }
  }

  _addAliexpressTag(url) {
    try {
      const u = new URL(url);
      u.searchParams.set('aff_fcid', this.aliexpressAffiliateId || 'default');
      return u.toString();
    } catch (e) { return url; }
  }

  _addRakutenTag(url) {
    try {
      const u = new URL(url);
      u.searchParams.set('afid', this.rakutenAffiliateId || 'default');
      return u.toString();
    } catch (e) { return url; }
  }

  _addEtsyTag(url) {
    try {
      const u = new URL(url);
      u.searchParams.set('ref', this.etsyAffiliateId || 'default');
      return u.toString();
    } catch (e) { return url; }
  }

  _addBestBuyTag(url) {
    try {
      const u = new URL(url);
      u.searchParams.set('ref', this.bestBuyAffiliateId || 'default');
      return u.toString();
    } catch (e) { return url; }
  }

  _addNeweggTag(url) {
    try {
      const u = new URL(url);
      u.searchParams.set('nm_mc', this.neweggAffiliateId || 'default');
      return u.toString();
    } catch (e) { return url; }
  }

  _addTargetTag(url) {
    try {
      const u = new URL(url);
      u.searchParams.set('afid', this.targetAffiliateId || 'default');
      return u.toString();
    } catch (e) { return url; }
  }

  _addSheinTag(url) {
    try {
      const u = new URL(url);
      u.searchParams.set('aff_id', this.sheinAffiliateId || 'default');
      return u.toString();
    } catch (e) { return url; }
  }

  _addTemuTag(url) {
    try {
      const u = new URL(url);
      u.searchParams.set('refer', this.temuAffiliateId || 'default');
      return u.toString();
    } catch (e) { return url; }
  }
}

module.exports = new AffiliateService();
