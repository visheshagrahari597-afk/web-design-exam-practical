# SpendWise – Expense Tracker

A multi-page, responsive expense tracker built with plain HTML, CSS and JavaScript (no frameworks, no build step).

## Pages
| Page | What it does |
|------|--------------|
| **Dashboard** (`index.html`) | Balance, income, expenses, savings rate, spending doughnut, budget progress, recent transactions |
| **Transactions** (`transactions.html`) | Add / edit / delete, search, filter by type & category, sort, export CSV |
| **Budgets** (`budgets.html`) | Overall monthly budget plus a limit per category, with progress bars (amber at 80%, red when exceeded) |
| **Reports** (`reports.html`) | 6-month income vs expenses chart, category breakdown, top expenses, daily average |
| **Settings** (`settings.html`) | Your name, currency, JSON backup / restore, sample data, delete all data |

## Features
- Month picker in the navbar filters every page
- Dark mode (remembers your choice, follows the system theme by default)
- Data saved in the browser with `localStorage`
- Fully responsive (phone, tablet, desktop)
- Charts built with pure CSS – no libraries

## Run locally
Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 5173
```

## Deploy (free)

**Netlify (easiest)** – go to https://app.netlify.com/drop and drag the project folder onto the page.

**GitHub Pages**
1. Push this folder to a GitHub repository.
2. Repo → Settings → Pages → Source: `Deploy from a branch` → `main` / `(root)` → Save.
3. Your site will be at `https://<your-username>.github.io/<repo-name>/`.

**Vercel** – import the GitHub repo at https://vercel.com/new and click Deploy.

## Files
| File | Purpose |
|------|---------|
| `common.js` | Shared store (localStorage), helpers, navbar, theme, month picker |
| `dashboard.js`, `transactions.js`, `budgets.js`, `reports.js`, `settings.js` | One script per page |
| `style.css` | Theme (CSS variables), layout, charts, dark mode, responsive rules |

## Customising
- Currency and name: Settings page.
- Categories and colours: `CATEGORIES` object at the top of `common.js`.
- Theme colours: variables at the top of `style.css`.
