import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FaSearch, FaSyncAlt, FaInbox, FaExclamationTriangle, FaRedo, FaTimes, FaTrash, FaCheckCircle,
  FaReceipt, FaFire, FaHourglassHalf, FaRupeeSign,
} from 'react-icons/fa';
import { CardSkeleton, EmptyState } from '../../components/Feedback/Feedback';
import { ConfirmDialog } from '../Tiffins/TiffinUi';
import TiffinOrderCard from './TiffinOrderCard';
import {
  apiError, backendUrl, formatINR, printKitchenTicket, statusLabel, todayIST, STATUS_META,
} from '../Tiffins/tiffinUtils';
import './TiffinOrders.css';

const REFRESH_MS = 30000;
const DEFAULT_STATUSES = Object.keys(STATUS_META);
const QUICK_REASONS = ['Customer requested', 'Item not available', 'Outside delivery area', 'Payment not received'];

const TiffinOrders = () => {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [summary, setSummary] = useState(null);
  const [slots, setSlots] = useState(['Breakfast', 'Dinner']);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [status, setStatus] = useState('all');
  const [fulfilment, setFulfilment] = useState('all');
  const [slot, setSlot] = useState('all');
  const [date, setDate] = useState(todayIST());
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [busy, setBusy] = useState({}); // { [orderId]: 'status:ready' | 'payment' | 'delete' }
  const [newIds, setNewIds] = useState(() => new Set());
  const [cancelFor, setCancelFor] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [paymentFor, setPaymentFor] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);

  const knownIds = useRef(null);
  const requestSeq = useRef(0);
  const dialogOpen = Boolean(cancelFor || paymentFor || deleteFor);

  // Debounce the search box
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Window labels for the slot filter
  useEffect(() => {
    axios.get(`${backendUrl}/api/tiffin/admin/settings`)
      .then(({ data }) => {
        const labels = (data?.ordering?.windows || data?.data?.orderingWindows || []).map((w) => w.label).filter(Boolean);
        if (labels.length) setSlots(labels);
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/tiffin-order/admin/summary`);
      if (data?.success) setSummary(data.data);
    } catch {
      /* summary is optional */
    }
  }, []);

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    const seq = ++requestSeq.current;
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const params = { status, fulfilment, slot, date, search };
      Object.keys(params).forEach((k) => { if (!params[k] || params[k] === 'all') delete params[k]; });
      const { data } = await axios.get(`${backendUrl}/api/tiffin-order/admin/list`, { params });
      if (seq !== requestSeq.current) return; // a newer request is on its way
      if (!data?.success) throw new Error(data?.message || 'Could not load orders');
      const list = data.data || [];
      if (Array.isArray(data.statuses) && data.statuses.length) setStatuses(data.statuses);

      // Highlight orders that arrived since the last refresh of this same view
      if (silent && knownIds.current) {
        const fresh = list.filter((o) => !knownIds.current.has(o._id)).map((o) => o._id);
        if (fresh.length) {
          setNewIds((prev) => new Set([...prev, ...fresh]));
          toast.info(fresh.length === 1 ? 'New tiffin order received' : `${fresh.length} new tiffin orders`, { autoClose: 4000 });
          setTimeout(() => {
            setNewIds((prev) => {
              const next = new Set(prev);
              fresh.forEach((id) => next.delete(id));
              return next;
            });
          }, 12000);
        }
      }
      knownIds.current = new Set(list.map((o) => o._id));
      setOrders(list);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (seq !== requestSeq.current) return;
      const msg = apiError(err, err.message || 'Could not load tiffin orders');
      if (silent) toast.error(msg, { toastId: 'tiffin-refresh-error' });
      else setError(msg);
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [status, fulfilment, slot, date, search]);

  // Reload when filters change (a new view: don't flag its orders as new)
  useEffect(() => {
    knownIds.current = null;
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Auto refresh every 30s, paused while a dialog is open or the tab is hidden
  const refreshRef = useRef(null);
  refreshRef.current = () => {
    fetchOrders({ silent: true });
    fetchSummary();
  };
  useEffect(() => {
    if (dialogOpen) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refreshRef.current();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [dialogOpen]);

  const manualRefresh = () => refreshRef.current();

  const replaceOrder = (updated) => {
    setOrders((list) => list.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)));
  };

  const setOrderBusy = (id, value) => {
    setBusy((b) => {
      const next = { ...b };
      if (value) next[id] = value;
      else delete next[id];
      return next;
    });
  };

  const changeStatus = async (order, next, reason) => {
    setOrderBusy(order._id, `status:${next}`);
    try {
      const { data } = await axios.put(`${backendUrl}/api/tiffin-order/admin/${order._id}/status`, { status: next, reason });
      if (!data?.success) throw new Error(data?.message || 'Could not update order');
      replaceOrder(data.data);
      toast.success(`${order.orderNumber || 'Order'}: ${statusLabel(next)}`, { autoClose: 2000 });
      fetchSummary();
      return true;
    } catch (err) {
      toast.error(apiError(err, err.message || 'Could not update order'));
      return false;
    } finally {
      setOrderBusy(order._id, null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelReason.trim()) return;
    const ok = await changeStatus(cancelFor, 'cancelled', cancelReason.trim());
    if (ok) {
      setCancelFor(null);
      setCancelReason('');
    }
  };

  const confirmPayment = async () => {
    const order = paymentFor;
    setOrderBusy(order._id, 'payment');
    try {
      const { data } = await axios.put(`${backendUrl}/api/tiffin-order/admin/${order._id}/payment`, { status: 'completed' });
      if (!data?.success) throw new Error(data?.message || 'Could not update payment');
      replaceOrder(data.data);
      toast.success(`Payment received for ${order.orderNumber}`);
      setPaymentFor(null);
      fetchSummary();
    } catch (err) {
      toast.error(apiError(err, err.message || 'Could not update payment'));
    } finally {
      setOrderBusy(order._id, null);
    }
  };

  const confirmDelete = async () => {
    const order = deleteFor;
    setOrderBusy(order._id, 'delete');
    try {
      const { data } = await axios.delete(`${backendUrl}/api/tiffin-order/admin/${order._id}`);
      if (!data?.success) throw new Error(data?.message || 'Could not delete order');
      setOrders((list) => list.filter((o) => o._id !== order._id));
      knownIds.current?.delete(order._id);
      toast.success(`${order.orderNumber} deleted`);
      setDeleteFor(null);
      fetchSummary();
    } catch (err) {
      toast.error(apiError(err, err.message || 'Could not delete order'));
    } finally {
      setOrderBusy(order._id, null);
    }
  };

  const onPrint = (order) => {
    if (!printKitchenTicket(order)) toast.error('Allow pop-ups for this site to print tickets');
  };

  const isToday = date === todayIST();
  const filtersActive = status !== 'all' || fulfilment !== 'all' || slot !== 'all' || search || !isToday;
  const clearFilters = () => {
    setStatus('all');
    setFulfilment('all');
    setSlot('all');
    setDate(todayIST());
    setSearchInput('');
    setSearch('');
  };

  const statusCounts = useMemo(() => {
    const c = {};
    orders.forEach((o) => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

  const summaryCards = [
    { key: 'total', label: 'Orders today', value: summary?.total ?? '–', Icon: FaReceipt, tone: 'brand' },
    { key: 'active', label: 'In progress', value: summary?.active ?? '–', Icon: FaFire, tone: 'info' },
    { key: 'pending', label: 'Awaiting payment', value: summary?.pending ?? '–', Icon: FaHourglassHalf, tone: 'warning' },
    { key: 'revenue', label: 'Revenue today', value: summary ? formatINR(summary.revenue) : '–', Icon: FaRupeeSign, tone: 'violet' },
  ];

  return (
    <div className="tiffin-orders">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tiffin orders</h1>
          <p className="page-subtitle">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit' })} · refreshes every 30s`
              : 'Live kitchen queue'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={manualRefresh} disabled={refreshing || loading}>
          <FaSyncAlt className={refreshing ? 'spin-icon' : ''} aria-hidden="true" />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="to-summary">
        {summaryCards.map(({ key, label, value, Icon, tone }) => (
          <div key={key} className={`card to-stat tone-${tone}`}>
            <span className="to-stat-icon"><Icon aria-hidden="true" /></span>
            <div>
              <p className="to-stat-value">{value}</p>
              <p className="to-stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card to-filters">
        <div className="to-chips" role="group" aria-label="Filter by status">
          <button className={`to-chip${status === 'all' ? ' active all' : ''}`} onClick={() => setStatus('all')} aria-pressed={status === 'all'}>
            All{status === 'all' && ` (${orders.length})`}
          </button>
          {statuses.map((s) => (
            <button
              key={s}
              className={`to-chip${status === s ? ' active' : ''}`}
              data-tone={STATUS_META[s]?.tone}
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
            >
              {statusLabel(s)}
              {status === 'all' && statusCounts[s] ? <span className="to-chip-count">{statusCounts[s]}</span> : null}
            </button>
          ))}
        </div>
        <div className="to-filter-row">
          <div className="to-search">
            <FaSearch className="to-search-icon" aria-hidden="true" />
            <input
              className="input"
              type="search"
              placeholder="Order no., name or phone"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search tiffin orders"
            />
          </div>
          <select className="select" value={fulfilment} onChange={(e) => setFulfilment(e.target.value)} aria-label="Filter by fulfilment">
            <option value="all">All types</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </select>
          <select className="select" value={slot} onChange={(e) => setSlot(e.target.value)} aria-label="Filter by slot">
            <option value="all">All slots</option>
            {slots.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            className="input to-date"
            type="date"
            value={date}
            max={todayIST()}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Order date"
          />
          {filtersActive && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              <FaTimes aria-hidden="true" /> Reset
            </button>
          )}
        </div>
      </div>

      <div className={`to-list-wrap${loading && orders.length ? ' is-loading' : ''}`}>
        {loading && orders.length > 0 && <div className="refresh-bar" aria-hidden="true" />}
        {loading && orders.length === 0 && !error ? (
          <CardSkeleton count={4} minWidth={340} />
        ) : error ? (
          <div className="card">
            <EmptyState
              error
              icon={<FaExclamationTriangle />}
              title="Couldn't load tiffin orders"
              text={error}
              action={<button className="btn btn-primary" onClick={() => fetchOrders()}><FaRedo aria-hidden="true" /> Try again</button>}
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={filtersActive ? <FaSearch /> : <FaInbox />}
              title={filtersActive ? 'No orders match these filters' : 'No tiffin orders yet today'}
              text={filtersActive ? 'Try another status, slot or date.' : 'New orders will appear here automatically.'}
              action={filtersActive ? <button className="btn btn-secondary" onClick={clearFilters}>Clear filters</button> : null}
            />
          </div>
        ) : (
          <div className="to-list">
            {orders.map((o) => (
              <TiffinOrderCard
                key={o._id}
                order={o}
                busy={busy[o._id]}
                isNew={newIds.has(o._id)}
                showDate={!isToday}
                onStatus={changeStatus}
                onCancel={(order) => { setCancelFor(order); setCancelReason(''); }}
                onPayment={setPaymentFor}
                onDelete={setDeleteFor}
                onPrint={onPrint}
              />
            ))}
          </div>
        )}
      </div>

      {cancelFor && (
        <ConfirmDialog
          danger
          icon={<FaTimes />}
          title={`Cancel ${cancelFor.orderNumber}?`}
          message="The customer will see this reason on their order."
          confirmLabel="Cancel order"
          busyLabel="Cancelling..."
          busy={Boolean(busy[cancelFor._id])}
          confirmDisabled={!cancelReason.trim()}
          onConfirm={confirmCancel}
          onCancel={() => setCancelFor(null)}
        >
          <div className="cancel-reasons">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`to-chip${cancelReason === r ? ' active all' : ''}`}
                onClick={() => setCancelReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <label className="field">
            <span className="label">Reason *</span>
            <textarea
              className="textarea"
              rows={3}
              maxLength={300}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Why is this order being cancelled?"
              autoFocus
            />
          </label>
        </ConfirmDialog>
      )}

      {paymentFor && (
        <ConfirmDialog
          icon={<FaCheckCircle />}
          title="Mark payment received?"
          message={`Confirm you received ${formatINR(paymentFor.amount)} for ${paymentFor.orderNumber}${paymentFor.payment?.method === 'WHATSAPP_PAY' ? ' on WhatsApp / UPI' : ''}.`}
          confirmLabel="Yes, received"
          busyLabel="Saving..."
          busy={busy[paymentFor._id] === 'payment'}
          onConfirm={confirmPayment}
          onCancel={() => setPaymentFor(null)}
        />
      )}

      {deleteFor && (
        <ConfirmDialog
          danger
          icon={<FaTrash />}
          title={`Delete ${deleteFor.orderNumber}?`}
          message="This permanently removes the order from the records. This cannot be undone."
          confirmLabel="Yes, delete"
          busyLabel="Deleting..."
          busy={busy[deleteFor._id] === 'delete'}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteFor(null)}
        />
      )}
    </div>
  );
};

export default TiffinOrders;
