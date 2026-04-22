import React, { useState, useEffect, useMemo } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardGrid from './components/DashboardGrid';
import LineChartSection from './components/LineChartSection';
import UploadModal from './components/UploadModal';
import HourlyLogs from './components/HourlyLogs';
import HourlyDashboardChart from './components/HourlyDashboardChart';
import HourlySummary from './components/HourlySummary';
import { getCategories, getProductionData, getHourlyDates, getHourlyLogs } from './api';

function App() {
  const [activeCategory, setActiveCategory] = useState('CUTTING + PREPARATION');
  const [activeMenu, setActiveMenu] = useState('hourly');
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState([]);
  const [hourlyDates, setHourlyDates] = useState([]);
  const [hourlyDashboardData, setHourlyDashboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filterMode, setFilterMode] = useState('month'); // all, day, week, month
  const [filterValue, setFilterValue] = useState('');
  const [filterCell, setFilterCell] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fixed category order
  const CATEGORY_ORDER = [
    'CUTTING + PREPARATION',
    'COMPUTER STITCHING',
    'SEWING',
    'ASSEMBLY'
  ];

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      // Start with ALL CATEGORY
      const sorted = ['ALL CATEGORY'];
      
      // Add standard categories in fixed order
      CATEGORY_ORDER.forEach(c => {
        if (res.data.includes(c)) sorted.push(c);
      });

      // Add any other categories from DB
      res.data.forEach(c => { 
        if (!sorted.includes(c)) sorted.push(c); 
      });
      
      setCategories(sorted);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getProductionData();
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchHourlyDates = async () => {
    try {
      const res = await getHourlyDates();
      setHourlyDates(res.data);
    } catch (err) {
      console.error("Failed to fetch hourly dates", err);
    }
  };

  const fetchHourlyDashboardData = async () => {
    try {
      const params = {};
      if (filterMode === 'day') params.date_filter = filterValue;
      // Note: Backend might need update for month_filter in hourly-logs if needed, 
      // but for now we focus on daily snapshot as requested by user.
      
      const res = await getHourlyLogs(params);
      setHourlyDashboardData(res.data);
    } catch (err) {
      console.error("Failed to fetch hourly dashboard data", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchCategories();
      await fetchData();
      await fetchHourlyDates();
      if (activeMenu === 'dashboard') await fetchHourlyDashboardData();
    };
    init();

    // Auto-polling for dashboard data
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch hourly dashboard data when filters or menu changes
  useEffect(() => {
    if (activeMenu === 'dashboard') {
      fetchHourlyDashboardData();
    }
  }, [activeMenu, filterMode, filterValue]);

  // Get unique dates based on active menu (Production vs Hourly)
  const availableDates = useMemo(() => {
    if (activeMenu === 'hourly' || activeMenu === 'hourly_summary') {
      return hourlyDates;
    }
    return [...new Set(data.map(d => d.date))].sort();
  }, [data, hourlyDates, activeMenu]);

  // Get all unique cells for the active category
  const availableCells = useMemo(() => {
    if (!data.length) return [];
    const categoryData = data.filter(d => d.category === activeCategory);
    const unique = [...new Set(categoryData.map(d => d.cell))];
    const CELL_ORDER = ['Cell 3', 'Cell 4', 'Cell 5', 'Cell 6', 'Cell 9', 'Cell 10', 'Cell 11', 'Cell D6', 'Cell BZ'];
    return unique.sort((a, b) => {
      const idxA = CELL_ORDER.indexOf(a);
      const idxB = CELL_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB || a.localeCompare(b);
    });
  }, [data, activeCategory]);

  // Auto-select latest filter value when mode changes
  useEffect(() => {
    if (!availableDates.length) return;

    if (filterMode === 'day') {
      setFilterValue(availableDates[availableDates.length - 1]); // latest date
    } else if (filterMode === 'week') {
      const d = new Date(availableDates[availableDates.length - 1]);
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
      setFilterValue(`${d.getFullYear()}-W${weekNum}`);
    } else if (filterMode === 'month') {
      const d = new Date(availableDates[availableDates.length - 1]);
      setFilterValue(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    } else {
      setFilterValue('');
    }
  }, [filterMode, availableDates]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!data.length) return [];

    let result = data;

    // Apply date filter
    if (filterMode !== 'all' && filterValue) {
      result = result.filter(d => {
        const date = new Date(d.date);
        if (filterMode === 'day') return d.date === filterValue;
        if (filterMode === 'week') {
          const jan1 = new Date(date.getFullYear(), 0, 1);
          const weekNum = Math.ceil(((date - jan1) / 86400000 + jan1.getDay() + 1) / 7);
          return `${date.getFullYear()}-W${weekNum}` === filterValue;
        }
        if (filterMode === 'month') {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === filterValue;
        }
        return true;
      });
    }

    // Apply cell filter
    if (filterCell !== 'all') {
      result = result.filter(d => d.cell === filterCell);
    }

    return result;
  }, [data, filterMode, filterValue, filterCell]);

  // Show all categories if "ALL CATEGORY" is selected, otherwise show only the selected one
  const visibleCategories = activeCategory === 'ALL CATEGORY'
    ? categories.filter(c => c !== 'ALL CATEGORY')
    : [activeCategory];

  return (
    <div className="flex h-screen bg-bg overflow-hidden relative">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className={`lg:hidden absolute top-5 left-4 z-30 bg-surface-strong border border-border p-2 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.5)] text-text hover:text-white hover:border-primary/50 transition-all focus:outline-none ${isMobileMenuOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
      >
        <Menu size={22} />
      </button>

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl shadow-black/50' : '-translate-x-full'}`}>
        <Sidebar
          activeMenu={activeMenu}
          onSelectMenu={(menu) => {
            setActiveMenu(menu);
            setIsMobileMenuOpen(false); // Auto close on mobile
            
            // Set default filters for Hourly Summary
            if (menu === 'hourly_summary') {
              setFilterMode('day');
              setFilterValue(new Date().toISOString().split('T')[0]);
            }
          }}
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden h-screen w-full relative">
        <div className="pt-6 px-2 pl-[4rem] lg:px-8 lg:pt-8 flex-shrink-0 z-10 bg-bg">
          {activeMenu !== 'hourly' && (
            <Header
              title={
                activeMenu === 'dashboard' ? 'Analytics Dashboard' :
                  activeMenu === 'hourly_summary' ? 'Hourly Performance Summary' :
                    'Production Tracking New Model'
              }
              subtitle={
                activeMenu === 'dashboard' ? 'Performance Overview & Trends' :
                  activeMenu === 'hourly_summary' ? 'Live Aggregated Output Monitoring' :
                    'Production Monitoring'
              }
              onUploadClick={() => setIsUploadOpen(true)}
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              filterMode={filterMode}
              onFilterModeChange={setFilterMode}
              filterValue={filterValue}
              onFilterValueChange={setFilterValue}
              availableDates={availableDates}
              filterCell={filterCell}
              onFilterCellChange={setFilterCell}
              availableCells={availableCells}
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-10 animate-fade-in">
              {activeMenu === 'hourly' ? (
                <HourlyLogs />
              ) : activeMenu === 'hourly_summary' ? (
                <HourlySummary
                  filterMode={filterMode}
                  filterValue={filterValue}
                  filterCell={filterCell}
                  activeCategory={activeCategory}
                  categories={categories.filter(c => c !== 'ALL CATEGORY')}
                />
              ) : activeMenu === 'dashboard' ? (
                <div className="grid grid-cols-1 gap-10">
                  {visibleCategories.map(cat => (
                    <LineChartSection
                      key={cat}
                      data={filteredData.filter(d => d.category === cat)}
                      title={`${cat} Trend Analysis`}
                    />
                  ))}
                </div>
              ) : (
                <div>
                  {visibleCategories.map(cat => (
                    <DashboardGrid
                      key={cat}
                      data={filteredData.filter(d => d.category === cat)}
                      title={`${cat}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            fetchCategories();
            fetchData();
            setIsUploadOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
