const content = document.getElementById("paymentContent");
const intro = document.getElementById("paymentIntro");
const query = new URLSearchParams(location.search);
const requestId = String(query.get("request_id") || "").trim();
const token = String(query.get("token") || "").trim();
const returnState = String(query.get("payment") || "").trim().toLowerCase();
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const money = (cents, currency) => new Intl.NumberFormat("en-CA", { style: "currency", currency: currency || "CAD" }).format(Number(cents || 0) / 100);
const when = (value) => { try { return value ? new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : ""; } catch { return ""; } };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function problem(message) {
  intro.textContent = "Payment assistance";
  content.innerHTML = `<div class="notice bad"><strong>We could not open this payment request.</strong><p>${esc(message)}</p><div class="payment-actions"><a class="btn primary" href="/contact.html">Contact Rosie Dazzlers</a></div></div>`;
}

function endpoint() {
  return `/api/final_balance_payment_view?request_id=${encodeURIComponent(requestId)}&token=${encodeURIComponent(token)}`;
}

async function fetchPayment() {
  const res = await fetch(endpoint(), { cache: "no-store", headers: { Accept: "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !data.payment) throw new Error(data.error || "This payment request is unavailable.");
  if (!data.payment) throw new Error(data.error || "This payment request is unavailable.");
  return { payment: data.payment, error: data.error || null };
}

function renderPaid(payment) {
  intro.textContent = "Payment received";
  content.innerHTML = `<div class="payment-state"><span class="badge">Payment received</span></div><div class="payment-amount">${esc(money(payment.amount_cents, payment.currency))}</div><div class="notice ok"><strong>Thank you.</strong><p>Rosie Dazzlers has recorded this final-balance payment${payment.paid_at ? ` on ${esc(when(payment.paid_at))}` : ""}.</p></div>`;
}

function renderClosed(payment, state) {
  intro.textContent = state === "expired" ? "This secure link has expired" : "This payment request is closed";
  content.innerHTML = `<div class="payment-state"><span class="badge">${state === "expired" ? "Link expired" : "Payment request closed"}</span></div><div class="payment-amount">${esc(money(payment.amount_cents, payment.currency))}</div><div class="notice warn"><strong>Do not reuse an older checkout link.</strong><p>Please contact Rosie Dazzlers for an updated payment request.</p></div><div class="payment-actions"><a class="btn primary" href="/contact.html">Contact Rosie Dazzlers</a></div>`;
}

function renderOpen(payment) {
  const amount = money(payment.amount_cents, payment.currency);
  const cancelledReturn = returnState === "cancelled";
  intro.textContent = cancelledReturn ? "Your payment was not completed. You can return to the same secure checkout." : "Review your secure final-balance payment request.";
  content.innerHTML = `<div class="payment-state"><span class="badge">Secure checkout</span>${payment.expires_at ? `<span class="badge">Expires ${esc(when(payment.expires_at))}</span>` : ""}</div><div class="payment-amount">${esc(amount)}</div>${cancelledReturn ? '<div class="notice warn"><strong>No payment has been recorded from that checkout return.</strong><p>If you want to continue, use the same secure checkout below. Rosie Dazzlers will not create a duplicate checkout just because you returned here.</p></div>' : ""}<div class="payment-actions">${payment.checkout_url ? `<a class="btn primary" target="_blank" rel="noopener" href="${esc(payment.checkout_url)}">${cancelledReturn ? "Return to secure checkout" : "Continue to secure checkout"}</a>` : '<a class="btn primary" href="/contact.html">Contact us to pay</a>'}<a class="btn ghost" href="/contact.html">Need help?</a></div><div class="payment-meta"><div><strong>Your card details are handled by the payment provider.</strong><br><span class="muted">Rosie Dazzlers does not ask for card numbers by email or text.</span></div></div>`;
}

function renderPending(payment) {
  intro.textContent = "Payment confirmation pending";
  content.innerHTML = `<div class="payment-state"><span class="badge">Confirmation pending</span></div><div class="payment-amount">${esc(money(payment.amount_cents, payment.currency))}</div><div class="notice warn"><strong>Please do not submit another payment yet.</strong><p>You returned from secure checkout, but Rosie Dazzlers has not yet recorded the payment as received. This page temporarily hides the checkout button to reduce duplicate-payment risk.</p></div><div class="payment-actions"><button class="btn ghost" id="checkAgainBtn" type="button">Check payment status again</button><a class="btn ghost" href="/contact.html">Contact Rosie Dazzlers</a></div>`;
  document.getElementById("checkAgainBtn")?.addEventListener("click", verifyReturnedPayment);
}

function render(payment) {
  const state = String(payment.state || payment.status || "open").toLowerCase();
  if (state === "paid") return renderPaid(payment);
  if (state === "expired" || state === "cancelled") return renderClosed(payment, state);
  if (returnState === "returned") return renderPending(payment);
  return renderOpen(payment);
}

async function verifyReturnedPayment() {
  intro.textContent = "Checking payment confirmation…";
  content.innerHTML = '<div class="notice">Checking Rosie Dazzlers payment records. Please do not submit another payment while this check is running.</div>';
  let lastPayment = null;
  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const result = await fetchPayment();
      lastPayment = result.payment;
      const state = String(lastPayment.state || lastPayment.status || "open").toLowerCase();
      if (state === "paid") {
        renderPaid(lastPayment);
        return;
      }
      if (state === "expired" || state === "cancelled") {
        renderClosed(lastPayment, state);
        return;
      }
      if (attempt < 3) await sleep(2000);
    }
    renderPending(lastPayment || {});
  } catch (err) {
    problem(err?.message || "Payment confirmation could not be checked.");
  }
}

async function load() {
  if (!requestId || !token) {
    problem("This secure link is incomplete. Please use the full link supplied by Rosie Dazzlers.");
    return;
  }
  try {
    if (returnState === "returned") {
      await verifyReturnedPayment();
      return;
    }
    const result = await fetchPayment();
    render(result.payment);
    if (result.error && result.payment?.state !== "open") intro.textContent = result.error;
  } catch (err) {
    problem(err?.message || "This payment request is unavailable.");
  }
}

load();
