import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCloudUploadAlt, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { Modal, Switch } from './TiffinUi';
import { apiError, backendUrl } from './tiffinUtils';

const MAX_MB = 5;

const TiffinFormModal = ({ tiffin, onClose, onSaved }) => {
  const isEdit = Boolean(tiffin);
  const [form, setForm] = useState({
    name: tiffin?.name || '',
    subtitle: tiffin?.subtitle || '',
    description: tiffin?.description || '',
    price: tiffin?.price != null ? String(tiffin.price) : '',
    isAvailable: tiffin?.isAvailable ?? true,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(tiffin?.image || '');
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  // Free the object URL created for a local preview
  useEffect(() => () => {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
  }, [preview]);

  const pickFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setErrors((e) => ({ ...e, image: 'Please choose an image file (JPG, PNG or WebP)' }));
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, image: `Image must be smaller than ${MAX_MB} MB` }));
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setErrors((e) => ({ ...e, image: undefined }));
  };

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = 'Name is required';
    const price = Number(form.price);
    if (!form.price || !Number.isFinite(price) || price <= 0) er.price = 'Enter a price greater than 0';
    if (!isEdit && !file) er.image = 'Please add a photo of the tiffin';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('subtitle', form.subtitle.trim());
    fd.append('description', form.description.trim());
    fd.append('price', String(Number(form.price)));
    fd.append('isAvailable', String(form.isAvailable));
    if (file) fd.append('image', file);

    setSaving(true);
    try {
      const { data } = isEdit
        ? await axios.put(`${backendUrl}/api/tiffin/admin/${tiffin._id}`, fd)
        : await axios.post(`${backendUrl}/api/tiffin/admin/add`, fd);
      if (!data?.success) throw new Error(data?.message || 'Could not save tiffin');
      toast.success(isEdit ? 'Tiffin updated' : 'Tiffin added');
      onSaved(data.data);
    } catch (err) {
      setServerError(apiError(err, err.message || 'Could not save tiffin'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} busy={saving} wide labelledBy="tiffin-form-title">
      <form className="tiffin-form" onSubmit={submit} noValidate>
        <div className="tiffin-form-head">
          <h3 id="tiffin-form-title">{isEdit ? 'Edit tiffin' : 'Add tiffin'}</h3>
          <button type="button" className="icon-btn" onClick={onClose} disabled={saving} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="tiffin-form-grid">
          <div className="field">
            <span className="label">Photo{!isEdit && ' *'}</span>
            <div
              className={`tiffin-upload${dragOver ? ' drag-over' : ''}${errors.image ? ' error' : ''}${preview ? ' has-image' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={preview ? 'Change photo' : 'Upload photo'}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]); }}
            >
              {preview ? (
                <img src={preview} alt="Tiffin preview" className="tiffin-upload-img" />
              ) : (
                <div className="tiffin-upload-empty">
                  <span className="tiffin-upload-icon"><FaCloudUploadAlt /></span>
                  <p><strong>Click to upload</strong> or drag and drop</p>
                  <p className="field-hint">JPG, PNG or WebP, up to {MAX_MB} MB</p>
                </div>
              )}
              {preview && <span className="tiffin-upload-change">Change photo</span>}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }}
              />
            </div>
            {errors.image && <span className="field-error">{errors.image}</span>}
            {isEdit && file && <span className="field-hint">The old photo will be replaced when you save.</span>}
          </div>

          <div className="tiffin-form-fields">
            <label className="field">
              <span className="label">Name *</span>
              <input
                className={`input${errors.name ? ' has-error' : ''}`}
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Masala Dosa"
                maxLength={80}
                autoFocus
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </label>
            <label className="field">
              <span className="label">Subtitle</span>
              <input
                className="input"
                value={form.subtitle}
                onChange={set('subtitle')}
                placeholder='e.g. "Rajmaid Rice Dosa" or "2 pcs"'
                maxLength={80}
              />
            </label>
            <label className="field">
              <span className="label">Price (₹) *</span>
              <input
                className={`input${errors.price ? ' has-error' : ''}`}
                type="number"
                inputMode="decimal"
                min="1"
                step="1"
                value={form.price}
                onChange={set('price')}
                placeholder="e.g. 60"
              />
              {errors.price && <span className="field-error">{errors.price}</span>}
            </label>
            <label className="field">
              <span className="label">Description <span className="field-hint">(optional)</span></span>
              <textarea
                className="textarea"
                rows={3}
                value={form.description}
                onChange={set('description')}
                placeholder="What's in it, served with..."
                maxLength={500}
              />
            </label>
            <Switch
              id="tiffin-available"
              checked={form.isAvailable}
              onChange={(v) => setForm((f) => ({ ...f, isAvailable: v }))}
              label={form.isAvailable ? 'Available on the menu' : 'Hidden from the menu'}
            />
          </div>
        </div>

        {serverError && (
          <div className="form-error-banner" role="alert">
            <FaExclamationCircle aria-hidden="true" /> <span>{serverError}</span>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving && <span className="spinner" aria-hidden="true" />}
            {saving ? (file ? 'Uploading...' : 'Saving...') : isEdit ? 'Save changes' : 'Add tiffin'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

TiffinFormModal.propTypes = {
  tiffin: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.number,
    image: PropTypes.string,
    isAvailable: PropTypes.bool,
  }),
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
};

export default TiffinFormModal;
