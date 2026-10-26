// ---------- Config ----------
const CURRENCY = '₹';
const CATEGORIES = {
  Food:     { icon: '🍔', color: '#f97316' },
  Travel:   { icon: '✈️', color: '#3b82f6' },
  Shopping: { icon: '🛍️', color: '#ec4899' },
  Bills:    { icon: '🧾', color: '#8b5cf6' },
  Fun:      { icon: '🎮', color: '#eab308' },
  Salary:   { icon: '💼', color: '#10b981' },
  Other:    { icon: '📦', color: '#64748b' }
};

// ---------- Elements ----------
const $ = id => document.getElementById(id);
const form = $('form'), list = $('list'), toast = $('toast');
const monthFilter = $('monthFilter'), typeFilter = $('typeFilter');

// ---------- State ----------
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
let transactions = load('sw_transactions', []);
let budget = Number(load('sw_budget', 0)) || 0;
let editingId = null;
let selectedMonth = 'all';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const currentMonth = () => today().slice(0, 7);
const money = n => CURRENCY + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthName = ym => {
  const [y, m] = ym.split('-');
  return new Date(y, m - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};
const escapeHtml = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

function save() {
  localStorage.setItem('sw_transactions', JSON.stringify(transactions));
  localStorage.setItem('sw_budget', JSON.stringify(budget));
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ---------- Setup ----------
$('category').innerHTML = Object.keys(CATEGORIES).map(c => `<option>${c}</option>`).join('');
$('date').value = today();
$('budgetInput').value = budget || '';

function refreshMonthOptions() {
  const months = new Set(transactions.map(t => t.date.slice(0, 7)));
  months.add(currentMonth());
  const sorted = [...months].sort().reverse();
  if (selectedMonth !== 'all' && !months.has(selectedMonth)) selectedMonth = currentMonth();
  monthFilter.innerHTML =
    '<option value="all">All time</option>' +
    sorted.map(m => `<option value="${m}">${monthName(m)}</option>`).join('');
  monthFilter.value = selectedMonth;
}

// ---------- Render ----------
function render() {
  refreshMonthOptions();

  const scoped = transactions
    .filter(t => selectedMonth === 'all' || t.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  const income = scoped.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = scoped.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  $('income').textContent = money(income);
  $('expense').textContent = money(expense);
  $('balance').textContent = money(income - expense);
  $('periodLabel').textContent = selectedMonth === 'all' ? 'Total Balance' : `Balance · ${monthName(selectedMonth)}`;

  renderList(scoped);
  renderChart(scoped, expense);
  renderBudget(expense);
}

function renderList(scoped) {
  const shown = scoped.filter(t => typeFilter.value === 'all' || t.type === typeFilter.value);
  list.innerHTML = shown.length
    ? shown.map(t => `
      <li data-id="${t.id}">
        <div class="icon">${CATEGORIES[t.category].icon}</div>
        <div class="info"><b>${escapeHtml(t.text)}</b><small>${t.category} · ${t.date}</small></div>
        <span class="amt ${t.type === 'income' ? 'plus' : 'minus'}">${t.type === 'income' ? '+' : '-'}${money(t.amount)}</span>
        <div class="actions">
          <button class="edit" title="Edit" aria-label="Edit">✏️</button>
          <button class="del" title="Delete" aria-label="Delete">🗑️</button>
        </div>
      </li>`).join('')
    : '<p class="empty">No transactions here yet. Add one! 👈</p>';
}

function renderChart(scoped, totalExpense) {
  const totals = {};
  scoped.filter(t => t.type === 'expense').forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const chart = $('chart');

  if (!rows.length) {
    chart.innerHTML = '<p class="empty">Add some expenses to see your breakdown.</p>';
    return;
  }

  let acc = 0;
  const stops = rows.map(([cat, val]) => {
    const start = acc;
    acc += (val / totalExpense) * 100;
    return `${CATEGORIES[cat].color} ${start}% ${acc}%`;
  });

  chart.innerHTML = `
    <div class="donut" style="background: conic-gradient(${stops.join(',')})">
      <div class="donut-center"><span>Spent</span><b>${money(totalExpense)}</b></div>
    </div>
    <ul class="legend">
      ${rows.map(([cat, val]) => `
        <li><span class="dot" style="background:${CATEGORIES[cat].color}"></span>${CATEGORIES[cat].icon} ${cat}
        <span class="pct">${Math.round((val / totalExpense) * 100)}% · ${money(val)}</span></li>`).join('')}
    </ul>`;
}

function renderBudget(expense) {
  const box = $('budgetBox');
  if (!budget) {
    box.innerHTML = '<p class="budget-note">Set a monthly budget to track your spending.</p>';
    return;
  }
  if (selectedMonth === 'all') {
    box.innerHTML = '<p class="budget-note">Pick a month in the top bar to see budget progress.</p>';
    return;
  }
  const pct = (expense / budget) * 100;
  const cls = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '';
  const left = budget - expense;
  const note = pct >= 100
    ? `⚠️ Over budget by ${money(Math.abs(left))}`
    : pct >= 80
      ? `Careful! Only ${money(left)} left`
      : `${money(left)} left this month`;
  box.innerHTML = `
    <div class="budget-meta"><span>${money(expense)} spent</span><span>of ${money(budget)}</span></div>
    <div class="budget-track"><div class="budget-fill ${cls}" style="width:${Math.min(pct, 100)}%"></div></div>
    <p class="budget-note ${cls}">${note}</p>`;
}

// ---------- Add / edit ----------
function resetForm() {
  editingId = null;
  form.reset();
  $('date').value = today();
  $('formTitle').textContent = 'Add Transaction';
  $('submitBtn').textContent = '+ Add';
  $('cancelEdit').hidden = true;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    text: $('text').value.trim(),
    amount: parseFloat($('amount').value),
    type: document.querySelector('input[name="type"]:checked').value,
    category: $('category').value,
    date: $('date').value
  };
  if (!data.text || !(data.amount > 0)) return;

  if (editingId) {
    transactions = transactions.map(t => t.id === editingId ? { ...t, ...data } : t);
    showToast('Transaction updated ✓');
  } else {
    transactions.unshift({ id: Date.now(), ...data });
    showToast('Transaction added ✓');
  }
  save();
  resetForm();
  render();
});

$('cancelEdit').addEventListener('click', resetForm);

list.addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li) return;
  const id = Number(li.dataset.id);

  if (e.target.closest('.del')) {
    transactions = transactions.filter(t => t.id !== id);
    save(); render();
    showToast('Transaction deleted');
  } else if (e.target.closest('.edit')) {
    const t = transactions.find(x => x.id === id);
    editingId = id;
    $('text').value = t.text;
    $('amount').value = t.amount;
    $(t.type === 'income' ? 'typeIncome' : 'typeExpense').checked = true;
    $('category').value = t.category;
    $('date').value = t.date;
    $('formTitle').textContent = 'Edit Transaction';
    $('submitBtn').textContent = 'Save changes';
    $('cancelEdit').hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('text').focus();
  }
});

// ---------- Budget, filters, clear ----------
$('saveBudget').addEventListener('click', () => {
  budget = Math.max(0, Number($('budgetInput').value) || 0);
  save(); render();
  showToast(budget ? 'Budget saved ✓' : 'Budget removed');
});

monthFilter.addEventListener('change', () => { selectedMonth = monthFilter.value; render(); });
typeFilter.addEventListener('change', render);

$('clearAll').addEventListener('click', () => {
  if (transactions.length && confirm('Delete ALL transactions? This cannot be undone.')) {
    transactions = [];
    save(); resetForm(); render();
    showToast('All data cleared');
  }
});

// ---------- Dark mode ----------
const themeBtn = $('themeToggle');
const dark = localStorage.getItem('sw_theme') === 'dark' ||
  (!localStorage.getItem('sw_theme') && matchMedia('(prefers-color-scheme: dark)').matches);
document.body.classList.toggle('dark', dark);
themeBtn.textContent = dark ? '☀️' : '🌙';
themeBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  themeBtn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('sw_theme', isDark ? 'dark' : 'light');
});

// start on the current month
selectedMonth = currentMonth();
render();
