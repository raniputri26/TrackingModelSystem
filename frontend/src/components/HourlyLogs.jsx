import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, Clock, Filter, ChevronDown, Package, AlertTriangle, TrendingUp, BarChart as BarChartIcon } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell, LabelList } from 'recharts';
import { getHourlyLogs, deleteHourlyLog, getCategories } from '../api';
import HourlyLogModal from './HourlyLogModal';

const CATEGORY_ORDER = [
  'CUTTING + PREPARATION',
  'COMPUTER STITCHING',
  'SEWING',
  'ASSEMBLY',
];

const CATEGORY_COLORS = {
  'CUTTING + PREPARATION': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', accent: '#06b6d4' },
  'COMPUTER STITCHING': { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30', accent: '#8b5cf6' },
  'SEWING': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', accent: '#10b981' },
  'ASSEMBLY': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', accent: '#f59e0b' },
};

const HOUR_ORDER = [
  '07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
  '11:00 - 12:00', '13:00 - 14:00', '14:00 - 15:00',
  '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00',
  '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00',
];

const cellSortKey = (name) => {
  const match = name.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
};

const HourlyLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState(CATEGORY_ORDER);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterCell, setFilterCell] = useState('all');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [editData, setEditData] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterDate) params.date_filter = filterDate;
      const res = await getHourlyLogs(params);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch hourly logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCategories().then(res => {
      const merged = [...CATEGORY_ORDER];
      res.data.forEach(c => { if (!merged.includes(c)) merged.push(c); });
      setCategories(merged);
    }).catch(() => { });
  }, []);

  useEffect(() => { fetchLogs(); }, [filterCategory, filterDate]);

  // Auto-polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [filterCategory, filterDate]); // Re-create interval if filters change to ensure correct data fetches

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    try {
      await deleteHourlyLog(id);
      fetchLogs();
    } catch (err) {
      console.error("Failed to delete log", err);
    }
  };

  const handleEdit = (log) => {
    setEditData(log);
    setShowModal(true);
  };

  // Determine available cells from fetched logs
  const availableCells = useMemo(() => {
    const cells = new Set();
    logs.forEach(l => cells.add(l.cell));
    return Array.from(cells).sort((a, b) => cellSortKey(a) - cellSortKey(b));
  }, [logs]);

  // Group & sort logs by category
  const groupedData = useMemo(() => {
    const visibleCats = filterCategory === 'all' ? CATEGORY_ORDER : [filterCategory];
    return visibleCats.map(cat => {
      const catLogs = logs
        .filter(l => l.category === cat && (filterCell === 'all' || l.cell === filterCell))
        .sort((a, b) => {
          const cellDiff = cellSortKey(a.cell) - cellSortKey(b.cell);
          if (cellDiff !== 0) return cellDiff;
          return HOUR_ORDER.indexOf(a.hour_range) - HOUR_ORDER.indexOf(b.hour_range);
        });
      return { category: cat, logs: catLogs };
    });
  }, [logs, filterCategory, filterCell]);

  // Summary stats (reflecting cell filter)
  const stats = useMemo(() => {
    const displayedLogs = filterCell === 'all' ? logs : logs.filter(l => l.cell === filterCell);
    const totalOutput = displayedLogs.reduce((s, l) => s + (l.output || 0), 0);
    const totalBGrade = displayedLogs.reduce((s, l) => s + (l.b_grade || 0), 0);
    const totalCGrade = displayedLogs.reduce((s, l) => s + (l.c_grade || 0), 0);
    return { totalOutput, totalBGrade, totalCGrade, totalRecords: displayedLogs.length };
  }, [logs, filterCell]);

  // --- Auto-Cycle States for Chart ---
  const [localSelectedCell, setLocalSelectedCell] = useState('auto'); // 'auto', 'all', or specific cell
  const [cycleIndex, setCycleIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);

  // Get available cells for the current category to cycle through
  const chartCells = useMemo(() => {
    // Collect all unique category + cell combinations from the logs
    const pairs = [];
    const seen = new Set();

    logs.forEach(l => {
      // If we are filtering by category, only include those cells
      if (filterCategory !== 'all' && l.category !== filterCategory) return;
      
      const key = `${l.category}|${l.cell}`;
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({ category: l.category, cell: l.cell });
      }
    });

    // Sort: First by Cell Number, then by Category Order
    return pairs.sort((a, b) => {
      const numA = parseInt(a.cell.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.cell.replace(/\D/g, ''), 10) || 0;
      
      if (numA !== numB) return numA - numB;
      
      // Secondary sort: pre-defined CATEGORY_ORDER index
      return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    });
  }, [logs, filterCategory]);

  // Auto-Cycle Timer Logic
  useEffect(() => {
    let timer;
    if (localSelectedCell === 'auto' && chartCells.length > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setCycleIndex(idx => (idx + 1) % chartCells.length);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [localSelectedCell, chartCells]);

  // Determine which cell is currently "Active" for the chart
  const activeChartCell = useMemo(() => {
    if (localSelectedCell === 'auto' && chartCells.length > 0) {
      return chartCells[cycleIndex];
    }
    if (localSelectedCell !== 'all' && localSelectedCell !== 'auto') {
      // Find the first matching pair in chartCells for manual selection
      return chartCells.find(c => c.cell === localSelectedCell) || { category: filterCategory, cell: localSelectedCell };
    }
    return null; // Show all (summed)
  }, [localSelectedCell, cycleIndex, chartCells, filterCategory]);

  // Aggregate data for the Hourly Performance Chart
  const hourlyChartData = useMemo(() => {
    const filteredLogs = logs.filter(l => 
      // If we have an active pair, filter strictly by both
      activeChartCell 
        ? (l.category === activeChartCell.category && l.cell === activeChartCell.cell)
        : (filterCategory === 'all' || l.category === filterCategory)
    );

    return HOUR_ORDER.map(hour => {
      const logsInHour = filteredLogs.filter(l => l.hour_range === hour);
      const totalOutput = logsInHour.reduce((sum, l) => sum + (l.output || 0) + (l.b_grade || 0) + (l.c_grade || 0), 0);
      return {
        name: hour.split(' - ')[0],
        fullName: hour,
        output: totalOutput
      };
    });
  }, [logs, filterCategory, activeChartCell]);

  const renderCustomBarLabel = ({ x, y, width, value }) => {
    if (!value || value === 0) return null;
    return (
      <text 
        x={x + width / 2} 
        y={y - 12} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="middle" 
        fontSize="13" 
        fontWeight="900"
      >
        {value}
      </text>
    );
  };

  const selectClass = "bg-surface-alt border border-border rounded-xl pl-3 pr-8 py-2.5 text-sm font-bold appearance-none cursor-pointer outline-none focus:border-primary transition-colors";
  const defaultColor = { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', accent: '#64748b' };

  return (
    <div className="-mx-2 lg:-mx-8 -mt-4 animate-fade-in">
      {/* Sticky Header Zone */}
      <div className="sticky top-0 z-20 bg-bg px-2 pl-[4rem] lg:px-8 pt-1 pb-3 space-y-3 border-b border-border bg-clip-padding">
        {/* Header - More Compact on Mobile */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white leading-tight truncate">Hourly Output 603</h2>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Live</span>
              </div>
            </div>
            <p className="text-text-muted text-[10px] sm:text-sm mt-0.5 truncate hidden xs:block">Record and monitor output & grade per hour</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 bg-primary hover:bg-primary/90 text-bg px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={14} className="sm:size-4" />
            <span className="xs:inline">Add</span>
            <span className="hidden xs:inline">Log</span>
          </button>
        </div>

        {/* Stats Cards - 2x2 Grid for Compactness on Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <div className="glass-card p-2 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Package size={14} className="sm:size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-xs text-text-muted font-bold uppercase tracking-wider truncate">Total Output</p>
              <p className="text-sm sm:text-xl font-extrabold text-white truncate">{stats.totalOutput.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass-card p-2 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle size={14} className="sm:size-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-xs text-text-muted font-bold uppercase tracking-wider truncate">B Grade</p>
              <p className="text-sm sm:text-xl font-extrabold text-amber-400 truncate">{stats.totalBGrade.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass-card p-2 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle size={14} className="sm:size-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-xs text-text-muted font-bold uppercase tracking-wider truncate">C Grade</p>
              <p className="text-sm sm:text-xl font-extrabold text-red-400 truncate">{stats.totalCGrade.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass-card p-2 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <TrendingUp size={14} className="sm:size-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-xs text-text-muted font-bold uppercase tracking-wider truncate">Records</p>
              <p className="text-sm sm:text-xl font-extrabold text-white truncate">{stats.totalRecords}</p>
            </div>
          </div>
        </div>

        {/* Filters - Scrollable on Mobile to prevent clipping */}
        <div className="glass-card p-2 sm:p-4 flex items-center gap-2 sm:gap-4 border border-border bg-bg relative shadow-lg shadow-black overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-1.5 text-text-muted text-[10px] shrink-0 lg:flex">
            <Filter size={12} className="text-primary" />
            <span className="font-bold uppercase tracking-wider">Filter</span>
          </div>
          <div className="hidden sm:block w-px h-5 bg-border shrink-0" />
          <div className="relative shrink-0 min-w-[120px] sm:flex-none">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className={`${selectClass} w-full`}
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          <div className="relative shrink-0 min-w-[120px] sm:flex-none">
            <select
              value={filterCell}
              onChange={e => setFilterCell(e.target.value)}
              className={`${selectClass} w-full`}
            >
              <option value="all">All Cells</option>
              {availableCells.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          <div className="relative shrink-0 min-w-[130px] sm:flex-none">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className={`${selectClass} w-full`}
            />
          </div>
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-widest shrink-0 px-2"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Hourly Performance Chart Section */}
      <div className="px-8 pt-4">
        <div className="glass-card p-6 border border-emerald-500/10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full bg-primary" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  Hourly Performance Visualizer
                  <span className="text-[10px] font-normal text-text-muted normal-case ml-2">Target: 120/hr</span>
                </h3>
                {activeChartCell && localSelectedCell === 'auto' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      {activeChartCell.cell} — {activeChartCell.category}
                    </span>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">
                      Auto-Cycle ({timeLeft}s)
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-tighter mt-1">
                    {activeChartCell ? `${activeChartCell.cell} - ${activeChartCell.category}` : (filterCategory === 'all' ? 'Factory Overview (All Categories)' : `${filterCategory} Overview`)} • {new Date(filterDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Local Filter Dropdown */}
              <div className="relative">
                <select
                  value={localSelectedCell}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocalSelectedCell(val);
                    if (val === 'auto') {
                      setTimeLeft(10);
                      setCycleIndex(0);
                    }
                  }}
                  className="bg-surface-alt border border-border rounded-xl pl-3 pr-8 py-2 text-[10px] font-bold text-white appearance-none cursor-pointer outline-none focus:border-primary transition-all min-w-[170px]"
                >
                  <option value="auto">🔄 Auto Rotate Sequence</option>
                  <option value="all">📊 Show Summed Total</option>
                  <optgroup label="Select Specific Cell">
                    {[...new Set(chartCells.map(c => c.cell))].map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>

              <div className="flex items-center gap-3 border-l border-border pl-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-text-muted uppercase font-mono">OK</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] font-bold text-text-muted uppercase font-mono">BELOW</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hourlyChartData} margin={{ top: 45, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--color-text-muted)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  interval={0}
                />
                <YAxis 
                  stroke="var(--color-text-muted)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, 'dataMax + 40']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-bg)', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: '0.75rem',
                    color: 'var(--color-text)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: 'var(--color-text)' }}
                  labelStyle={{ color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <ReferenceLine 
                  y={120} 
                  ifOverflow="extendDomain" 
                  stroke="#ef4444" 
                  strokeDasharray="5 5" 
                  strokeWidth={2} 
                  opacity={0.5} 
                  label={{ position: 'insideTopRight', value: 'TARGET 120', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} 
                />
                <Bar 
                  dataKey="output" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={0}
                >
                  {hourlyChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.output >= 120 ? '#10b981' : '#ef4444'} 
                      fillOpacity={entry.output === 0 ? 0.1 : 0.8}
                    />
                  ))}
                </Bar>
                <Line 
                  dataKey="output" 
                  stroke="none" 
                  dot={false}
                  isAnimationActive={false}
                >
                  <LabelList 
                    dataKey="output" 
                    position="top" 
                    fill="#FFFFFF" 
                    fontSize={10} 
                    fontWeight="bold" 
                    offset={8}
                    formatter={(val) => val > 0 ? val : ''}
                  />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Scrollable Tables */}
      <div className="px-8 pb-8 pt-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
          </div>
        ) : (
          /* Category Tables */
          <div className="space-y-8">
            {groupedData.map(({ category, logs: catLogs }) => {
              const color = CATEGORY_COLORS[category] || defaultColor;
              const catTotalOutput = catLogs.reduce((s, l) => s + (l.output || 0) + (l.b_grade || 0) + (l.c_grade || 0), 0);

              return (
                <div key={category} className="space-y-3">
                  {/* Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 sm:px-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-6 sm:h-8 rounded-full`} style={{ backgroundColor: color.accent }} />
                      <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide">{category}</h3>
                      <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 sm:px-2.5 py-1 rounded-lg ${color.bg} ${color.text} border ${color.border}`}>
                        {catLogs.length}
                      </span>
                    </div>
                    {catLogs.length > 0 && (
                      <div className="flex items-center gap-4 text-[11px] sm:text-xs text-text-muted pl-4 sm:pl-0">
                        <span>Total Output: <strong className="text-white">{catTotalOutput.toLocaleString()}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Table */}
                  <div className={`glass-card overflow-hidden border ${color.border}`}>
                    <div className="overflow-x-auto overflow-y-auto max-h-[420px]">
                      <table className="w-full text-sm relative">
                        <thead className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: '#0f172a' }}>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-text-muted font-bold text-[11px] uppercase tracking-wider">Date</th>
                            <th className="text-left py-3 px-4 text-text-muted font-bold text-[11px] uppercase tracking-wider">Cell</th>
                            <th className="text-left py-3 px-4 text-text-muted font-bold text-[11px] uppercase tracking-wider">
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-primary" />
                                Hour
                              </div>
                            </th>
                            <th className="text-right py-3 px-4 text-text-muted font-bold text-[11px] uppercase tracking-wider">Output</th>
                            <th className="text-right py-3 px-4 text-text-muted font-bold text-[11px] uppercase tracking-wider">B Grade</th>
                            <th className="text-right py-3 px-4 text-text-muted font-bold text-[11px] uppercase tracking-wider">C Grade</th>
                            <th className="text-right py-3 px-4 text-text-muted font-bold text-[11px] uppercase tracking-wider">Output / Target</th>
                            <th className="text-left py-3 px-4 text-text-muted font-bold text-[11px] uppercase tracking-wider min-w-[120px]">Note</th>
                            <th className="text-center py-3 px-4 text-text-muted font-bold text-[11px] uppercase tracking-wider w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catLogs.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-8 text-center text-text-muted">
                                <p className="text-xs opacity-50">No data recorded.</p>
                              </td>
                            </tr>
                          ) : (
                            catLogs.map((log, i) => {
                              const totalOutput = (log.output || 0) + (log.b_grade || 0) + (log.c_grade || 0);
                              const target = 120;
                              const isAbove = totalOutput >= target;
                              return (
                                <tr key={log.id} className={`border-b border-border/30 hover:bg-white/[0.03] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                                  <td className="py-2.5 px-4 text-[13px] text-text-muted">
                                    {new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <span className="text-[13px] font-semibold text-white">{log.cell}</span>
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${color.bg} ${color.text}`}>
                                      {log.hour_range}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right text-[13px] font-bold text-white">{log.output.toLocaleString()}</td>
                                  <td className="py-2.5 px-4 text-right text-[13px]">
                                    <span className={`font-bold ${log.b_grade > 0 ? 'text-amber-400' : 'text-text-muted/40'}`}>
                                      {log.b_grade}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right text-[13px]">
                                    <span className={`font-bold ${log.c_grade > 0 ? 'text-red-400' : 'text-text-muted/40'}`}>
                                      {log.c_grade}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right text-[13px]">
                                    <span className={`font-bold ${isAbove ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {totalOutput}
                                      <span className="text-text-muted/50 font-normal text-[11px] ml-1">/ {target}</span>
                                      <span className="ml-1 text-[10px]">{isAbove ? '▲' : '▼'}</span>
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-left text-[12px] text-text-muted/80 italic max-w-[200px] truncate" title={log.note || ''}>
                                    {log.note || '-'}
                                  </td>
                                  <td className="py-2.5 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleEdit(log)}
                                        className="text-text-muted/40 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10"
                                        title="Edit"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(log.id)}
                                        className="text-text-muted/40 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
                                        title="Delete"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <HourlyLogModal
          editData={editData}
          onClose={() => {
            setShowModal(false);
            setEditData(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditData(null);
            fetchLogs();
          }}
        />
      )}
    </div>
  );
};

export default HourlyLogs;
