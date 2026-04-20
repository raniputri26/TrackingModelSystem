import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const LineChartSection = ({ data, title }) => {
  // Transform data for Output/Day
  const chartDataDay = useMemo(() => {
    const dates = [...new Set(data.map(item => item.date))].sort();
    return dates.map(date => {
      const point = {
        name: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
      };
      data.filter(d => d.date === date).forEach(d => {
        point[d.cell] = Math.round(d.output_day);
      });
      return point;
    });
  }, [data]);

  // Transform data for Output/H
  const chartDataHour = useMemo(() => {
    const dates = [...new Set(data.map(item => item.date))].sort();
    return dates.map(date => {
      const point = {
        name: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
      };
      data.filter(d => d.date === date).forEach(d => {
        point[d.cell] = Math.round(d.output_h);
      });
      return point;
    });
  }, [data]);

  const cellNames = useMemo(() => {
    return [...new Set(data.map(item => item.cell))].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [data]);

  const colors = ['#06b6d4', '#84cc16', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7'];

  if (data.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold mb-6 text-white">{title}</h3>
        <div className="h-[300px] flex items-center justify-center text-text-muted">
          No trend data to display.
        </div>
      </div>
    );
  }

  const renderChart = (chartData, yAxisFormatter, targetVal = null) => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="var(--color-text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--color-text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={yAxisFormatter}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.75rem',
            color: 'var(--color-text)'
          }}
          itemStyle={{ color: 'var(--color-text)' }}
        />
        <Legend iconType="circle" />
        {targetVal !== null && (
          <ReferenceLine y={targetVal} ifOverflow="extendDomain" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} opacity={0.5} label={{ position: 'insideBottomLeft', value: 'TARGET 120', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
        )}
        {cellNames.map((name, index) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={colors[index % colors.length]}
            strokeWidth={3}
            dot={{ r: 4, fill: colors[index % colors.length], strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1500}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

  const renderBarChart = (chartData, yAxisFormatter, targetVal = null) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} barGap={2} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="var(--color-text-muted)" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke="var(--color-text-muted)" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={yAxisFormatter}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'var(--color-bg)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '0.75rem',
            color: 'var(--color-text)'
          }}
          itemStyle={{ color: 'var(--color-text)' }}
        />
        <Legend iconType="circle" />
        {targetVal !== null && (
          <ReferenceLine y={targetVal} ifOverflow="extendDomain" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} opacity={0.5} label={{ position: 'insideBottomLeft', value: 'TARGET 120', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
        )}
        {cellNames.map((name, index) => (
          <Bar
            key={name}
            dataKey={name}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-text uppercase pl-2 border-l-4 border-primary">{title}</h3>

      <div className="glass-card p-6">
        <h4 className="text-sm font-bold text-text-muted mb-6 uppercase tracking-wider flex items-center justify-between">
          <span>Trend Output / H</span>
          <span className="text-xs font-normal text-text-muted bg-surface-alt px-2 py-1 rounded">Target: 120 / h</span>
        </h4>
        <div className="h-[350px] w-full">
          {renderBarChart(chartDataHour, (value) => `${value.toLocaleString()}`, 120)}
        </div>
      </div>

      <div className="glass-card p-6">
        <h4 className="text-sm font-bold text-text-muted mb-6 uppercase tracking-wider">Trend Output / Day</h4>
        <div className="h-[350px] w-full">
          {renderChart(chartDataDay, (value) => `${value.toLocaleString()}`)}
        </div>
      </div>
    </div>
  );
};

export default LineChartSection;
