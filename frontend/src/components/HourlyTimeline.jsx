import React, { useState, useEffect, useMemo } from 'react';
import { getHourlyTimeline } from '../api';
import { Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

const HOUR_COLUMNS = [
  '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
  '11:00 - 12:00', '13:00 - 14:00', '14:00 - 15:00',
  '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00',
  '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00',
];

const HourlyTimeline = ({ filterMode, filterValue, filterCell, category, title = "Hourly Production Timeline" }) => {
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

      if (filterCell !== 'all') {
        timelineData = timelineData.filter(d => d.cell === filterCell);
      }

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
  }, [filterMode, filterValue, filterCell, category]);

  const getHeatmapClass = (value) => {
    if (!value || value === 0) return 'text-text-muted/20';
    if (value >= 120) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    return 'bg-red-500/20 text-red-400 border border-red-500/30';
  };

  return (
    <section className="glass-card overflow-hidden animate-fade-in shadow-2xl mb-8 border border-primary/10">
      <div className="p-6 border-b border-border flex justify-between items-center bg-surface-alt/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock size={22} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-xs text-text-muted">Real-time output breakdown per hour per cell</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-alt border border-border">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Target Met (≥120)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-alt border border-border">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Below Target (&lt;120)</span>
            </div>
        </div>
      </div>

      <div className="overflow-x-auto relative">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-surface-alt/50">
              <th className="sticky left-0 z-20 bg-surface-alt/90 backdrop-blur-md py-4 px-6 text-left text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-r border-border min-w-[140px]">
                Cell Name
              </th>
              {HOUR_COLUMNS.map(hour => (
                <th key={hour} className="py-4 px-4 text-center text-[10px] font-bold text-text-muted uppercase tracking-widest border-b border-border min-w-[100px]">
                  {hour.split(' - ')[0]} - {hour.split(' - ')[1]}
                </th>
              ))}
              <th className="py-4 px-6 text-right text-[10px] font-bold text-primary uppercase tracking-widest border-b border-border bg-primary/5 min-w-[100px]">
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
                  <td className="sticky left-0 z-10 bg-bg/95 group-hover:bg-surface-alt/50 backdrop-blur-sm py-4 px-6 border-r border-border transition-colors">
                    <span className="text-sm font-black text-white group-hover:text-primary transition-colors uppercase">
                      {row.cell}
                    </span>
                  </td>
                  {HOUR_COLUMNS.map(hour => {
                    const val = row[hour] || 0;
                    return (
                      <td key={hour} className="py-2 px-2 text-center border-r border-border/30 last:border-r-0">
                        <div className={`py-2 px-1 rounded-lg font-black text-sm transition-all duration-300 ${getHeatmapClass(val)}`}>
                          {val > 0 ? val.toLocaleString() : '-'}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-4 px-6 text-right font-black text-primary-light bg-primary/5">
                    {row.total_all.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot className="bg-surface-alt/30 border-t-2 border-border">
              <tr className="font-bold">
                <td className="sticky left-0 z-20 bg-surface-alt/90 backdrop-blur-md py-5 px-6 text-[10px] uppercase tracking-widest text-text-muted border-r border-border">
                  Hourly Total
                </td>
                {HOUR_COLUMNS.map(hour => {
                  const hourlyTotal = data.reduce((acc, r) => acc + (r[hour] || 0), 0);
                  return (
                    <td key={hour} className="py-5 px-4 text-center text-sm text-white">
                      {hourlyTotal.toLocaleString()}
                    </td>
                  );
                })}
                <td className="py-5 px-6 text-right text-lg text-primary bg-primary/10">
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
