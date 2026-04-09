import { serviceHeaders } from "./staff-auth.js";

export function roundMoney(value) {
  const num = Number(value || 0);
  return Math.round((Number.isFinite(num) ? num : 0) * 100) / 100;
}

export async function loadAccounts(env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_accounts?select=*&order=sort_order.asc,code.asc`, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load accounting accounts. ${await res.text()}`);
  return await res.json().catch(() => []);
}

export async function postJournalEntry(env, entry, lines) {
  const headers = serviceHeaders(env);
  const debits = roundMoney(lines.filter((x)=>x.direction==='debit').reduce((s,x)=>s+Number(x.amount_cad||0),0));
  const credits = roundMoney(lines.filter((x)=>x.direction==='credit').reduce((s,x)=>s+Number(x.amount_cad||0),0));
  if (debits <= 0 || credits <= 0 || debits !== credits) throw new Error('Journal entry is not balanced.');

  const entryRes = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_journal_entries`, {
    method:'POST',
    headers:{...headers, Prefer:'return=representation'},
    body: JSON.stringify([{...entry, subtotal_cad: roundMoney(entry.subtotal_cad), tax_cad: roundMoney(entry.tax_cad), total_cad: roundMoney(entry.total_cad)}])
  });
  if (!entryRes.ok) throw new Error(`Could not save journal entry. ${await entryRes.text()}`);
  const createdRows = await entryRes.json().catch(()=>[]);
  const created = Array.isArray(createdRows) ? createdRows[0] : null;
  if (!created?.id) throw new Error('Could not save journal entry.');

  const linePayload = lines.map((line, idx)=>({
    entry_id: created.id,
    line_order: idx + 1,
    account_code: line.account_code,
    direction: line.direction,
    amount_cad: roundMoney(line.amount_cad),
    memo: line.memo || null
  }));
  const lineRes = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_journal_lines`, {
    method:'POST',
    headers:{...headers, Prefer:'return=representation'},
    body: JSON.stringify(linePayload)
  });
  if (!lineRes.ok) throw new Error(`Could not save journal lines. ${await lineRes.text()}`);
  const createdLines = await lineRes.json().catch(()=>[]);
  return { entry: created, lines: createdLines };
}

export async function buildMonthlyReport(env, { month, year }) {
  const rows = await loadPostedLineRows(env, { month, year });
  const byAccount = {};
  const totals = { revenue:0, expense:0, asset:0, liability:0, equity:0, net_income:0 };
  for (const row of rows) {
    const parsed = signedAmountForRow(row);
    const account = row.account || {};
    byAccount[row.account_code] ||= { account_code: row.account_code, label: account.label || row.account_code, account_type: account.account_type || 'expense', account_group: account.account_group || null, amount_cad:0 };
    byAccount[row.account_code].amount_cad = roundMoney(byAccount[row.account_code].amount_cad + parsed.signed_amount_cad);
    const type = String(parsed.account_type || 'expense');
    totals[type] = roundMoney((totals[type] || 0) + parsed.signed_amount_cad);
  }
  totals.net_income = roundMoney((totals.revenue || 0) - (totals.expense || 0));
  const { start, nextMonth } = monthRange(month, year);
  return { month, year, period_start:start, period_end_exclusive:nextMonth, by_account:Object.values(byAccount).sort((a,b)=>String(a.label).localeCompare(String(b.label))), totals };
}

export async function listPayables(env, { status = 'open' } = {}) {
  const headers = serviceHeaders(env);
  const url = `${env.SUPABASE_URL}/rest/v1/accounting_journal_entries?select=*&entry_type=eq.vendor_bill&order=entry_date.desc,created_at.desc&limit=250`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Could not load payables. ${await res.text()}`);
  const rows = await res.json().catch(()=>[]);
  const payables = [];
  for (const entry of rows) {
    const settled = await loadSettlementsForEntry(env, entry.id);
    const settledAmount = roundMoney(settled.reduce((sum, row) => sum + Number(row.total_cad || 0), 0));
    const total = roundMoney(entry.total_cad || 0);
    const balance = roundMoney(total - settledAmount);
    const paymentStatus = balance <= 0 ? 'paid' : (settledAmount > 0 ? 'partial' : 'open');
    if (status !== 'all' && paymentStatus !== status) continue;
    payables.push({ ...entry, settled_amount_cad: settledAmount, balance_due_cad: balance, payment_status: paymentStatus, settlements: settled });
  }
  return payables;
}

export async function settlePayable(env, { entry_id, amount_cad, payment_account='cash', payment_date, memo=null, actorName=null }) {
  const headers = serviceHeaders(env);
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/accounting_journal_entries?select=*&id=eq.${encodeURIComponent(entry_id)}&limit=1`, { headers });
  if (!res.ok) throw new Error(`Could not load payable entry. ${await res.text()}`);
  const bill = (await res.json().catch(()=>[]))[0];
  if (!bill) throw new Error('Payable entry not found.');
  const existingSettled = await loadSettlementsForEntry(env, entry_id);
  const already = roundMoney(existingSettled.reduce((s, row) => s + Number(row.total_cad || 0), 0));
  const total = roundMoney(bill.total_cad || 0);
  const remaining = roundMoney(total - already);
  const settleAmount = amount_cad == null ? remaining : roundMoney(amount_cad);
  if (settleAmount <= 0) throw new Error('Settlement amount must be greater than zero.');
  if (settleAmount > remaining) throw new Error('Settlement amount is greater than the remaining payable balance.');
  const entryType = settleAmount === remaining ? 'payable_settlement' : 'payable_partial_settlement';
  const posted = await postJournalEntry(env, {
    entry_date: payment_date || new Date().toISOString().slice(0,10),
    entry_type: entryType,
    status: 'posted',
    reference_type: 'payable_settlement',
    reference_id: entry_id,
    settlement_of_entry_id: entry_id,
    payee_name: bill.payee_name || bill.vendor_name || null,
    vendor_name: bill.vendor_name || bill.payee_name || null,
    memo: memo || `Settlement for payable ${entry_id}`,
    subtotal_cad: settleAmount,
    tax_cad: 0,
    total_cad: settleAmount,
    paid_at: new Date().toISOString(),
    created_by_name: actorName,
    last_recorded_by_name: actorName
  }, [
    { account_code: 'accounts_payable', direction: 'debit', amount_cad: settleAmount, memo: memo || `Settlement for payable ${entry_id}` },
    { account_code: payment_account, direction: 'credit', amount_cad: settleAmount, memo: memo || `Settlement for payable ${entry_id}` }
  ]);
  return posted;
}

export async function buildTaxReport(env, { month, year }) {
  const rows = await loadPostedLineRows(env, { month, year, accountCode: 'sales_tax_payable' });
  let net = 0;
  for (const row of rows) net = roundMoney(net + signedAmountForRow(row).signed_amount_cad);
  const collected = roundMoney(rows.filter((r)=>String(r.direction)==='credit').reduce((s,r)=>s + Number(r.amount_cad||0), 0));
  const credits = roundMoney(rows.filter((r)=>String(r.direction)==='credit').reduce((s,r)=>s + Number(r.amount_cad||0), 0));
  const debits = roundMoney(rows.filter((r)=>String(r.direction)==='debit').reduce((s,r)=>s + Number(r.amount_cad||0), 0));
  return { month, year, collected_tax_cad: collected, tax_account_credits_cad: credits, tax_account_debits_cad: debits, net_tax_payable_cad: net, suggested_remittance_cad: Math.max(0, net), rows };
}

export async function buildOwnerEquityReport(env, { month, year }) {
  const ownerDrawRows = await loadPostedLineRows(env, { month, year, accountCode: 'owner_draw' });
  const equityRows = await loadPostedLineRows(env, { month, year, accountCode: 'owner_equity' });
  const ownerDrawTotal = roundMoney(ownerDrawRows.reduce((s,r)=>s + signedAmountForRow(r).signed_amount_cad, 0));
  const ownerEquityDelta = roundMoney(equityRows.reduce((s,r)=>s + signedAmountForRow(r).signed_amount_cad, 0));
  return { month, year, owner_draw_cad: ownerDrawTotal, owner_equity_delta_cad: ownerEquityDelta, rows: { owner_draw: ownerDrawRows, owner_equity: equityRows } };
}

export async function buildGeneralLedgerExport(env, { month, year }) {
  const rows = await loadPostedLineRows(env, { month, year });
  const header = ['Entry Date','Entry Type','Reference Type','Reference ID','Vendor / Payee','Account Code','Account Label','Direction','Amount CAD','Memo'];
  const lines = [header.join(',')];
  for (const row of rows) {
    const entry = row.entry || {};
    const account = row.account || {};
    lines.push([
      csvSafe(entry.entry_date || ''),
      csvSafe(entry.entry_type || ''),
      csvSafe(entry.reference_type || ''),
      csvSafe(entry.reference_id || ''),
      csvSafe(entry.vendor_name || entry.payee_name || ''),
      csvSafe(row.account_code || ''),
      csvSafe(account.label || ''),
      csvSafe(row.direction || ''),
      csvSafe(roundMoney(row.amount_cad || 0)),
      csvSafe(row.memo || entry.memo || '')
    ].join(','));
  }
  return lines.join('\n');
}

export async function postInventoryUsageCOGS(env, { bookingId, item, qtyUsed, actorName=null, note=null }) {
  const costCents = Number(item?.cost_cents || 0);
  if (!Number.isFinite(costCents) || costCents <= 0 || !Number.isFinite(Number(qtyUsed)) || Number(qtyUsed) <= 0) return null;
  const totalCost = roundMoney((Number(qtyUsed) * costCents) / 100);
  if (totalCost <= 0) return null;
  return await postJournalEntry(env, {
    entry_date: new Date().toISOString().slice(0,10),
    entry_type: 'inventory_usage_cogs',
    status: 'posted',
    reference_type: 'booking_inventory_usage',
    reference_id: bookingId || null,
    vendor_name: null,
    payee_name: null,
    memo: note || `Inventory used on booking ${bookingId || ''}`,
    subtotal_cad: totalCost,
    tax_cad: 0,
    total_cad: totalCost,
    created_by_name: actorName,
    last_recorded_by_name: actorName
  }, [
    { account_code: 'cost_of_goods_sold', direction: 'debit', amount_cad: totalCost, memo: note || item?.name || item?.item_key || null },
    { account_code: 'inventory_supplies', direction: 'credit', amount_cad: totalCost, memo: note || item?.name || item?.item_key || null }
  ]);
}

async function loadSettlementsForEntry(env, entryId) {
  const headers = serviceHeaders(env);
  const url = `${env.SUPABASE_URL}/rest/v1/accounting_journal_entries?select=id,entry_date,entry_type,total_cad,memo,reference_id,settlement_of_entry_id&or=(reference_id.eq.${encodeURIComponent(entryId)},settlement_of_entry_id.eq.${encodeURIComponent(entryId)})&entry_type=in.(payable_settlement,payable_partial_settlement)&status=eq.posted&order=entry_date.asc`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Could not load payable settlements. ${await res.text()}`);
  return await res.json().catch(()=>[]);
}

async function loadPostedLineRows(env, { month, year, accountCode = null } = {}) {
  const headers = serviceHeaders(env);
  const { start, nextMonth } = monthRange(month, year);
  let url = `${env.SUPABASE_URL}/rest/v1/accounting_journal_lines?select=direction,amount_cad,account_code,memo,entry:accounting_journal_entries!inner(entry_date,entry_type,status,reference_type,reference_id,vendor_name,payee_name,memo),account:accounting_accounts!inner(label,account_type,account_group)&entry.entry_date=gte.${start}&entry.entry_date=lt.${nextMonth}&entry.status=eq.posted`;
  if (accountCode) url += `&account_code=eq.${encodeURIComponent(accountCode)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Could not load accounting rows. ${await res.text()}`);
  return await res.json().catch(()=>[]);
}

function signedAmountForRow(row) {
  const account = row.account || {};
  const type = String(account.account_type || 'expense');
  const dir = String(row.direction || 'debit');
  const amount = roundMoney(row.amount_cad || 0);
  const sign = (type === 'revenue' || type === 'liability' || type === 'equity')
    ? (dir === 'credit' ? 1 : -1)
    : (dir === 'debit' ? 1 : -1);
  return { signed_amount_cad: roundMoney(sign * amount), account_type: type };
}

function monthRange(month, year) {
  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const nextMonth = month === 12 ? `${year+1}-01-01` : `${year}-${String(month+1).padStart(2,'0')}-01`;
  return { start, nextMonth };
}

function csvSafe(value) {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}
