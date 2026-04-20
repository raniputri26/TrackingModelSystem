import React, { useState, useEffect } from 'react';
import { X, FileUp, CheckCircle, AlertCircle, Loader2, List } from 'lucide-react';
import { uploadExcel, listSheets } from '../api';

const UploadModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('Summary');
  const [status, setStatus] = useState('idle'); // idle, loading_sheets, uploading, success, error
  const [message, setMessage] = useState('');

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('loading_sheets');
      try {
        const res = await listSheets(selectedFile);
        setSheets(res.data.sheets);
        if (res.data.sheets.length > 0) {
          // If Summary exists, select it by default, else select first
          const defaultSheet = res.data.sheets.includes('Summary') ? 'Summary' : res.data.sheets[0];
          setSelectedSheet(defaultSheet);
        }
        setStatus('idle');
      } catch (err) {
        setStatus('error');
        setMessage("Failed to read Excel sheets. Make sure it's a valid file.");
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedSheet) return;
    
    setStatus('uploading');
    try {
      const res = await uploadExcel(file, selectedSheet);
      setStatus('success');
      setMessage(`Successfully processed ${res.data.records_processed} records.`);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.detail || "Failed to upload file. Check Excel format.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md overflow-hidden animate-fade-in shadow-2xl">
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface-alt/50">
          <div>
            <h3 className="text-xl font-bold">Import Data</h3>
            <p className="text-xs text-text-muted">Select file and target sheet</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {status === 'success' ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-success" />
              </div>
              <p className="text-lg font-bold">Upload Complete</p>
              <p className="text-sm text-text-muted">{message}</p>
            </div>
          ) : (
            <>
              {/* File Drop Area */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer mb-6 ${
                  file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <input 
                  type="file" 
                  id="fileInput" 
                  hidden 
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${file ? 'bg-primary text-bg shadow-lg shadow-primary/30' : 'bg-surface-alt text-text-muted'}`}>
                    {status === 'loading_sheets' ? <Loader2 size={24} className="animate-spin" /> : <FileUp size={24} />}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-white max-w-[200px] truncate">{file ? file.name : 'Select Excel File'}</p>
                    <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest font-bold">MAX 20MB • XLSX / XLS</p>
                  </div>
                </div>
              </div>

              {/* Sheet Selection */}
              {file && status !== 'loading_sheets' && sheets.length > 0 && (
                <div className="mb-6 space-y-2 animate-fade-in">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider block ml-1">
                    Select Source Sheet
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                      <List size={16} />
                    </div>
                    <select 
                      value={selectedSheet}
                      onChange={(e) => setSelectedSheet(e.target.value)}
                      className="w-full bg-surface-alt border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:border-primary outline-none appearance-none cursor-pointer hover:bg-surface transition-colors"
                    >
                      {sheets.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-text-muted italic px-1">
                    Tip: The system will detect red cells for alert status automatically.
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="flex items-center gap-2 text-danger text-sm mb-6 justify-center bg-danger/10 p-3 rounded-lg border border-danger/20">
                  <AlertCircle size={14} />
                  <span>{message}</span>
                </div>
              )}

              <button 
                onClick={handleUpload}
                disabled={!file || status === 'uploading' || status === 'loading_sheets'}
                className={`w-full py-3.5 rounded-xl bg-primary text-bg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none mt-2`}
              >
                {status === 'uploading' ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Processing Data...</span>
                  </div>
                ) : (
                  <span>Start Import</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
