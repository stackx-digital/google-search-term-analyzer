# Search Term Analyzer Setup

Static Google Ads search terms analyzer. It runs fully in the browser and does not need a backend.

The interface uses Tailwind CSS through the Play CDN, Google Sans Flex, basic canvas charts, and local component styles in `styles.css`.

## Run locally

Open `index.html` in a browser, or run a tiny local server:

```bash
cd /Users/im/search-term-analyzer-setup
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Google Ads export

Export a Search terms report as CSV or TSV. Useful columns:

- Search term
- Campaign
- Cost
- Clicks
- Impressions
- CTR
- Conversions
- Conversion value
- Search impression share
- Device

The parser also skips Google Ads preamble rows and rows starting with `Total:`.

## Cloudflare Pages deploy

Fastest manual setup:

1. Open Cloudflare Dashboard.
2. Go to Workers & Pages.
3. Create application.
4. Choose Pages.
5. Use Direct Upload.
6. Upload the `search-term-analyzer-setup` folder.

Git setup:

1. Push this folder to GitHub.
2. Create a Cloudflare Pages project from the repo.
3. Build command: leave blank.
4. Output directory: `/` if this folder is the repo root.

## Rules included

- Threat: junk or irrelevant terms such as `free`, `download`, `login`, `job`, `pdf`, `shopee`, `lazada`, and similar terms.
- Problem: high spend with zero conversions, low ROAS, or weak CTR depending on whether conversion data exists.
- Opportunity: converting terms, high ROAS terms, high CTR terms, or low impression share winners.
- Weakness: high impressions with weak CTR or CPA above target.
- Segments: brand terms, location terms, recurring phrases, and intent categories.

## Features added

- Custom thresholds for CPA, wasted spend, ROAS, CTR, impression share, clicks, and impressions.
- Competitor term detection and custom junk word list.
- Priority score for each search term.
- Negative keyword builder with exact, phrase, and broad match formatting.
- Google Ads Editor CSV export for account, campaign, or ad group negatives.
- Campaign and ad group breakdown tables.
- Before vs after comparison upload.
- Canvas charts for strategy spend, intent mix, campaign waste, and cost vs CTR.
- Local session save and restore through browser localStorage.
- Browser print/PDF report export.
- English-only interface and strategy summary.
- AI-ready strategy prompt that can be copied into ChatGPT or another AI tool.
