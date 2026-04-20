import React, { useState, useEffect } from 'react';
import { X, Save, Clock } from 'lucide-react';
import { createHourlyLog, updateHourlyLog, getCategories } from '../api';

const HOUR_RANGES = [
  '07:00 - 08:00',
  '08:00 - 09:00',
  '09:00 - 10:00',
  '10:00 - 11:00',
  '11:00 - 12:00',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
  '20:00 - 21:00',
  '21:00 - 22:00',
];

const CELL_OPTIONS = [
  'Cell 1', 'Cell 2', 'Cell 3', 'Cell 4', 'Cell 5',
  'Cell 6', 'Cell 7', 'Cell 8', 'Cell 9', 'Cell 10',
  'Cell 11', 'Cell 12', 'Cell D6',
];

const CATEGORY_ORDER = [
  'CUTTING + PREPARATION',
  'COMPUTER STITCHING',
  'SEWING',
  'ASSEMBLY',
];

const HourlyLogModal = ({ onClose, onSuccess, editData }) => {
  const [categories, setCategories] = useState(CATEGORY_ORDER);
  const [form, setForm] = useState({
    category: editData?.category || CATEGORY_ORDER[0],
    cell: editData?.cell || CELL_OPTIONS[0],
    date: editData?.date || new Date().toISOString().split('T')[0],
    hour_range: editData?.hour_range || HOUR_RANGES[0],
    output: editData?.output || 0,
    b_grade: editData?.b_grade || 0,
    c_grade: editData?.c_grade || 0,
    note: editData?.note || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch categories from DB and merge with defaults
    getCategories().then(res => {
      const merged = [...CATEGORY_ORDER];
      res.data.forEach(c => { if (!merged.includes(c)) merged.push(c); });
      setCategories(merged);
    }).catch(() => {});
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        output: parseInt(form.output) || 0,
        b_grade: parseInt(form.b_grade) || 0,
        c_grade: parseInt(form.c_grade) || 0,
        note: form.note || null
      };

      if (editData?.id) {
        await updateHourlyLog(editData.id, payload);
      } else {
        await createHourlyLog(payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const selectClass = "w-full bg-surface-alt border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition-colors appearance-none cursor-pointer";
  const inputClass = "w-full bg-surface-alt border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition-colors";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-sidebar border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center">
              <Clock className="text-primary" size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{editData ? 'Edit Hourly Log' : 'Input Hourly Data'}</h3>
              <p className="text-xs text-text-muted">{editData ? 'Perbarui data produksi' : 'Masukkan data produksi per jam'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category & Cell Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Category</label>
              <select value={form.category} onChange={e => handleChange('category', e.target.value)} className={selectClass}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Cell</label>
              <select value={form.cell} onChange={e => handleChange('cell', e.target.value)} className={selectClass}>
                {CELL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Date & Hour Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => handleChange('date', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Hour</label>
              <select value={form.hour_range} onChange={e => handleChange('hour_range', e.target.value)} className={selectClass}>
                {HOUR_RANGES.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {/* Output, B Grade, C Grade Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Output</label>
              <input
                type="number"
                min="0"
                value={form.output}
                onChange={e => handleChange('output', e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">B Grade</label>
              <input
                type="number"
                min="0"
                value={form.b_grade}
                onChange={e => handleChange('b_grade', e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">C Grade</label>
              <input
                type="number"
                min="0"
                value={form.c_grade}
                onChange={e => handleChange('c_grade', e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>

          {/* Note Row */}
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Note / Remarks</label>
            <textarea
              value={form.note}
              onChange={e => handleChange('note', e.target.value)}
              className={`${inputClass} min-h-[80px] resize-none`}
              placeholder="Tambahkan catatan jika ada..."
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 glass-card py-3 text-sm font-bold text-text-muted hover:text-white transition-colors rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary/90 text-bg py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : (editData ? 'Save Changes' : 'Save Data')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HourlyLogModal;
