import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { FaUtensils, FaSlidersH } from 'react-icons/fa';
import './TiffinShared.css';

/* Small UI pieces shared by the tiffin admin pages. */

export const Switch = ({ checked, onChange, disabled = false, label, busy = false, id }) => (
  <label className={`switch${disabled ? ' is-disabled' : ''}${busy ? ' is-busy' : ''}`} htmlFor={id}>
    <input
      id={id}
      type="checkbox"
      role="switch"
      checked={checked}
      disabled={disabled}
      aria-checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="switch-track" aria-hidden="true"><span className="switch-thumb" /></span>
    {label && <span className="switch-label">{label}</span>}
  </label>
);
Switch.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  label: PropTypes.node,
  busy: PropTypes.bool,
  id: PropTypes.string,
};

export const Modal = ({ onClose, busy = false, wide = false, labelledBy, children }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, busy]);

  return (
    <div className="modal-overlay" onClick={busy ? undefined : onClose}>
      <div
        className={`modal${wide ? ' modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
Modal.propTypes = {
  onClose: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  wide: PropTypes.bool,
  labelledBy: PropTypes.string,
  children: PropTypes.node,
};

export const ConfirmDialog = ({
  icon, title, message, confirmLabel = 'Confirm', busyLabel = 'Working...', danger = false,
  busy = false, onConfirm, onCancel, children, confirmDisabled = false,
}) => (
  <Modal onClose={onCancel} busy={busy} labelledBy="confirm-dialog-title">
    {icon && <div className={`modal-icon${danger ? ' danger' : ''}`}>{icon}</div>}
    <h3 id="confirm-dialog-title">{title}</h3>
    {message && <p>{message}</p>}
    {children}
    <div className="modal-actions">
      <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
      <button
        type="button"
        className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
        onClick={onConfirm}
        disabled={busy || confirmDisabled}
      >
        {busy && <span className="spinner" aria-hidden="true" />}
        {busy ? busyLabel : confirmLabel}
      </button>
    </div>
  </Modal>
);
ConfirmDialog.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.node.isRequired,
  message: PropTypes.node,
  confirmLabel: PropTypes.string,
  busyLabel: PropTypes.string,
  danger: PropTypes.bool,
  busy: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  children: PropTypes.node,
  confirmDisabled: PropTypes.bool,
};

/* Menu / Settings tabs shown at the top of both tiffin setup pages */
export const TiffinTabs = () => (
  <nav className="tiffin-tabs" aria-label="Tiffin sections">
    <NavLink to="/tiffins" end className="tiffin-tab">
      <FaUtensils aria-hidden="true" /> Menu
    </NavLink>
    <NavLink to="/tiffin-settings" className="tiffin-tab">
      <FaSlidersH aria-hidden="true" /> Settings
    </NavLink>
  </nav>
);

export const OpenBadge = ({ ordering }) => {
  if (!ordering) return null;
  return (
    <span
      className={`pill open-badge ${ordering.isOpen ? 'pill-success is-open' : 'pill-danger'}`}
      title={ordering.message}
    >
      {ordering.isOpen ? `Open${ordering.currentWindow ? ` · ${ordering.currentWindow}` : ''}` : 'Closed'}
    </span>
  );
};
OpenBadge.propTypes = {
  ordering: PropTypes.shape({
    isOpen: PropTypes.bool,
    currentWindow: PropTypes.string,
    message: PropTypes.string,
  }),
};
