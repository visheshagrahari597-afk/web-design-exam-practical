# SpendWise – Expense Tracker

A responsive expense tracker built with plain HTML, CSS and JavaScript (no frameworks, no build step).

## Features
- Add, edit and delete income / expense transactions
- Balance, income and expense summary
- Filter by month and by type (income / expense)
- Doughnut chart of spending by category (pure CSS `conic-gradient`)
- Monthly budget with progress bar (turns amber at 80%, red when exceeded)
- Dark mode (remembers your choice, follows system theme by default)
- Data saved in the browser with `localStorage`
- Fully responsive, works offline after first load

## Run locally
Just open `index.html` in a browser. Or serve the folder:

```bash
python -m http.server 5173
```

## Deploy (free)

**Netlify (easiest)** – go to https://app.netlify.com/drop and drag the `spendwise` folder onto the page. You get a live link in seconds.

**GitHub Pages**
1. Create a new repository and upload these files (`index.html`, `style.css`, `script.js`, `README.md`).
2. Repo → Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `(root)` → Save.
3. Your site will be at `https://<your-username>.github.io/<repo-name>/`.

**Vercel** – import the GitHub repo at https://vercel.com/new and click Deploy (no settings needed).

## Files
| File | Purpose |
|------|---------|
| `index.html` | Page structure |
| `style.css` | Theme (CSS variables), layout, animations, dark mode |
| `script.js` | State, rendering, add/edit/delete, budget, filters, localStorage |

## Customising
- Currency: change `CURRENCY` at the top of `script.js` (and the "Amount (₹)" label in `index.html`).
- Categories and colours: edit the `CATEGORIES` object in `script.js`.
- Theme colours: edit the variables at the top of `style.css`.
