# Price Comparison Engine - SQLite Version

This version uses **SQLite** instead of MongoDB Atlas. No external database server needed - the database is a single file stored locally. Completely free with no limits!

## What Changed?

| Feature | Old (MongoDB Atlas) | New (SQLite) |
|---------|---------------------|--------------|
| Database | MongoDB Atlas (cloud) | SQLite (local file) |
| Cost | Free tier limits | Completely free |
| Connection | Requires internet + IP whitelist | Local file, no connection needed |
| Data limit | 512MB - 5GB | Only limited by disk space |
| Setup | MongoDB account + cluster | Nothing extra needed |

## Files Changed

- `package.json` - Removed `mongodb`, added `sqlite3`
- `server.js` - Replaced MongoDB connection with SQLite init
- `database.js` - **NEW** - SQLite database setup
- `routes/auth.js` - Updated to use SQLite queries
- `routes/search.js` - Updated to use SQLite
- `routes/favorites.js` - Updated to use SQLite

## How to Deploy on Railway

### Step 1: Download This ZIP
Extract all files and **replace your old project files** with these new ones.

### Step 2: Update Environment Variables on Railway

Go to your Railway dashboard → price-engine → **Variables**

**REMOVE this (old):**
```
MONGODB_URI
```

**KEEP these:**
```
JWT_SECRET=your_jwt_secret_here
SERPAPI_KEY=your_serpapi_key_here
NODE_ENV=production
```

**ADD these (optional - for affiliate links):**
```
AMAZON_ASSOCIATE_TAG=your_tag-20
EBAY_CAMPAIGN_ID=your_campaign_id
ALIEXPRESS_ID=your_aliexpress_id
WALMART_ID=your_walmart_id
BESTBUY_ID=your_bestbuy_id
```

### Step 3: Update package.json
Make sure your `package.json` on GitHub matches the new one (it now includes `sqlite3` instead of `mongodb`).

### Step 4: Deploy
Push the updated files to GitHub, then click **Redeploy** on Railway.

The SQLite database file will be created automatically at `data/database.sqlite` when the server starts.

### Step 5: Remove MongoDB Atlas (optional)
You can now delete your MongoDB Atlas cluster if you want - you won't need it anymore!

## Data Storage on Railway

**Important:** Railway's filesystem is ephemeral. This means:
- If you redeploy or restart the service, the SQLite file may reset
- For production use with persistent data, you should add a **Railway Volume**

### To add a Volume (recommended):
1. Go to your Railway project
2. Click on **price-engine** service
3. Go to **Volumes** tab
4. Click **New Volume**
5. Mount path: `/app/data`
6. This will persist your database across redeploys

## API Endpoints (unchanged)

All API endpoints work exactly the same:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/search?q=...` - Search products
- `GET /api/favorites` - Get favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites/:id` - Remove favorite

## Affiliate Setup

To earn money from your site, sign up for these affiliate programs and add your IDs to Railway variables:

1. **Amazon Associates** - https://affiliate-program.amazon.com
2. **eBay Partner Network** - https://partnernetwork.ebay.com
3. **AliExpress Portals** - https://portals.aliexpress.com
4. **Walmart Affiliate** - https://affiliates.walmart.com
5. **Best Buy Affiliate** - https://partnerships.bestbuy.com

When users click "Buy Now" on products from these stores, your affiliate ID is automatically added to the link.
