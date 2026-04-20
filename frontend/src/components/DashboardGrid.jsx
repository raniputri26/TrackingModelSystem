import React, { useState } from 'react';
import { Calendar, Users, Target, ArrowRightLeft, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

const ROWS_PER_PAGE = 10;

const DashboardGrid = ({ data, title }) => {
  const [page, setPage] = useState(0);

  // Sort by date descending (newest first), then by Cell number ascending
  const sortedData = [...data].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    
    // Extract numbers from "Cell X", default to 0 if no number found
    const matchA = a.cell.match(/\d+/);
    const matchB = b.cell.match(/\d+/);
    const numA = matchA ? parseInt(matchA[0], 10) : 0;
    const numB = matchB ? parseInt(matchB[0], 10) : 0;
    
    if (numA !== numB) {
      return numA - numB;
    }
    return a.cell.localeCompare(b.cell);
  });

  const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE);
  const pagedData = sortedData.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  // Reset page when data changes
  React.useEffect(() => { setPage(0); }, [data]);

  return (
    <section id={title.replace(/\s+/g, '-').toLowerCase()} className="glass-card overflow-hidden">
      <div className="p-5 border-b border-border flex justify-between items-center bg-surface-alt/30">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" />
          {title}
        </h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-2 h-2 bg-success rounded-full" />
            Normal
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-2 h-2 bg-danger rounded-full" />
            Below Target
          </div>
          <span className="text-xs text-text-muted ml-2">{data.length} records</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="data-grid">
          <thead>
            <tr>
              <th><div className="flex items-center gap-2"><Calendar size={14} /> Date</div></th>
              <th>Cell</th>
              <th>Period</th>
              <th><div className="flex items-center gap-2"><Users size={14} /> STD / ACT</div></th>
              <th>Gap</th>
              <th><div className="flex items-center gap-2"><Target size={14} /> Output / Day</div></th>
              <th>Output / H</th>
              <th>Work Hours</th>
              <th>Output / Target</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-20 text-text-muted italic">
                  No data available. Import an Excel file or adjust your filters.
                </td>
              </tr>
            ) : (
              pagedData.map((row) => {
                const outputH = Math.round(row.output_h);
                const target = 120;
                const meetsTarget = outputH >= target;
                const workHours = row.output_h > 0 ? Number((row.output_day / row.output_h).toFixed(1)) : 0;
                return (
                  <tr key={row.id}>
                    <td className="font-medium text-primary-light">
                      {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td><span className="bg-surface-alt px-2 py-1 rounded-md border border-border">{row.cell}</span></td>
                    <td>{row.working_period}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted">{row.std_mp}</span>
                        <ArrowRightLeft size={10} className="text-text-muted" />
                        <span className="font-bold">{row.act_mp}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`font-bold ${row.gap < 0 ? 'text-danger' : 'text-success'}`}>
                        {row.gap > 0 ? `+${row.gap}` : row.gap}
                      </span>
                    </td>
                    <td className={`font-bold ${row.day_status === 'alert' ? 'text-danger bg-danger/10 p-2 rounded-md' : ''}`}>
                      {Math.round(row.output_day)}
                    </td>
                    <td className={`font-bold ${row.hour_status === 'alert' ? 'text-danger bg-danger/10 p-2 rounded-md' : 'text-primary-light'}`}>
                      {Math.round(row.output_h)}
                    </td>
                    <td className="font-bold text-text-muted">
                      {workHours}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${meetsTarget ? 'text-success' : 'text-danger'}`}>
                          {outputH}
                        </span>
                        <span className="text-text-muted">/</span>
                        <span className="text-text-muted">{target}</span>
                        {meetsTarget ? (
                          <span className="text-[10px] bg-success/15 text-success px-1.5 py-0.5 rounded font-bold">▲</span>
                        ) : (
                          <span className="text-[10px] bg-danger/15 text-danger px-1.5 py-0.5 rounded font-bold">▼</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-center gap-4 bg-surface-alt/20">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-surface-alt border border-border hover:border-primary hover:text-primary"
          >
            <ChevronLeft size={14} />
            Previous
          </button>
          
          <span className="text-xs text-text-muted">
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-surface-alt border border-border hover:border-primary hover:text-primary"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </section>
  );
};

export default DashboardGrid;
