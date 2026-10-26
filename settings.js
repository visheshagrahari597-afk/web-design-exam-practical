$('currency').innerHTML = CURRENCIES.map(c => `<option>${c}</option>`).join('');

initPage(() => {
  $('name').value = App.settings.name;
  $('currency').value = App.settings.currency;
});

$('profileForm').addEventListener('submit', e => {
  e.preventDefault();
  App.settings.name = $('name').value.trim();
  App.settings.currency = $('currency').value;
  saveSettings();
  showToast('Settings saved ✓');
});

$('exportJson').addEventListener('click', () => {
  const backup = { app: 'spendwise', version: 1, tx: App.tx, settings: App.settings, budgets: App.budgets };
  download(`spendwise-backup-${today()}.json`, JSON.stringify(backup, null, 2), 'application/json');
  showToast('Backup downloaded ✓');
});

$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.app !== 'spendwise' || !Array.isArray(data.tx)) throw new Error('bad file');
      if (!confirm('Replace your current data with this backup?')) return;
      const valid = data.tx.filter(t => t && t.text && t.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
        ['income', 'expense'].includes(t.type) && CATEGORIES[t.category]);
      App.tx = valid.map((t, i) => ({ ...t, id: Number(t.id) || Date.now() + i }));
      App.settings = { ...App.settings, ...data.settings };
      App.budgets = { overall: 0, cats: {}, ...data.budgets };
      saveTx(); saveSettings(); saveBudgets();
      showToast(`Restored ${valid.length} transactions ✓`);
      setTimeout(() => location.reload(), 900);
    } catch {
      showToast('That file is not a valid backup');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

$('sample').addEventListener('click', () => {
  if (App.tx.length && !confirm('Add sample data to your existing transactions?')) return;
  const sample = [
    [0, 'Pizza night', 650, 'expense', 'Food'],
    [1, 'Metro card recharge', 500, 'expense', 'Travel'],
    [3, 'Movie tickets', 800, 'expense', 'Fun'],
    [5, 'Groceries', 2100, 'expense', 'Food'],
    [7, 'Electricity bill', 1800, 'expense', 'Bills'],
    [9, 'New sneakers', 3200, 'expense', 'Shopping'],
    [12, 'Pharmacy', 450, 'expense', 'Health'],
    [2, 'Freelance project', 12000, 'income', 'Other'],
    [32, 'Monthly salary', 45000, 'income', 'Salary'],
    [34, 'Rent', 12000, 'expense', 'Bills'],
    [38, 'Dinner with friends', 1500, 'expense', 'Food'],
    [41, 'Weekend trip', 6500, 'expense', 'Travel'],
    [64, 'Monthly salary', 45000, 'income', 'Salary'],
    [66, 'Rent', 12000, 'expense', 'Bills'],
    [70, 'Online shopping', 2800, 'expense', 'Shopping'],
    [75, 'Gaming subscription', 700, 'expense', 'Fun']
  ];
  const now = new Date();
  const stamp = Date.now();
  sample.forEach(([ago, text, amount, type, category], i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ago);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    App.tx.push({ id: stamp + i, text, amount, type, category, date });
  });
  if (!App.budgets.overall) App.budgets.overall = 20000;
  saveTx(); saveBudgets();
  showToast('Sample data added ✓');
});

$('clearAll').addEventListener('click', () => {
  if (confirm('Delete ALL transactions and budgets? This cannot be undone.')) {
    App.tx = [];
    App.budgets = { overall: 0, cats: {} };
    saveTx(); saveBudgets();
    showToast('All data deleted');
  }
});
