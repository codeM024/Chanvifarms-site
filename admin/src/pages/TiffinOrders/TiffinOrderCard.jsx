import PropTypes from 'prop-types';
import {
  FaPhoneAlt, FaWhatsapp, FaMapMarkerAlt, FaTruck, FaStore, FaTrash, FaTimes, FaCheckCircle, FaPrint, FaStickyNote,
} from 'react-icons/fa';
import {
  ACTION_LABELS, FINISHED_STATUSES, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_META, STATUS_META, formatINR, needsPaymentConfirm, statusLabel, waNumber,
} from '../Tiffins/tiffinUtils';

const timeIST = (d) =>
  new Date(d).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' });
const dateIST = (d) =>
  new Date(d).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' });

const TiffinOrderCard = ({ order, busy, isNew, showDate, onStatus, onCancel, onPayment, onDelete, onPrint }) => {
  const meta = STATUS_META[order.status] || { tone: 'muted' };
  const pay = PAYMENT_STATUS_META[order.payment?.status] || { label: order.payment?.status, tone: '' };
  const name = order.contact?.name || [order.address?.firstName, order.address?.lastName].filter(Boolean).join(' ') || 'Customer';
  const phone = order.contact?.phone || order.address?.phone || '';
  const isDelivery = order.fulfilment === 'delivery';
  const loc = order.address?.location;
  const hasLoc = loc && Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude);
  const next = (order.allowedNextStatuses || []).filter((s) => s !== 'cancelled');
  const canCancel = (order.allowedNextStatuses || []).includes('cancelled');
  const finished = FINISHED_STATUSES.includes(order.status);
  const anyBusy = Boolean(busy);

  return (
    <article className={`card tiffin-order${isNew ? ' is-new' : ''}`} data-tone={meta.tone} aria-busy={anyBusy}>
      <header className="to-head">
        <div className="to-head-main">
          <h3 className="to-number">{order.orderNumber || `#${order._id.slice(-6)}`}</h3>
          <p className="to-meta">
            {showDate && `${dateIST(order.createdAt)}, `}{timeIST(order.createdAt)}
            {order.slot && <> · <span className="to-slot">{order.slot}</span></>}
          </p>
        </div>
        <div className="to-head-badges">
          <span className={`pill no-dot to-fulfil ${isDelivery ? 'pill-info' : 'pill-violet'}`}>
            {isDelivery ? <FaTruck aria-hidden="true" /> : <FaStore aria-hidden="true" />}
            {isDelivery ? 'Delivery' : 'Pickup'}
          </span>
          <span className={`pill pill-${meta.tone}`}>{statusLabel(order.status)}</span>
        </div>
      </header>

      {isNew && <span className="to-new-flag">New</span>}

      <ul className="to-items">
        {order.items.map((it, i) => (
          <li key={i}>
            <span className="to-qty">{it.quantity}×</span>
            <span className="to-item-name">
              {it.name}
              {it.subtitle && <small> · {it.subtitle}</small>}
            </span>
            <span className="to-item-price">{formatINR(it.price * it.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="to-totals">
        <div><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
        {isDelivery && <div><span>Delivery fee</span><span>{order.deliveryFee ? formatINR(order.deliveryFee) : 'Free'}</span></div>}
        <div className="to-total"><span>Total</span><span>{formatINR(order.amount)}</span></div>
      </div>

      <div className="to-payment">
        <span className="to-pay-method">{order.payment?.method === 'COD' && order.fulfilment === 'pickup' ? 'Pay at pickup' : (PAYMENT_METHOD_LABELS[order.payment?.method] || order.payment?.method)}</span>
        <span className={`pill pill-${pay.tone}`}>{pay.label}</span>
      </div>

      <div className="to-customer">
        <div className="to-customer-row">
          <strong className="to-name">{name}</strong>
          {phone && (
            <div className="to-contact">
              <a className="btn btn-secondary btn-sm" href={`tel:${phone}`} aria-label={`Call ${name}`}>
                <FaPhoneAlt aria-hidden="true" /> {phone}
              </a>
              <a
                className="btn btn-sm to-wa"
                href={`https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(`Hi ${name}, about your Chanvi Farms tiffin order ${order.orderNumber || ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${name}`}
              >
                <FaWhatsapp aria-hidden="true" /> WhatsApp
              </a>
            </div>
          )}
        </div>
        {isDelivery && order.address && (
          <div className="to-address">
            <FaMapMarkerAlt aria-hidden="true" />
            <div>
              <p>{order.address.street}</p>
              <p>{[order.address.city, order.address.state].filter(Boolean).join(', ')}{order.address.zipcode && ` - ${order.address.zipcode}`}</p>
              {loc?.address && <p className="to-loc-text">{loc.address}</p>}
              {hasLoc && (
                <a
                  className="to-map-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {order.notes && (
        <p className="to-notes"><FaStickyNote aria-hidden="true" /> <span>{order.notes}</span></p>
      )}
      {order.status === 'cancelled' && order.cancelReason && (
        <p className="to-cancel-reason">Cancelled: {order.cancelReason}</p>
      )}

      <footer className="to-actions">
        {next.map((s) => (
          <button
            key={s}
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onStatus(order, s)}
            disabled={anyBusy}
          >
            {busy === `status:${s}` && <span className="spinner" aria-hidden="true" />}
            {ACTION_LABELS[s] || statusLabel(s)}
          </button>
        ))}
        {needsPaymentConfirm(order) && (
          <button type="button" className="btn btn-soft btn-sm" onClick={() => onPayment(order)} disabled={anyBusy}>
            {busy === 'payment' ? <span className="spinner" aria-hidden="true" /> : <FaCheckCircle aria-hidden="true" />}
            Mark payment received
          </button>
        )}
        <span className="to-actions-spacer" />
        <button type="button" className="icon-btn" onClick={() => onPrint(order)} title="Print kitchen ticket" aria-label="Print kitchen ticket">
          <FaPrint />
        </button>
        {canCancel && (
          <button type="button" className="btn btn-danger-soft btn-sm" onClick={() => onCancel(order)} disabled={anyBusy}>
            <FaTimes aria-hidden="true" /> Cancel
          </button>
        )}
        {finished && (
          <button type="button" className="icon-btn to-delete" onClick={() => onDelete(order)} disabled={anyBusy} title="Delete order" aria-label="Delete order">
            {busy === 'delete' ? <span className="spinner" aria-hidden="true" /> : <FaTrash />}
          </button>
        )}
      </footer>
    </article>
  );
};

TiffinOrderCard.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    orderNumber: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      subtitle: PropTypes.string,
      price: PropTypes.number,
      quantity: PropTypes.number,
    })).isRequired,
    subtotal: PropTypes.number,
    deliveryFee: PropTypes.number,
    amount: PropTypes.number,
    fulfilment: PropTypes.string,
    slot: PropTypes.string,
    contact: PropTypes.shape({ name: PropTypes.string, phone: PropTypes.string }),
    address: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      street: PropTypes.string,
      city: PropTypes.string,
      state: PropTypes.string,
      zipcode: PropTypes.string,
      phone: PropTypes.string,
      location: PropTypes.shape({ latitude: PropTypes.number, longitude: PropTypes.number, address: PropTypes.string }),
    }),
    notes: PropTypes.string,
    payment: PropTypes.shape({ method: PropTypes.string, status: PropTypes.string }),
    status: PropTypes.string.isRequired,
    cancelReason: PropTypes.string,
    createdAt: PropTypes.string,
    allowedNextStatuses: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  busy: PropTypes.string,
  isNew: PropTypes.bool,
  showDate: PropTypes.bool,
  onStatus: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onPayment: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPrint: PropTypes.func.isRequired,
};

export default TiffinOrderCard;
