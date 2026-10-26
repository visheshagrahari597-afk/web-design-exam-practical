function lastSixMonths(endYm) {
  const [y, m] = endYm.split('-').map(Number);
  const out = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, m - 1 - i);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

initPage(() => {
  const list = scoped();
  const { income, expense } = totals(list);
  const byCat = expenseByCategory(list);
  const expenses = list.filter(t => t.type === 'expense');

  $('reportPeriod').textContent = App.month === 'all' ? 'All time' : monthName(App.month);

  // stat cards
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  let days = 1;
  if (App.month === 'all') {
    const dates = list.map(t => new Date(t.date).getTime());
    days = dates.length ? Math.max(1, Math.round((Math.max(...dates) - Math.min(...dates)) / 864e5) + 1) : 1;
  } else {
    const [y, m] = App.month.split('-').map(Number);
    days = App.month === currentMonth() ? new Date().getDate() : new Date(y, m, 0).getDate();
  }
  const stats = [
    ['💰', 'Saved', money(income - expense)],
    ['📅', 'Avg. daily spend', money(expense / days)],
    ['🏆', 'Top category', topCat ? `${CATEGORIES[topCat[0]].icon} ${topCat[0]}` : '–'],
    ['🧾', 'Transactions', list.length]
  ];
  $('stats').innerHTML = stats.map(([i, l, v]) =>
    `<div class="stat"><span class="stat-icon">${i}</span><small>${l}</small><b>${v}</b></div>`).join('');

  // bar chart (ends at the selected month, or this month for "All time")
  const months = lastSixMonths(App.month === 'all' ? currentMonth() : App.month);
  const data = months.map(m => ({ m, ...totals(inMonth(App.tx, m)) }));
  const max = Math.max(1, ...data.map(d => Math.max(d.income, d.expense)));
  $('bars').innerHTML = `
    <div class="bars">
      ${data.map(d => `
        <div class="bar-group">
          <div class="bar-pair">
            <div class="bar inc" style="height:${(d.income / max) * 100}%" title="Income ${money(d.income)}"></div>
            <div class="bar exp" style="height:${(d.expense / max) * 100}%" title="Expenses ${money(d.expense)}"></div>
          </div>
          <small>${monthName(d.m, true)}</small>
        </div>`).join('')}
    </div>
    <div class="bar-legend"><span><i class="dot inc"></i> Income</span><span><i class="dot exp"></i> Expenses</span></div>`;

  $('chart').innerHTML = donutHTML(byCat);

  const top = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
  $('top').innerHTML = top.length
    ? top.map(t => txItem(t, false)).join('')
    : '<p class="empty">No expenses yet.</p>';
});
