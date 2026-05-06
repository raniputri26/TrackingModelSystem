import React, { useMemo } from 'react';
import { AlertCircle, TrendingUp, BarChart2, Zap, Target, FileText } from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';

const MarketingDashboardTable = ({ data }) => {
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { rows: [], chartData: [], grandTotal: { pd_hrs: 0, target: 0, act_output: 0, gap: 0 } };
    }

    const rows = [];
    const chartData = [];
    let lastMonth = "";
    let weekTotal = { pd_hrs: 0, target: 0, act_output: 0, gap: 0, total_cell: 0, count: 0 };
    let grandTotal = { pd_hrs: 0, target: 0, act_output: 0, gap: 0, total_cell: 0 };

    data.forEach((item, index) => {
      const d = new Date(item.date);
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const daysSinceJan1 = Math.floor((d - jan1) / 86400000);
      const weekNum = Math.ceil((daysSinceJan1 + jan1.getDay() + 1) / 7);

      const displayMonth = item.month_name !== lastMonth ? item.month_name : "";
      lastMonth = item.month_name;
      
      rows.push({ ...item, isData: true, displayMonth, weekNum });
      
      chartData.push({
        name: `${d.getDate()}/${d.getMonth() + 1}`,
        Actual: Number(item.act_output) || 0,
        Target: Number(item.target) || 0,
        Gap: Number(item.gap) || 0
      });

      weekTotal.pd_hrs += Number(item.pd_hrs) || 0;
      weekTotal.target += Number(item.target) || 0;
      weekTotal.act_output += Number(item.act_output) || 0;
      weekTotal.gap += Number(item.gap) || 0;
      weekTotal.total_cell += Number(item.total_cell) || 0;
      weekTotal.count++;

      grandTotal.pd_hrs += Number(item.pd_hrs) || 0;
      grandTotal.target += Number(item.target) || 0;
      grandTotal.act_output += Number(item.act_output) || 0;
      grandTotal.gap += Number(item.gap) || 0;
      grandTotal.total_cell += Number(item.total_cell) || 0;

      if (d.getDay() === 6 || index === data.length - 1) {
        rows.push({
          isTotal: true,
          label: `WK-${weekNum}`,
          ...weekTotal,
          act_vs_target: weekTotal.target > 0 ? (weekTotal.act_output / weekTotal.target) * 100 : 0
        });
        weekTotal = { pd_hrs: 0, target: 0, act_output: 0, gap: 0, total_cell: 0, count: 0 };
      }
    });

    return { rows, chartData, grandTotal };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-20 text-center animate-fade-in border border-border/50">
        <BarChart2 size={48} className="text-primary/30 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Awaiting Production Data</h3>
        <p className="text-text-muted text-sm max-w-xs mx-auto">Please upload the marketing daily summary to populate this dashboard.</p>
      </div>
    );
  }

  const { rows, chartData, grandTotal } = processedData;
  const formatNum = (val) => (val !== undefined && val !== null ? val.toLocaleString() : '0');
  const projectKpi = grandTotal.target > 0 ? Math.round((grandTotal.act_output / grandTotal.target) * 100) : 0;
  const isGlobalGapNegative = grandTotal.gap < 0;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      
      {/* 1. HERO SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Target */}
        <div className="glass-card p-6 border-l-4 border-l-primary hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <Target size={16} className="text-primary" />
              Total Target
            </h3>
          </div>
          <div className="text-3xl font-black text-text">{formatNum(grandTotal.target)}</div>
        </div>

        {/* Realized Output */}
        <div className="glass-card p-6 border-l-4 border-l-success hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <Zap size={16} className="text-success" />
              Actual Output
            </h3>
          </div>
          <div className="text-3xl font-black text-text">{formatNum(grandTotal.act_output)}</div>
        </div>

        {/* Total Gap */}
        <div className={`glass-card p-6 border-l-4 hover:scale-[1.02] transition-transform ${isGlobalGapNegative ? 'border-l-danger' : 'border-l-success'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={16} className={isGlobalGapNegative ? 'text-danger' : 'text-success'} />
              Variance (GAP)
            </h3>
          </div>
          <div className={`text-3xl font-black ${isGlobalGapNegative ? 'text-danger' : 'text-success'}`}>
            {formatNum(grandTotal.gap)}
          </div>
        </div>

        {/* Efficiency / KPI */}
        <div className="glass-card p-6 border-l-4 border-l-info hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={16} className="text-info" />
              Project KPI
            </h3>
          </div>
          <div className="text-3xl font-black text-text">{projectKpi}%</div>
        </div>
      </div>

      {/* 2. TREND CHART SECTION */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest text-text flex items-center gap-2">
              <BarChart2 size={18} className="text-primary" />
              Output Performance Trend
            </h3>
            <p className="text-xs text-text-muted mt-1">Real-time production trajectory vs target</p>
          </div>
          <div className="flex items-center gap-4 bg-surface-alt px-4 py-2 rounded-full border border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-sm"></div>
              <span className="text-xs font-bold uppercase text-text">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-success rounded-full"></div>
              <span className="text-xs font-bold uppercase text-text">Target</span>
            </div>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: '500'}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: '500'}}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-surface-strong)', 
                  borderColor: 'var(--color-border)', 
                  borderRadius: '12px', 
                  color: 'var(--color-text)',
                  boxShadow: 'var(--shadow-card)'
                }}
                itemStyle={{ color: 'var(--color-text)' }}
              />
              <Bar dataKey="Actual" fill="url(#barGradient)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Line type="monotone" dataKey="Target" stroke="var(--color-success)" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: 'var(--color-surface)', stroke: 'var(--color-success)'}} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. DETAILED DATA TABLE */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border bg-surface-alt flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <h3 className="font-bold uppercase text-xs tracking-widest text-text">Daily Production Logs</h3>
          </div>
          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
            MODEL 603
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead className="bg-primary/10 text-xs uppercase tracking-wider text-primary font-bold border-y-2 border-primary/20 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-semibold text-center">Date</th>
                <th className="px-6 py-4 font-semibold text-center">Hrs</th>
                <th className="px-6 py-4 font-semibold text-center">Target</th>
                <th className="px-6 py-4 font-semibold text-center">Actual</th>
                <th className="px-6 py-4 font-semibold text-center">Total Cell</th>
                <th className="px-6 py-4 font-semibold text-center">GAP</th>
                <th className="px-6 py-4 font-semibold text-center">KPI</th>
                <th className="px-6 py-4 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border">
              {rows.map((row, idx) => {
                if (row.isTotal) {
                  return (
                    <tr key={`total-${idx}`} className="bg-success/10 font-bold border-y border-success/20">
                      <td className="px-6 py-3 text-right text-text border-r border-border/50" colSpan="2">
                          <span className="text-xs text-success font-bold uppercase mr-3">Summary</span>
                          {row.label}
                      </td>
                      <td className="px-6 py-3 text-center text-text">{formatNum(row.target)}</td>
                      <td className="px-6 py-3 text-center text-text">{formatNum(row.act_output)}</td>
                      <td className="px-6 py-3 text-center text-text">{formatNum(row.total_cell)}</td>
                      <td className={`px-6 py-3 text-center ${row.gap < 0 ? 'text-danger' : 'text-success'}`}>
                        {formatNum(row.gap)}
                      </td>
                      <td className={`px-6 py-3 text-center ${row.act_vs_target < 100 ? 'text-danger' : 'text-success'}`}>
                        {Math.round(row.act_vs_target)}%
                      </td>
                      <td className="px-6 py-3"></td>
                    </tr>
                  );
                }

                const isAlert = row.gap < 0;
                const efficiency = row.target > 0 ? (row.act_output / row.target) * 100 : 0;
                const dateObj = new Date(row.date);

                return (
                  <tr key={row.id || idx} className="hover:bg-surface-alt/50 transition-colors group">
                    <td className="px-6 py-4 text-center font-semibold text-text">
                      {dateObj.getDate()} {row.displayMonth && <span className="text-xs text-text-muted ml-1">{row.displayMonth}</span>}
                    </td>
                    <td className="px-6 py-4 text-center text-text-muted">
                      {row.pd_hrs}
                    </td>
                    <td className="px-6 py-4 text-center text-text-muted">
                      {formatNum(row.target)}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-text group-hover:text-primary transition-colors">
                      {formatNum(row.act_output)}
                    </td>
                    <td className="px-6 py-4 text-center text-text-muted">
                      {formatNum(row.total_cell)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${isAlert ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                        {formatNum(row.gap)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${isAlert ? 'text-danger' : 'text-success'}`}>
                        {Math.round(efficiency)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-muted italic max-w-xs truncate group-hover:whitespace-normal transition-all">
                      {row.remarks || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboardTable;
