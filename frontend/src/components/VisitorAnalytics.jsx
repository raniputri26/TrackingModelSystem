import React, { useState, useEffect } from 'react';
import { Users, Eye, Monitor, Smartphone, Globe, Clock, LayoutDashboard } from 'lucide-react';
import { getVisitorStats } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const VisitorAnalytics = ({ filterMode, filterValue }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getVisitorStats({ 
          filter_mode: filterMode, 
          filter_value: filterValue 
        });
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch visitor stats", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    // Refresh every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [filterMode, filterValue]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) return null;

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-card p-6 flex flex-col justify-between items-start animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Eye size={22} />
            </div>
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Total Page Views</h3>
          </div>
          <p className="text-4xl font-bold text-white">{stats.total_views.toLocaleString()}</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between items-start animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Users size={22} />
            </div>
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Unique Devices</h3>
          </div>
          <p className="text-4xl font-bold text-white">{stats.unique_visitors.toLocaleString()}</p>
        </div>
        
        <div className="glass-card p-6 flex flex-col justify-between items-start animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
              <Smartphone size={22} />
            </div>
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Mobile Users</h3>
          </div>
          <p className="text-4xl font-bold text-white">
            {stats.devices.filter(d => d.name.includes('Mobile')).reduce((sum, d) => sum + d.value, 0).toLocaleString()}
          </p>
        </div>
        
        <div className="glass-card p-6 flex flex-col justify-between items-start animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Monitor size={22} />
            </div>
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Desktop Users</h3>
          </div>
          <p className="text-4xl font-bold text-white">
            {stats.devices.filter(d => d.name.includes('Desktop')).reduce((sum, d) => sum + d.value, 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center text-text-muted">
              <LayoutDashboard size={18} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Device Breakdown</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.devices} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', color: 'var(--color-text)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1000}>
                  {stats.devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Trend */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center text-text-muted">
              <Clock size={18} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Visits Over Time</h3>
          </div>
          <div className="h-[300px]">
            {stats.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}/${d.getMonth()+1}`;
                  }}/>
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', color: 'var(--color-text)' }}
                  />
                  <Bar dataKey="visits" fill="var(--color-primary)" radius={[4, 4, 0, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                Not enough data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="p-4 sm:p-6 border-b border-border bg-surface-alt/30 flex items-center gap-3">
          <Globe size={18} className="text-text-muted" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Recent Live Traffic</h4>
        </div>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-surface-alt/50 border-b border-border">
                <th className="p-4 font-bold text-text-muted">Time (Live)</th>
                <th className="p-4 font-bold text-text-muted">Device</th>
                <th className="p-4 font-bold text-text-muted">OS</th>
                <th className="p-4 font-bold text-text-muted">Browser</th>
                <th className="p-4 font-bold text-text-muted text-right">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_logs.map((log, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-primary font-medium">
                    {new Date(log.time.replace(' ', 'T') + 'Z').toLocaleString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td className="p-4 text-text">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      log.device === 'Mobile' ? 'bg-purple-500/20 text-purple-400' : 
                      log.device === 'Desktop' ? 'bg-emerald-500/20 text-emerald-400' : 
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {log.device}
                    </span>
                  </td>
                  <td className="p-4 text-text">{log.os}</td>
                  <td className="p-4 text-text">{log.browser}</td>
                  <td className="p-4 text-text-muted text-right font-mono text-xs">{log.ip}</td>
                </tr>
              ))}
              {stats.recent_logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-text-muted">No recent activity found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VisitorAnalytics;
