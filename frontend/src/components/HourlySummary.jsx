import React, { useState, useEffect } from 'react';
import { getHourlySummary } from '../api';
import { TrendingUp, BarChart3 } from 'lucide-react';

const HourlySummary = ({ filterMode, filterValue, filterCell }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterMode === 'day') params.date_filter = filterValue;
      else if (filterMode === 'month') params.month_filter = filterValue;
      
      const res = await getHourlySummary(params);
      let summaryData = res.data;
      
      // Filter by cell on client side or we could add it to backend params
      if (filterCell !== 'all') {
        summaryData = summaryData.filter(d => d.cell === filterCell);
      }
      
      // Secondary sort to ensure Cell 1, Cell 2, etc. (backend does simple alpha sort)
      summaryData.sort((a, b) => {
        const numA = parseInt(a.cell.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.cell.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
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
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [filterMode, filterValue, filterCell]);

  return (
    <section className="glass-card overflow-hidden animate-fade-in shadow-2xl">
      <div className="p-6 border-b border-border flex justify-between items-center bg-surface-alt/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 size={22} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Hourly Production Summary</h3>
            <p className="text-xs text-text-muted">Aggregated total output from hourly logs</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-surface-alt border border-border">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{data.length} Cells Active</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-grid">
          <thead>
            <tr>
              <th className="py-4 px-6 text-left text-xs font-bold text-text-muted uppercase tracking-widest">Cell Name</th>
              <th className="py-4 px-6 text-right text-xs font-bold text-text-muted uppercase tracking-widest">Cutting + Preparation</th>
              <th className="py-4 px-6 text-right text-xs font-bold text-text-muted uppercase tracking-widest">Computer Stitching</th>
              <th className="py-4 px-6 text-right text-xs font-bold text-text-muted uppercase tracking-widest">Sewing</th>
              <th className="py-4 px-6 text-right text-xs font-bold text-text-muted uppercase tracking-widest">Assembly</th>
              <th className="py-4 px-6 text-right text-xs font-bold text-primary uppercase tracking-widest border-l border-border/50">Total Output</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading && data.length === 0 ? (
               <tr>
                <td colSpan="6" className="text-center py-24">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    <span className="text-sm text-text-muted font-medium">Calculating totals...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-24">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <TrendingUp size={48} className="text-text-muted mb-2" />
                    <p className="text-lg font-bold text-text-muted uppercase">No Data Found</p>
                    <p className="text-sm text-text-muted italic">There are no hourly logs recorded for this period.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.cell} className={`hover:bg-white/[0.03] transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}>
                  <td className="py-4 px-6">
                    <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg font-black text-sm uppercase">
                      {row.cell}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`text-sm font-bold ${row['CUTTING + PREPARATION'] > 0 ? 'text-white' : 'text-text-muted/30'}`}>
                      {row['CUTTING + PREPARATION'] ? row['CUTTING + PREPARATION'].toLocaleString() : '0'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`text-sm font-bold ${row['COMPUTER STITCHING'] > 0 ? 'text-white' : 'text-text-muted/30'}`}>
                      {row['COMPUTER STITCHING'] ? row['COMPUTER STITCHING'].toLocaleString() : '0'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`text-sm font-bold ${row['SEWING'] > 0 ? 'text-white' : 'text-text-muted/30'}`}>
                      {row['SEWING'] ? row['SEWING'].toLocaleString() : '0'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`text-sm font-bold ${row['ASSEMBLY'] > 0 ? 'text-white' : 'text-text-muted/30'}`}>
                      {row['ASSEMBLY'] ? row['ASSEMBLY'].toLocaleString() : '0'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right border-l border-border/50">
                    <div className="flex flex-col items-end">
                      <span className="text-base font-black text-primary-light">
                        {row['total_all'] ? row['total_all'].toLocaleString() : '0'}
                      </span>
                      <div className="w-full h-1 bg-surface-alt rounded-full mt-1 overflow-hidden max-w-[80px]">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${Math.min(100, (row['total_all'] / 4000) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
             )}
          </tbody>
          {data.length > 0 && (
            <tfoot className="bg-surface-alt/50 border-t border-border">
              <tr className="font-black text-white">
                <td className="py-5 px-6 uppercase text-xs tracking-widest text-text-muted">Total Overall</td>
                <td className="py-5 px-6 text-right text-sm">
                  {data.reduce((acc, r) => acc + (r['CUTTING + PREPARATION'] || 0), 0).toLocaleString()}
                </td>
                <td className="py-5 px-6 text-right text-sm">
                  {data.reduce((acc, r) => acc + (r['COMPUTER STITCHING'] || 0), 0).toLocaleString()}
                </td>
                <td className="py-5 px-6 text-right text-sm">
                  {data.reduce((acc, r) => acc + (r['SEWING'] || 0), 0).toLocaleString()}
                </td>
                <td className="py-5 px-6 text-right text-sm">
                  {data.reduce((acc, r) => acc + (r['ASSEMBLY'] || 0), 0).toLocaleString()}
                </td>
                <td className="py-5 px-6 text-right text-lg text-primary border-l border-border/50">
                  {data.reduce((acc, r) => acc + (r['total_all'] || 0), 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
};

export default HourlySummary;
