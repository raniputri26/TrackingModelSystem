import React, { useMemo } from 'react';
import { Upload, Bell, Search, Filter, ChevronDown } from 'lucide-react';

const Header = ({ 
  title, subtitle, onUploadClick, 
  categories, activeCategory, onSelectCategory, 
  filterMode, onFilterModeChange, filterValue, onFilterValueChange,
  availableDates,
  filterCell,
  onFilterCellChange,
  availableCells
}) => {

  // Generate week options from available dates
  const weekOptions = useMemo(() => {
    if (!availableDates || !availableDates.length) return [];
    const weeks = {};
    availableDates.forEach(dateStr => {
      const d = new Date(dateStr);
      // Get ISO week number
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-W${weekNum}`;
      if (!weeks[key]) {
        weeks[key] = { label: `Week ${weekNum} (${d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })})`, value: key, weekNum, year: d.getFullYear() };
      }
    });
    return Object.values(weeks).sort((a, b) => b.value.localeCompare(a.value));
  }, [availableDates]);

  // Generate month options from available dates
  const monthOptions = useMemo(() => {
    if (!availableDates || !availableDates.length) return [];
    const months = {};
    availableDates.forEach(dateStr => {
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) {
        months[key] = { label: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), value: key };
      }
    });
    return Object.values(months).sort((a, b) => b.value.localeCompare(a.value));
  }, [availableDates]);

  // Generate unique date options
  const dateOptions = useMemo(() => {
    if (!availableDates || !availableDates.length) return [];
    const unique = [...new Set(availableDates)].sort().reverse();
    return unique.map(d => ({
      value: d,
      label: new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }));
  }, [availableDates]);

  return (
    <header className="mb-8 space-y-5">
      {/* Top bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-0">
        <div className="w-full lg:w-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-1">{title}</h2>
          <p className="text-text-muted font-medium">{subtitle}</p>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative glass-card px-3 py-2 flex items-center gap-2">
            <Search className="text-text-muted" size={15} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none outline-none text-sm w-32 text-white placeholder:text-text-muted"
            />
          </div>

          {/* Filter Mode Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
              <select
                value={filterMode}
                onChange={(e) => onFilterModeChange(e.target.value)}
                className="glass-card pl-8 pr-8 py-2 text-sm font-bold appearance-none cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors"
              >
                <option value="all">All Data</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>

            {/* Dynamic filter value selector */}
            {filterMode === 'day' && dateOptions.length > 0 && (
              <div className="relative animate-fade-in">
                <select
                  value={filterValue}
                  onChange={(e) => onFilterValueChange(e.target.value)}
                  className="glass-card px-4 pr-8 py-2 text-sm appearance-none cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors"
                >
                  {dateOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            )}

            {filterMode === 'week' && weekOptions.length > 0 && (
              <div className="relative animate-fade-in">
                <select
                  value={filterValue}
                  onChange={(e) => onFilterValueChange(e.target.value)}
                  className="glass-card px-4 pr-8 py-2 text-sm appearance-none cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors"
                >
                  {weekOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            )}

            {filterMode === 'month' && monthOptions.length > 0 && (
              <div className="relative animate-fade-in">
                <select
                  value={filterValue}
                  onChange={(e) => onFilterValueChange(e.target.value)}
                  className="glass-card px-4 pr-8 py-2 text-sm appearance-none cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors"
                >
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            )}

            {/* Cell Filter */}
            {availableCells && availableCells.length > 0 && (
              <div className="relative border-l border-border pl-4 ml-2 max-w-48">
                <select
                  value={filterCell}
                  onChange={(e) => onFilterCellChange(e.target.value)}
                  className="glass-card px-4 pr-8 py-2 text-sm appearance-none cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors truncate max-w-full"
                >
                  <option value="all">All Cells</option>
                  {availableCells.map(cell => (
                    <option key={cell} value={cell}>{cell}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            )}
          </div>

          <button className="glass-card p-2.5 text-text-muted hover:text-white transition-colors">
            <Bell size={18} />
          </button>

          <button onClick={onUploadClick} className="btn-primary flex items-center justify-center gap-2 shrink-0">
            <Upload size={16} />
            <span className="hidden sm:inline">Import Data</span>
            <span className="sm:hidden">Import</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      {categories && categories.length > 0 && (
        <div className="flex overflow-x-auto hide-scrollbar border-b border-border/50 pb-1 w-full lg:justify-center relative">
          <div className="flex gap-2 min-w-max pr-4">
            {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-5 py-2.5 text-sm font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                activeCategory === cat
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-muted hover:text-white hover:border-border'
              }`}
            >
              {cat}
            </button>
          ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
