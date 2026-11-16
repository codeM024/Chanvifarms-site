import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FaPlus, FaTrash, FaExclamationTriangle, FaRedo, FaExclamationCircle, FaClock, FaTruck, FaStore, FaLink, FaSave, FaUndo,
} from 'react-icons/fa';
import { EmptyState, Skeleton } from '../../components/Feedback/Feedback';
import { Switch, TiffinTabs, OpenBadge } from './TiffinUi';
import { apiError, backendUrl, formatTime12 } from './tiffinUtils';
import './TiffinSettings.css';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const URL_RE = /^https?:\/\/\S+$/i;

const toForm = (s) => ({
  deliveryEnabled: Boolean(s.deliveryEnabled),
  pickupEnabled: Boolean(s.pickupEnabled),
  deliveryFee: String(s.deliveryFee ?? 0),
  minOrderAmount: String(s.minOrderAmount ?? 0),
  pickupAddress: s.pickupAddress || '',
  storeTimings: s.storeTimings || '',
  produceTimings: s.produceTimings || '',
  mapsUrl: s.mapsUrl || '',
  reviewUrl: s.reviewUrl || '',
  windows: (s.orderingWindows || []).map((w) => ({
    label: w.label || '',
    start: w.start || '',
    end: w.end === '24:00' ? '' : w.end || '',
    untilMidnight: w.end === '24:00',
  })),
});

const toPayload = (f) => ({
  deliveryEnabled: f.deliveryEnabled,
  pickupEnabled: f.pickupEnabled,
  deliveryFee: Number(f.deliveryFee),
  minOrderAmount: Number(f.minOrderAmount),
  pickupAddress: f.pickupAddress.trim(),
  storeTimings: f.storeTimings.trim(),
  produceTimings: f.produceTimings.trim(),
  mapsUrl: f.mapsUrl.trim(),
  reviewUrl: f.reviewUrl.trim(),
  orderingWindows: f.windows.map((w) => ({
    label: w.label.trim(),
    start: w.start,
    end: w.untilMidnight ? '24:00' : w.end,
  })),
});

const validate = (f) => {
  const e = {};
  const winErrors = f.windows.map((w) => {
    const we = {};
    if (!w.label.trim()) we.label = 'Label is required';
    if (!TIME_RE.test(w.start)) we.start = 'Choose a start time';
    if (!w.untilMidnight && !TIME_RE.test(w.end)) we.end = 'Choose an end time';
    const end = w.untilMidnight ? '24:00' : w.end;
    if (!we.start && !we.end && w.start >= end) we.end = 'End must be after start';
    return we;
  });
  if (!f.windows.length) e.windows = 'Add at least one ordering window';

  const labels = f.windows.map((w) => w.label.trim().toLowerCase()).filter(Boolean);
  if (new Set(labels).size !== labels.length) e.windows = 'Each window needs a different label';

  const valid = f.windows
    .map((w, i) => ({ ...w, i, end: w.untilMidnight ? '24:00' : w.end }))
    .filter((w) => !Object.keys(winErrors[w.i]).length)
    .sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 1; i < valid.length; i++) {
    if (valid[i].start < valid[i - 1].end) {
      e.windows = `"${valid[i - 1].label}" and "${valid[i].label}" overlap`;
      break;
    }
  }
  if (winErrors.some((w) => Object.keys(w).length)) e.windowRows = winErrors;

  if (!f.deliveryEnabled && !f.pickupEnabled) e.fulfilment = 'Enable at least one of delivery or pickup';
  const fee = Number(f.deliveryFee);
  if (f.deliveryFee === '' || !Number.isFinite(fee) || fee < 0) e.deliveryFee = 'Enter 0 or more';
  const min = Number(f.minOrderAmount);
  if (f.minOrderAmount === '' || !Number.isFinite(min) || min < 0) e.minOrderAmount = 'Enter 0 or more';
  if (f.pickupEnabled && !f.pickupAddress.trim()) e.pickupAddress = 'Pickup address is required when pickup is on';
  if (f.mapsUrl.trim() && !URL_RE.test(f.mapsUrl.trim())) e.mapsUrl = 'Enter a full link starting with https://';
  if (f.reviewUrl.trim() && !URL_RE.test(f.reviewUrl.trim())) e.reviewUrl = 'Enter a full link starting with https://';
  return e;
};

const TiffinSettings = () => {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [ordering, setOrdering] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingAccept, setTogglingAccept] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${backendUrl}/api/tiffin/admin/settings`);
      if (!data?.success) throw new Error(data?.message || 'Could not load settings');
      const f = toForm(data.data || {});
      setForm(f);
      setSaved(f);
      setAcceptingOrders(data.data?.acceptingOrders !== false);
      setOrdering(data.ordering || null);
      setErrors({});
      setServerError('');
    } catch (err) {
      setError(apiError(err, err.message || 'Could not load tiffin settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the open/closed badge live
  const hasForm = Boolean(form);
  useEffect(() => {
    if (!hasForm) return undefined;
    const id = setInterval(async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/tiffin/status`);
        if (data?.success && data.ordering) setOrdering(data.ordering);
      } catch {
        /* ignore - badge just stays as it was */
      }
    }, 60000);
    return () => clearInterval(id);
  }, [hasForm]);

  const dirty = useMemo(() => form && saved && JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined, ...(key.endsWith('Enabled') ? { fulfilment: undefined, pickupAddress: undefined } : {}) }));
  };

  const setWindow = (i, patch) => {
    setForm((f) => ({ ...f, windows: f.windows.map((w, idx) => (idx === i ? { ...w, ...patch } : w)) }));
    setErrors((e) => ({ ...e, windows: undefined, windowRows: undefined }));
  };

  const addWindow = () => {
    setForm((f) => ({ ...f, windows: [...f.windows, { label: '', start: '', end: '', untilMidnight: false }] }));
    setErrors((e) => ({ ...e, windows: undefined }));
  };

  const removeWindow = (i) => {
    setForm((f) => ({ ...f, windows: f.windows.filter((_, idx) => idx !== i) }));
    setErrors((e) => ({ ...e, windows: undefined, windowRows: undefined }));
  };

  const toggleAccepting = async (next) => {
    setTogglingAccept(true);
    setAcceptingOrders(next);
    try {
      const { data } = await axios.put(`${backendUrl}/api/tiffin/admin/settings`, { acceptingOrders: next });
      if (!data?.success) throw new Error(data?.message || 'Could not update');
      if (data.ordering) setOrdering(data.ordering);
      toast.success(next ? 'Tiffin ordering turned on' : 'Tiffin ordering paused');
    } catch (err) {
      setAcceptingOrders(!next);
      toast.error(apiError(err, err.message || 'Could not update ordering'));
    } finally {
      setTogglingAccept(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setServerError('');
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.put(`${backendUrl}/api/tiffin/admin/settings`, toPayload(form));
      if (!data?.success) throw new Error(data?.message || 'Could not save settings');
      const f = toForm(data.data || {});
      setForm(f);
      setSaved(f);
      if (data.ordering) setOrdering(data.ordering);
      toast.success('Tiffin settings saved');
    } catch (err) {
      setServerError(apiError(err, err.message || 'Could not save settings'));
    } finally {
      setSaving(false);
    }
  };

  const title = (
    <div className="page-header">
      <div>
        <div className="tiffins-settings-title">
          <h1 className="page-title">Tiffin settings</h1>
          <OpenBadge ordering={ordering} />
        </div>
        <p className="page-subtitle">{ordering?.message || 'Ordering hours, delivery and store details.'}</p>
      </div>
    </div>
  );

  if (loading && !form) {
    return (
      <div className="tiffin-settings">
        <TiffinTabs />
        {title}
        <div className="settings-grid" aria-busy="true">
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="card card-pad settings-skeleton">
              <Skeleton height={16} width="40%" />
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={12} width="60%" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="tiffin-settings">
        <TiffinTabs />
        {title}
        <div className="card">
          <EmptyState
            error
            icon={<FaExclamationTriangle />}
            title="Couldn't load tiffin settings"
            text={error}
            action={<button className="btn btn-primary" onClick={load}><FaRedo aria-hidden="true" /> Try again</button>}
          />
        </div>
      </div>
    );
  }

  const rowErr = (i, k) => errors.windowRows?.[i]?.[k];

  return (
    <div className="tiffin-settings">
      <TiffinTabs />
      {title}

      <div className={`card card-pad accept-card${acceptingOrders ? ' is-on' : ''}`}>
        <div>
          <p className="accept-title">Accepting tiffin orders</p>
          <p className="field-hint">
            {acceptingOrders
              ? 'Customers can order during the ordering windows below.'
              : 'Ordering is paused for everyone, even inside the ordering windows.'}
          </p>
        </div>
        <Switch
          id="accepting-orders"
          checked={acceptingOrders}
          busy={togglingAccept}
          disabled={togglingAccept}
          onChange={toggleAccepting}
          label={acceptingOrders ? 'On' : 'Paused'}
        />
      </div>

      <form onSubmit={save} noValidate>
        <div className="settings-grid">
          <section className="card card-pad settings-section settings-wide">
            <h2 className="section-title"><FaClock aria-hidden="true" /> Ordering windows <span className="field-hint">(India time)</span></h2>
            <div className="windows-list">
              {form.windows.map((w, i) => (
                <div key={i} className="window-row">
                  <label className="field window-label">
                    <span className="label">Label</span>
                    <input
                      className={`input${rowErr(i, 'label') ? ' has-error' : ''}`}
                      value={w.label}
                      onChange={(e) => setWindow(i, { label: e.target.value })}
                      placeholder="e.g. Breakfast"
                      maxLength={30}
                    />
                    {rowErr(i, 'label') && <span className="field-error">{rowErr(i, 'label')}</span>}
                  </label>
                  <label className="field">
                    <span className="label">Opens</span>
                    <input
                      type="time"
                      className={`input${rowErr(i, 'start') ? ' has-error' : ''}`}
                      value={w.start}
                      onChange={(e) => setWindow(i, { start: e.target.value })}
                    />
                    {rowErr(i, 'start') && <span className="field-error">{rowErr(i, 'start')}</span>}
                  </label>
                  <label className="field">
                    <span className="label">Closes</span>
                    <input
                      type="time"
                      className={`input${rowErr(i, 'end') ? ' has-error' : ''}`}
                      value={w.untilMidnight ? '' : w.end}
                      disabled={w.untilMidnight}
                      onChange={(e) => setWindow(i, { end: e.target.value })}
                      aria-label={w.untilMidnight ? 'Closes at midnight' : 'Closes'}
                    />
                    {rowErr(i, 'end') && <span className="field-error">{rowErr(i, 'end')}</span>}
                  </label>
                  <label className="midnight-check">
                    <input
                      type="checkbox"
                      checked={w.untilMidnight}
                      onChange={(e) => setWindow(i, { untilMidnight: e.target.checked })}
                    />
                    Until midnight
                  </label>
                  <button
                    type="button"
                    className="icon-btn remove-window"
                    onClick={() => removeWindow(i)}
                    disabled={form.windows.length <= 1}
                    title="Remove window"
                    aria-label={`Remove ${w.label || 'window'}`}
                  >
                    <FaTrash />
                  </button>
                  {TIME_RE.test(w.start) && (w.untilMidnight || TIME_RE.test(w.end)) && (
                    <p className="window-preview">
                      {formatTime12(w.start)} – {w.untilMidnight ? '12:00 AM (midnight)' : formatTime12(w.end)}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {errors.windows && <p className="field-error">{errors.windows}</p>}
            <button type="button" className="btn btn-soft btn-sm add-window" onClick={addWindow} disabled={form.windows.length >= 6}>
              <FaPlus aria-hidden="true" /> Add window
            </button>
          </section>

          <section className="card card-pad settings-section">
            <h2 className="section-title"><FaTruck aria-hidden="true" /> Delivery &amp; pickup</h2>
            <div className="toggle-row">
              <Switch id="delivery-enabled" checked={form.deliveryEnabled} onChange={(v) => set('deliveryEnabled', v)} label="Home delivery" />
              <Switch id="pickup-enabled" checked={form.pickupEnabled} onChange={(v) => set('pickupEnabled', v)} label="Store pickup" />
            </div>
            {errors.fulfilment && <p className="field-error">{errors.fulfilment}</p>}
            <div className="two-col">
              <label className="field">
                <span className="label">Delivery fee (₹)</span>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  className={`input${errors.deliveryFee ? ' has-error' : ''}`}
                  value={form.deliveryFee}
                  onChange={(e) => set('deliveryFee', e.target.value)}
                  disabled={!form.deliveryEnabled}
                />
                {errors.deliveryFee && <span className="field-error">{errors.deliveryFee}</span>}
              </label>
              <label className="field">
                <span className="label">Minimum order (₹)</span>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  className={`input${errors.minOrderAmount ? ' has-error' : ''}`}
                  value={form.minOrderAmount}
                  onChange={(e) => set('minOrderAmount', e.target.value)}
                />
                {errors.minOrderAmount
                  ? <span className="field-error">{errors.minOrderAmount}</span>
                  : <span className="field-hint">0 means no minimum</span>}
              </label>
            </div>
            <label className="field">
              <span className="label">Pickup address</span>
              <textarea
                className={`textarea${errors.pickupAddress ? ' has-error' : ''}`}
                rows={3}
                value={form.pickupAddress}
                onChange={(e) => set('pickupAddress', e.target.value)}
              />
              {errors.pickupAddress && <span className="field-error">{errors.pickupAddress}</span>}
            </label>
          </section>

          <section className="card card-pad settings-section">
            <h2 className="section-title"><FaStore aria-hidden="true" /> Store details</h2>
            <label className="field">
              <span className="label">Store timings</span>
              <input
                className="input"
                value={form.storeTimings}
                onChange={(e) => set('storeTimings', e.target.value)}
                placeholder="7:00 AM - 10:00 PM (All Days)"
              />
            </label>
            <label className="field">
              <span className="label">Fresh produce timings</span>
              <input
                className="input"
                value={form.produceTimings}
                onChange={(e) => set('produceTimings', e.target.value)}
                placeholder="6:00 AM - 10:00 PM (Wed, Sat & Sun)"
              />
            </label>
            <h2 className="section-title section-sub"><FaLink aria-hidden="true" /> Links</h2>
            <label className="field">
              <span className="label">Google Maps link</span>
              <input
                type="url"
                className={`input${errors.mapsUrl ? ' has-error' : ''}`}
                value={form.mapsUrl}
                onChange={(e) => set('mapsUrl', e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
              />
              {errors.mapsUrl && <span className="field-error">{errors.mapsUrl}</span>}
            </label>
            <label className="field">
              <span className="label">Google review link</span>
              <input
                type="url"
                className={`input${errors.reviewUrl ? ' has-error' : ''}`}
                value={form.reviewUrl}
                onChange={(e) => set('reviewUrl', e.target.value)}
                placeholder="https://g.page/r/.../review"
              />
              {errors.reviewUrl && <span className="field-error">{errors.reviewUrl}</span>}
            </label>
          </section>
        </div>

        <div className={`card settings-savebar${dirty ? ' is-dirty' : ''}`}>
          {serverError ? (
            <div className="form-error-banner" role="alert">
              <FaExclamationCircle aria-hidden="true" /> <span>{serverError}</span>
            </div>
          ) : (
            <span className="field-hint">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
          )}
          <div className="savebar-actions">
            <button type="button" className="btn btn-ghost" onClick={() => { setForm(saved); setErrors({}); setServerError(''); }} disabled={!dirty || saving}>
              <FaUndo aria-hidden="true" /> Discard
            </button>
            <button type="submit" className="btn btn-primary" disabled={!dirty || saving}>
              {saving ? <span className="spinner" aria-hidden="true" /> : <FaSave aria-hidden="true" />}
              {saving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TiffinSettings;
