# The Daily Torn Syndicate

Welcome to the **Daily Torn Syndicate** - an immersive, auto-scraping, retro-cyberpunk newspaper that acts as a live intelligence hub for Torn City players.

This project uses a unique Google Apps Script Reverse Proxy combined with a crowdsourced API key pool to fetch live Torn API data (like Bounties, Wars, and Forums) without ever compromising the developer's personal API key.

## Custom Sponsor Banner Ads
As the newspaper publisher, you can run custom "Sponsor Banners" natively within the web app, just like the real Torn City UI!

### Technical Requirements for Ads:
- **Dimensions**: Your banners must be precisely **650x90 pixels** (Width: 650px, Height: 90px). This perfectly matches the official Torn City ad banners and prevents the images from distorting or stretching.
- **Supported Formats**: `apng`, `webp`, `gif`, `png`, and `jpg`. We highly recommend `webp` and `apng` for high-quality, lightweight animated banners!
- **Setup**: Open `/infinityfree-frontend/app.js` and locate the `CUSTOM_ADS` array near the top of the file. You can insert multiple image links and destination URLs into the array. The frontend engine will automatically cycle through the ads every 10 seconds!

## Core Intel Modules
The newspaper currently supports parsing and generating immersive alerts for:
- **Syndicate Hitlist**: Live interception of the top 3 highest bounties on the Torn `torn/bounties` API.
- **Foreign Hospital Watch**: Simulated alerts tracking massive patient influxes across Torn's neighboring countries.
- **Market Inflation**: Simulated tracking of erratic street prices for Xanax, FHCs, and Donator Packs.
- **City Calendar**: Live tracker of official Torn City festivals and seasonal events.
- **High-Roller Tables**: Poker/Casino live table tracking.

## Disclaimer
Not affiliated with Torn City. This is an Open Source Project designed for the Torn community.
