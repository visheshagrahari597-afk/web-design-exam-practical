initPage(() => {
  const list = scoped();
  const { income, expense } = totals(list);

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  $('greeting').textContent = `${hello}${App.settings.name ? ', ' + App.settings.name : ''} 👋`;

  $('periodLabel').textContent = App.month === 'all' ? 'Total Balance' : `Balance · ${monthName(App.month)}`;
  $('balance').textContent = money(income - expense);
  $('income').textContent = money(income);
  $('expense').textContent = money(expense);
  $('savings').textContent = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) + '%' : '–';

  $('chart').innerHTML = donutHTML(expenseByCategory(list));

  // budget
  const spent = totals(inMonth(App.tx, budgetMonth())).expense;
  $('budgetBox').innerHTML = App.budgets.overall
    ? (App.month === 'all' ? `<p class="budget-note">Showing ${monthName(budgetMonth())}.</p>` : '') +
      budgetBarHTML(spent, App.budgets.overall)
    : '<p class="budget-note">No budget set yet. <a class="link" href="budgets.html">Set one →</a></p>';

  // recent
  const recent = list.slice(0, 6);
  $('list').innerHTML = recent.length
    ? recent.map(t => txItem(t, false)).join('')
    : '<p class="empty">Nothing here yet. Add your first transaction, or load sample data in Settings.</p>';
});
