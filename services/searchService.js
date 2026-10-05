const axios = require('axios');
const { getDb } = require('../models/database');
const affiliateService = require('./affiliateService');

class SearchService {
  constructor() {
    this.serpApiKey = process.env.SERPAPI_KEY;
    this.rapidApiKey = process.env.RAPIDAPI_KEY;
    this.ebayAppId = process.env.EBAY_APP_ID;
    this.walmartApiKey = process.env.WALMART_API_KEY;
    this.bestBuyApiKey = process.env.BESTBUY_API_KEY;
    this.amazonAccessKey = process.env.AMAZON_ACCESS_KEY;
    this.hasRealKeys = !!(this.serpApiKey || this.rapidApiKey || this.ebayAppId || this.walmartApiKey);
  }

  async searchAll(query, options = {}) {
    const { limit = 50, category, minPrice, maxPrice, country = 'US', sort = 'price_asc' } = options;
    let allResults = [];

    console.log('Search starting for:', query);
    console.log('SerpAPI key present:', !!this.serpApiKey);

    // Try SerpAPI (Google Shopping) - best free tier option
    if (this.serpApiKey) {
      try {
        console.log('Calling SerpAPI...');
        const serpResults = await this.searchSerpAPI(query, options);
        console.log('SerpAPI returned', serpResults.length, 'results');
        allResults = allResults.concat(serpResults);
      } catch (e) {
        console.log('SerpAPI failed:', e.message);
      }
    } else {
      console.log('No SerpAPI key, skipping...');
    }

    // Try eBay API
    if (this.ebayAppId) {
      try {
        const ebayResults = await this.searchEbayAPI(query, options);
        allResults = allResults.concat(ebayResults);
      } catch (e) {
        console.log('eBay API failed:', e.message);
      }
    }

    // Try Walmart API
    if (this.walmartApiKey) {
      try {
        const walmartResults = await this.searchWalmartAPI(query, options);
        allResults = allResults.concat(walmartResults);
      } catch (e) {
        console.log('Walmart API failed:', e.message);
      }
    }

    // Try RapidAPI (multiple sources)
    if (this.rapidApiKey) {
      try {
        const rapidResults = await this.searchRapidAPI(query, options);
        allResults = allResults.concat(rapidResults);
      } catch (e) {
        console.log('RapidAPI failed:', e.message);
      }
    }

    // If no real APIs worked, use demo data
    if (allResults.length === 0) {
      console.log('No APIs configured or all failed. Using demo data...');
      allResults = this.generateDemoData(query, options);
    }

    // Apply filters
    if (category) {
      allResults = allResults.filter(r => r.category === category || r.category === 'general');
    }
    if (minPrice !== undefined) {
      allResults = allResults.filter(r => r.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      allResults = allResults.filter(r => r.price <= maxPrice);
    }

    // Sort results
    if (sort === 'price_asc') {
      allResults.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      allResults.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      allResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    // Add affiliate links
    allResults = allResults.map(r => affiliateService.addAffiliateLink(r));

    // Store in MongoDB
    try {
      const db = getDb();
      if (db && allResults.length > 0) {
        for (const result of allResults.slice(0, 20)) {
          await db.collection('products').updateOne(
            { source_id: result.source_id, source: result.source },
            { $set: { ...result, updated_at: new Date() }, $setOnInsert: { created_at: new Date() } },
            { upsert: true }
          );
        }
      }
    } catch (e) {}

    return allResults.slice(0, limit);
  }

  async searchSerpAPI(query, options) {
    console.log('SerpAPI: sending request for', query);
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_shopping',
        q: query,
        gl: options.country || 'us',
        hl: 'en',
        api_key: this.serpApiKey,
        num: 20
      },
      timeout: 10000
    });

    console.log('SerpAPI: response status', response.status);
    console.log('SerpAPI: response keys', Object.keys(response.data));
    const results = response.data.shopping_results || [];
    console.log('SerpAPI: shopping_results count', results.length);

    if (results.length === 0 && response.data.error) {
      console.log('SerpAPI: API error', response.data.error);
      throw new Error(response.data.error);
    }

    return results
      .filter(item => item.link || item.product_link)
      .map((item, index) => {
        var url = item.link || item.product_link || '#';
        if (url && !url.startsWith('http')) {
          url = 'https://www.google.com/search?q=' + encodeURIComponent(item.title);
        }
        return {
          source_id: 'serp_' + (item.product_id || index),
          title: item.title || 'Unknown Product',
          description: item.snippet || '',
          price: this.parsePrice(item.extracted_price),
          original_price: item.extracted_old_price ? this.parsePrice(item.extracted_old_price) : null,
          currency: item.price && item.price.includes('EUR') ? 'EUR' : 'USD',
          source: this.extractSource(item.source || item.link),
          product_url: url,
          image_url: item.thumbnail,
          rating: item.rating ? parseFloat(item.rating) : null,
          reviews: item.reviews ? parseInt(String(item.reviews).replace(/[^0-9]/g, '')) : null,
          category: options.category || 'general',
          country: options.country || 'US',
          search_query: query,
          created_at: new Date()
        };
      });
  }

  async searchEbayAPI(query, options) {
    const response = await axios.get('https://svcs.ebay.com/services/search/FindingService/v1', {
      params: {
        'OPERATION-NAME': 'findItemsByKeywords',
        'SERVICE-VERSION': '1.0.0',
        'SECURITY-APPNAME': this.ebayAppId,
        'RESPONSE-DATA-FORMAT': 'JSON',
        keywords: query,
        'paginationInput.entriesPerPage': 20
      },
      timeout: 15000
    });

    const items = response.data.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];
    return items.map(item => ({
      source_id: item.itemId?.[0],
      title: item.title?.[0],
      description: item.subtitle?.[0],
      price: this.parsePrice(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__),
      currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD',
      source: 'eBay',
      product_url: item.viewItemURL?.[0],
      image_url: item.galleryURL?.[0],
      category: options.category || 'general',
      country: item.country?.[0] || 'US',
      search_query: query,
      created_at: new Date()
    }));
  }

  async searchWalmartAPI(query, options) {
    const response = await axios.get('https://developer.api.walmart.com/api-proxy/service/Ip/DefaultSearch', {
      params: { query },
      headers: { 'WM_SVC.NAME': 'Ip', 'WM_QOS.CORRELATION_ID': Date.now().toString() },
      timeout: 10000
    });

    const items = response.data.items || [];
    return items.map(item => ({
      source_id: item.itemId?.toString(),
      title: item.name,
      description: item.shortDescription || '',
      price: this.parsePrice(item.salePrice),
      original_price: item.msrp ? this.parsePrice(item.msrp) : null,
      currency: 'USD',
      source: 'Walmart',
      product_url: `https://www.walmart.com/ip/${item.itemId}`,
      image_url: item.thumbnailImage,
      rating: item.customerRating ? parseFloat(item.customerRating) : null,
      reviews: item.numReviews,
      category: options.category || 'general',
      country: 'US',
      search_query: query,
      created_at: new Date()
    }));
  }

  async searchRapidAPI(query, options) {
    const response = await axios.get('https://real-time-product-search.p.rapidapi.com/search', {
      params: { q: query, country: options.country || 'us', language: 'en' },
      headers: {
        'X-RapidAPI-Key': this.rapidApiKey,
        'X-RapidAPI-Host': 'real-time-product-search.p.rapidapi.com'
      },
      timeout: 10000
    });

    return (response.data.data || []).map((item, index) => ({
      source_id: `rapid_${index}`,
      title: item.product_title,
      description: item.product_description || '',
      price: this.parsePrice(item.offer.price),
      original_price: item.offer.original_price ? this.parsePrice(item.offer.original_price) : null,
      currency: item.offer.currency || 'USD',
      source: item.offer.store_name || 'Unknown',
      product_url: item.offer.offer_page_url,
      image_url: item.product_photos?.[0],
      rating: item.product_rating ? parseFloat(item.product_rating) : null,
      reviews: item.product_num_reviews,
      category: options.category || 'general',
      country: options.country || 'US',
      search_query: query,
      created_at: new Date()
    }));
  }

  generateDemoData(query, options) {
    const placeholder = (text, color) => `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#${color}"/><text x="150" y="150" font-family="Arial,sans-serif" font-size="16" fill="white" text-anchor="middle" dy=".3em">${text}</text></svg>`).toString('base64')}`;
    const products = [
      { title: `${query} - Premium Quality`, price: 29.99, source: 'Amazon', image: placeholder('Amazon', '3b82f6') },
      { title: `${query} - Best Seller`, price: 24.99, source: 'eBay', image: placeholder('eBay', 'ef4444') },
      { title: `${query} - Popular Choice`, price: 27.99, source: 'Walmart', image: placeholder('Walmart', 'f59e0b') },
      { title: `${query} - Budget Option`, price: 15.99, source: 'AliExpress', image: placeholder('AliExpress', '10b981') },
      { title: `${query} - Trending Now`, price: 32.99, source: 'Target', image: placeholder('Target', '8b5cf6') },
      { title: `${query} - Top Rated`, price: 34.99, source: 'Best Buy', image: placeholder('Best Buy', '06b6d4') },
      { title: `${query} - Handmade`, price: 39.99, source: 'Etsy', image: placeholder('Etsy', 'ec4899') },
      { title: `${query} - Tech Spec`, price: 45.99, source: 'Newegg', image: placeholder('Newegg', '6366f1') },
      { title: `${query} - Fashion Style`, price: 19.99, source: 'Shein', image: placeholder('Shein', '14b8a6') },
      { title: `${query} - Value Pack`, price: 12.99, source: 'Temu', image: placeholder('Temu', 'f97316') }
    ];

    return products.map((p, i) => ({
      source_id: `demo_${i}_${Date.now()}`,
      title: p.title,
      description: `High quality ${query} with great reviews`,
      price: p.price,
      original_price: p.price * 1.3,
      currency: 'USD',
      source: p.source,
      product_url: `https://www.google.com/search?q=${encodeURIComponent(p.title)}`,
      image_url: p.image,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      reviews: Math.floor(Math.random() * 5000) + 50,
      category: options.category || 'general',
      country: options.country || 'US',
      search_query: query,
      created_at: new Date()
    }));
  }

  parsePrice(price) {
    if (!price) return 0;
    if (typeof price === 'number') return price;
    const parsed = parseFloat(price.toString().replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }

  extractSource(url) {
    if (!url) return 'Unknown';
    if (url.includes('amazon')) return 'Amazon';
    if (url.includes('ebay')) return 'eBay';
    if (url.includes('walmart')) return 'Walmart';
    if (url.includes('target')) return 'Target';
    if (url.includes('bestbuy')) return 'Best Buy';
    if (url.includes('newegg')) return 'Newegg';
    if (url.includes('etsy')) return 'Etsy';
    if (url.includes('shein')) return 'Shein';
    if (url.includes('temu')) return 'Temu';
    return 'Google Shopping';
  }

  getPlatformCount() {
    return 40;
  }
}

module.exports = new SearchService();
