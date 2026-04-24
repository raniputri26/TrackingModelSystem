import React, { useState, useEffect, useMemo } from 'react';
import { getHourlyTimeline } from '../api';
import { Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

const HOUR_COLUMNS = [
  '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
  '11:00 - 12:00', '13:00 - 14:00', '14:00 - 15:00',
  '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', 
  '18:30 - 19:30', '19:30 - 20:30', '20:30 - 21:30',
];

const CATEGORY_CELL_MAPPING = {
  'CUTTING + PREPARATION': ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11'],
  'COMPUTER STITCHING': ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10'],
  'SEWING': ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11', 'Cell D6', 'Cell BZ'],
  'ASSEMBLY': ['Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11'],
};

const HourlyTimeline = ({ filterMode, filterValue, filterCell, category, title = "Hourly Production Timeline", onCellClick, refreshTrigger }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { category };
      if (filterMode === 'day') params.date_filter = filterValue;
      else if (filterMode === 'month') params.month_filter = filterValue;

      const res = await getHourlyTimeline(params);
      let timelineData = res.data;

      const CELL_ORDER = ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11', 'Cell D6', 'Cell BZ'];
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
  }, [filterMode, filterValue, filterCell, category, refreshTrigger]);

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
                <th key={hour} className="py-4 px-2 sm:px-4 text-center text-[10px] font-bold text-[var(--color-table-header-text)] uppercase tracking-widest border-b border-border min-w-[80px] sm:min-w-[100px]">
                  <span className="block sm:hidden">{hour.split(' - ')[0]}</span>
                  <span className="hidden sm:block">{hour}</span>
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
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={HOUR_COLUMNS.length + 2} className="text-center py-20 opacity-40">
                    <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No Hourly Data</p>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.cell} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="sticky left-0 z-20 bg-bg/95 group-hover:bg-surface-alt/80 backdrop-blur-sm py-3 sm:py-4 px-4 sm:px-6 border-r border-border transition-colors">
                    <span className="text-xs sm:text-sm font-black text-text group-hover:text-primary-light transition-colors uppercase whitespace-nowrap">
                      {row.cell}
                    </span>
                  </td>
                  {HOUR_COLUMNS.map(hour => {
                    const cellData = row[hour] || { total: 0, logs: [] };
                    const val = cellData.total;
                    return (
                      <td 
                        key={hour} 
                        className="py-1.5 sm:py-2 px-1 sm:px-2 text-center border-r border-border/30 last:border-r-0 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => onCellClick && onCellClick(row.cell, hour, cellData.logs)}
                      >
                        <div className={`py-1.5 sm:py-2 px-1 rounded-lg font-black text-xs sm:text-sm transition-all duration-300 shadow-sm ${getHeatmapClass(val)}`}>
                          {val > 0 ? val.toLocaleString() : '-'}
                        </div>
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-20 bg-primary/5 group-hover:bg-primary/10 backdrop-blur-sm py-3 sm:py-4 px-4 sm:px-6 text-right font-black text-primary-light border-l border-border transition-colors">
                    {row.total_all.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot className="bg-surface-alt/30 border-t-2 border-border">
              <tr className="font-bold">
                <td className="sticky left-0 z-30 py-4 sm:py-5 px-4 sm:px-6 text-[10px] uppercase tracking-widest text-text-muted border-r border-border" style={{ backgroundColor: 'var(--color-table-header)' }}>
                  Hourly Total
                </td>
                {HOUR_COLUMNS.map(hour => {
                  const hourlyTotal = data.reduce((acc, r) => acc + (r[hour]?.total || 0), 0);
                  return (
                    <td key={hour} className="py-4 sm:py-5 px-2 sm:px-4 text-center text-xs sm:text-sm text-text border-r border-border/30 last:border-r-0">
                      {hourlyTotal.toLocaleString()}
                    </td>
                  );
                })}
                <td className="sticky right-0 z-30 bg-primary/10 backdrop-blur-md py-4 sm:py-5 px-4 sm:px-6 text-right text-base sm:text-lg text-primary border-l border-border">
                  {data.reduce((acc, r) => acc + r.total_all, 0).toLocaleString()}
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
