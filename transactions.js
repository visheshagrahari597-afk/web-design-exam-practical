const form = $('form'), list = $('list');
const renderList = {};
let editingId = null;

$('category').innerHTML = categoryOptions('Food');
$('catFilter').innerHTML = categoryOptions('all', true);
$('date').value = today();

const rerender = initPage(() => {
  const q = $('search').value.trim().toLowerCase();
  let shown = scoped().filter(t =>
    (!q || t.text.toLowerCase().includes(q)) &&
    ($('typeFilter').value === 'all' || t.type === $('typeFilter').value) &&
    ($('catFilter').value === 'all' || t.category === $('catFilter').value));

  const sorters = {
    new: (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
    old: (a, b) => a.date.localeCompare(b.date) || a.id - b.id,
    high: (a, b) => b.amount - a.amount,
    low: (a, b) => a.amount - b.amount
  };
  shown = shown.sort(sorters[$('sort').value]);
  renderList.current = shown;

  const { income, expense } = totals(shown);
  $('resultInfo').textContent = shown.length
    ? `${shown.length} transaction${shown.length > 1 ? 's' : ''} · Income ${money(income)} · Expenses ${money(expense)}`
    : '';
  list.innerHTML = shown.length
    ? shown.map(t => txItem(t, true)).join('')
    : '<p class="empty">No matching transactions. Try changing the filters.</p>';
});

['search', 'typeFilter', 'catFilter', 'sort'].forEach(id => {
  $(id).addEventListener(id === 'search' ? 'input' : 'change', rerender);
});

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
    App.tx = App.tx.map(t => t.id === editingId ? { ...t, ...data } : t);
    showToast('Transaction updated ✓');
  } else {
    App.tx.unshift({ id: Date.now(), ...data });
    showToast('Transaction added ✓');
  }
  saveTx();
  resetForm();
  rerender();
});

$('cancelEdit').addEventListener('click', resetForm);

list.addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li) return;
  const id = Number(li.dataset.id);

  if (e.target.closest('.del')) {
    App.tx = App.tx.filter(t => t.id !== id);
    saveTx();
    rerender();
    showToast('Transaction deleted');
  } else if (e.target.closest('.edit')) {
    const t = App.tx.find(x => x.id === id);
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

$('exportCsv').addEventListener('click', () => {
  const rows = renderList.current || [];
  if (!rows.length) return showToast('Nothing to export');
  const cell = v => `"${String(v).replace(/"/g, '""')}"`;
  const csv = ['Date,Description,Category,Type,Amount']
    .concat(rows.map(t => [t.date, cell(t.text), t.category, t.type, t.amount].join(',')))
    .join('\n');
  download('spendwise-transactions.csv', csv, 'text/csv');
  showToast('CSV downloaded ✓');
});
