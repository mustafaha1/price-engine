const express = require('express');
const router = express.Router();

const IMG_HEADPHONES = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzNiODJmNiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5IZWFkcGhvbmVzPC90ZXh0Pjwvc3ZnPg==';
const IMG_WATCH = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzEwYjk4MSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TbWFydCBXYXRjaDwvdGV4dD48L3N2Zz4=';
const IMG_SPEAKER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1OWUwYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TcGVha2VyPC90ZXh0Pjwvc3ZnPg==';
const IMG_SHOES = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VmNDQ0NCIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaG9lczwvdGV4dD48L3N2Zz4=';
const IMG_BOTTLE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzhiNWNmNiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Cb3R0bGU8L3RleHQ+PC9zdmc+';
const IMG_LAMP = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzA2YjZkNCIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5MYW1wPC90ZXh0Pjwvc3ZnPg==';
const IMG_YOGA = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VjNDg5OSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Zb2dhIE1hdDwvdGV4dD48L3N2Zz4=';
const IMG_USB = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzYzNjZmMSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5VU0IgSHViPC90ZXh0Pjwvc3ZnPg==';
const IMG_BACKPACK = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzE0YjhhNiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CYWNrcGFjazwvdGV4dD48L3N2Zz4=';
const IMG_COFFEE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzc4NzE2YyIvPjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Db2ZmZWUgTWFrZXI8L3RleHQ+PC9zdmc+';

router.get('/', async (req, res) => {
  const deals = [
    { title: 'Wireless Bluetooth Headphones', price: 29.99, original_price: 89.99, discount_percent: 67, source: 'Amazon', image_url: IMG_HEADPHONES, product_url: '#' },
    { title: 'Smart Watch Fitness Tracker', price: 24.99, original_price: 79.99, discount_percent: 69, source: 'eBay', image_url: IMG_WATCH, product_url: '#' },
    { title: 'Portable Bluetooth Speaker', price: 19.99, original_price: 49.99, discount_percent: 60, source: 'Walmart', image_url: IMG_SPEAKER, product_url: '#' },
    { title: 'Running Shoes - Lightweight', price: 34.99, original_price: 99.99, discount_percent: 65, source: 'AliExpress', image_url: IMG_SHOES, product_url: '#' },
    { title: 'Stainless Steel Water Bottle', price: 12.99, original_price: 34.99, discount_percent: 63, source: 'Amazon', image_url: IMG_BOTTLE, product_url: '#' },
    { title: 'LED Desk Lamp with Charger', price: 22.99, original_price: 59.99, discount_percent: 62, source: 'Best Buy', image_url: IMG_LAMP, product_url: '#' },
    { title: 'Yoga Mat - Extra Thick', price: 15.99, original_price: 39.99, discount_percent: 60, source: 'Walmart', image_url: IMG_YOGA, product_url: '#' },
    { title: 'USB-C Hub Multiport', price: 18.99, original_price: 49.99, discount_percent: 62, source: 'eBay', image_url: IMG_USB, product_url: '#' },
    { title: 'Anti-theft Laptop Backpack', price: 27.99, original_price: 69.99, discount_percent: 60, source: 'AliExpress', image_url: IMG_BACKPACK, product_url: '#' },
    { title: 'Single Serve Coffee Maker', price: 32.99, original_price: 89.99, discount_percent: 63, source: 'Target', image_url: IMG_COFFEE, product_url: '#' }
  ];
  res.json({ deals, count: deals.length, demo: true });
});

router.get('/hot', async (req, res) => {
  const deals = [
    { title: 'Smart Watch Fitness Tracker', price: 24.99, original_price: 79.99, discount_percent: 69, source: 'eBay', image_url: IMG_WATCH, product_url: '#' },
    { title: 'Wireless Bluetooth Headphones', price: 29.99, original_price: 89.99, discount_percent: 67, source: 'Amazon', image_url: IMG_HEADPHONES, product_url: '#' },
    { title: 'Running Shoes - Lightweight', price: 34.99, original_price: 99.99, discount_percent: 65, source: 'AliExpress', image_url: IMG_SHOES, product_url: '#' },
    { title: 'Single Serve Coffee Maker', price: 32.99, original_price: 89.99, discount_percent: 63, source: 'Target', image_url: IMG_COFFEE, product_url: '#' },
    { title: 'Stainless Steel Water Bottle', price: 12.99, original_price: 34.99, discount_percent: 63, source: 'Amazon', image_url: IMG_BOTTLE, product_url: '#' }
  ];
  res.json({ deals, count: deals.length, demo: true });
});

module.exports = router;
