
    (function () {
      var state = {
        accounts: [],
        reports: null,
        tax: null,
        owner: null,
        recordSummary: null,
        payables: []
      };

      function qs(selector, root) { return (root || document).querySelector(selector); }
      function qsa(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
      function money(n) {
        return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(n || 0));
      }
      function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (m) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
        });
      }
      function setStatus(message, type) {
        qsa("[data-admin-shell-status]").forEach(function (node) {
          node.hidden = !message;
          node.textContent = message || "";
          node.dataset.state = type || "";
        });
      }
      function todayIso() { return new Date().toISOString().slice(0, 10); }
      function selectedMonth() { return Number(qs("#monthSelect").value || new Date().getMonth() + 1); }
      function selectedYear() { return Number(qs("#yearSelect").value || new Date().getFullYear()); }
      function selectedPayableStatus() { return String(qs("#payableStatusFilter").value || "open"); }
      function apiJson(url, options) {
        return fetch(url, Object.assign({ credentials: "include" }, options || {})).then(function (res) {
          return res.json().catch(function () { return null; }).then(function (out) {
            if (!res.ok || !(out && out.ok)) {
              throw new Error((out && out.error) || "Request failed.");
            }
            return out;
          });
        });
      }
      function buildYears() {
        var now = new Date().getFullYear();
        var years = [];
        for (var year = now - 3; year <= now + 1; year += 1) years.push(year);
        return years;
      }
      function bootFilters() {
        var monthNode = qs("#monthSelect");
        var yearNode = qs("#yearSelect");
        var now = new Date();
        monthNode.innerHTML = Array.prototype.map.call(Array.from({ length: 12 }), function (_, idx) {
          var value = idx + 1;
          return '<option value="' + value + '">' + new Date(2000, idx, 1).toLocaleString("en-CA", { month: "long" }) + '</option>';
        }).join("");
        yearNode.innerHTML = buildYears().map(function (year) {
          return '<option value="' + year + '">' + year + '</option>';
        }).join("");
        monthNode.value = String(now.getMonth() + 1);
        yearNode.value = String(now.getFullYear());
        qs("#entryDate").value = todayIso();
        qs("#entryDueDate").value = todayIso();
        qs("#remitDate").value = todayIso();
      }
      function accountOptions(filterFn, selectedValue) {
        return state.accounts.filter(filterFn).map(function (account) {
          var selected = String(account.code) === String(selectedValue || "") ? ' selected' : '';
          return '<option value="' + esc(account.code) + '"' + selected + '>' + esc(account.label + ' (' + account.code + ')') + '</option>';
        }).join("");
      }
      function fillAccountSelects() {
        var expenseHtml = accountOptions(function (account) { return String(account.account_type) === 'expense'; }, 'shop_supplies');
        var paymentHtml = accountOptions(function (account) { return ['asset', 'liability', 'equity'].includes(String(account.account_type)); }, 'cash');
        qsa('select[data-account-role="expense"]').forEach(function (node) { node.innerHTML = expenseHtml; if (!node.value) node.value = 'shop_supplies'; });
        qsa('select[data-account-role="payment"]').forEach(function (node) {
          node.innerHTML = paymentHtml;
          if (!node.value) node.value = 'cash';
        });
        applyEntryMode();
      }
      function applyEntryMode() {
        var mode = String(qs('#entryMode').value || 'cash');
        var due = qs('#entryDueDate');
        var payment = qs('#entryPaymentAccount');
        due.disabled = mode !== 'payable';
        if (mode === 'payable') {
          payment.value = 'accounts_payable';
        } else if (!payment.value || payment.value === 'accounts_payable') {
          payment.value = 'cash';
        }
      }
      function renderRecordRows(rows) {
        var wrap = qs('#recordsWrap');
        rows = Array.isArray(rows) ? rows : [];
        if (!rows.length) {
          wrap.innerHTML = '<div class="mini">No accounting records found.</div>';
          return;
        }
        wrap.innerHTML = rows.map(function (row) {
          return (
            '<article class="card">' +
              '<div class="row wrap" style="justify-content:space-between;gap:10px">' +
                '<div>' +
                  '<div class="kicker">' + esc(row.order_status || 'open') + ' · ' + esc(row.accounting_stage || 'open') + '</div>' +
                  '<h3 style="margin:6px 0">' + esc(row.customer_name || 'Unknown customer') + '</h3>' +
                  '<div class="mini">' + esc(row.customer_email || '') + (row.customer_phone ? ' · ' + esc(row.customer_phone) : '') + '</div>' +
                '</div>' +
                '<div class="mini">' + esc(row.service_date || '') + (row.package_code ? ' · ' + esc(row.package_code) : '') + '</div>' +
              '</div>' +
              '<div class="admin-grid-3" style="margin-top:12px">' +
                '<div><strong>Total</strong><div>' + money(row.total_cad || 0) + '</div></div>' +
                '<div><strong>Collected</strong><div>' + money(row.collected_total_cad || 0) + '</div></div>' +
                '<div><strong>Balance</strong><div>' + money(row.balance_due_cad || 0) + '</div></div>' +
              '</div>' +
              '<div class="mini" style="margin-top:10px">Booking ' + esc(row.booking_id || '') + ' · Updated ' + esc(new Date(row.updated_at || row.created_at || Date.now()).toLocaleString()) + '</div>' +
            '</article>'
          );
        }).join('');
      }
      function renderProfitLoss(report) {
        var summary = qs('#profitLossSummary');
        var accounts = qs('#profitLossAccounts');
        if (!report) {
          summary.innerHTML = '<div class="mini">No report loaded.</div>';
          accounts.innerHTML = '';
          return;
        }
        qs('#profitLossPeriod').textContent = (report.period_start || '') + ' to ' + ((report.period_end_exclusive || '').replace(/-01$/, ' month end'));
        summary.innerHTML = [
          ['Revenue', money(report.totals && report.totals.revenue || 0)],
          ['Expenses', money(report.totals && report.totals.expense || 0)],
          ['Net income', money(report.totals && report.totals.net_income || 0)]
        ].map(function (row) {
          return '<div class="table-lite__row"><span>' + esc(row[0]) + '</span><span>' + esc(row[1]) + '</span></div>';
        }).join('');
        accounts.innerHTML = (report.by_account || []).filter(function (row) {
          return ['revenue', 'expense'].includes(String(row.account_type || '')) && Number(row.amount_cad || 0) !== 0;
        }).map(function (row) {
          return '<div class="table-lite__row"><span>' + esc(row.label || row.account_code) + '</span><span>' + esc(money(row.amount_cad || 0)) + '</span></div>';
        }).join('') || '<div class="mini">No revenue or expense rows for this month.</div>';
      }
      function renderBalanceSheet(report) {
        var wrap = qs('#balanceSheetWrap');
        if (!report) {
          wrap.innerHTML = '<div class="mini">No balance sheet loaded.</div>';
          return;
        }
        qs('#balanceSheetDate').textContent = report.as_of || '—';
        function section(title, rows, extraRows) {
          var html = '<article><h3 style="margin:0 0 8px">' + esc(title) + '</h3><div class="table-lite">';
          html += (rows || []).map(function (row) {
            return '<div class="table-lite__row"><span>' + esc(row.label || row.account_code) + '</span><span>' + esc(money(row.amount_cad || 0)) + '</span></div>';
          }).join('') || '<div class="mini">No rows.</div>';
          html += (extraRows || []).map(function (row) {
            return '<div class="table-lite__row"><span>' + esc(row.label) + '</span><span>' + esc(money(row.amount_cad || 0)) + '</span></div>';
          }).join('');
          html += '</div></article>';
          return html;
        }
        wrap.innerHTML =
          section('Assets', report.sections && report.sections.assets, []) +
          section('Liabilities', report.sections && report.sections.liabilities, []) +
          section('Equity', report.sections && report.sections.equity, [{ label: 'Retained earnings / net income to date', amount_cad: report.totals && report.totals.retained_earnings_cad || 0 }]) +
          '<article class="table-lite">' +
            '<div class="table-lite__row"><span>Total assets</span><span>' + esc(money(report.totals && report.totals.assets_cad || 0)) + '</span></div>' +
            '<div class="table-lite__row"><span>Liabilities and equity</span><span>' + esc(money(report.totals && report.totals.liabilities_and_equity_cad || 0)) + '</span></div>' +
            '<div class="table-lite__row"><span>Balance delta</span><span class="' + ((report.totals && Math.abs(Number(report.totals.balance_delta_cad || 0)) > 0.01) ? 'danger-note' : '') + '">' + esc(money(report.totals && report.totals.balance_delta_cad || 0)) + '</span></div>' +
          '</article>';
      }
      function renderCashFlow(report) {
        var totals = qs('#cashFlowTotals');
        var entries = qs('#cashFlowEntries');
        if (!report) {
          totals.innerHTML = '<div class="mini">No cash-flow report loaded.</div>';
          entries.innerHTML = '';
          return;
        }
        qs('#cashFlowPeriod').textContent = report.period_start + ' to ' + report.period_end_exclusive;
        totals.innerHTML = [
          ['Opening cash', report.totals && report.totals.opening_cash_cad || 0],
          ['Operating', report.totals && report.totals.operating_cad || 0],
          ['Investing', report.totals && report.totals.investing_cad || 0],
          ['Financing', report.totals && report.totals.financing_cad || 0],
          ['Net change', report.totals && report.totals.net_change_cad || 0],
          ['Closing cash', report.totals && report.totals.closing_cash_cad || 0]
        ].map(function (row) {
          return '<div class="table-lite__row"><span>' + esc(row[0]) + '</span><span>' + esc(money(row[1])) + '</span></div>';
        }).join('');
        entries.innerHTML = (report.entries || []).slice(-60).reverse().map(function (row) {
          return '<div class="table-lite__row"><span>' + esc(row.entry_date || '') + ' · ' + esc(row.category || '') + '<div class="mini">' + esc(row.entry_type || '') + (row.memo ? ' · ' + esc(row.memo) : '') + '</div></span><span>' + esc(money(row.cash_delta_cad || 0)) + '</span></div>';
        }).join('') || '<div class="mini">No cash entries found in this month.</div>';
      }
      function renderInventoryCosts(report) {
        var summary = qs('#inventoryCostSummary');
        var missing = qs('#inventoryCostMissing');
        if (!report) {
          summary.innerHTML = '<div class="mini">No inventory-cost report loaded.</div>';
          missing.innerHTML = '';
          return;
        }
        summary.innerHTML = [
          ['Active items', report.totals && report.totals.active_items || 0],
          ['Costed items', report.totals && report.totals.costed_items || 0],
          ['Missing cost items', report.totals && report.totals.missing_cost_items || 0],
          ['Missing cost with stock on hand', report.totals && report.totals.missing_cost_on_hand_items || 0],
          ['Coverage', String(report.totals && report.totals.cost_coverage_pct || 0) + '%'],
          ['Costed inventory value', money(report.totals && report.totals.costed_inventory_value_cad || 0)]
        ].map(function (row) {
          return '<div class="table-lite__row"><span>' + esc(row[0]) + '</span><span>' + esc(row[1]) + '</span></div>';
        }).join('');
        missing.innerHTML = (report.items_missing_cost || []).map(function (row) {
          return '<div class="table-lite__row"><span>' + esc(row.name || row.item_key) + '<div class="mini">' + esc((row.item_key || '') + (row.preferred_vendor ? ' · ' + row.preferred_vendor : '')) + '</div></span><span>' + esc(String(row.qty_on_hand || 0) + ' ' + (row.unit_label || '')) + '</span></div>';
        }).join('') || '<div class="mini">All active inventory items currently have cost data.</div>';
      }
      function renderPayables(payables) {
        var wrap = qs('#payablesWrap');
        payables = Array.isArray(payables) ? payables : [];
        qs('#payablesMeta').textContent = payables.length + ' records';
        if (!payables.length) {
          wrap.innerHTML = '<div class="mini">No payables found for this filter.</div>';
          return;
        }
        var paymentOptions = accountOptions(function (account) { return ['asset', 'liability', 'equity'].includes(String(account.account_type)); }, 'cash');
        wrap.innerHTML = payables.map(function (row) {
          var settlements = Array.isArray(row.settlements) ? row.settlements : [];
          var settlementHtml = settlements.length
            ? settlements.map(function (item) {
                return '<div class="settlement-item"><strong>' + esc(item.entry_date || '') + '</strong> · ' + esc(money(item.total_cad || 0)) + '<div class="mini">' + esc(item.entry_type || '') + (item.memo ? ' · ' + esc(item.memo) : '') + '</div></div>';
              }).join('')
            : '<div class="mini">No settlements posted yet.</div>';
          var settleForm = Number(row.balance_due_cad || 0) > 0 ? (
            '<form class="stack payable-settle-form" data-entry-id="' + esc(row.id) + '">' +
              '<div class="admin-grid-3">' +
                '<label>Amount<input name="amount_cad" type="number" min="0.01" step="0.01" value="' + esc(Number(row.balance_due_cad || 0).toFixed(2)) + '" /></label>' +
                '<label>Payment date<input name="payment_date" type="date" value="' + esc(todayIso()) + '" /></label>' +
                '<label>Payment account<select name="payment_account">' + paymentOptions + '</select></label>' +
              '</div>' +
              '<label>Memo<textarea name="memo" rows="2" placeholder="Optional settlement note"></textarea></label>' +
              '<div class="row wrap"><button class="btn ghost" type="submit">Post settlement</button></div>' +
            '</form>'
          ) : '<div class="tag">Paid in full</div>';
          return (
            '<article class="payable-card">' +
              '<div class="row wrap" style="justify-content:space-between;gap:10px">' +
                '<div>' +
                  '<div class="kicker">' + esc(row.payment_status || 'open') + '</div>' +
                  '<h3 style="margin:6px 0">' + esc(row.vendor_name || row.payee_name || 'Vendor bill') + '</h3>' +
                  '<div class="mini">Entry ' + esc(row.id || '') + (row.due_date ? ' · Due ' + esc(row.due_date) : '') + '</div>' +
                '</div>' +
                '<div class="mini">' + esc(row.entry_date || '') + '</div>' +
              '</div>' +
              '<div class="admin-grid-3" style="margin-top:12px">' +
                '<div><strong>Total</strong><div>' + money(row.total_cad || 0) + '</div></div>' +
                '<div><strong>Settled</strong><div>' + money(row.settled_amount_cad || 0) + '</div></div>' +
                '<div><strong>Balance</strong><div>' + money(row.balance_due_cad || 0) + '</div></div>' +
              '</div>' +
              (row.memo ? '<div class="mini" style="margin-top:10px">' + esc(row.memo) + '</div>' : '') +
              '<div class="hr"></div>' +
              '<div><strong>Settlement history</strong><div class="settlement-list">' + settlementHtml + '</div></div>' +
              '<div class="hr"></div>' + settleForm +
            '</article>'
          );
        }).join('');

        qsa('.payable-settle-form', wrap).forEach(function (form) {
          form.addEventListener('submit', async function (event) {
            event.preventDefault();
            var entryId = form.getAttribute('data-entry-id');
            var payload = {
              entry_id: entryId,
              amount_cad: Number(form.elements.amount_cad.value || 0),
              payment_date: form.elements.payment_date.value || todayIso(),
              payment_account: form.elements.payment_account.value || 'cash',
              memo: form.elements.memo.value.trim()
            };
            try {
              setStatus('Posting settlement…');
              await apiJson('/api/admin/accounting_payable_settle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              setStatus('Settlement posted.', 'success');
              await refreshAll();
            } catch (err) {
              setStatus(err && err.message ? err.message : 'Could not post settlement.', 'error');
            }
          });
        });
      }
      function renderSummaryCards() {
        var recordSummary = state.recordSummary || {};
        var tax = state.tax || {};
        var pnl = state.reports && state.reports.profit_loss || {};
        var statements = state.reports && state.reports.statements || {};
        var inventory = statements.inventory_costs || {};
        var payables = state.payables || [];
        var outstanding = payables.reduce(function (sum, row) { return sum + Number(row.balance_due_cad || 0); }, 0);
        var openCount = payables.filter(function (row) { return ['open', 'partial'].includes(String(row.payment_status || '')); }).length;
        qs('#sumOpen').textContent = String(recordSummary.open || 0);
        qs('#sumPayables').textContent = money(outstanding);
        qs('#sumPayablesCount').textContent = openCount + ' vendor bills with balance due';
        qs('#sumTaxDue').textContent = money(tax.suggested_remittance_cad || 0);
        qs('#sumNetIncome').textContent = money(pnl.totals && pnl.totals.net_income || 0);
        qs('#sumClosingCash').textContent = money(statements.cash_flow && statements.cash_flow.totals && statements.cash_flow.totals.closing_cash_cad || 0);
        qs('#sumMissingCosts').textContent = String(inventory.totals && inventory.totals.missing_cost_items || 0);
        qs('#sumCostCoverage').textContent = String(inventory.totals && inventory.totals.cost_coverage_pct || 0) + '% coverage';
      }
      async function loadAccounts() {
        var out = await apiJson('/api/admin/accounting_accounts_list');
        state.accounts = Array.isArray(out.accounts) ? out.accounts : [];
        fillAccountSelects();
      }
      async function loadRecords() {
        var q = qs('#searchQ').value.trim();
        var out = await apiJson('/api/admin/accounting_list' + (q ? ('?q=' + encodeURIComponent(q)) : ''));
        state.recordSummary = out.summary || {};
        renderRecordRows(out.records || []);
      }
      async function loadPayables() {
        var status = selectedPayableStatus();
        var out = await apiJson('/api/admin/accounting_payables_list?status=' + encodeURIComponent(status));
        state.payables = Array.isArray(out.payables) ? out.payables : [];
        renderPayables(state.payables);
      }
      async function loadReports() {
        var month = selectedMonth();
        var year = selectedYear();
        var results = await Promise.all([
          apiJson('/api/admin/accounting_report?month=' + month + '&year=' + year),
          apiJson('/api/admin/accounting_statement_report?month=' + month + '&year=' + year),
          apiJson('/api/admin/accounting_tax_report?month=' + month + '&year=' + year),
          apiJson('/api/admin/accounting_owner_report?month=' + month + '&year=' + year)
        ]);
        state.reports = {
          profit_loss: results[0].report || null,
          statements: {
            balance_sheet: results[1].balance_sheet || null,
            cash_flow: results[1].cash_flow || null,
            inventory_costs: results[1].inventory_costs || null
          }
        };
        state.tax = results[2].report || null;
        state.owner = results[3].report || null;
        renderProfitLoss(state.reports.profit_loss);
        renderBalanceSheet(state.reports.statements.balance_sheet);
        renderCashFlow(state.reports.statements.cash_flow);
        renderInventoryCosts(state.reports.statements.inventory_costs);
        qs('#remitAmount').value = Number(state.tax && state.tax.suggested_remittance_cad || 0).toFixed(2);
      }
      async function refreshAll() {
        setStatus('Refreshing accounting workspace…');
        await Promise.all([loadRecords(), loadPayables(), loadReports()]);
        renderSummaryCards();
        setStatus('Accounting workspace refreshed.', 'success');
      }
      function bindActions() {
        qs('#filterForm').addEventListener('submit', async function (event) {
          event.preventDefault();
          try {
            await refreshAll();
          } catch (err) {
            setStatus(err && err.message ? err.message : 'Could not refresh accounting workspace.', 'error');
          }
        });

        qs('#entryMode').addEventListener('change', applyEntryMode);

        qs('#entryForm').addEventListener('submit', async function (event) {
          event.preventDefault();
          var payload = {
            mode: qs('#entryMode').value,
            entry_date: qs('#entryDate').value || todayIso(),
            due_date: qs('#entryDueDate').value || null,
            vendor_name: qs('#entryVendor').value.trim(),
            amount_cad: Number(qs('#entryAmount').value || 0),
            tax_cad: Number(qs('#entryTax').value || 0),
            expense_account: qs('#entryExpenseAccount').value,
            payment_account: qs('#entryPaymentAccount').value,
            memo: qs('#entryMemo').value.trim()
          };
          try {
            setStatus('Posting accounting entry…');
            await apiJson('/api/admin/accounting_entry_save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            qs('#entryAmount').value = '0.00';
            qs('#entryTax').value = '0.00';
            qs('#entryMemo').value = '';
            setStatus('Accounting entry posted.', 'success');
            await refreshAll();
          } catch (err) {
            setStatus(err && err.message ? err.message : 'Could not post accounting entry.', 'error');
          }
        });

        qs('#fillSuggestedRemitBtn').addEventListener('click', function () {
          qs('#remitAmount').value = Number(state.tax && state.tax.suggested_remittance_cad || 0).toFixed(2);
        });

        qs('#remitForm').addEventListener('submit', async function (event) {
          event.preventDefault();
          var payload = {
            month: selectedMonth(),
            year: selectedYear(),
            payment_date: qs('#remitDate').value || todayIso(),
            amount_cad: Number(qs('#remitAmount').value || 0),
            payment_account: qs('#remitPaymentAccount').value || 'cash',
            memo: qs('#remitMemo').value.trim()
          };
          try {
            setStatus('Posting tax remittance…');
            await apiJson('/api/admin/accounting_remittance_post', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            qs('#remitMemo').value = '';
            setStatus('Tax remittance posted.', 'success');
            await refreshAll();
          } catch (err) {
            setStatus(err && err.message ? err.message : 'Could not post remittance.', 'error');
          }
        });

        qsa('[data-export]').forEach(function (button) {
          button.addEventListener('click', function () {
            var type = button.getAttribute('data-export');
            var url = '/api/admin/accounting_export?type=' + encodeURIComponent(type) + '&month=' + selectedMonth() + '&year=' + selectedYear();
            if (type === 'payables') url += '&status=' + encodeURIComponent(selectedPayableStatus());
            window.location.href = url;
          });
        });
      }

      window.AdminShell.boot({
        pageKey: 'admin-accounting',
        onReady: async function () {
          if (window.AdminMenu && typeof window.AdminMenu.render === 'function') {
            window.AdminMenu.render({ currentPage: 'admin-accounting' });
          }
          bootFilters();
          bindActions();
          await loadAccounts();
          await refreshAll();
        }
      });
    })();
  