import React, { useState, useEffect, useMemo } from 'react';
import { getHourlyTimeline } from '../api';
import { Clock, TrendingUp, ChevronLeft, ChevronRight, Eye, EyeOff, ChevronDown } from 'lucide-react';

const HOUR_COLUMNS = [
  '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
  '11:00 - 12:00', '13:00 - 14:00', '14:00 - 15:00',
  '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', 
  '18:30 - 19:30', '19:30 - 20:30', '20:30 - 21:30',
];

const CATEGORY_CELL_MAPPING = {
  'CUTTING + PREPARATION': ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11'],
  'COMPUTER STITCHING': ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10'],
  'SEWING': ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11', 'Cell D3', 'Cell D4', 'Cell D5', 'Cell D6', 'Cell D7', 'Cell BZ'],
  'ASSEMBLY': ['Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11'],
};

const HourlyTimeline = ({ filterMode, filterValue, filterCell, category, title = "Hourly Production Timeline", onCellClick, refreshTrigger, hiddenCells, setHiddenCells, selectedModel }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);

  const visibleData = useMemo(() => {
    return data.filter(row => !hiddenCells.includes(row.cell));
  }, [data, hiddenCells]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { category };
      if (filterMode === 'day') params.date_filter = filterValue;
      else if (filterMode === 'month') params.month_filter = filterValue;

      const res = await getHourlyTimeline(params, selectedModel);
      let timelineData = res.data;

      const CELL_ORDER = ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11', 'Cell D3', 'Cell D5', 'Cell D6', 'Cell D7', 'Cell BZ'];
      const defaultCells = CATEGORY_CELL_MAPPING[category] || CELL_ORDER;

      // If viewing all cells, ensure the category-specific default list is always present
      if (filterCell === 'all') {
        const existingCells = timelineData.map(d => d.cell);
        defaultCells.forEach(cellName => {
          if (!existingCells.includes(cellName)) {
            timelineData.push({
              cell: cellName,
              total_all: 0
            });
          }
        });
      } else {
        // If filtering by specific cell, only show that one
        timelineData = timelineData.filter(d => d.cell === filterCell);
        // If it's a standard cell but no data exists yet, ensure it shows up
        if (timelineData.length === 0 && (CELL_ORDER.includes(filterCell) || defaultCells.includes(filterCell))) {
          timelineData.push({
            cell: filterCell,
            total_all: 0
          });
        }
      }

      timelineData.sort((a, b) => {
        const idxA = CELL_ORDER.indexOf(a.cell);
        const idxB = CELL_ORDER.indexOf(b.cell);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        
        const numA = parseInt(a.cell.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.cell.replace(/\D/g, ''), 10) || 0;
        return numA - numB || a.cell.localeCompare(b.cell);
      });

      setData(timelineData);
    } catch (err) {
      console.error("Failed to fetch hourly timeline", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [filterMode, filterValue, filterCell, category, refreshTrigger, selectedModel]);

  const getHeatmapClass = (value) => {
    if (!value || value === 0) return 'text-text-muted/20';
    if (value >= 120) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    return 'bg-red-500/20 text-red-400 border border-red-500/30';
  };

  return (
    <section className="glass-card overflow-hidden animate-fade-in shadow-2xl mb-8 border border-primary/10">
      <div className="p-3 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-surface-alt/30">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Clock size={18} className="text-primary sm:size-[22px]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-lg font-bold text-text truncate">{title}</h3>
            <p className="text-[9px] sm:text-xs text-text-muted truncate">Output breakdown per hour</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
            {/* Manage Cells Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsManageOpen(!isManageOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-alt border border-border text-[10px] sm:text-xs font-bold text-text-muted hover:text-text transition-colors"
              >
                <Eye size={14} />
                <span>Cells ({(CATEGORY_CELL_MAPPING[category] || []).filter(c => !hiddenCells.includes(c)).length}/{(CATEGORY_CELL_MAPPING[category] || []).length})</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${isManageOpen ? 'rotate-180' : ''}`} />
              </button>

              {isManageOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsManageOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-strong border border-border shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
                      <span className="text-xs font-black text-text uppercase tracking-wider">Show/Hide Cells</span>
                      <button 
                        onClick={() => setHiddenCells(prev => prev.filter(c => !(CATEGORY_CELL_MAPPING[category] || []).includes(c)))}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        Show All
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin pr-1">
                      {(CATEGORY_CELL_MAPPING[category] || []).map(cell => {
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

            <button 
              onClick={() => setShowInput(!showInput)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-alt border border-border text-[10px] sm:text-xs font-bold text-text-muted hover:text-text transition-colors"
            >
              {showInput ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden sm:inline">{showInput ? 'Hide Input' : 'Show Input'}</span>
            </button>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-alt border border-border">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[8px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">Target Met</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-alt border border-border">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[8px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">Below</span>
            </div>
        </div>
      </div>

      <div className="overflow-x-auto relative scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent touch-pan-x">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-table-header)' }}>
              <th className="sticky left-0 z-30 py-4 px-4 sm:px-6 text-left text-[10px] font-bold text-[var(--color-table-header-text)] uppercase tracking-widest border-b border-r border-border min-w-[100px] sm:min-w-[140px]" style={{ backgroundColor: 'var(--color-table-header)' }}>
                Cell Name
              </th>
              {HOUR_COLUMNS.map(hour => (
                <th key={hour} className="p-0 border-b border-r border-border min-w-[80px] sm:min-w-[120px]">
                  <div className="flex flex-col h-full w-full">
                    <div className={`py-2 px-2 text-center text-[10px] font-bold text-[var(--color-table-header-text)] uppercase tracking-widest ${showInput ? 'border-b border-border' : ''}`}>
                      <span className="block sm:hidden">{hour.split(' - ')[0]}</span>
                      <span className="hidden sm:block">{hour}</span>
                    </div>
                    {showInput && (
                      <div className="flex w-full divide-x divide-border">
                        <div className="flex-1 py-1.5 text-center text-[9px] font-bold text-primary uppercase">Input</div>
                        <div className="flex-1 py-1.5 text-center text-[9px] font-bold text-[var(--color-table-header-text)] uppercase">Out</div>
                      </div>
                    )}
                  </div>
                </th>
              ))}
              <th className="sticky right-0 z-30 bg-primary/10 backdrop-blur-md py-4 px-4 sm:px-6 text-right text-[10px] font-bold text-primary uppercase tracking-widest border-b border-l border-border min-w-[80px] sm:min-w-[100px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={HOUR_COLUMNS.length + 2} className="text-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                    <span className="text-xs text-text-muted font-medium">Loading timeline...</span>
                  </div>
                </td>
              </tr>
            ) : visibleData.length === 0 ? (
              <tr>
                <td colSpan={HOUR_COLUMNS.length + 2} className="text-center py-20 opacity-40">
                    <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No Active Cells</p>
                    <p className="text-xs text-text-muted mt-1">All cells are hidden. Enable them from the "Cells" dropdown.</p>
                </td>
              </tr>
            ) : (
              visibleData.map((row, idx) => (
                <tr key={row.cell} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="sticky left-0 z-20 bg-bg/95 group-hover:bg-surface-alt/80 backdrop-blur-sm py-3 sm:py-4 px-4 sm:px-6 border-r border-border transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-black text-text group-hover:text-primary-light transition-colors uppercase whitespace-nowrap">
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
                  {HOUR_COLUMNS.map(hour => {
                    const cellData = row[hour] || { total: 0, input_total: 0, logs: [] };
                    const val = cellData.total;
                    const inputVal = cellData.input_total || 0;
                    return (
                      <td 
                        key={hour} 
                        className="p-0 border-r border-border/30 last:border-r-0 cursor-pointer hover:bg-white/5 transition-colors align-top h-full"
                      >
                        {showInput ? (
                          <div className="flex w-full h-full divide-x divide-border/30 min-h-[40px]">
                            <div 
                              className="flex-1 p-1 sm:p-1.5 flex items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors"
                              onClick={() => onCellClick && onCellClick(row.cell, hour, cellData.logs, 'input')}
                            >
                              <span className="font-bold text-[10px] sm:text-xs text-primary">
                                {inputVal > 0 ? inputVal.toLocaleString() : '-'}
                              </span>
                            </div>
                            <div 
                              className="flex-1 p-1 sm:p-1.5 flex items-center justify-center hover:bg-white/10 transition-colors"
                              onClick={() => onCellClick && onCellClick(row.cell, hour, cellData.logs, 'output')}
                            >
                              <div className={`w-full h-full min-h-[24px] flex items-center justify-center rounded-md font-black text-[10px] sm:text-xs shadow-sm ${getHeatmapClass(val)}`} title="Output">
                                {val > 0 ? val.toLocaleString() : '-'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="p-1.5 sm:p-2 h-full flex items-center justify-center hover:bg-white/10 transition-colors"
                            onClick={() => onCellClick && onCellClick(row.cell, hour, cellData.logs, 'output')}
                          >
                            <div className={`w-full py-1.5 px-1 rounded-lg font-black text-xs sm:text-sm text-center transition-all duration-300 shadow-sm ${getHeatmapClass(val)}`} title="Output">
                              {val > 0 ? val.toLocaleString() : '-'}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-20 bg-primary/5 group-hover:bg-primary/10 backdrop-blur-sm py-3 sm:py-4 px-4 sm:px-6 text-right font-black text-primary-light border-l border-border transition-colors align-top">
                    <div className="flex flex-col gap-1 items-end">
                      <span>{row.total_all.toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {visibleData.length > 0 && (
            <tfoot className="bg-surface-alt/30 border-t-2 border-border">
              <tr className="font-bold">
                <td className="sticky left-0 z-30 py-4 sm:py-5 px-4 sm:px-6 text-[10px] uppercase tracking-widest text-text-muted border-r border-border align-top" style={{ backgroundColor: 'var(--color-table-header)' }}>
                  <div className="flex flex-col gap-2">
                    <span>Hourly Total</span>
                    {showInput && <span className="text-primary opacity-80">Hourly Input</span>}
                  </div>
                </td>
                {HOUR_COLUMNS.map(hour => {
                  const hourlyTotal = visibleData.reduce((acc, r) => acc + (r[hour]?.total || 0), 0);
                  const hourlyInputTotal = visibleData.reduce((acc, r) => acc + (r[hour]?.input_total || 0), 0);
                  return (
                    <td key={hour} className="p-0 border-r border-border/30 last:border-r-0 align-top">
                      {showInput ? (
                        <div className="flex w-full h-full divide-x divide-border/30 min-h-[40px]">
                          <div className="flex-1 p-2 sm:p-3 flex items-center justify-center bg-primary/5">
                            <span className="text-[10px] sm:text-xs font-bold text-primary">{hourlyInputTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex-1 p-2 sm:p-3 flex items-center justify-center">
                            <span className="font-bold text-xs sm:text-sm text-text">{hourlyTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 sm:p-5 flex items-center justify-center">
                          <span className="font-bold text-xs sm:text-sm text-text">{hourlyTotal.toLocaleString()}</span>
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="sticky right-0 z-30 bg-primary/10 backdrop-blur-md py-4 sm:py-5 px-4 sm:px-6 text-right text-base sm:text-lg text-primary border-l border-border align-top">
                  <div className="flex flex-col gap-1 items-end">
                    <span>{visibleData.reduce((acc, r) => acc + r.total_all, 0).toLocaleString()}</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
};

export default HourlyTimeline;
