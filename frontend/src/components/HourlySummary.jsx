import React, { useState, useEffect, useMemo } from 'react';
import { getHourlySummary, createHourlyLog } from '../api';
import { TrendingUp, BarChart3, Eye, EyeOff, ChevronDown } from 'lucide-react';
import HourlyTimeline from './HourlyTimeline';
import HourlyLogModal from './HourlyLogModal';

const CATEGORY_CELL_MAPPING = {
  'CUTTING + PREPARATION': ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11'],
  'COMPUTER STITCHING': ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10'],
  'SEWING': ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11', 'Cell D3', 'Cell D4', 'Cell D5', 'Cell D6', 'Cell D7', 'Cell BZ'],
  'ASSEMBLY': ['Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11'],
};

const ALL_DEFAULT_CELLS = [...new Set(Object.values(CATEGORY_CELL_MAPPING).flat()), 'ZHANHUI'];

const HourlySummary = ({ filterMode, filterValue, filterCell, activeCategory, categories, hiddenCells, setHiddenCells, selectedModel }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showInput, setShowInput] = useState(false);
  const [showZhanhui, setShowZhanhui] = useState(true);
  const [isManageOpen, setIsManageOpen] = useState(false);

  const handleCellClick = (cell, hour, existingLogs, clickedField = 'output') => {
    if (existingLogs && existingLogs.length > 0) {
      // Edit mode (taking the first log if multiple exist)
      setModalData({ ...existingLogs[0], _focusField: clickedField });
    } else {
      // Add mode
      setModalData({
        category: activeCategory === 'ALL CATEGORY' ? categories[0] : activeCategory,
        cell: cell,
        hour_range: hour,
        date: filterMode === 'day' ? filterValue : new Date().toISOString().split('T')[0],
        output: 0,
        input_qty: 0,
        b_grade: 0,
        c_grade: 0,
        _focusField: clickedField
      });
    }
    setShowModal(true);
  };

  const handleDirectSave = async (cellName, value) => {
    if (filterMode !== 'day') {
      return;
    }
    try {
      await createHourlyLog({
        category: 'COMPUTER STITCHING',
        cell: cellName,
        date: filterValue,
        hour_range: 'DAILY_TOTAL',
        output: parseInt(value) || 0,
        b_grade: 0,
        c_grade: 0,
        note: ''
      }, selectedModel);
      fetchData();
    } catch (err) {
      console.error(`Failed to save data for ${cellName}`, err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterMode === 'day') params.date_filter = filterValue;
      else if (filterMode === 'month') params.month_filter = filterValue;

      const res = await getHourlySummary(params, selectedModel);
      let summaryData = res.data;

      const CELL_ORDER = ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11', 'Cell D3', 'Cell D5', 'Cell D6', 'Cell D7', 'Cell BZ', 'ZHANHUI'];
      
      // For summary table, we use the union of all cells from all categories
      const allDefaultCells = [...new Set(Object.values(CATEGORY_CELL_MAPPING).flat()), 'ZHANHUI'];

      if (filterCell === 'all') {
        const existingCells = summaryData.map(d => d.cell);
        allDefaultCells.forEach(cellName => {
          if (!existingCells.includes(cellName)) {
            summaryData.push({
              cell: cellName,
              total_all: 0,
              total_b_grade: 0,
              total_c_grade: 0,
              notes: ""
            });
          }
        });
      } else {
        summaryData = summaryData.filter(d => d.cell === filterCell);
        if (summaryData.length === 0 && (CELL_ORDER.includes(filterCell) || allDefaultCells.includes(filterCell))) {
          summaryData.push({
            cell: filterCell,
            total_all: 0,
            total_b_grade: 0,
            total_c_grade: 0,
            notes: ""
          });
        }
      }

      summaryData.sort((a, b) => {
        const idxA = CELL_ORDER.indexOf(a.cell);
        const idxB = CELL_ORDER.indexOf(b.cell);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        
        const numA = parseInt(a.cell.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.cell.replace(/\D/g, ''), 10) || 0;
        return numA - numB || a.cell.localeCompare(b.cell);
      });

      setData(summaryData);
    } catch (err) {
      console.error("Failed to fetch hourly summary", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [filterMode, filterValue, filterCell, refreshTrigger, selectedModel]);

  const visibleSummaryData = useMemo(() => {
    let result = showZhanhui ? data : data.filter(r => r.cell !== 'ZHANHUI');
    return result.filter(row => !hiddenCells.includes(row.cell));
  }, [data, showZhanhui, hiddenCells]);

  return (
    <div className="space-y-8 animate-fade-in">
      {activeCategory === 'ALL CATEGORY' ? (
        categories.map(cat => (
          <HourlyTimeline 
            key={cat}
            filterMode={filterMode} 
            filterValue={filterValue} 
            filterCell={filterCell} 
            category={cat}
            title={`Timeline: ${cat}`}
            onCellClick={(cell, hour, logs, clickedField) => handleCellClick(cell, hour, logs, clickedField)}
            refreshTrigger={refreshTrigger}
            hiddenCells={hiddenCells}
            setHiddenCells={setHiddenCells}
            selectedModel={selectedModel}
          />
        ))
      ) : (
        <HourlyTimeline 
          filterMode={filterMode} 
          filterValue={filterValue} 
          filterCell={filterCell} 
          category={activeCategory}
          title={`Timeline: ${activeCategory}`}
          onCellClick={(cell, hour, logs, clickedField) => handleCellClick(cell, hour, logs, clickedField)}
          refreshTrigger={refreshTrigger}
          hiddenCells={hiddenCells}
          setHiddenCells={setHiddenCells}
          selectedModel={selectedModel}
        />
      )}

      {showModal && (
        <HourlyLogModal
          initialData={modalData}
          onClose={() => {
            setShowModal(false);
            setModalData(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setModalData(null);
            setRefreshTrigger(prev => prev + 1);
            fetchData();
          }}
          selectedModel={selectedModel}
        />
      )}

      <section className="glass-card overflow-hidden shadow-2xl">
      <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-surface-alt/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 size={20} className="text-primary sm:size-[22px]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-text leading-tight">Hourly Production Summary</h3>
            <p className="text-[10px] sm:text-xs text-text-muted">Aggregated total output from hourly logs</p>
          </div>
        </div>
        <div className="self-start sm:self-auto flex items-center gap-3">
          <button 
            onClick={() => setShowZhanhui(!showZhanhui)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-alt border border-border text-[10px] sm:text-xs font-bold text-text-muted hover:text-text transition-colors"
          >
            {showZhanhui ? <EyeOff size={14} /> : <Eye size={14} />}
            <span className="hidden sm:inline">{showZhanhui ? 'Hide Zhanhui' : 'Show Zhanhui'}</span>
          </button>
          <button 
            onClick={() => setShowInput(!showInput)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-alt border border-border text-[10px] sm:text-xs font-bold text-text-muted hover:text-text transition-colors"
          >
            {showInput ? <EyeOff size={14} /> : <Eye size={14} />}
            <span className="hidden sm:inline">{showInput ? 'Hide Input' : 'Show Input'}</span>
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsManageOpen(!isManageOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-alt border border-border text-[10px] sm:text-xs font-bold text-text-muted hover:text-text transition-colors"
            >
              <Eye size={14} />
              <span>Cells ({ALL_DEFAULT_CELLS.filter(c => !hiddenCells.includes(c)).length}/{ALL_DEFAULT_CELLS.length})</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${isManageOpen ? 'rotate-180' : ''}`} />
            </button>

            {isManageOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsManageOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-strong border border-border shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                    <span className="text-xs font-black text-text uppercase tracking-wider">Show/Hide Cells</span>
                    <button 
                      onClick={() => setHiddenCells([])}
                      className="text-[10px] text-primary hover:underline font-bold"
                    >
                      Show All
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin pr-1">
                    {ALL_DEFAULT_CELLS.map(cell => {
                      const isVisible = !hiddenCells.includes(cell);
                      return (
                        <label 
                          key={cell} 
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-xs font-bold text-text-muted hover:text-text transition-colors"
                        >
                          <input 
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => {
                              if (isVisible) {
                                setHiddenCells(prev => [...prev, cell]);
                              } else {
                                setHiddenCells(prev => prev.filter(c => c !== cell));
                              }
                            }}
                            className="rounded border-border text-primary focus:ring-primary/50 bg-bg"
                          />
                          <span>{cell}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        <table className="data-grid min-w-[800px] sm:min-w-full">
          <thead>
            <tr>
              <th className="py-4 px-4 sm:px-6 text-left text-[10px] sm:text-xs font-bold uppercase tracking-widest sticky left-0 z-10 backdrop-blur-sm">Cell Name</th>
              <th className="py-4 px-4 sm:px-6 text-right text-[10px] sm:text-xs font-bold uppercase tracking-widest">Cutting + Prep</th>
              <th className="py-4 px-4 sm:px-6 text-right text-[10px] sm:text-xs font-bold uppercase tracking-widest">Comp Stitching</th>
              <th className="py-4 px-4 sm:px-6 text-right text-[10px] sm:text-xs font-bold uppercase tracking-widest">Sewing</th>
              <th className="py-4 px-4 sm:px-6 text-right text-[10px] sm:text-xs font-bold uppercase tracking-widest">Assembly</th>
              <th className="py-4 px-4 sm:px-6 text-right text-[10px] sm:text-xs font-bold uppercase tracking-widest border-l border-border/10">B Grade</th>
              <th className="py-4 px-4 sm:px-6 text-right text-[10px] sm:text-xs font-bold uppercase tracking-widest">C Grade</th>
              <th className="py-4 px-4 sm:px-6 text-left text-[10px] sm:text-xs font-bold uppercase tracking-widest border-l border-border/50">Ket</th>
              {showInput && <th className="py-4 px-4 sm:px-6 text-right text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest border-l border-border/50">Total Input</th>}
              <th className="py-4 px-4 sm:px-6 text-right text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest border-l border-border/50 sticky right-0 z-10 backdrop-blur-sm">Total Output</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading && visibleSummaryData.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-24">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    <span className="text-sm text-text-muted font-medium">Calculating totals...</span>
                  </div>
                </td>
              </tr>
            ) : visibleSummaryData.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-24">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <TrendingUp size={48} className="text-text-muted mb-2" />
                    <p className="text-lg font-bold text-text-muted uppercase">No Active Cells</p>
                    <p className="text-sm text-text-muted italic">All cells are currently hidden. Enable cells from the dropdown above.</p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleSummaryData.map((row, idx) => (
                <tr key={row.cell} className={`hover:bg-white/[0.03] transition-colors group ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}>
                  <td className="py-4 px-4 sm:px-6 sticky left-0 z-10 bg-bg/95 group-hover:bg-surface-alt/50 backdrop-blur-sm border-r border-border/10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-primary/10 text-primary border border-primary/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-black text-[10px] sm:text-sm uppercase whitespace-nowrap">
                        {row.cell}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHiddenCells(prev => [...prev, row.cell]);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all p-1 rounded hover:bg-surface-alt"
                        title={`Hide ${row.cell}`}
                      >
                        <EyeOff size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <span className={`text-xs sm:text-sm font-bold ${row['CUTTING + PREPARATION'] > 0 ? 'text-text' : 'text-text-muted/30'}`}>
                      {row['CUTTING + PREPARATION'] ? row['CUTTING + PREPARATION'].toLocaleString() : '0'}
                    </span>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    {(row.cell === 'ZHANHUI' || row.cell === 'Cell D3' || row.cell === 'Cell D5' || row.cell === 'Cell D6' || row.cell === 'Cell D7') ? (
                      filterMode === 'day' ? (
                        <input 
                          key={`direct-input-${row.cell}-${filterValue}-${row['COMPUTER STITCHING']}`}
                          type="number"
                          className={`w-16 sm:w-20 bg-surface border border-border/50 rounded px-2 py-1.5 text-right text-xs sm:text-sm font-bold focus:outline-none focus:ring-1 transition-all placeholder:font-normal placeholder:text-text-muted/30 ${row.cell === 'ZHANHUI' ? 'text-cyan-400 focus:border-cyan-400 focus:ring-cyan-400/50' : 'text-text focus:border-primary focus:ring-primary/50'}`}
                          defaultValue={row['COMPUTER STITCHING'] || ''}
                          placeholder="0"
                          onBlur={(e) => handleDirectSave(row.cell, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                        />
                      ) : (
                        <span className={`text-xs sm:text-sm font-bold ${row['COMPUTER STITCHING'] > 0 ? (row.cell === 'ZHANHUI' ? 'text-cyan-400' : 'text-text') : 'text-text-muted/30'}`}>
                          {row['COMPUTER STITCHING'] ? row['COMPUTER STITCHING'].toLocaleString() : '0'}
                        </span>
                      )
                    ) : (
                      <span className={`text-xs sm:text-sm font-bold ${row['COMPUTER STITCHING'] > 0 ? 'text-text' : 'text-text-muted/30'}`}>
                        {row['COMPUTER STITCHING'] ? row['COMPUTER STITCHING'].toLocaleString() : '0'}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <span className={`text-xs sm:text-sm font-bold ${row['SEWING'] > 0 ? 'text-text' : 'text-text-muted/30'}`}>
                      {row['SEWING'] ? row['SEWING'].toLocaleString() : '0'}
                    </span>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <span className={`text-xs sm:text-sm font-bold ${row['ASSEMBLY'] > 0 ? 'text-text' : 'text-text-muted/30'}`}>
                      {row['ASSEMBLY'] ? row['ASSEMBLY'].toLocaleString() : '0'}
                    </span>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right border-l border-border/10">
                    <span className={`text-xs sm:text-sm font-bold ${row['total_b_grade'] > 0 ? 'text-yellow-500' : 'text-text-muted/30'}`}>
                      {row['total_b_grade'] ? row['total_b_grade'].toLocaleString() : '0'}
                    </span>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <span className={`text-xs sm:text-sm font-bold ${row['total_c_grade'] > 0 ? 'text-red-500' : 'text-text-muted/30'}`}>
                      {row['total_c_grade'] ? row['total_c_grade'].toLocaleString() : '0'}
                    </span>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-left border-l border-border/50">
                    <span className="text-xs text-text-muted max-w-[150px] block truncate" title={row['notes'] || '-'}>
                      {row['notes'] || '-'}
                    </span>
                  </td>
                  {showInput && (
                    <td className="py-4 px-4 sm:px-6 text-right border-l border-border/50">
                      <span className="text-sm sm:text-base font-black text-primary">
                        {row['total_input'] ? row['total_input'].toLocaleString() : '0'}
                      </span>
                    </td>
                  )}
                  <td className="py-4 px-4 sm:px-6 text-right border-l border-border/50 sticky right-0 z-10 bg-bg/95 backdrop-blur-sm">
                    <div className="flex flex-col items-end">
                      <span className="text-sm sm:text-base font-black text-primary-light">
                        {row['total_all'] ? row['total_all'].toLocaleString() : '0'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {visibleSummaryData.length > 0 && (
            <tfoot className="bg-surface-alt/50 border-t border-border">
              <tr className="font-black text-text">
                <td className="py-5 px-6 uppercase text-xs tracking-widest text-text-muted">Total Overall</td>
                <td className="py-5 px-6 text-right text-sm">
                  {visibleSummaryData.reduce((acc, r) => acc + (r['CUTTING + PREPARATION'] || 0), 0).toLocaleString()}
                </td>
                <td className="py-5 px-6 text-right text-sm">
                  {visibleSummaryData.reduce((acc, r) => acc + (r['COMPUTER STITCHING'] || 0), 0).toLocaleString()}
                </td>
                <td className="py-5 px-6 text-right text-sm">
                  {visibleSummaryData.reduce((acc, r) => acc + (r['SEWING'] || 0), 0).toLocaleString()}
                </td>
                <td className="py-5 px-6 text-right text-sm">
                  {visibleSummaryData.reduce((acc, r) => acc + (r['ASSEMBLY'] || 0), 0).toLocaleString()}
                </td>
                <td className="py-5 px-6 text-right text-sm text-yellow-500 border-l border-border/10">
                  {visibleSummaryData.reduce((acc, r) => acc + (r['total_b_grade'] || 0), 0).toLocaleString()}
                </td>
                <td className="py-5 px-6 text-right text-sm text-red-500">
                  {visibleSummaryData.reduce((acc, r) => acc + (r['total_c_grade'] || 0), 0).toLocaleString()}
                </td>
                <td className="py-5 px-6 border-l border-border/50"></td>
                {showInput && (
                  <td className="py-5 px-6 text-right text-lg text-primary border-l border-border/50">
                    {visibleSummaryData.reduce((acc, r) => acc + (r['total_input'] || 0), 0).toLocaleString()}
                  </td>
                )}
                <td className="py-5 px-6 text-right text-lg text-primary border-l border-border/50">
                  {visibleSummaryData.reduce((acc, r) => acc + (r['total_all'] || 0), 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
    </div>
  );
};

export default HourlySummary;
