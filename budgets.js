const rerender = initPage(() => {
  const month = budgetMonth();
  const monthTx = inMonth(App.tx, month);
  const spentByCat = expenseByCategory(monthTx);

  $('budgetPeriod').textContent = `Tracking ${monthName(month)}` +
    (App.month === 'all' ? ' (pick another month in the top bar)' : '');

  // overall
  if (document.activeElement !== $('budgetInput')) $('budgetInput').value = App.budgets.overall || '';
  $('budgetBox').innerHTML = App.budgets.overall
    ? budgetBarHTML(totals(monthTx).expense, App.budgets.overall)
    : '<p class="budget-note">No overall budget set.</p>';

  // per category
  $('catGrid').innerHTML = EXPENSE_CATS.map(cat => {
    const limit = App.budgets.cats[cat] || 0;
    const spent = spentByCat[cat] || 0;
    return `
      <div class="cat-card">
        <div class="cat-head"><span>${CATEGORIES[cat].icon} ${cat}</span>
          <input type="number" min="0" step="50" placeholder="Limit" data-cat="${cat}" value="${limit || ''}" aria-label="${cat} limit">
        </div>
        ${limit ? budgetBarHTML(spent, limit) : `<p class="budget-note">Spent ${money(spent)} · no limit</p>`}
      </div>`;
  }).join('');
});

$('saveBudget').addEventListener('click', () => {
  App.budgets.overall = Math.max(0, Number($('budgetInput').value) || 0);
  saveBudgets();
  rerender();
  showToast(App.budgets.overall ? 'Budget saved ✓' : 'Budget removed');
});

$('catGrid').addEventListener('change', e => {
  const cat = e.target.dataset.cat;
  if (!cat) return;
  const v = Math.max(0, Number(e.target.value) || 0);
  if (v) App.budgets.cats[cat] = v; else delete App.budgets.cats[cat];
  saveBudgets();
  rerender();
  showToast(`${cat} limit ${v ? 'saved ✓' : 'removed'}`);
});
