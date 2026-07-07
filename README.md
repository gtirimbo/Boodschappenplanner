# Boodschappenplanner 🛒

Pick a Dutch supermarket, a weekly budget, which days you want to cook, and
a diet style — get back a full breakfast/lunch/dinner plan with step-by-step
recipes, macros per meal, and a real shopping list priced at that store.

No installation, no account, no build step. It's one HTML file.

**[Try the live version →](https://YOUR-USERNAME.github.io/YOUR-REPO/)**
*(replace this link after you enable GitHub Pages — see below)*

---

## What it does

- Choose from 8 supermarkets: Albert Heijn, Jumbo, Lidl, PLUS, Dirk, SPAR,
  Hoogvliet, DekaMarkt
- Set a weekly budget (€0–200)
- Pick which days you'll cook
- Choose **Basic Healthy** or **High Protein**
- Get a day-by-day breakfast/lunch/dinner plan — 38 recipes, each with
  exact quantities and step-by-step instructions
- Get a real shopping list (a "receipt") totaled against your budget, using
  actual current prices
- Prices refresh automatically once a week (see below) — or use the
  snapshot baked into the file if you just open it standalone

## Quick start

**Just want to use it yourself?** Download `index.html` and open it in any
browser, phone included. Done.

**Want a shareable link for other people?** Use GitHub Pages — takes about
2 minutes, no server required:

1. Push this repo to your own GitHub account (fork it, or create a new repo
   and copy these files in).
2. On GitHub: **Settings → Pages → Source** → select `Deploy from a branch`
   → branch `main`, folder `/ (root)` → **Save**.
3. GitHub gives you a URL like `https://your-username.github.io/your-repo/`
   within a minute or two. That's the link to share.
4. Update the "Try the live version" link above (and anywhere else you
   share it) to point there.

That's the whole deployment. No server, no database, nothing to maintain.

## Keeping prices fresh

The repo includes `.github/workflows/update-prices.yml`, a GitHub Action
that runs every Monday morning and regenerates `prices.json` from current
data. Once Pages is enabled, this happens automatically — nothing for you
to run.

If you'd rather not wait for GitHub, you can trigger it manually any time:
**Actions tab → "Update supermarket prices" → Run workflow**.

The app (`index.html`) always tries `prices.json` first, so as soon as the
Action updates that file, anyone opening the page gets the newer prices.
The footer of the app always shows whether you're looking at live data or
the fallback snapshot, and the date it's from.

### Running it with a real backend instead (optional)

If you'd rather self-host on your own server instead of GitHub Pages, see
`server/README.md` for a small FastAPI alternative. Most people don't need
this — Pages is simpler and free.

## Repo structure

```
index.html                        the entire app — open this or deploy it
prices.json                       current prices, regenerated weekly
update_prices.py                  fetches & matches fresh prices
.github/workflows/update-prices.yml   the weekly automation
server/                           optional FastAPI backend (not required for Pages)
extras/                           the original React version, kept for reference
```

## Where the prices come from

Prices are matched against the open dataset from the
[**checkjebon**](https://github.com/supermarkt/checkjebon) project
(MIT-licensed), which indexes real product prices from Dutch supermarket
websites. `update_prices.py` searches that dataset for the closest matching
product per ingredient and store, scaling for pack size. Every match is
recorded in `prices.json` so you can see exactly which product a price
came from.

This project is not affiliated with checkjebon, AH, Lidl, Jumbo, PLUS,
Dirk, SPAR, Hoogvliet, or DekaMarkt. All trademarks belong to their
respective owners.

## Disclaimers

- **Prices are estimates**, matched automatically against a community
  dataset — not official prices from the supermarkets themselves. Always
  check the actual price in-store or online before relying on a total.
- **Macros are estimates per serving**, not lab-verified nutrition data.
  If precise nutrition tracking matters to you (medical reasons, etc.),
  verify against product labels.
- This is a planning tool, not medical or dietary advice.

## Contributing

Adding another supermarket that [checkjebon covers](https://github.com/supermarkt/checkjebon#supported-supermarkets)
is one line in `update_prices.py`:

```python
ADAPTERS: list[StoreAdapter] = [
    ...,
    CheckjebonAdapter("your_store_id", "checkjebon_store_key"),
]
```

Adding a recipe means adding one object to the `RECIPES` array in
`index.html` (and the matching entries to `INGREDIENTS` if it needs a new
ingredient).

Issues and pull requests welcome.

## License

MIT — see [LICENSE](LICENSE). Price data credit: see above.
