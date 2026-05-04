import React, { useMemo } from 'react';
import { Calendar, AlertCircle, CheckCircle2, TrendingUp, BarChart2, Zap, Target, FileText } from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from 'recharts';

const MarketingDashboardTable = ({ data }) => {
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { rows: [], chartData: [], grandTotal: { pd_hrs: 0, target: 0, act_output: 0, gap: 0 } };
    }

    const rows = [];
    const chartData = [];
    let lastMonth = "";
    let weekTotal = { pd_hrs: 0, target: 0, act_output: 0, gap: 0, count: 0 };
    let grandTotal = { pd_hrs: 0, target: 0, act_output: 0, gap: 0 };

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
      weekTotal.count++;

      grandTotal.pd_hrs += Number(item.pd_hrs) || 0;
      grandTotal.target += Number(item.target) || 0;
      grandTotal.act_output += Number(item.act_output) || 0;
      grandTotal.gap += Number(item.gap) || 0;

      if (d.getDay() === 6 || index === data.length - 1) {
        rows.push({
          isTotal: true,
          label: `WK-${weekNum}`,
          ...weekTotal,
          act_vs_target: weekTotal.target > 0 ? (weekTotal.act_output / weekTotal.target) * 100 : 0
        });
        weekTotal = { pd_hrs: 0, target: 0, act_output: 0, gap: 0, count: 0 };
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

  return (
    <div className="w-full space-y-4 animate-fade-in">
      <div className="flex flex-col xl:flex-row gap-6 items-stretch">
        
        {/* LEFT: Compact Data Table */}
        <div className="flex-1 min-w-0">
          <div className="glass-card overflow-hidden border border-border/60 bg-surface/30 backdrop-blur-md h-full shadow-lg">
            <div className="p-4 border-b border-border/30 flex justify-between items-center bg-surface-alt/20">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                <h3 className="font-black uppercase text-[10px] tracking-widest text-white">Daily Production Logs</h3>
              </div>
              <span className="text-[9px] font-black bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30">MODEL 603</span>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse table-auto text-[11px]">
                <thead className="sticky top-0 z-20 bg-surface/95 backdrop-blur shadow-sm">
                  <tr className="border-b border-border">
                    <th className="px-4 py-4 font-black text-text-muted uppercase tracking-wider w-32 text-center border-r border-border/10">Date</th>
                    <th className="px-4 py-4 font-black text-text-muted uppercase tracking-wider w-24 text-center border-r border-border/10">Hrs</th>
                    <th className="px-6 py-4 font-black text-text-muted uppercase tracking-wider w-44 text-center border-r border-border/10">Target</th>
                    <th className="px-6 py-4 font-black text-text-muted uppercase tracking-wider w-44 text-center border-r border-border/10">Actual</th>
                    <th className="px-6 py-4 font-black text-text-muted uppercase tracking-wider w-36 text-center border-r border-border/10">GAP</th>
                    <th className="px-6 py-4 font-black text-text-muted uppercase tracking-wider w-36 text-center border-r border-border/10">KPI</th>
                    <th className="px-6 py-4 font-black text-text-muted uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="font-medium text-white">
                  {rows.map((row, idx) => {
                    if (row.isTotal) {
                      return (
                        <tr key={`total-${idx}`} className="bg-[#92d050] text-black font-black border-y border-black/10">
                          <td className="px-3 py-1.5 text-right pr-4 border-r border-black/10" colSpan="2">
                             <span className="text-[9px] opacity-40 uppercase mr-2 italic">Summary</span>
                             {row.label}
                          </td>
                          <td className="px-4 py-1.5 text-center border-r border-black/10">{formatNum(row.target)}</td>
                          <td className="px-4 py-1.5 text-center border-r border-black/10">{formatNum(row.act_output)}</td>
                          <td className="px-4 py-1.5 text-center border-r border-black/10">{formatNum(row.gap)}</td>
                          <td className="px-4 py-1.5 text-center border-r border-black/10">{Math.round(row.act_vs_target)}%</td>
                          <td className="px-4 py-1.5"></td>
                        </tr>
                      );
                    }

                    const isAlert = row.gap < 0;
                    const efficiency = row.target > 0 ? (row.act_output / row.target) * 100 : 0;
                    const dateObj = new Date(row.date);

                    return (
                      <tr key={row.id || idx} className="border-b border-border/5 hover:bg-white/[0.04] transition-colors group">
                        <td className="px-4 py-3 border-r border-border/10 text-center font-black bg-surface-alt/40 text-[13px]">
                          {dateObj.getDate()}
                        </td>
                        <td className="px-4 py-3 border-r border-border/10 text-center text-text-muted opacity-60">
                          {row.pd_hrs}
                        </td>
                        <td className="px-6 py-3 border-r border-border/10 text-center text-text-muted/50">
                          {formatNum(row.target)}
                        </td>
                        <td className="px-6 py-3 border-r border-border/10 text-center font-black text-white group-hover:text-primary transition-colors text-[13px]">
                          {formatNum(row.act_output)}
                        </td>
                        <td className={`px-6 py-3 border-r border-border/10 text-center font-black ${isAlert ? 'text-[#ff0000] bg-[#f8cbad]/30' : 'text-success'} text-[13px]`}>
                          {formatNum(row.gap)}
                        </td>
                        <td className={`px-6 py-3 border-r border-border/10 text-center font-black ${isAlert ? 'text-[#ff0000] bg-[#f8cbad]/30' : 'text-success'} text-[13px]`}>
                          {Math.round(efficiency)}%
                        </td>
                        <td className="px-6 py-3 text-[12px] text-text-muted italic truncate max-w-[150px] group-hover:whitespace-normal group-hover:max-w-none transition-all">
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

        {/* RIGHT: Visual Trends Chart */}
        <div className="w-full xl:w-[45%] flex flex-col gap-4">
          <div className="glass-card p-8 border border-border/60 bg-surface/30 backdrop-blur-md flex-1 min-h-[500px] shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-black uppercase text-[10px] tracking-widest mb-1 flex items-center gap-2 text-white">
                  <TrendingUp size={16} className="text-primary" />
                  Output Performance Trend
                </h3>
                <p className="text-[9px] text-text-muted uppercase font-bold tracking-tight">Real-time production trajectory</p>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-primary rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.4)]"></div>
                    <span className="text-[9px] font-bold uppercase text-text-muted">Actual</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-success rounded-full"></div>
                    <span className="text-[9px] font-bold uppercase text-text-muted">Target</span>
                 </div>
              </div>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#888', fontSize: 9, fontWeight: 'bold'}} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#888', fontSize: 9, fontWeight: 'bold'}}
                    width={35}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold', color: '#fff' }}
                  />
                  <Bar dataKey="Actual" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line type="monotone" dataKey="Target" stroke="#10b981" strokeWidth={2} dot={{r: 2, fill: '#10b981'}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mini Summary Cards on Right Column */}
          <div className="grid grid-cols-2 gap-4">
             <div className="glass-card p-5 border border-primary/20 bg-primary/5 shadow-md">
                <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                   <Target size={12} /> Total Target
                </div>
                <div className="text-2xl font-black text-white">{formatNum(grandTotal.target)}</div>
             </div>
             <div className="glass-card p-5 border border-success/20 bg-success/5 shadow-md">
                <div className="text-[9px] font-black text-success uppercase tracking-widest mb-2 flex items-center gap-1.5">
                   <Zap size={12} /> Realized Output
                </div>
                <div className="text-2xl font-black text-white">{formatNum(grandTotal.act_output)}</div>
             </div>
          </div>
        </div>
      </div>

      {/* FOOTER: Global Grand Summary */}
      <div className="glass-card bg-[#002060] overflow-hidden border-t-2 border-primary/50 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between px-8 py-3 gap-6">
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-primary-light uppercase tracking-[0.3em] mb-1 leading-none opacity-60">Intelligence Report</span>
              <span className="text-xl font-black text-white uppercase tracking-wider leading-none">GRAND SUMMARY</span>
           </div>
           
           <div className="flex items-center gap-12">
              <div className="text-center">
                 <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">PD Hours</div>
                 <div className="text-xl font-black text-white leading-none">{grandTotal.pd_hrs}</div>
              </div>
              <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
              <div className="text-center">
                 <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Total Gap</div>
                 <div className={`text-xl font-black leading-none ${grandTotal.gap < 0 ? 'text-red-400' : 'text-green-400'}`}>
                   {formatNum(grandTotal.gap)}
                 </div>
              </div>
              <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
              <div className="text-center">
                 <div className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Project KPI</div>
                 <div className="text-3xl font-black text-primary-light leading-none">
                   {grandTotal.target > 0 ? Math.round((grandTotal.act_output / grandTotal.target) * 100) : 0}%
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboardTable;
