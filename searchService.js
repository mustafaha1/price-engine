const { getJson } = require('serpapi');
const affiliateService = require('./affiliateService');

const SUPPORTED_COUNTRIES = {
  'US': { gl: 'us', hl: 'en', ebay: 'EBAY_US' },
  'UK': { gl: 'uk', hl: 'en', ebay: 'EBAY_GB' },
  'CA': { gl: 'ca', hl: 'en', ebay: 'EBAY_CA' },
  'AU': { gl: 'au', hl: 'en', ebay: 'EBAY_AU' },
  'DE': { gl: 'de', hl: 'de', ebay: 'EBAY_DE' },
  'FR': { gl: 'fr', hl: 'fr', ebay: 'EBAY_FR' },
  'IT': { gl: 'it', hl: 'it', ebay: 'EBAY_IT' },
  'ES': { gl: 'es', hl: 'es', ebay: 'EBAY_ES' },
  'NL': { gl: 'nl', hl: 'nl', ebay: 'EBAY_NL' },
  'BR': { gl: 'br', hl: 'pt', ebay: 'EBAY_BR' },
  'IN': { gl: 'in', hl: 'en', ebay: 'EBAY_IN' },
  'JP': { gl: 'jp', hl: 'ja', ebay: 'EBAY_JP' }
};

async function search(query, options) {
  try {
    var countryConfig = SUPPORTED_COUNTRIES[options.country] || SUPPORTED_COUNTRIES['US'];
    var limit = options.limit || 50;

    // Search both SerpAPI Google Shopping AND eBay in parallel
    var [googleResults, ebayResults] = await Promise.allSettled([
      searchGoogleShopping(query, countryConfig, options, limit),
      searchEbay(query, countryConfig, options, limit)
    ]);

    var products = [];

    // Add Google Shopping results
    if (googleResults.status === 'fulfilled' && googleResults.value) {
      products = products.concat(googleResults.value);
    }

    // Add eBay results
    if (ebayResults.status === 'fulfilled' && ebayResults.value) {
      products = products.concat(ebayResults.value);
    }

    // If both failed, return demo results
    if (products.length === 0) {
      return generateDemoResults(query, options);
    }

    // Sort by price if requested
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

async function searchGoogleShopping(query, countryConfig, options, limit) {
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

  return response.shopping_results
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
}

async function searchEbay(query, countryConfig, options, limit) {
  var ebayAppId = process.env.EBAY_APP_ID;
  if (!ebayAppId) {
    console.log('EBAY_APP_ID not set, skipping eBay search');
    return [];
  }

  try {
    var ebayGlobalId = countryConfig.ebay || 'EBAY_US';
    var entriesPerPage = Math.min(limit, 20);

    var url = 'https://svcs.ebay.com/services/search/FindingService/v1?' +
      'OPERATION-NAME=findItemsByKeywords' +
      '&SERVICE-VERSION=1.0.0' +
      '&SECURITY-APPNAME=' + encodeURIComponent(ebayAppId) +
      '&RESPONSE-DATA-FORMAT=JSON' +
      '&REST-PAYLOAD' +
      '&GLOBAL-ID=' + ebayGlobalId +
      '&keywords=' + encodeURIComponent(query) +
      '&paginationInput.entriesPerPage=' + entriesPerPage;

    if (options.minPrice !== undefined) {
      url += '&itemFilter(0).name=MinPrice&itemFilter(0).value=' + options.minPrice;
    }
    if (options.maxPrice !== undefined) {
      var idx = options.minPrice !== undefined ? 1 : 0;
      url += '&itemFilter(' + idx + ').name=MaxPrice&itemFilter(' + idx + ').value=' + options.maxPrice;
    }

    var response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('eBay API error: ' + response.status);
    }

    var data = await response.json();

    var searchResult = data.findItemsByKeywordsResponse &&
                       data.findItemsByKeywordsResponse[0] &&
                       data.findItemsByKeywordsResponse[0].searchResult &&
                       data.findItemsByKeywordsResponse[0].searchResult[0];

    if (!searchResult || !searchResult.item) {
      return [];
    }

    var items = Array.isArray(searchResult.item) ? searchResult.item : [searchResult.item];

    return items.map((item, index) => {
      var title = item.title && item.title[0] ? item.title[0] : 'Unknown Product';
      var priceObj = item.sellingStatus && item.sellingStatus[0] &&
                     item.sellingStatus[0].currentPrice && item.sellingStatus[0].currentPrice[0];
      var price = priceObj ? parseFloat(priceObj.__value__) : null;
      var currency = priceObj ? priceObj['@currencyId'] : 'USD';
      var image = item.galleryURL && item.galleryURL[0] ? item.galleryURL[0] : null;
      var url = item.viewItemURL && item.viewItemURL[0] ? item.viewItemURL[0] : '#';
      var condition = item.condition && item.condition[0] && item.condition[0].conditionDisplayName ?
                      item.condition[0].conditionDisplayName[0] : '';
      var topRated = item.topRatedListing && item.topRatedListing[0] === 'true';
      var seller = item.sellerInfo && item.sellerInfo[0] && item.sellerInfo[0].sellerUserName ?
                   item.sellerInfo[0].sellerUserName[0] : 'eBay Seller';

      var product = {
        id: 'ebay_' + index + '_' + Date.now(),
        title: title,
        description: condition,
        price: price,
        currency: currency,
        image: image,
        images: [image],
        product_url: url,
        source: 'eBay - ' + seller,
        rating: topRated ? 4.5 : null,
        reviews: null,
        stock: 'in',
        position: index + 1
      };

      return affiliateService.addAffiliateLink(product);
    }).filter(item => item.price > 0 || !item.price);

  } catch (error) {
    console.error('eBay search error:', error.message);
    return [];
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
