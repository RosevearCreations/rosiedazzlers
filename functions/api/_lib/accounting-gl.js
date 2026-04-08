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
  const start = `${year}-${String(month).padStart(2,'0')}-01`;
  const nextMonth = month === 12 ? `${year+1}-01-01` : `${year}-${String(month+1).padStart(2,'0')}-01`;
  const headers = serviceHeaders(env);
  const url = `${env.SUPABASE_URL}/rest/v1/accounting_journal_lines?select=direction,amount_cad,account_code,entry:accounting_journal_entries!inner(entry_date,status),account:accounting_accounts!inner(label,account_type,account_group)&entry.entry_date=gte.${start}&entry.entry_date=lt.${nextMonth}&entry.status=eq.posted`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Could not load monthly report. ${await res.text()}`);
  const rows = await res.json().catch(()=>[]);
  const byAccount = {};
  const totals = { revenue:0, expense:0, asset:0, liability:0, equity:0, net_income:0 };
  for (const row of rows) {
    const account = row.account || {};
    const type = String(account.account_type || 'expense');
    const label = account.label || row.account_code;
    const dir = String(row.direction || 'debit');
    const amount = roundMoney(row.amount_cad || 0);
    const sign = (type === 'revenue' || type === 'liability' || type === 'equity')
      ? (dir === 'credit' ? 1 : -1)
      : (dir === 'debit' ? 1 : -1);
    byAccount[row.account_code] ||= { account_code: row.account_code, label, account_type:type, account_group: account.account_group || null, amount_cad:0 };
    byAccount[row.account_code].amount_cad = roundMoney(byAccount[row.account_code].amount_cad + sign * amount);
    totals[type] = roundMoney((totals[type] || 0) + sign * amount);
  }
  totals.net_income = roundMoney((totals.revenue || 0) - (totals.expense || 0));
  return { month, year, period_start:start, period_end_exclusive:nextMonth, by_account:Object.values(byAccount).sort((a,b)=>String(a.label).localeCompare(String(b.label))), totals };
}
