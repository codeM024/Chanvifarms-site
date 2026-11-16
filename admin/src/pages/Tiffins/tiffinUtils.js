export const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const formatINR = (n) => {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

// Best error message from an axios error / API response
export const apiError = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message ||
  (!err?.response && err?.message === 'Network Error' ? 'Cannot reach the server. Check your connection and try again.' : fallback);

// Today's date (YYYY-MM-DD) in India time
export const todayIST = () => {
  const d = new Date(Date.now() + 330 * 60000);
  return d.toISOString().slice(0, 10);
};

export const formatTime12 = (hhmm) => {
  if (!hhmm) return '';
  let [h, m] = hhmm.split(':').map(Number);
  if (h === 24) return '12:00 AM (midnight)';
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const STATUS_META = {
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  preparing: { label: 'Preparing', tone: 'violet' },
  ready: { label: 'Ready', tone: 'teal' },
  'out-for-delivery': { label: 'Out for delivery', tone: 'teal' },
  delivered: { label: 'Delivered', tone: 'success' },
  'picked-up': { label: 'Picked up', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  payment_failed: { label: 'Payment failed', tone: 'danger' },
};

export const statusLabel = (s) => STATUS_META[s]?.label || String(s || '').replace(/[-_]/g, ' ');

// Button text for moving an order to the given status
export const ACTION_LABELS = {
  confirmed: 'Confirm order',
  preparing: 'Start preparing',
  ready: 'Mark ready',
  'out-for-delivery': 'Out for delivery',
  delivered: 'Delivered',
  'picked-up': 'Picked up',
};

export const FINISHED_STATUSES = ['delivered', 'picked-up', 'cancelled', 'payment_failed'];

export const PAYMENT_METHOD_LABELS = { COD: 'Cash on delivery', Online: 'Online', WHATSAPP_PAY: 'WhatsApp / UPI' };
export const PAYMENT_STATUS_META = {
  pending: { label: 'Unpaid', tone: 'warning' },
  awaiting_confirmation: { label: 'Awaiting confirmation', tone: 'warning' },
  completed: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
};

// 10-digit Indian number -> 91XXXXXXXXXX for wa.me links
export const waNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
};

// WhatsApp/UPI or online orders whose money has not been confirmed yet
export const needsPaymentConfirm = (o) =>
  ['WHATSAPP_PAY', 'Online'].includes(o?.payment?.method) &&
  o?.payment?.status !== 'completed' &&
  o?.status !== 'cancelled';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Opens a small print-friendly kitchen ticket for one order
export const printKitchenTicket = (o) => {
  const w = window.open('', '_blank', 'width=380,height=640');
  if (!w) return false;
  const name = o.contact?.name || [o.address?.firstName, o.address?.lastName].filter(Boolean).join(' ');
  const phone = o.contact?.phone || o.address?.phone || '';
  const time = new Date(o.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const addr = o.fulfilment === 'delivery' && o.address
    ? `<p>${esc(o.address.street)}<br>${esc([o.address.city, o.address.zipcode].filter(Boolean).join(' - '))}</p>${o.address.location?.address ? `<p class="s">${esc(o.address.location.address)}</p>` : ''}`
    : '';
  const items = o.items.map((it) => `<tr><td class="q">${esc(it.quantity)}×</td><td>${esc(it.name)}${it.subtitle ? `<br><span class="s">${esc(it.subtitle)}</span>` : ''}</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(o.orderNumber)}</title>
<style>body{font-family:system-ui,sans-serif;margin:16px;color:#000;font-size:14px}h1{font-size:22px;margin:0}
.b{display:inline-block;border:2px solid #000;padding:2px 8px;font-weight:700;margin:6px 6px 0 0;text-transform:uppercase}
table{width:100%;border-collapse:collapse;margin:12px 0;font-size:16px}td{padding:6px 0;border-bottom:1px dashed #999;vertical-align:top}
.q{width:44px;font-weight:700;font-size:18px}.s{color:#444;font-size:12px}p{margin:4px 0}.n{border:2px solid #000;padding:6px;margin-top:8px}
@media print{body{margin:0}}</style></head><body>
<h1>${esc(o.orderNumber)}</h1><p class="s">${esc(time)}</p>
<span class="b">${o.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}</span>${o.slot ? `<span class="b">${esc(o.slot)}</span>` : ''}
<table>${items}</table>
<p><strong>${esc(name)}</strong> ${esc(phone)}</p>${addr}
${o.notes ? `<p class="n"><strong>Note:</strong> ${esc(o.notes)}</p>` : ''}
<p><strong>Total ₹${esc(o.amount)}</strong> · ${esc(o.payment?.method)} (${esc(o.payment?.status)})</p>
<script>window.onload=function(){window.print();}</script></body></html>`);
  w.document.close();
  return true;
};
