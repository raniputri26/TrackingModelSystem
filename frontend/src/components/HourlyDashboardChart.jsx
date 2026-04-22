import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const HOUR_ORDER = [
  '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
  '11:00 - 12:00', '13:00 - 14:00', '14:00 - 15:00',
  '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00',
  '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00',
];

// Gradient-like colors for hours (Morning to Evening)
const HOUR_COLORS = [
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'
];

const HourlyDashboardChart = ({ hourlyLogs, title, targetPerHour = 120 }) => {
  // Transform hourly logs into stacked chart data
  const chartData = useMemo(() => {
    if (!hourlyLogs || hourlyLogs.length === 0) return [];

    const cells = [...new Set(hourlyLogs.map(l => l.cell))].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    return cells.map(cell => {
      const point = { name: cell };
      let totalOutput = 0;
      
      HOUR_ORDER.forEach(hour => {
        const log = hourlyLogs.find(l => l.cell === cell && l.hour_range === hour);
        const val = log ? (log.output + log.b_grade + log.c_grade) : 0;
        point[hour] = val;
        totalOutput += val;
      });
      
      point.total = totalOutput;
      return point;
    });
  }, [hourlyLogs]);

  if (!hourlyLogs || hourlyLogs.length === 0) {
    return (
      <div className="glass-card p-6 min-h-[400px] flex flex-col">
        <h3 className="text-xl font-bold text-text uppercase pl-2 border-l-4 border-primary mb-6">{title}</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center">
            <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="font-medium">No hourly data records found for this category and date.</p>
          <p className="text-xs italic">Please ensure data is recorded in the Hourly Output menu.</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Sort payload by hour range to display in correct order (morning first)
      const sortedPayload = [...payload].sort((a, b) => {
        return HOUR_ORDER.indexOf(a.dataKey) - HOUR_ORDER.indexOf(b.dataKey);
      });

      return (
        <div className="bg-surface-strong border border-border p-4 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-primary font-black mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            {label}
          </p>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {sortedPayload.map((entry, index) => (
              entry.value > 0 && (
                <div key={index} className="flex justify-between items-center gap-6 text-xs transition-all hover:bg-white/5 p-1 rounded">
                  <span className="text-text-muted flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }}></span>
                    {entry.dataKey}
                  </span>
                  <span className="text-white font-bold">{entry.value.toLocaleString()} units</span>
                </div>
              )
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-border flex justify-between items-center text-sm">
            <span className="text-text-muted font-bold uppercase">Total Day</span>
            <span className="text-primary-light font-black underline decoration-primary/30 underline-offset-4">
              {payload[0].payload.total.toLocaleString()} units
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-xl font-bold text-text uppercase pl-2 border-l-4 border-primary">{title}</h3>
      
      <div className="glass-card p-6 relative group overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
        
        <h4 className="text-sm font-bold text-text-muted mb-8 uppercase tracking-wider flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full"></span>
            <span>Hourly Production Breakdown (By Cell)</span>
          </div>
          <div className="flex gap-4">
             <span className="text-[10px] font-normal text-text-muted/60 flex items-center gap-1">
               <span className="w-2 h-2 rounded-full border border-primary/40"></span>
               Snapshot View
             </span>
             <span className="text-xs font-bold text-primary/80 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
               Target Output Total
             </span>
          </div>
        </h4>

        <div className="h-[450px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="var(--color-text-muted)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'var(--color-text-muted)', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                stroke="var(--color-text-muted)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tick={{ fill: 'var(--color-text-muted)' }}
                tickFormatter={(val) => val.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="rect" 
                iconSize={10}
                wrapperStyle={{ paddingTop: '20px', fontSize: '10px', opacity: 0.7 }}
                formatter={(value) => <span className="text-text-muted hover:text-white transition-colors">{value.split(' - ')[0]}</span>}
              />
              
              {HOUR_ORDER.map((hour, index) => (
                <Bar 
                  key={hour} 
                  dataKey={hour} 
                  stackId="a" 
                  fill={HOUR_COLORS[index % HOUR_COLORS.length]} 
                  radius={index === HOUR_ORDER.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  animationDuration={1500}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HourlyDashboardChart;
