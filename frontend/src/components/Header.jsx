import React, { useMemo } from 'react';
import { Upload, Bell, Search, ChevronDown, Calendar, Sun, Moon } from 'lucide-react';

const Header = ({ 
  title, subtitle, onUploadClick, 
  categories, activeCategory, onSelectCategory, 
  filterMode, onFilterModeChange, filterValue, onFilterValueChange,
  availableDates,
  filterRangeStart,
  filterRangeEnd,
  onFilterRangeStartChange,
  onFilterRangeEndChange,
  filterCell,
  onFilterCellChange,
  availableCells,
  dashboardType,
  onDashboardTypeChange,
  activeMenu,
  hideTabs,
  hideSearch,
  hideActionButtons,
  theme,
  toggleTheme
}) => {

  // Generate week options from available dates
  const weekOptions = useMemo(() => {
    if (!availableDates || !availableDates.length) return [];
    const weeks = {};
    availableDates.forEach(dateStr => {
      const d = new Date(dateStr);
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
    <header className="mb-4 sm:mb-8 space-y-3 sm:space-y-5">
      {/* Top bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-0">
        <div className="w-full lg:w-auto">
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-text leading-tight sm:mb-1">{title}</h2>
          <p className="text-[10px] sm:text-sm text-text-muted font-medium">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {/* Search */}
          {!hideSearch && (
            <div className="hidden sm:flex relative glass-card px-3 py-2 items-center gap-2">
              <Search className="text-text-muted" size={15} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm w-24 sm:w-32 text-text placeholder:text-text-muted"
              />
            </div>
          )}

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 sm:flex-none">
            {/* Filter Mode */}
            <div className="relative flex-1 sm:flex-none min-w-[80px]">
              <select
                value={filterMode}
                onChange={(e) => onFilterModeChange(e.target.value)}
                className="w-full glass-card pl-3 pr-7 py-1.5 text-[10px] sm:text-sm font-bold appearance-none cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors text-text"
              >
                <option value="all">All</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="range">Range</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>

            {/* Dynamic filter value selector */}
            {(filterMode === 'day' || filterMode === 'week' || filterMode === 'month') && (
              <div className="relative flex-1 sm:flex-none min-w-[100px] animate-fade-in">
                <select
                  value={filterValue}
                  onChange={(e) => onFilterValueChange(e.target.value)}
                  className="w-full glass-card px-3 pr-7 py-1.5 text-[10px] sm:text-sm appearance-none cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors truncate text-text"
                >
                  {filterMode === 'day' && dateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  {filterMode === 'week' && weekOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  {filterMode === 'month' && monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            )}

            {/* Date Range Picker */}
            {filterMode === 'range' && (
              <div className="flex items-center gap-1.5 sm:gap-2 animate-fade-in">
                <div className="relative flex-1 sm:flex-none min-w-[120px]">
                  <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type="date"
                    value={filterRangeStart}
                    onChange={(e) => onFilterRangeStartChange(e.target.value)}
                    className="w-full glass-card pl-7 pr-2 py-1.5 text-[10px] sm:text-sm cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors text-text [color-scheme:dark]"
                  />
                </div>
                <span className="text-text-muted text-[10px] sm:text-xs font-semibold">to</span>
                <div className="relative flex-1 sm:flex-none min-w-[120px]">
                  <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type="date"
                    value={filterRangeEnd}
                    onChange={(e) => onFilterRangeEndChange(e.target.value)}
                    className="w-full glass-card pl-7 pr-2 py-1.5 text-[10px] sm:text-sm cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors text-text [color-scheme:dark]"
                  />
                </div>
              </div>
            )}

            {/* Cell Filter */}
            {!hideTabs && availableCells && availableCells.length > 0 && (
              <div className="relative flex-1 sm:flex-none min-w-[80px] sm:border-l sm:border-border sm:pl-3">
                <select
                  value={filterCell}
                  onChange={(e) => onFilterCellChange(e.target.value)}
                  className="w-full glass-card px-3 pr-7 py-1.5 text-[10px] sm:text-sm appearance-none cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors truncate text-text"
                >
                  <option value="all">Cells</option>
                  {availableCells.map(cell => (
                    <option key={cell} value={cell}>{cell}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="glass-card p-1.5 sm:p-2 text-text-muted hover:text-primary transition-all hover:scale-110 active:scale-95"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {!hideActionButtons && (
              <>
                <button className="glass-card p-1.5 sm:p-2 text-text-muted hover:text-text transition-colors">
                  <Bell size={16} />
                </button>

                <button onClick={onUploadClick} className="btn-primary flex items-center justify-center gap-2 shrink-0 py-1.5 px-3 sm:py-2 sm:px-4">
                  <Upload size={14} className="sm:size-4" />
                  <span className="text-xs sm:text-sm font-bold">Import</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Type Selection (Produksi / Marketing) */}
      {activeMenu === 'dashboard' && (
        <div className="flex items-center gap-6 border-b border-border/20 mb-2 px-1">
          <button
            onClick={() => onDashboardTypeChange('produksi')}
            className={`group relative pb-3 text-xs sm:text-sm font-bold tracking-wider transition-all ${
              dashboardType === 'produksi' ? 'text-primary' : 'text-text-muted hover:text-text'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>PRODUKSI</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${dashboardType === 'produksi' ? 'rotate-180' : ''}`} />
            </div>
            {dashboardType === 'produksi' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(6,182,212,0.5)] rounded-full animate-in fade-in slide-in-from-bottom-1" />
            )}
          </button>

          <button
            onClick={() => onDashboardTypeChange('marketing')}
            className={`group relative pb-3 text-xs sm:text-sm font-bold tracking-wider transition-all ${
              dashboardType === 'marketing' ? 'text-primary' : 'text-text-muted hover:text-text'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span>MARKETING</span>
              <ChevronDown size={14} className={`transition-transform duration-300 ${dashboardType === 'marketing' ? 'rotate-180' : ''}`} />
            </div>
            {dashboardType === 'marketing' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(6,182,212,0.5)] rounded-full animate-in fade-in slide-in-from-bottom-1" />
            )}
          </button>
        </div>
      )}

      {/* Category Tabs */}
      {!hideTabs && categories && categories.length > 0 && (
        <div className="flex overflow-x-auto hide-scrollbar border-b border-border/30 w-full lg:justify-center relative">
          <div className="flex gap-1 sm:gap-2 min-w-max pr-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-2 sm:px-5 sm:py-2.5 text-[10px] sm:text-sm font-bold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
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
