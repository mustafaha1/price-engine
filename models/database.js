const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
let client;
let db;

async function connectDatabase() {
  if (db) return db;
  try {
    client = new MongoClient(uri, {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000
    });
    await client.connect();
    db = client.db('globalpriceengine');
    console.log('Connected to MongoDB Atlas');

    const categoriesCollection = db.collection('categories');
    const categoriesCount = await categoriesCollection.countDocuments();

    if (categoriesCount === 0) {
      const categories = [
        { name: 'electronics', display_name: 'Electronics & Gadgets', icon: 'fa-laptop', sort_order: 1 },
        { name: 'fashion', display_name: 'Fashion & Clothing', icon: 'fa-tshirt', sort_order: 2 },
        { name: 'home', display_name: 'Home & Garden', icon: 'fa-home', sort_order: 3 },
        { name: 'beauty', display_name: 'Beauty & Health', icon: 'fa-spa', sort_order: 4 },
        { name: 'sports', display_name: 'Sports & Outdoors', icon: 'fa-futbol', sort_order: 5 },
        { name: 'toys', display_name: 'Toys & Games', icon: 'fa-gamepad', sort_order: 6 },
        { name: 'automotive', display_name: 'Automotive', icon: 'fa-car', sort_order: 7 },
        { name: 'books', display_name: 'Books & Media', icon: 'fa-book', sort_order: 8 },
        { name: 'food', display_name: 'Food & Grocery', icon: 'fa-utensils', sort_order: 9 },
        { name: 'pet', display_name: 'Pet Supplies', icon: 'fa-paw', sort_order: 10 },
        { name: 'office', display_name: 'Office Supplies', icon: 'fa-briefcase', sort_order: 11 },
        { name: 'jewelry', display_name: 'Jewelry & Watches', icon: 'fa-gem', sort_order: 12 },
        { name: 'industrial', display_name: 'Industrial & Scientific', icon: 'fa-cogs', sort_order: 13 },
        { name: 'music', display_name: 'Musical Instruments', icon: 'fa-music', sort_order: 14 },
        { name: 'art', display_name: 'Arts & Crafts', icon: 'fa-palette', sort_order: 15 }
      ];
      await categoriesCollection.insertMany(categories);
      console.log('Seeded categories');
    }

    const productsCollection = db.collection('products');
    await productsCollection.createIndex({ title: 'text', description: 'text' });
    await productsCollection.createIndex({ source_id: 1 });
    await productsCollection.createIndex({ category: 1 });
    await productsCollection.createIndex({ price: 1 });

    return db;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.log('Running in demo mode without database...');
    return null;
  }
}

function getDb() {
  return db;
}

module.exports = { connectDatabase, getDb };
