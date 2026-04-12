import { requireStaffAccess, json, methodNotAllowed, cleanText } from "../_lib/staff-auth.js";
import { postJournalEntry, roundMoney } from "../_lib/accounting-gl.js";

export async function onRequestOptions(){ return new Response('', {status:204, headers:corsHeaders()}); }
export async function onRequestPost({request, env}){
  try {
    const access = await requireStaffAccess({ request, env, capability:'manage_staff', allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    const body = await request.json().catch(()=>({}));
    const mode = cleanText(body.mode) || 'expense';
    const entryDate = cleanText(body.entry_date) || new Date().toISOString().slice(0,10);
    const vendorName = cleanText(body.vendor_name) || cleanText(body.payee_name) || null;
    const memo = cleanText(body.memo) || null;
    const expenseAccount = cleanText(body.expense_account) || 'shop_supplies';
    const paymentAccount = cleanText(body.payment_account) || 'accounts_payable';
    const amount = roundMoney(body.amount_cad || 0);
    const tax = roundMoney(body.tax_cad || 0);
    const total = roundMoney(amount + tax);
    if (amount <= 0) return withCors(json({ error:'Amount must be greater than zero.' },400));
    const actorName = access.actor?.full_name || access.actor?.email || null;

    const result = await postJournalEntry(env, {
      entry_date: entryDate,
      entry_type: mode === 'payable' ? 'vendor_bill' : 'expense',
      status: 'posted',
      reference_type: 'manual_accounting',
      reference_id: null,
      payee_name: vendorName,
      vendor_name: vendorName,
      memo,
      subtotal_cad: amount,
      tax_cad: tax,
      total_cad: total,
      due_date: mode === 'payable' ? (cleanText(body.due_date) || null) : null,
      paid_at: mode === 'cash' ? new Date().toISOString() : null,
      created_by_name: actorName,
      last_recorded_by_name: actorName,
      created_by_staff_user_id: access.actor?.id || null,
      last_recorded_by_staff_user_id: access.actor?.id || null
    }, [
      { account_code: expenseAccount, direction:'debit', amount_cad: amount, memo },
      ...(tax > 0 ? [{ account_code:'sales_tax_payable', direction:'debit', amount_cad: tax, memo:'Input tax / tax component' }] : []),
      { account_code: paymentAccount, direction:'credit', amount_cad: total, memo }
    ]);

    return withCors(json({ ok:true, saved: result.entry, lines: result.lines }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const headers = new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
