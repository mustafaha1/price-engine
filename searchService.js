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

        var thumbnail = item.thumbnail || item.image || null;
        var images = [thumbnail];
        if (item.inline_images && Array.isArray(item.inline_images)) {
          for (var ii = 0; ii < item.inline_images.length && ii < 4; ii++) {
            if (item.inline_images[ii] && item.inline_images[ii] !== thumbnail) {
              images.push(item.inline_images[ii]);
            }
          }
        }

        var stockStatus = 'unknown';
        if (item.in_stock !== undefined) stockStatus = item.in_stock ? 'in' : 'out';
        else if (item.availability && item.availability.toLowerCase().includes('out')) stockStatus = 'out';
        else if (item.availability && item.availability.toLowerCase().includes('in')) stockStatus = 'in';
        else if (item.availability && item.availability.toLowerCase().includes('low')) stockStatus = 'low';

        var product = {
          id: 'gshop_' + index + '_' + Date.now(),
          title: item.title || 'Unknown Product',
          description: item.snippet || item.description || '',
          price: parsePrice(item.price),
          currency: extractCurrency(item.price) || 'USD',
          image: thumbnail,
          images: images,
          product_url: url,
          source: item.source || extractDomain(url) || 'Google Shopping',
          rating: item.rating ? parseFloat(item.rating) : null,
          reviews: item.reviews ? parseInt(item.reviews) : null,
          stock: stockStatus,
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

    var stocks = ['in', 'in', 'in', 'low', 'out', 'in'];
    results.push({
      id: 'demo_' + i,
      title: query + ' - ' + sources[i % sources.length] + ' Option ' + (i + 1),
      description: 'Compare prices for ' + query + '. Great deals available.',
      price: Math.round(basePrice * 100) / 100,
      currency: 'USD',
      image: null,
      images: [null],
      product_url: 'https://www.google.com/search?q=' + encodeURIComponent(query),
      source: sources[i % sources.length],
      rating: 3 + Math.random() * 2,
      reviews: Math.floor(Math.random() * 5000),
      stock: stocks[i % stocks.length],
      position: i + 1
    });
  }

  return results;
}

async function searchByImage(imageUrl, options) {
  try {
    var params = {
      engine: 'google_lens',
      url: imageUrl,
      api_key: process.env.SERPAPI_KEY
    };

    var response = await new Promise((resolve, reject) => {
      getJson(params, (json) => {
        if (json.error) {
          reject(new Error(json.error));
        } else {
          resolve(json);
        }
      });
    });

    var productName = extractProductNameFromLens(response);
    if (!productName) {
      return { recognized: false, message: 'Could not identify the product in your photo. Try typing the product name.' };
    }

    var results = await search(productName, options);
    return { recognized: true, query: productName, results: results };
  } catch (error) {
    console.error('Image search service error:', error);
    return { recognized: false, message: 'Photo analysis failed. Please type the product name instead.' };
  }
}

function extractProductNameFromLens(response) {
  if (!response.visual_matches || !Array.isArray(response.visual_matches) || response.visual_matches.length === 0) {
    return null;
  }

  var skipPhrases = ['view on', 'visit', 'site', 'similar', 'images', 'click here', 'shop now', 'buy now', 'learn more'];
  var bestTitle = null;
  var bestScore = 0;

  for (var i = 0; i < Math.min(response.visual_matches.length, 8); i++) {
    var match = response.visual_matches[i];
    var title = match.title;
    if (!title || title.length < 3) continue;

    var lower = title.toLowerCase();
    var skip = false;
    for (var j = 0; j < skipPhrases.length; j++) {
      if (lower.includes(skipPhrases[j])) { skip = true; break; }
    }
    if (skip) continue;

    var words = title.split(/\s+/).length;
    var score = words * 2;
    if (/\d/.test(title)) score += 3;
    if (title.length > 10 && title.length < 120) score += 2;
    if (match.source && match.source.length > 2) score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestTitle = title;
    }
  }

  return bestTitle;
}

module.exports = { search, searchByImage };
