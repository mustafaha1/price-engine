const { getJson } = require('serpapi');
const affiliateService = require('./affiliateService');
const crypto = require('crypto');

// === Search Cache ===
// Caches SerpAPI results for 10 minutes to save API credits
var searchCache = {};
var CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCacheKey(query, options) {
  return JSON.stringify({
    q: query.toLowerCase().trim(),
    c: options.country || 'US',
    s: options.sort || 'relevance',
    min: options.minPrice || '',
    max: options.maxPrice || '',
    l: options.limit || 60
  });
}

function getCached(key) {
  var entry = searchCache[key];
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL_MS) {
    delete searchCache[key];
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  searchCache[key] = { time: Date.now(), data: data };
}

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
  'JP': { gl: 'jp', hl: 'ja', ebay: 'EBAY_JP' },
  'AE': { gl: 'ae', hl: 'en', ebay: 'EBAY_US' },
  'SA': { gl: 'sa', hl: 'ar', ebay: 'EBAY_US' },
  'SG': { gl: 'sg', hl: 'en', ebay: 'EBAY_US' },
  'SE': { gl: 'se', hl: 'sv', ebay: 'EBAY_SE' },
  'PL': { gl: 'pl', hl: 'pl', ebay: 'EBAY_PL' },
  'MX': { gl: 'mx', hl: 'es', ebay: 'EBAY_US' },
  'TR': { gl: 'tr', hl: 'tr', ebay: 'EBAY_US' }
};

async function search(query, options) {
  try {
    var countryConfig = SUPPORTED_COUNTRIES[options.country] || SUPPORTED_COUNTRIES['US'];
    var limit = options.limit || 60;
    var cacheKey = getCacheKey(query, options);

    // Check cache first (saves SerpAPI credits!)
    var cached = getCached(cacheKey);
    if (cached) {
      console.log('[CACHE HIT] Returning cached results for:', query);
      return cached;
    }

    // Search SerpAPI Google Shopping, eBay, AND AliExpress in parallel
    var [googleResults, ebayResults, aliResults] = await Promise.allSettled([
      searchGoogleShopping(query, countryConfig, options, limit),
      searchEbay(query, countryConfig, options, limit),
      searchAliExpress(query, options, limit)
    ]);

    var products = [];

    // Add Google Shopping results
    if (googleResults.status === 'fulfilled' && googleResults.value) {
      console.log('[SEARCH] Google Shopping returned', googleResults.value.length, 'results');
      products = products.concat(googleResults.value);
    } else if (googleResults.status === 'rejected') {
      console.error('[SEARCH] Google Shopping failed:', googleResults.reason.message);
    }

    // Add eBay results
    if (ebayResults.status === 'fulfilled' && ebayResults.value) {
      console.log('[SEARCH] eBay API returned', ebayResults.value.length, 'results');
      products = products.concat(ebayResults.value);
    } else if (ebayResults.status === 'rejected') {
      console.error('[SEARCH] eBay API failed:', ebayResults.reason.message);
    } else {
      console.log('[SEARCH] eBay API returned 0 results (EBAY_APP_ID may not be set)');
    }

    // Add AliExpress results
    if (aliResults.status === 'fulfilled' && aliResults.value) {
      console.log('[SEARCH] AliExpress API returned', aliResults.value.length, 'results');
      products = products.concat(aliResults.value);
    } else if (aliResults.status === 'rejected') {
      console.error('[SEARCH] AliExpress API failed:', aliResults.reason.message);
    }

    // If all failed, return demo results
    if (products.length === 0) {
      console.log('[SEARCH] All sources failed — returning demo results');
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
    // 'relevance' sort keeps original API order (no sorting)

    var result = products.slice(0, limit);

    // Cache successful results (10 min TTL)
    if (result.length > 0) {
      setCached(cacheKey, result);
      console.log('[CACHE SET] Cached', result.length, 'results for:', query);
    }

    return result;
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
    num: Math.min(limit, 60)
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
    .filter(item => item.link || item.product_link || item.direct_link)
    .map((item, index) => {
      // Try to get direct merchant URL first, fall back to Google redirect
      var rawUrl = item.direct_link || item.product_link || item.link || '#';
      var url = extractDirectUrl(rawUrl);

      // Detect source from item.source or URL
      var detectedSource = (item.source || '').toLowerCase();
      var isGoogleUrl = url.includes('google.com/search') || url.includes('google.com/shopping');

      // Map eBay domains to correct regional domain (prevents eBay redirect kick-out)
      var ebayDomainMap = {
        'uk': 'ebay.co.uk', 'de': 'ebay.de', 'fr': 'ebay.fr',
        'ca': 'ebay.ca', 'au': 'ebay.com.au', 'it': 'ebay.it',
        'es': 'ebay.es', 'nl': 'ebay.nl', 'br': 'ebay.com.br',
        'in': 'ebay.in', 'jp': 'ebay.co.jp', 'se': 'ebay.se',
        'pl': 'ebay.pl'
      };
      if (url.includes('ebay.com') && ebayDomainMap[countryConfig.gl]) {
        var targetEbay = ebayDomainMap[countryConfig.gl];
        if (!url.includes(targetEbay)) {
          url = url.replace('ebay.com', targetEbay);
        }
      }

      // Map Amazon domains to correct regional domain
      var amazonDomainMap = {
        'uk': 'amazon.co.uk', 'de': 'amazon.de', 'fr': 'amazon.fr',
        'ca': 'amazon.ca', 'au': 'amazon.com.au', 'it': 'amazon.it',
        'es': 'amazon.es', 'nl': 'amazon.nl', 'br': 'amazon.com.br',
        'in': 'amazon.in', 'jp': 'amazon.co.jp', 'ae': 'amazon.ae',
        'sa': 'amazon.sa', 'sg': 'amazon.sg', 'se': 'amazon.se',
        'pl': 'amazon.pl', 'mx': 'amazon.com.mx', 'tr': 'amazon.com.tr'
      };
      if (url.includes('amazon.com') && amazonDomainMap[countryConfig.gl]) {
        var targetAmazon = amazonDomainMap[countryConfig.gl];
        if (!url.includes(targetAmazon)) {
          url = url.replace('amazon.com', targetAmazon);
        }
      }

      // Map Shein domains to correct regional domain
      var sheinDomainMap = {
        'uk': 'shein.co.uk', 'de': 'shein.de', 'fr': 'shein.fr',
        'us': 'shein.com', 'ca': 'shein.com', 'au': 'shein.com.au',
        'it': 'shein.it', 'es': 'shein.es', 'nl': 'shein.nl',
        'se': 'shein.se', 'pl': 'shein.pl', 'jp': 'shein.co.jp',
        'mx': 'shein.com.mx', 'br': 'shein.com.br', 'ae': 'shein.ae',
        'sa': 'shein.sa', 'sg': 'shein.com.sg', 'tr': 'shein.com.tr'
      };

      // If Google gives us a redirect URL (not a direct merchant link),
      // try to build a direct merchant link for known partners
      if (isGoogleUrl || url === '#' || !url.startsWith('http')) {
        var searchQuery = encodeURIComponent(item.title || query);

        if (detectedSource.includes('amazon')) {
          // Direct Amazon search with affiliate tag
          var amazonDomain = amazonDomainMap[countryConfig.gl] || 'amazon.com';
          url = 'https://www.' + amazonDomain + '/s?k=' + searchQuery;
        } else if (detectedSource.includes('walmart')) {
          url = 'https://www.walmart.com/search?q=' + searchQuery;
        } else if (detectedSource.includes('best buy')) {
          url = 'https://www.bestbuy.com/site/searchpage.jsp?st=' + searchQuery;
        } else if (detectedSource.includes('target')) {
          url = 'https://www.target.com/s?searchTerm=' + searchQuery;
        } else if (detectedSource.includes('ebay')) {
          // TEMPORARY: eBay Finding API is dead (418 error).
          // eBay Browse API requires Developer Program approval (pending review).
          // Using Google Shopping eBay search pages as fallback.
          // Note: /sch/ search pages intentionally skip campid (breaks eBay).
          var ebayDomain = ebayDomainMap[countryConfig.gl] || 'ebay.com';
          url = 'https://www.' + ebayDomain + '/sch/i.html?_nkw=' + searchQuery;
        } else if (detectedSource.includes('shein')) {
          // Direct Shein search with Awin affiliate tag
          var sheinDomain = sheinDomainMap[countryConfig.gl] || 'shein.com';
          url = 'https://www.' + sheinDomain + '/search?q=' + searchQuery;
        } else if (rawUrl && rawUrl.startsWith('http')) {
          // Unknown source but we have a Google redirect URL — keep it!
          // It will redirect to the merchant. Don't send users to Google search.
          url = rawUrl;
        } else {
          // No usable URL at all — skip this product by returning null
          // (filtered out below)
          return null;
        }
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
    .filter(item => item && (item.price > 0 || !item.price));
}

async function searchEbay(query, countryConfig, options, limit) {
  var ebayAppId = process.env.EBAY_APP_ID;
  if (!ebayAppId) {
    console.log('EBAY_APP_ID not set, skipping eBay search');
    return [];
  }

  try {
    var ebayGlobalId = countryConfig.ebay || 'EBAY_US';
    var entriesPerPage = Math.min(limit, 30);

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

/* ========== URL HELPERS ========== */
// Google Shopping returns google.com redirect URLs — extract the real merchant URL
function extractDirectUrl(googleUrl) {
  if (!googleUrl || googleUrl === '#') return '#';

  try {
    // Pattern 1: google.com/aclk?...&adurl=https://real-site.com/...
    var adurlMatch = googleUrl.match(/[?&]adurl=([^&]+)/i);
    if (adurlMatch) {
      return decodeURIComponent(adurlMatch[1]);
    }

    // Pattern 2: google.com/url?...&url=https://real-site.com/...
    var urlMatch = googleUrl.match(/[?&]url=([^&]+)/i);
    if (urlMatch) {
      return decodeURIComponent(urlMatch[1]);
    }

    // Pattern 3: google.com/shopping/product/... with merchant link
    var merchantMatch = googleUrl.match(/[?&]merchant_link=([^&]+)/i);
    if (merchantMatch) {
      return decodeURIComponent(merchantMatch[1]);
    }

    // If it's already a direct link (not google.com), return as-is
    if (!googleUrl.includes('google.com')) {
      return googleUrl;
    }

    // Google knowledge panel URLs can't be decoded — return as-is
    return googleUrl;
  } catch (e) {
    return googleUrl;
  }
}

/* ========== ALIEXPRESS AFFILIATE API ========== */
// Docs: https://portals.aliexpress.com/helpcenter/api/doku.php?id=products
// Requires env vars: ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET, ALIEXPRESS_TRACKING_ID

async function searchAliExpress(query, options, limit) {
  var appKey = process.env.ALIEXPRESS_APP_KEY;
  var appSecret = process.env.ALIEXPRESS_APP_SECRET;
  var trackingId = process.env.ALIEXPRESS_TRACKING_ID;

  if (!appKey || !appSecret) {
    console.log('AliExpress API keys not set, skipping AliExpress search');
    return [];
  }

  try {
    var timestamp = Date.now().toString();
    var pageSize = Math.min(limit, 50);

    // Build params for signature (alphabetical order, no sign yet)
    var params = {
      app_key: appKey,
      format: 'json',
      keywords: query,
      method: 'aliexpress.affiliate.product.query',
      page_size: String(pageSize),
      sign_method: 'md5',
      timestamp: timestamp,
      tracking_id: trackingId || 'priceengine',
      v: '2.0'
    };

    // Build signature string: secret + sorted(key+value) + secret
    var sortedKeys = Object.keys(params).sort();
    var signStr = appSecret;
    for (var i = 0; i < sortedKeys.length; i++) {
      var k = sortedKeys[i];
      signStr += k + params[k];
    }
    signStr += appSecret;

    var sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();

    // Build query string (same alphabetical order)
    var qsParts = [];
    for (var j = 0; j < sortedKeys.length; j++) {
      var sk = sortedKeys[j];
      qsParts.push(encodeURIComponent(sk) + '=' + encodeURIComponent(params[sk]));
    }
    qsParts.push('sign=' + encodeURIComponent(sign));

    var url = 'https://api-sg.aliexpress.com/sync?' + qsParts.join('&');

    var response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('AliExpress API HTTP ' + response.status);
    }

    var data = await response.json();

    // Parse AliExpress response
    var respResult = data.aliexpress_affiliate_product_query_response ||
                     data.resp_result ||
                     data;

    var result = respResult.result || respResult;
    if (!result) {
      console.log('AliExpress API: no result field');
      return [];
    }

    var productsData = result.products || (result.product ? { product: result.product } : null);
    if (!productsData) {
      console.log('AliExpress API: no products found');
      return [];
    }

    var items = Array.isArray(productsData.product) ? productsData.product : (productsData.product ? [productsData.product] : []);

    return items.map(function(item, index) {
      var title = item.product_title || 'AliExpress Product';
      var priceStr = item.sale_price || item.target_sale_price || '0';
      var price = parseFloat(priceStr) || 0;
      var originalPrice = item.original_price || item.target_original_price || priceStr;
      var currency = 'USD';
      var image = item.product_main_image_url || item.product_small_image_urls?.string?.[0] || null;
      var productUrl = item.product_detail_url || item.promotion_link || '#';
      var rating = item.evaluate_rate ? parseFloat(item.evaluate_rate) : null;
      var sales = item.lastest_volume ? parseInt(item.lastest_volume) : null;
      var shop = item.shop_name || item.store_name || 'AliExpress';

      // Add affiliate tracking to URL
      if (productUrl && productUrl !== '#' && trackingId) {
        var sep = productUrl.includes('?') ? '&' : '?';
        productUrl = productUrl + sep + 'aff_fcid=' + encodeURIComponent(trackingId);
      }

      return {
        id: 'ali_' + (item.product_id || index) + '_' + Date.now(),
        title: title,
        description: '',
        price: price,
        currency: currency,
        image: image,
        images: [image],
        product_url: productUrl,
        source: 'AliExpress',
        rating: rating,
        reviews: sales,
        stock: 'in',
        position: index + 1
      };
    }).filter(function(item) { return item.price > 0; });

  } catch (error) {
    console.error('AliExpress search error:', error.message);
    return [];
  }
}

function parsePrice(priceStr) {
  if (!priceStr && priceStr !== 0) return null;
  var str = priceStr.toString().trim();

  // European format: "177,00", "EUR 177,00", "1.234,56", "177,00 €"
  // Comma + exactly 2 digits, followed by non-digit (or end of string)
  var euroMatch = str.match(/([\d.]+),(\d{2})(?!\d)/);
  if (euroMatch) {
    var whole = euroMatch[1].replace(/\./g, ''); // Remove dot thousands separators
    return parseFloat(whole + '.' + euroMatch[2]);
  }

  // US format: "1,234.56", "$1234.56", "177.00"
  var usMatch = str.match(/[\d,]+\.\d{2}(?!\d)/);
  if (usMatch) {
    return parseFloat(usMatch[0].replace(/,/g, ''));
  }

  // Plain integer or number without decimals
  var simpleMatch = str.match(/[\d,]+(?!\d)/);
  if (simpleMatch) {
    return parseFloat(simpleMatch[0].replace(/,/g, ''));
  }

  return null;
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
