import React, { useMemo } from 'react';
import { Upload, Bell, Search, ChevronDown } from 'lucide-react';

const Header = ({ 
  title, subtitle, onUploadClick, 
  categories, activeCategory, onSelectCategory, 
  filterMode, onFilterModeChange, filterValue, onFilterValueChange,
  availableDates,
  filterCell,
  onFilterCellChange,
  availableCells,
  hideTabs,
  hideSearch,
  hideActionButtons
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
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight sm:mb-1">{title}</h2>
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
                className="bg-transparent border-none outline-none text-sm w-24 sm:w-32 text-white placeholder:text-text-muted"
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
                className="w-full glass-card pl-3 pr-7 py-1.5 text-[10px] sm:text-sm font-bold appearance-none cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors"
              >
                <option value="all">All</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>

            {/* Dynamic filter value selector */}
            {(filterMode === 'day' || filterMode === 'week' || filterMode === 'month') && (
              <div className="relative flex-1 sm:flex-none min-w-[100px] animate-fade-in">
                <select
                  value={filterValue}
                  onChange={(e) => onFilterValueChange(e.target.value)}
                  className="w-full glass-card px-3 pr-7 py-1.5 text-[10px] sm:text-sm appearance-none cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors truncate"
                >
                  {filterMode === 'day' && dateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  {filterMode === 'week' && weekOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  {filterMode === 'month' && monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            )}

            {/* Cell Filter */}
            {!hideTabs && availableCells && availableCells.length > 0 && (
              <div className="relative flex-1 sm:flex-none min-w-[80px] sm:border-l sm:border-border sm:pl-3">
                <select
                  value={filterCell}
                  onChange={(e) => onFilterCellChange(e.target.value)}
                  className="w-full glass-card px-3 pr-7 py-1.5 text-[10px] sm:text-sm appearance-none cursor-pointer bg-surface-alt border border-border rounded-xl outline-none focus:border-primary transition-colors truncate"
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

          {!hideActionButtons && (
            <div className="flex items-center gap-2">
              <button className="glass-card p-1.5 sm:p-2 text-text-muted hover:text-white transition-colors">
                <Bell size={16} />
              </button>

              <button onClick={onUploadClick} className="btn-primary flex items-center justify-center gap-2 shrink-0 py-1.5 px-3 sm:py-2 sm:px-4">
                <Upload size={14} className="sm:size-4" />
                <span className="text-xs sm:text-sm font-bold">Import</span>
              </button>
            </div>
          )}
        </div>
      </div>

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
