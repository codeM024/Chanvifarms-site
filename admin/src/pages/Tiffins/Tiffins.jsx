import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FaPlus, FaPen, FaTrash, FaArrowUp, FaArrowDown, FaUtensils, FaExclamationTriangle, FaRedo, FaUndo, FaSave,
} from 'react-icons/fa';
import { CardSkeleton, EmptyState } from '../../components/Feedback/Feedback';
import { Switch, ConfirmDialog, TiffinTabs } from './TiffinUi';
import TiffinFormModal from './TiffinFormModal';
import { apiError, backendUrl, formatINR } from './tiffinUtils';
import './Tiffins.css';

const Tiffins = () => {
  const [items, setItems] = useState([]);
  const [savedOrder, setSavedOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState({});
  const [formFor, setFormFor] = useState(null); // null | 'new' | tiffin
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${backendUrl}/api/tiffin/admin/list`);
      if (!data?.success) throw new Error(data?.message || 'Could not load tiffins');
      const list = data.data || [];
      setItems(list);
      setSavedOrder(list.map((t) => t._id));
    } catch (err) {
      setError(apiError(err, 'Could not load tiffins'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const orderDirty = useMemo(() => {
    const ids = items.map((t) => t._id);
    return ids.length === savedOrder.length && ids.some((id, i) => id !== savedOrder[i]);
  }, [items, savedOrder]);

  const availableCount = items.filter((t) => t.isAvailable).length;

  const toggleAvailability = async (tiffin, next) => {
    setToggling((t) => ({ ...t, [tiffin._id]: true }));
    setItems((list) => list.map((t) => (t._id === tiffin._id ? { ...t, isAvailable: next } : t)));
    try {
      const fd = new FormData();
      fd.append('isAvailable', String(next));
      const { data } = await axios.put(`${backendUrl}/api/tiffin/admin/${tiffin._id}`, fd);
      if (!data?.success) throw new Error(data?.message || 'Could not update');
      toast.success(`${tiffin.name} is now ${next ? 'available' : 'hidden'}`, { autoClose: 1800 });
    } catch (err) {
      setItems((list) => list.map((t) => (t._id === tiffin._id ? { ...t, isAvailable: !next } : t)));
      toast.error(apiError(err, err.message || 'Could not update availability'));
    } finally {
      setToggling((t) => {
        const copy = { ...t };
        delete copy[tiffin._id];
        return copy;
      });
    }
  };

  const move = (index, dir) => {
    setItems((list) => {
      const target = index + dir;
      if (target < 0 || target >= list.length) return list;
      const copy = [...list];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const resetOrder = () => {
    setItems((list) => {
      const byId = Object.fromEntries(list.map((t) => [t._id, t]));
      return savedOrder.map((id) => byId[id]).filter(Boolean);
    });
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    const order = items.map((t) => t._id);
    try {
      const { data } = await axios.put(`${backendUrl}/api/tiffin/admin/reorder`, { order });
      if (!data?.success) throw new Error(data?.message || 'Could not save order');
      setSavedOrder(order);
      setItems((list) => list.map((t, i) => ({ ...t, sortOrder: i + 1 })));
      toast.success('Menu order saved');
    } catch (err) {
      toast.error(apiError(err, err.message || 'Could not save menu order'));
    } finally {
      setSavingOrder(false);
    }
  };

  const onSaved = (saved) => {
    if (!saved?._id) {
      fetchList();
    } else if (formFor === 'new') {
      setItems((list) => [...list, saved]);
      setSavedOrder((o) => [...o, saved._id]);
    } else {
      setItems((list) => list.map((t) => (t._id === saved._id ? { ...t, ...saved } : t)));
    }
    setFormFor(null);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const { data } = await axios.delete(`${backendUrl}/api/tiffin/admin/${toDelete._id}`);
      if (!data?.success) throw new Error(data?.message || 'Could not delete');
      setItems((list) => list.filter((t) => t._id !== toDelete._id));
      setSavedOrder((o) => o.filter((id) => id !== toDelete._id));
      toast.success(`${toDelete.name} deleted`);
      setToDelete(null);
    } catch (err) {
      toast.error(apiError(err, err.message || 'Could not delete tiffin'));
    } finally {
      setDeleting(false);
    }
  };

  const header = (
    <div className="page-header">
      <div>
        <div className="tiffins-title">
          <h1 className="page-title">Tiffin menu</h1>
          {!loading && !error && (
            <span className="count-chip">{availableCount} of {items.length} available</span>
          )}
        </div>
        <p className="page-subtitle">Dishes customers can order during the tiffin hours.</p>
      </div>
      <button className="btn btn-primary" onClick={() => setFormFor('new')} disabled={loading && !items.length}>
        <FaPlus aria-hidden="true" /> Add tiffin
      </button>
    </div>
  );

  let body;
  if (loading && items.length === 0) {
    body = <CardSkeleton count={6} minWidth={250} />;
  } else if (error) {
    body = (
      <div className="card">
        <EmptyState
          error
          icon={<FaExclamationTriangle />}
          title="Couldn't load tiffins"
          text={error}
          action={<button className="btn btn-primary" onClick={fetchList}><FaRedo aria-hidden="true" /> Try again</button>}
        />
      </div>
    );
  } else if (items.length === 0) {
    body = (
      <div className="card">
        <EmptyState
          icon={<FaUtensils />}
          title="No tiffins yet"
          text="Add your first dish with a photo, a short subtitle and a price."
          action={<button className="btn btn-primary" onClick={() => setFormFor('new')}><FaPlus aria-hidden="true" /> Add tiffin</button>}
        />
      </div>
    );
  } else {
    body = (
      <div className="tiffin-grid">
        {items.map((t, i) => (
          <article key={t._id} className={`card tiffin-card${t.isAvailable ? '' : ' is-off'}`}>
            <div className="tiffin-card-media">
              {t.image ? <img src={t.image} alt={t.name} loading="lazy" /> : <span className="tiffin-card-noimg"><FaUtensils /></span>}
              <span className="tiffin-card-pos" title="Position on the menu">#{i + 1}</span>
              {!t.isAvailable && <span className="pill pill-danger tiffin-card-hidden">Hidden</span>}
            </div>
            <div className="tiffin-card-body">
              <div className="tiffin-card-top">
                <div className="tiffin-card-text">
                  <h3 className="tiffin-card-name">{t.name}</h3>
                  {t.subtitle && <p className="tiffin-card-sub">{t.subtitle}</p>}
                </div>
                <span className="tiffin-card-price">{formatINR(t.price)}</span>
              </div>
              {t.description && <p className="tiffin-card-desc">{t.description}</p>}
              {t.imageCredit?.author && (
                <p className="tiffin-card-credit">
                  Photo:{' '}
                  {t.imageCredit.sourceUrl ? (
                    <a href={t.imageCredit.sourceUrl} target="_blank" rel="noopener noreferrer">{t.imageCredit.author}</a>
                  ) : t.imageCredit.author}
                  {t.imageCredit.license && ` · ${t.imageCredit.license}`}
                </p>
              )}
              <div className="tiffin-card-foot">
                <Switch
                  id={`avail-${t._id}`}
                  checked={Boolean(t.isAvailable)}
                  busy={Boolean(toggling[t._id])}
                  disabled={Boolean(toggling[t._id])}
                  onChange={(v) => toggleAvailability(t, v)}
                  label={t.isAvailable ? 'Available' : 'Hidden'}
                />
                <div className="tiffin-card-actions">
                  <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0 || savingOrder} title="Move up" aria-label={`Move ${t.name} up`}>
                    <FaArrowUp />
                  </button>
                  <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === items.length - 1 || savingOrder} title="Move down" aria-label={`Move ${t.name} down`}>
                    <FaArrowDown />
                  </button>
                  <button className="icon-btn edit-btn" onClick={() => setFormFor(t)} title="Edit" aria-label={`Edit ${t.name}`}>
                    <FaPen />
                  </button>
                  <button className="icon-btn remove-btn" onClick={() => setToDelete(t)} title="Delete" aria-label={`Delete ${t.name}`}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="tiffins-page">
      <TiffinTabs />
      {header}

      {orderDirty && (
        <div className="card order-bar" role="status">
          <span>You changed the menu order.</span>
          <div className="order-bar-actions">
            <button className="btn btn-ghost btn-sm" onClick={resetOrder} disabled={savingOrder}>
              <FaUndo aria-hidden="true" /> Reset
            </button>
            <button className="btn btn-primary btn-sm" onClick={saveOrder} disabled={savingOrder}>
              {savingOrder ? <span className="spinner" aria-hidden="true" /> : <FaSave aria-hidden="true" />}
              {savingOrder ? 'Saving...' : 'Save order'}
            </button>
          </div>
        </div>
      )}

      {body}

      {formFor && (
        <TiffinFormModal
          tiffin={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={onSaved}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          danger
          icon={<FaTrash />}
          title={`Delete ${toDelete.name}?`}
          message="This removes the tiffin from the menu and permanently deletes its photo. Past orders keep their details. This cannot be undone."
          confirmLabel="Yes, delete"
          busyLabel="Deleting..."
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
};

export default Tiffins;
