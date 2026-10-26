// ============ SpendWise shared code (used by every page) ============

const CATEGORIES = {
  Food:     { icon: '🍔', color: '#f97316' },
  Travel:   { icon: '✈️', color: '#3b82f6' },
  Shopping: { icon: '🛍️', color: '#ec4899' },
  Bills:    { icon: '🧾', color: '#8b5cf6' },
  Fun:      { icon: '🎮', color: '#eab308' },
  Health:   { icon: '💊', color: '#ef4444' },
  Salary:   { icon: '💼', color: '#10b981' },
  Other:    { icon: '📦', color: '#64748b' }
};
const EXPENSE_CATS = Object.keys(CATEGORIES).filter(c => c !== 'Salary');
const CURRENCIES = ['₹', '$', '€', '£', '¥'];
const PAGES = [
  ['index.html', 'Dashboard', '📊'],
  ['transactions.html', 'Transactions', '💳'],
  ['budgets.html', 'Budgets', '🎯'],
  ['reports.html', 'Reports', '📈'],
  ['settings.html', 'Settings', '⚙️']
];

const $ = id => document.getElementById(id);

// ---------- Storage ----------
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};

const App = {
  tx: load('sw_transactions', []),
  settings: { name: '', currency: '₹', ...load('sw_settings', {}) },
  budgets: { overall: Number(load('sw_budget', 0)) || 0, cats: {}, ...load('sw_budgets', {}) },
  month: load('sw_month', null)
};
const saveTx = () => localStorage.setItem('sw_transactions', JSON.stringify(App.tx));
const saveSettings = () => localStorage.setItem('sw_settings', JSON.stringify(App.settings));
const saveBudgets = () => localStorage.setItem('sw_budgets', JSON.stringify(App.budgets));

// ---------- Helpers ----------
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const currentMonth = () => today().slice(0, 7);
const money = n => App.settings.currency + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthName = (ym, short) => {
  const [y, m] = ym.split('-');
  return new Date(y, m - 1).toLocaleString('en-IN', short ? { month: 'short' } : { month: 'long', year: 'numeric' });
};
const escapeHtml = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

if (App.month !== 'all' && !/^\d{4}-\d{2}$/.test(App.month || '')) App.month = currentMonth();

const inMonth = (list, month) => month === 'all' ? list : list.filter(t => t.date.startsWith(month));
const scoped = () => inMonth(App.tx, App.month).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
const totals = list => ({
  income: list.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
  expense: list.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
});
const expenseByCategory = list => {
  const out = {};
  list.filter(t => t.type === 'expense').forEach(t => { out[t.category] = (out[t.category] || 0) + t.amount; });
  return out;
};
// month used for budgets: the selected month, or this month when "All time" is chosen
const budgetMonth = () => App.month === 'all' ? currentMonth() : App.month;

function showToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => el.classList.remove('show'), 2200);
}

function download(filename, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- Shared UI pieces ----------
function txItem(t, withActions) {
  const c = CATEGORIES[t.category] || CATEGORIES.Other;
  return `
    <li data-id="${t.id}">
      <div class="icon">${c.icon}</div>
      <div class="info"><b>${escapeHtml(t.text)}</b><small>${t.category} · ${t.date}</small></div>
      <span class="amt ${t.type === 'income' ? 'plus' : 'minus'}">${t.type === 'income' ? '+' : '-'}${money(t.amount)}</span>
      ${withActions ? `<div class="actions">
        <button class="edit" title="Edit" aria-label="Edit">✏️</button>
        <button class="del" title="Delete" aria-label="Delete">🗑️</button>
      </div>` : ''}
    </li>`;
}

function donutHTML(byCat) {
  const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((s, r) => s + r[1], 0);
  if (!rows.length) return '<p class="empty">No expenses to show for this period.</p>';
  let acc = 0;
  const stops = rows.map(([cat, val]) => {
    const start = acc;
    acc += (val / total) * 100;
    return `${CATEGORIES[cat].color} ${start}% ${acc}%`;
  });
  return `
    <div class="chart-wrap">
      <div class="donut" style="background: conic-gradient(${stops.join(',')})">
        <div class="donut-center"><span>Spent</span><b>${money(total)}</b></div>
      </div>
      <ul class="legend">
        ${rows.map(([cat, val]) => `
          <li><span class="dot" style="background:${CATEGORIES[cat].color}"></span>${CATEGORIES[cat].icon} ${cat}
          <span class="pct">${Math.round((val / total) * 100)}% · ${money(val)}</span></li>`).join('')}
      </ul>
    </div>`;
}

function budgetBarHTML(spent, limit) {
  const pct = (spent / limit) * 100;
  const cls = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '';
  const left = limit - spent;
  const note = pct >= 100 ? `⚠️ Over budget by ${money(Math.abs(left))}`
    : pct >= 80 ? `Careful! Only ${money(left)} left`
    : `${money(left)} left`;
  return `
    <div class="budget-meta"><span>${money(spent)} spent</span><span>of ${money(limit)}</span></div>
    <div class="budget-track"><div class="budget-fill ${cls}" style="width:${Math.min(pct, 100)}%"></div></div>
    <p class="budget-note ${cls}">${note}</p>`;
}

function categoryOptions(selected, withAll) {
  return (withAll ? '<option value="all">All categories</option>' : '') +
    Object.keys(CATEGORIES).map(c => `<option${c === selected ? ' selected' : ''}>${c}</option>`).join('');
}

// ---------- Page shell: navbar, theme, toast, month picker ----------
function initPage(render) {
  const page = document.body.dataset.page;
  const showMonth = document.body.dataset.month !== 'off';

  const header = document.createElement('header');
  header.className = 'navbar';
  header.innerHTML = `
    <a class="logo" href="index.html">💸 Spend<span>Wise</span></a>
    <nav class="nav-links">
      ${PAGES.map(([href, label, icon]) =>
        `<a href="${href}" class="${href === page ? 'active' : ''}"><span>${icon}</span> ${label}</a>`).join('')}
    </nav>
    <div class="nav-right">
      ${showMonth ? '<select id="monthFilter" aria-label="Filter by month"></select>' : ''}
      <button id="themeToggle" class="icon-btn" title="Toggle dark mode" aria-label="Toggle dark mode">🌙</button>
    </div>`;
  document.body.prepend(header);

  const footer = document.createElement('footer');
  footer.innerHTML = 'SpendWise · your data stays in your browser';
  const toast = document.createElement('div');
  toast.id = 'toast'; toast.className = 'toast'; toast.setAttribute('role', 'status');
  document.body.append(footer, toast);

  // dark mode
  const themeBtn = $('themeToggle');
  const stored = localStorage.getItem('sw_theme');
  const dark = stored ? stored === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('dark', dark);
  themeBtn.textContent = dark ? '☀️' : '🌙';
  themeBtn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    themeBtn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('sw_theme', isDark ? 'dark' : 'light');
  });

  // month picker
  const fillMonths = () => {
    if (!showMonth) return;
    const months = new Set(App.tx.map(t => t.date.slice(0, 7)));
    months.add(currentMonth());
    if (App.month !== 'all') months.add(App.month);
    $('monthFilter').innerHTML = '<option value="all">All time</option>' +
      [...months].sort().reverse().map(m => `<option value="${m}">${monthName(m)}</option>`).join('');
    $('monthFilter').value = App.month;
  };
  if (showMonth) {
    $('monthFilter').addEventListener('change', e => {
      App.month = e.target.value;
      localStorage.setItem('sw_month', JSON.stringify(App.month));
      run();
    });
  }

  function run() {
    fillMonths();
    document.querySelectorAll('.cur').forEach(el => { el.textContent = App.settings.currency; });
    render();
  }
  run();
  return run;
}
