const { getJson } = require('serpapi');
const affiliateService = require('./affiliateService');

const SUPPORTED_COUNTRIES = {
  'US': { gl: 'us', hl: 'en' },
  'UK': { gl: 'uk', hl: 'en' },
  'CA': { gl: 'ca', hl: 'en' },
  'AU': { gl: 'au', hl: 'en' },
  'DE': { gl: 'de', hl: 'de' },
  'FR': { gl: 'fr', hl: 'fr' },
  'IT': { gl: 'it', hl: 'it' },
  'ES': { gl: 'es', hl: 'es' },
  'NL': { gl: 'nl', hl: 'nl' },
  'BR': { gl: 'br', hl: 'pt' },
  'IN': { gl: 'in', hl: 'en' },
  'JP': { gl: 'jp', hl: 'ja' }
};

async function search(query, options) {
  try {
    var countryConfig = SUPPORTED_COUNTRIES[options.country] || SUPPORTED_COUNTRIES['US'];
    var limit = options.limit || 50;

    var params = {
      engine: 'google_shopping',
      q: query,
      api_key: process.env.SERPAPI_KEY,
      gl: countryConfig.gl,
      hl: countryConfig.hl,
      num: Math.min(limit, 40)
    };

    if (options.minPrice !== undefined) params.min_price = options.minPrice;
    if (options.maxPrice !== undefined) params.max_price = options.maxPrice;

    var response = await new Promise((resolve, reject) => {
      getJson(params, (json) => {
        if (json.error) {
          reject(new Error(json.error));
        } else {
          resolve(json);
        }
      });
    });

    if (!response.shopping_results || !Array.isArray(response.shopping_results)) {
      return [];
    }

    var products = response.shopping_results
      .filter(item => item.link || item.product_link)
      .map((item, index) => {
        var url = item.link || item.product_link || '#';
        if (url && !url.startsWith('http')) {
          url = 'https://www.google.com/search?q=' + encodeURIComponent(item.title);
        }

        var product = {
          id: 'gshop_' + index + '_' + Date.now(),
          title: item.title || 'Unknown Product',
          description: item.snippet || item.description || '',
          price: parsePrice(item.price),
          currency: extractCurrency(item.price) || 'USD',
          image: item.thumbnail || item.image || null,
          product_url: url,
          source: item.source || extractDomain(url) || 'Google Shopping',
          rating: item.rating ? parseFloat(item.rating) : null,
          reviews: item.reviews ? parseInt(item.reviews) : null,
          position: index + 1
        };

        return affiliateService.addAffiliateLink(product);
      })
      .filter(item => item.price > 0 || !item.price);

    if (options.sort === 'price_asc') {
      products.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
    } else if (options.sort === 'price_desc') {
      products.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (options.sort === 'rating') {
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return products.slice(0, limit);
  } catch (error) {
    console.error('Search service error:', error);
    return generateDemoResults(query, options);
  }
}

function parsePrice(priceStr) {
  if (!priceStr) return null;
  var match = priceStr.toString().replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

function extractCurrency(priceStr) {
  if (!priceStr) return 'USD';
  if (priceStr.includes('$')) return 'USD';
  if (priceStr.includes('£')) return 'GBP';
  if (priceStr.includes('€')) return 'EUR';
  if (priceStr.includes('¥')) return 'JPY';
  if (priceStr.includes('₹')) return 'INR';
  if (priceStr.includes('R$')) return 'BRL';
  if (priceStr.includes('A$')) return 'AUD';
  if (priceStr.includes('CA$')) return 'CAD';
  return 'USD';
}

function extractDomain(url) {
  try {
    if (!url || url === '#') return null;
    var u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

function generateDemoResults(query, options) {
  var sources = ['Amazon', 'eBay', 'Walmart', 'Best Buy', 'Target', 'AliExpress'];
  var results = [];
  var count = Math.min(options.limit || 10, 20);

  for (var i = 0; i < count; i++) {
    var basePrice = 20 + Math.random() * 500;
    if (options.minPrice) basePrice = Math.max(basePrice, options.minPrice);
    if (options.maxPrice) basePrice = Math.min(basePrice, options.maxPrice);

    results.push({
      id: 'demo_' + i,
      title: query + ' - ' + sources[i % sources.length] + ' Option ' + (i + 1),
      description: 'Compare prices for ' + query + '. Great deals available.',
      price: Math.round(basePrice * 100) / 100,
      currency: 'USD',
      image: null,
      product_url: 'https://www.google.com/search?q=' + encodeURIComponent(query),
      source: sources[i % sources.length],
      rating: 3 + Math.random() * 2,
      reviews: Math.floor(Math.random() * 5000),
      position: i + 1
    });
  }

  return results;
}

module.exports = { search };
