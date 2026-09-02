    (function () {
      var state = {
        accounts: [],
        reports: null,
        tax: null,
        owner: null,
        recordSummary: null,
        payables: [],
        monthEndChecklist: null,
        yearEnd: null,
        bankReconciliation: null,
        payrollPayouts: null,
        recurringExpenses: [],
        accountingDocuments: [],
        periodCloses: []
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

      function currentMonthStart() {
        return selectedYear() + '-' + String(selectedMonth()).padStart(2, '0') + '-01';
      }
      function monthLabel() {
        return selectedYear() + '-' + String(selectedMonth()).padStart(2, '0');
      }
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
      function renderReceivables(report) {
        var summary = qs('#receivablesSummary');
        var rowsWrap = qs('#receivablesRows');
        if (!report) {
          summary.innerHTML = '<div class="mini">No receivables-aging report loaded.</div>';
          rowsWrap.innerHTML = '';
          return;
        }
        qs('#receivablesAsOf').textContent = report.as_of || '—';
        summary.innerHTML = [
          ['Current', money(report.totals && report.totals.current_cad || 0)],
          ['1-30 days', money(report.totals && report.totals.due_1_30_cad || 0)],
          ['31-60 days', money(report.totals && report.totals.due_31_60_cad || 0)],
          ['61-90 days', money(report.totals && report.totals.due_61_90_cad || 0)],
          ['91+ days', money(report.totals && report.totals.due_91_plus_cad || 0)],
          ['Total', money(report.totals && report.totals.total_balance_cad || 0)]
        ].map(function (row) {
          return '<div class="table-lite__row"><span>' + esc(row[0]) + '</span><span>' + esc(row[1]) + '</span></div>';
        }).join('');
        rowsWrap.innerHTML = (report.rows || []).slice(0, 40).map(function (row) {
          return '<div class="table-lite__row"><span>' + esc(row.customer_name || 'Customer') + '<div class="mini">' + esc(row.service_date || '') + (row.package_code ? ' · ' + esc(row.package_code) : '') + (row.customer_email ? ' · ' + esc(row.customer_email) : '') + '</div></span><span>' + esc(money(row.balance_due_cad || 0)) + '<div class="mini">' + esc(String(row.days_outstanding || 0)) + ' days · ' + esc(row.aging_bucket || '') + '</div></span></div>';
        }).join('') || '<div class="mini">No open receivables found.</div>';
      }
      function renderProfitability(report) {
        var summary = qs('#profitabilitySummary');
        var rowsWrap = qs('#profitabilityRows');
        if (!report) {
          summary.innerHTML = '<div class="mini">No profitability report loaded.</div>';
          rowsWrap.innerHTML = '';
          return;
        }
        qs('#profitabilityPeriod').textContent = (report.period_start || '') + ' to ' + (report.period_end_exclusive || '');
        qs('#profitabilityMethodNote').textContent = report.method_note || '';
        summary.innerHTML = [
          ['Recognized revenue', money(report.totals && report.totals.recognized_revenue_cad || 0)],
          ['Collected revenue', money(report.totals && report.totals.collected_revenue_cad || 0)],
          ['Direct COGS', money(report.totals && report.totals.direct_cogs_cad || 0)],
          ['Estimated direct labor', money(report.totals && report.totals.estimated_direct_labor_cad || 0)],
          ['Contribution after labor', money(report.totals && report.totals.estimated_contribution_after_labor_cad || 0)],
          ['Allocated overhead pool', money(report.totals && report.totals.overhead_pool_cad || 0)],
          ['Estimated net', money(report.totals && report.totals.estimated_net_after_overhead_cad || 0)]
        ].map(function (row) {
          return '<div class="table-lite__row"><span>' + esc(row[0]) + '</span><span>' + esc(row[1]) + '</span></div>';
        }).join('');
        rowsWrap.innerHTML = (report.rows || []).slice(0, 40).map(function (row) {
          return '<div class="table-lite__row"><span>' + esc(row.customer_name || 'Customer') + '<div class="mini">' + esc(row.service_date || '') + (row.package_code ? ' · ' + esc(row.package_code) : '') + (row.booking_id ? ' · ' + esc(row.booking_id) : '') + '</div></span><span>' + esc(money(row.estimated_contribution_after_labor_cad || row.estimated_net_after_overhead_cad || 0)) + '<div class="mini">Revenue ' + esc(money(row.recognized_revenue_cad || 0)) + ' · COGS ' + esc(money(row.direct_cogs_cad || 0)) + ' · Labor ' + esc(money(row.estimated_direct_labor_cad || 0)) + ' · Overhead ' + esc(money(row.allocated_overhead_cad || 0)) + ' · Net ' + esc(money(row.estimated_net_after_overhead_cad || 0)) + '</div></span></div>';
        }).join('') || '<div class="mini">No booking profitability rows found for this month.</div>';
      }

function renderYearEnd(report) {
  var summary = qs('#yearEndSummary');
  var monthsWrap = qs('#yearEndMonths');
  var expensesWrap = qs('#yearEndExpenses');
  if (!report) {
    qs('#yearEndPeriod').textContent = '—';
    summary.innerHTML = '<div class="mini">No year-end package loaded yet.</div>';
    monthsWrap.innerHTML = '';
    expensesWrap.innerHTML = '';
    return;
  }
  qs('#yearEndPeriod').textContent = String(report.year || selectedYear());
  qs('#yearEndNotes').textContent = report.reporting_basis_note || 'Operational year-end summary for accountant handoff.';
  var totals = report.totals || {};
  summary.innerHTML = [
    ['Revenue', money(totals.revenue_cad || 0)],
    ['Expense', money(totals.expense_cad || 0)],
    ['Net income', money(totals.net_income_cad || 0)],
    ['HST collected', money(totals.hst_collected_cad || 0)],
    ['HST debits / ITCs', money(totals.hst_debits_cad || 0)],
    ['Year-end tax payable', money(totals.year_end_sales_tax_payable_cad || 0)],
    ['Year-end receivables', money(totals.year_end_receivables_cad || 0)],
    ['Open payables', money(totals.year_end_open_payables_cad || 0)],
    ['Owner draw', money(totals.owner_draw_cad || 0)],
    ['Year-end cash', money(totals.year_end_cash_cad || 0)]
  ].map(function (row) {
    return '<div class="table-lite__row"><span>' + esc(row[0]) + '</span><span>' + esc(row[1]) + '</span></div>';
  }).join('');
  monthsWrap.innerHTML = (report.monthly || []).map(function (row) {
    return '<div class="table-lite__row"><span>' + esc(row.month_label || row.month) + '</span><span>' + esc(money(row.net_income_cad || 0)) + '<div class="mini">Revenue ' + esc(money(row.revenue_cad || 0)) + ' · Expense ' + esc(money(row.expense_cad || 0)) + ' · HST ' + esc(money(row.hst_net_activity_cad || 0)) + '</div></span></div>';
  }).join('') || '<div class="mini">No monthly year-end rows found.</div>';
  expensesWrap.innerHTML = (report.expense_categories || []).slice(0, 18).map(function (row) {
    return '<div class="table-lite__row"><span>' + esc(row.label || row.account_code) + '<div class="mini">' + esc(row.account_code || '') + '</div></span><span>' + esc(money(row.amount_cad || 0)) + '</span></div>';
  }).join('') || '<div class="mini">No expense categories found yet.</div>';
}


      function renderDocuments(items) {
        var wrap = qs('#documentRows');
        items = Array.isArray(items) ? items : [];
        qs('#documentMeta').textContent = items.length ? (items.length + ' document links loaded') : 'No accounting documents loaded yet.';
        wrap.innerHTML = items.length ? items.map(function (row) {
          var href = row.file_url || row.storage_path || '';
          return '<div class="doc-card"><div class="row wrap" style="justify-content:space-between;gap:10px"><div><strong>' + esc(row.title || 'Document') + '</strong><div class="mini">' + esc((row.document_kind || 'attachment') + ' · ' + (row.related_type || 'journal_entry') + (row.related_id ? ' · ' + row.related_id : '')) + '</div></div><div class="mini">' + esc(new Date(row.created_at || Date.now()).toLocaleString()) + '</div></div>' + (href ? '<div class="mini" style="margin-top:10px"><a href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(href) + '</a></div>' : '') + (row.notes ? '<div class="mini" style="margin-top:8px">' + esc(row.notes) + '</div>' : '') + '</div>';
        }).join('') : '<div class="mini">No accounting documents saved yet.</div>';
      }
      function renderRecurringExpenses(items) {
        var wrap = qs('#recurringExpenseRows');
        items = Array.isArray(items) ? items : [];
        qs('#recurringExpenseMeta').textContent = items.length ? (items.length + ' recurring templates loaded') : 'No recurring expense templates loaded yet.';
        wrap.innerHTML = items.length ? items.map(function (row) {
          return '<article class="recurring-card"><div class="row wrap" style="justify-content:space-between;gap:10px"><div><div class="kicker">' + esc(row.cadence || 'monthly') + ' · ' + esc(row.posting_mode || 'cash') + (row.is_active === false ? ' · inactive' : '') + '</div><h3 style="margin:6px 0">' + esc(row.vendor_name || 'Vendor') + '</h3><div class="mini">Due ' + esc(row.next_due_date || '') + ' · ' + esc(money(row.total_cad || 0)) + '</div></div><div class="tag">' + esc(row.expense_account_code || 'shop_supplies') + '</div></div>' + (row.memo ? '<div class="mini" style="margin-top:10px">' + esc(row.memo) + '</div>' : '') + '<div class="row wrap" style="justify-content:space-between;align-items:center;margin-top:12px"><div class="mini">Last posted ' + esc(row.last_posted_at ? new Date(row.last_posted_at).toLocaleString() : 'never') + '</div><button class="btn ghost recurring-post-now" type="button" data-template-id="' + esc(row.id || '') + '">Post due now</button></div></article>';
        }).join('') : '<div class="mini">No recurring templates saved yet.</div>';
        qsa('.recurring-post-now', wrap).forEach(function (button) {
          button.addEventListener('click', async function () {
            try {
              setStatus('Posting recurring expense…');
              await apiJson('/api/admin/accounting_recurring_expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'post_now', id: button.getAttribute('data-template-id'), entry_date: todayIso() })
              });
              setStatus('Recurring expense posted.', 'success');
              await refreshAll();
            } catch (err) {
              setStatus(err && err.message ? err.message : 'Could not post recurring expense.', 'error');
            }
          });
        });
      }
      function renderBankReconciliation(payload) {
        var summary = qs('#bankReconSummary');
        var rowsWrap = qs('#bankReconRows');
        var meta = qs('#bankReconMeta');
        var snapshot = payload && payload.snapshot ? payload.snapshot : null;
        var rows = payload && Array.isArray(payload.reconciliations) ? payload.reconciliations : [];
        if (!snapshot) {
          meta.textContent = 'No reconciliation snapshot loaded yet.';
          summary.innerHTML = '<div class="mini">No bank reconciliation data loaded.</div>';
          rowsWrap.innerHTML = '';
          return;
        }
        meta.textContent = 'Working month ' + esc(monthLabel()) + ' · ' + esc(snapshot.account_code || 'cash');
        summary.innerHTML = [
          ['Ending book balance', money(snapshot.ending_book_balance_cad || 0)],
          ['Month activity', money(snapshot.month_activity_cad || 0)],
          ['Cash entries', String(snapshot.entry_count || 0)],
          ['Latest difference', money(snapshot.latest_reconciliation && snapshot.latest_reconciliation.difference_cad || 0)]
        ].map(function (row) { return '<div class="table-lite__row"><span>' + esc(row[0]) + '</span><span>' + esc(row[1]) + '</span></div>'; }).join('');
        rowsWrap.innerHTML = rows.length ? rows.map(function (row) {
          return '<div class="table-lite__row"><span>' + esc(row.period_start || '') + ' to ' + esc(row.period_end || '') + '<div class="mini">' + esc(row.status || 'draft') + (row.notes ? ' · ' + esc(row.notes) : '') + '</div></span><span>' + esc(money(row.statement_ending_balance_cad || 0)) + '<div class="mini">Δ ' + esc(money(row.difference_cad || 0)) + '</div></span></div>';
        }).join('') : '<div class="mini">No reconciliation rows saved yet.</div>';
      }
      function renderPayrollPayouts(report) {
        var summary = qs('#payrollPayoutSummary');
        var rowsWrap = qs('#payrollPayoutRows');
        var select = qs('#payrollRunSelect');
        report = report || { totals: {}, rows: [] };
        var rows = Array.isArray(report.rows) ? report.rows : [];
        qs('#payrollPayoutMeta').textContent = rows.length ? (rows.length + ' payroll runs in period') : 'No payroll payout report loaded yet.';
        select.innerHTML = rows.length ? rows.map(function (row) {
          return '<option value="' + esc(row.payroll_run_id || '') + '">' + esc((row.period_start || '') + ' to ' + (row.period_end || '')) + ' · ' + money(row.expected_gross_cad || 0) + '</option>';
        }).join('') : '<option value="">No payroll runs</option>';
        summary.innerHTML = [
          ['Expected gross', money(report.totals && report.totals.expected_gross_cad || 0)],
          ['Paid gross', money(report.totals && report.totals.paid_gross_cad || 0)],
          ['Difference', money(report.totals && report.totals.difference_cad || 0)],
          ['Reconciled runs', String(report.totals && report.totals.reconciled_count || 0)]
        ].map(function (row) { return '<div class="table-lite__row"><span>' + esc(row[0]) + '</span><span>' + esc(row[1]) + '</span></div>'; }).join('');
        rowsWrap.innerHTML = rows.length ? rows.map(function (row) {
          var cls = Math.abs(Number(row.difference_cad || 0)) > 0.01 ? 'warning-text' : '';
          return '<div class="table-lite__row"><span>' + esc((row.period_start || '') + ' to ' + (row.period_end || '')) + '<div class="mini">' + esc(row.status || 'pending') + (row.payout_date ? ' · ' + esc(row.payout_date) : '') + '</div></span><span class="' + cls + '">' + esc(money(row.paid_gross_cad || 0)) + '<div class="mini">Expected ' + esc(money(row.expected_gross_cad || 0)) + ' · Δ ' + esc(money(row.difference_cad || 0)) + '</div></span></div>';
        }).join('') : '<div class="mini">No payroll runs found for this month.</div>';
        if (rows.length) {
          qs('#payrollPayoutAmount').value = Number(rows[0].expected_gross_cad || 0).toFixed(2);
        }
      }
      function renderPeriodCloses(periods) {
        var wrap = qs('#periodCloseRows');
        periods = Array.isArray(periods) ? periods : [];
        var current = periods.find(function (row) { return String(row.month_start || '') === currentMonthStart(); }) || null;
        qs('#periodCloseMonthLabel').value = monthLabel();
        qs('#periodCloseStatus').value = current && current.status ? current.status : 'open';
        qs('#periodCloseNotes').value = current && current.notes ? current.notes : '';
        qs('#periodCloseMeta').textContent = current ? ('Current month is ' + current.status + (current.locked_at ? ' · ' + new Date(current.locked_at).toLocaleString() : '')) : 'No period-close workflow record loaded yet.';
        wrap.innerHTML = periods.length ? periods.map(function (row) {
          return '<div class="table-lite__row"><span>' + esc(row.month_start || '') + '<div class="mini">' + esc(row.notes || '') + '</div></span><span>' + esc(row.status || 'open') + '</span></div>';
        }).join('') : '<div class="mini">No period-close workflow rows saved yet.</div>';
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
                return '<div class="settlement-item"><strong>' + esc(item.entry_date || '') + '</strong> · ' + esc(money(item.total_cad || 0)) + '<div class="mini">' + esc(item.entry_type || '') + (item.memo ? ' · ' + esc(item.memo) : '') + ((item.last_recorded_by_name || item.created_by_name) ? ' · by ' + esc(item.last_recorded_by_name || item.created_by_name) : '') + '</div></div>';
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
      function renderMonthEndChecklist(checklist) {
        state.monthEndChecklist = checklist || null;
        qs('#monthEndChecklistPeriod').textContent = selectedYear() + '-' + String(selectedMonth()).padStart(2, '0');
        qs('#checkRemittance').checked = !!(checklist && checklist.remittance_reviewed);
        qs('#checkPayables').checked = !!(checklist && checklist.payables_reviewed);
        qs('#checkReceivables').checked = !!(checklist && checklist.receivables_reviewed);
        qs('#checkStatements').checked = !!(checklist && checklist.statements_exported);
        qs('#checkInventoryCosts').checked = !!(checklist && checklist.inventory_costs_reviewed);
        qs('#checkProfitability').checked = !!(checklist && checklist.profitability_reviewed);
        qs('#monthEndChecklistNotes').value = checklist && checklist.notes ? checklist.notes : '';
        var meta = 'No month-end checklist saved yet.';
        if (checklist && checklist.updated_at) {
          meta = 'Last saved ' + new Date(checklist.updated_at).toLocaleString() + (checklist.updated_by_name ? ' by ' + checklist.updated_by_name : '');
        }
        qs('#monthEndChecklistMeta').textContent = meta;
      }
      async function loadMonthEndChecklist() {
        var out = await apiJson('/api/admin/accounting_month_end_checklist?month=' + selectedMonth() + '&year=' + selectedYear());
        renderMonthEndChecklist(out.checklist || null);
      }
      async function saveMonthEndChecklist() {
        var payload = {
          month: selectedMonth(),
          year: selectedYear(),
          remittance_reviewed: qs('#checkRemittance').checked,
          payables_reviewed: qs('#checkPayables').checked,
          receivables_reviewed: qs('#checkReceivables').checked,
          statements_exported: qs('#checkStatements').checked,
          inventory_costs_reviewed: qs('#checkInventoryCosts').checked,
          profitability_reviewed: qs('#checkProfitability').checked,
          notes: qs('#monthEndChecklistNotes').value.trim()
        };
        var out = await apiJson('/api/admin/accounting_month_end_checklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        renderMonthEndChecklist(out.checklist || null);
      }
      async function loadPricingWindow() {
        try {
          var res = await fetch('/api/pricing_catalog_public', { credentials: 'include', cache: 'no-store' });
          var out = await res.json().catch(function () { return null; });
          if (!res.ok || !out) throw new Error(out && out.error || 'Could not load pricing window.');
          state.pricingCatalog = out;
          renderPricingWindow();
        } catch (err) {
          qs('#pricingWindowSummary').innerHTML = '<div class="mini danger-note">' + esc(err && err.message ? err.message : 'Could not load pricing window.') + '</div>';
          qs('#pricingWindowTiers').innerHTML = '';
        }
      }
      function renderPricingWindow() {
        var catalog = state.pricingCatalog || {};
        var bookingRules = catalog.booking_rules || {};
        var travel = bookingRules.travel_pricing || {};
        qs('#pricingWindowSummary').innerHTML = [
          ['Packages', String((catalog.packages || []).length)],
          ['Add-ons', String((catalog.addons || []).length)],
          ['Service areas', String((catalog.service_areas || []).length)],
          ['Default area', esc(bookingRules.default_service_area || '—')],
          ['Availability window', String(bookingRules.availability_window_days || 21) + ' days']
        ].map(function (row) {
          return '<div class="panel"><div class="kicker">' + row[0] + '</div><div class="hero-stat">' + row[1] + '</div></div>';
        }).join('');
        var tiers = ['urban','township','hamlet','coastal','rural','out_of_zone'];
        qs('#pricingWindowTiers').innerHTML = tiers.map(function (tier) {
          return '<div class="pricing-tier"><div class="kicker">' + esc(tier.replace(/_/g, ' ')) + '</div><strong>' + money(Number(travel[tier] || 0)) + '</strong></div>';
        }).join('');
        qs('#pricingWindowNotes').textContent = travel.notes || 'Travel pricing is loaded from the canonical pricing catalog.';
      }
      function renderSummaryCards() {
        var recordSummary = state.recordSummary || {};
        var tax = state.tax || {};
        var pnl = state.reports && state.reports.profit_loss || {};
        var statements = state.reports && state.reports.statements || {};
        var inventory = statements.inventory_costs || {};
        var receivables = statements.receivables_aging || {};
        var payables = state.payables || [];
        var outstanding = payables.reduce(function (sum, row) { return sum + Number(row.balance_due_cad || 0); }, 0);
        var openCount = payables.filter(function (row) { return ['open', 'partial'].includes(String(row.payment_status || '')); }).length;
        qs('#sumOpen').textContent = money(receivables.totals && receivables.totals.total_balance_cad || 0);
        qs('#sumOpenMeta').textContent = String(receivables.totals && receivables.totals.record_count || recordSummary.open || 0) + ' booking records with balance due';
        qs('#sumPayables').textContent = money(outstanding);
        qs('#sumPayablesCount').textContent = openCount + ' vendor bills with balance due';
        qs('#sumTaxDue').textContent = money(tax.suggested_remittance_cad || 0);
        qs('#sumNetIncome').textContent = money(pnl.totals && pnl.totals.net_income || 0);
        qs('#sumClosingCash').textContent = money(statements.cash_flow && statements.cash_flow.totals && statements.cash_flow.totals.closing_cash_cad || 0);
        qs('#sumMissingCosts').textContent = String(inventory.totals && inventory.totals.missing_cost_items || 0);
        qs('#sumCostCoverage').textContent = String(inventory.totals && inventory.totals.cost_coverage_pct || 0) + '% coverage';
      }

      async function loadDocuments() {
        try {
          var out = await apiJson('/api/admin/accounting_documents?limit=30');
          state.accountingDocuments = Array.isArray(out.documents) ? out.documents : [];
          renderDocuments(state.accountingDocuments);
        } catch (err) {
          state.accountingDocuments = [];
          renderDocuments([]);
          qs('#documentMeta').textContent = err && err.message ? err.message : 'Could not load accounting documents.';
        }
      }
      async function loadRecurringExpenses() {
        try {
          var out = await apiJson('/api/admin/accounting_recurring_expenses');
          state.recurringExpenses = Array.isArray(out.items) ? out.items : [];
          renderRecurringExpenses(state.recurringExpenses);
        } catch (err) {
          state.recurringExpenses = [];
          renderRecurringExpenses([]);
          qs('#recurringExpenseMeta').textContent = err && err.message ? err.message : 'Could not load recurring expenses.';
        }
      }
      async function loadBankReconciliation() {
        try {
          var accountCode = qs('#bankReconAccount').value || 'cash';
          var out = await apiJson('/api/admin/accounting_bank_reconciliation?month=' + selectedMonth() + '&year=' + selectedYear() + '&account_code=' + encodeURIComponent(accountCode));
          state.bankReconciliation = { snapshot: out.snapshot || null, reconciliations: out.reconciliations || [] };
          renderBankReconciliation(state.bankReconciliation);
        } catch (err) {
          state.bankReconciliation = null;
          renderBankReconciliation(null);
          qs('#bankReconMeta').textContent = err && err.message ? err.message : 'Could not load bank reconciliation.';
        }
      }
      async function loadPayrollPayouts() {
        try {
          var out = await apiJson('/api/admin/accounting_payroll_payout_reconciliation?month=' + selectedMonth() + '&year=' + selectedYear());
          state.payrollPayouts = out.report || null;
          renderPayrollPayouts(state.payrollPayouts || { totals: {}, rows: [] });
        } catch (err) {
          state.payrollPayouts = null;
          renderPayrollPayouts({ totals: {}, rows: [] });
          qs('#payrollPayoutMeta').textContent = err && err.message ? err.message : 'Could not load payroll payout reconciliation.';
        }
      }
      async function loadPeriodCloses() {
        try {
          var out = await apiJson('/api/admin/accounting_period_close?year=' + selectedYear());
          state.periodCloses = Array.isArray(out.periods) ? out.periods : [];
          renderPeriodCloses(state.periodCloses);
        } catch (err) {
          state.periodCloses = [];
          renderPeriodCloses([]);
          qs('#periodCloseMeta').textContent = err && err.message ? err.message : 'Could not load period-close workflow.';
        }
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
      async function loadYearEnd() {
        var out = await apiJson('/api/admin/accounting_year_end_report?year=' + selectedYear());
        state.yearEnd = out.report || null;
        renderYearEnd(state.yearEnd);
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
            inventory_costs: results[1].inventory_costs || null,
            receivables_aging: results[1].receivables_aging || null,
            operational_profitability: results[1].operational_profitability || null
          }
        };
        state.tax = results[2].report || null;
        state.owner = results[3].report || null;
        renderProfitLoss(state.reports.profit_loss);
        renderBalanceSheet(state.reports.statements.balance_sheet);
        renderCashFlow(state.reports.statements.cash_flow);
        renderInventoryCosts(state.reports.statements.inventory_costs);
        renderReceivables(state.reports.statements.receivables_aging);
        renderProfitability(state.reports.statements.operational_profitability);
        qs('#remitAmount').value = Number(state.tax && state.tax.suggested_remittance_cad || 0).toFixed(2);
      }
      async function refreshAll() {
        setStatus('Refreshing accounting workspace…');
        await Promise.all([
          loadRecords(),
          loadPayables(),
          loadReports(),
          loadYearEnd(),
          loadMonthEndChecklist(),
          loadPricingWindow(),
          loadDocuments(),
          loadRecurringExpenses(),
          loadBankReconciliation(),
          loadPayrollPayouts(),
          loadPeriodCloses()
        ]);
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

        qs('#monthEndChecklistForm').addEventListener('submit', async function (event) {
          event.preventDefault();
          try {
            setStatus('Saving month-end checklist…');
            await saveMonthEndChecklist();
            setStatus('Month-end checklist saved.', 'success');
          } catch (err) {
            setStatus(err && err.message ? err.message : 'Could not save month-end checklist.', 'error');
          }
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
  