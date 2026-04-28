import React, { useMemo } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

const CATEGORY_KEYS = [
  'CUTTING + PREPARATION',
  'COMPUTER STITCHING',
  'SEWING',
  'ASSEMBLY'
];

const AllCategoryDashboardTable = ({ data }) => {
  const tableData = useMemo(() => {
    const cellMap = {};

    data.forEach(item => {
      if (!cellMap[item.cell]) {
        cellMap[item.cell] = {
          cell: item.cell,
          'CUTTING + PREPARATION': 0,
          'COMPUTER STITCHING': 0,
          'SEWING': 0,
          'ASSEMBLY': 0,
          total: 0
        };
      }

      // Sum the output_day based on category
      if (CATEGORY_KEYS.includes(item.category)) {
        cellMap[item.cell][item.category] += Math.round(item.output_day || 0);
        cellMap[item.cell].total += Math.round(item.output_day || 0);
      }
    });

    const result = Object.values(cellMap);

    // Sort cells naturally
    const CELL_ORDER = ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 9', 'Cell 10', 'Cell 11', 'Cell D6', 'Cell BZ'];
    result.sort((a, b) => {
      const idxA = CELL_ORDER.indexOf(a.cell);
      const idxB = CELL_ORDER.indexOf(b.cell);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;

      const numA = parseInt(a.cell.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.cell.replace(/\D/g, ''), 10) || 0;
      return numA - numB || a.cell.localeCompare(b.cell);
    });

    return result;
  }, [data]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-xl font-bold text-text uppercase pl-2 border-l-4 border-primary">ALL CATEGORY OVERVIEW</h3>

      <section className="glass-card overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-surface-alt/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 size={20} className="text-primary sm:size-[22px]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-text leading-tight">All Category Production Summary</h3>
              <p className="text-[10px] sm:text-xs text-text-muted">Aggregated total output per category</p>
            </div>
          </div>
          <div className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-surface-alt border border-border">
            <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">{tableData.length} Cells Active</span>
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
                <th className="py-4 px-4 sm:px-6 text-right text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest border-l border-border/50 sticky right-0 z-10 backdrop-blur-sm">Total Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-24">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <TrendingUp size={48} className="text-text-muted mb-2" />
                      <p className="text-lg font-bold text-text-muted uppercase">No Data Found</p>
                      <p className="text-sm text-text-muted italic">There is no production data recorded for this period.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tableData.map((row, idx) => (
                  <tr key={row.cell} className={`hover:bg-white/[0.03] transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}>
                    <td className="py-4 px-4 sm:px-6 sticky left-0 z-10 bg-bg/95 group-hover:bg-surface-alt/50 backdrop-blur-sm border-r border-border/10">
                      <span className="bg-primary/10 text-primary border border-primary/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-black text-[10px] sm:text-sm uppercase whitespace-nowrap">
                        {row.cell}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <span className={`text-xs sm:text-sm font-bold ${row['CUTTING + PREPARATION'] > 0 ? 'text-text' : 'text-text-muted/30'}`}>
                        {row['CUTTING + PREPARATION'] ? row['CUTTING + PREPARATION'].toLocaleString() : '0'}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <span className={`text-xs sm:text-sm font-bold ${row['COMPUTER STITCHING'] > 0 ? 'text-text' : 'text-text-muted/30'}`}>
                        {row['COMPUTER STITCHING'] ? row['COMPUTER STITCHING'].toLocaleString() : '0'}
                      </span>
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
                    <td className="py-4 px-4 sm:px-6 text-right border-l border-border/50 sticky right-0 z-10 bg-bg/95 backdrop-blur-sm">
                      <div className="flex flex-col items-end">
                        <span className="text-sm sm:text-base font-black text-primary-light">
                          {row.total ? row.total.toLocaleString() : '0'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {tableData.length > 0 && (
              <tfoot className="bg-surface-alt/50 border-t border-border">
                <tr className="font-black text-text">
                  <td className="py-5 px-6 uppercase text-xs tracking-widest text-text-muted">Total Overall</td>
                  <td className="py-5 px-6 text-right text-sm">
                    {tableData.reduce((acc, r) => acc + (r['CUTTING + PREPARATION'] || 0), 0).toLocaleString()}
                  </td>
                  <td className="py-5 px-6 text-right text-sm">
                    {tableData.reduce((acc, r) => acc + (r['COMPUTER STITCHING'] || 0), 0).toLocaleString()}
                  </td>
                  <td className="py-5 px-6 text-right text-sm">
                    {tableData.reduce((acc, r) => acc + (r['SEWING'] || 0), 0).toLocaleString()}
                  </td>
                  <td className="py-5 px-6 text-right text-sm">
                    {tableData.reduce((acc, r) => acc + (r['ASSEMBLY'] || 0), 0).toLocaleString()}
                  </td>
                  <td className="py-5 px-6 text-right text-lg text-primary border-l border-border/50">
                    {tableData.reduce((acc, r) => acc + (r.total || 0), 0).toLocaleString()}
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

export default AllCategoryDashboardTable;
