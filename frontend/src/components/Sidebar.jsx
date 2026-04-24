import React, { useState } from 'react';
import { LayoutDashboard, Activity, Clock, Pin, PinOff, BarChart3, Users } from 'lucide-react';

const Sidebar = ({ activeMenu, onSelectMenu }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`bg-sidebar border-r border-border h-screen flex flex-col transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'}`}>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-4 top-8 text-text-muted hover:text-text transition-all z-20 hover:scale-110"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <Pin size={16} className={`transform transition-transform duration-300 ${isCollapsed ? 'rotate-45 text-primary' : 'rotate-0'}`} />
      </button>

      {/* Logo Area */}
      <div className="flex items-center mb-12 mt-6 px-5 overflow-hidden">
        <div className="w-10 h-10 min-w-[2.5rem] bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Activity className="text-white w-6 h-6" />
        </div>
          <h1 className="text-xl font-bold tracking-tight text-text">TRACKING</h1>
          <p className="text-[10px] text-primary font-bold tracking-widest uppercase">Model System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 overflow-hidden">
        <p className={`font-bold text-text-muted uppercase tracking-widest px-3 transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'text-[0px] h-0 mb-0 opacity-0' : 'text-[10px] h-4 mb-3 opacity-100'}`}>
          Main Menu
        </p>

        <button
          onClick={() => onSelectMenu('dashboard')}
          title={isCollapsed ? "Overview Dashboard" : ""}
          className={`w-full nav-link flex items-center p-3 rounded-xl transition-all duration-200 overflow-hidden ${activeMenu === 'dashboard' ? 'active' : ''} ${isCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <LayoutDashboard size={18} className="min-w-[18px]" />
          <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[150px] opacity-100 ml-3'}`}>
            Overview Dashboard
          </span>
        </button>

        <button
          onClick={() => onSelectMenu('production')}
          title={isCollapsed ? "Production Tracking" : ""}
          className={`w-full nav-link flex items-center p-3 rounded-xl transition-all duration-200 overflow-hidden ${activeMenu === 'production' ? 'active' : ''} ${isCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <Activity size={18} className="min-w-[18px]" />
          <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[150px] opacity-100 ml-3'}`}>
            Production Tracking
          </span>
        </button>

        <button
          onClick={() => onSelectMenu('hourly')}
          title={isCollapsed ? "Hourly Input" : ""}
          className={`w-full nav-link flex items-center p-3 rounded-xl transition-all duration-200 overflow-hidden ${activeMenu === 'hourly' ? 'active' : ''} ${isCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <Clock size={18} className="min-w-[18px]" />
          <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[150px] opacity-100 ml-3'}`}>
            Hourly Output
          </span>
        </button>

        <button
          onClick={() => onSelectMenu('hourly_summary')}
          title={isCollapsed ? "Hourly Summary" : ""}
          className={`w-full nav-link flex items-center p-3 rounded-xl transition-all duration-200 overflow-hidden ${activeMenu === 'hourly_summary' ? 'active' : ''} ${isCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <BarChart3 size={18} className="min-w-[18px]" />
          <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[150px] opacity-100 ml-3'}`}>
            Hourly Summary
          </span>
        </button>

      </nav>

      {/* Footer Area */}
      <div className="mt-auto mb-6 mx-3">
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-[3rem]' : 'glass-card p-4 mx-1 max-h-[5rem]'}`}>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'max-w-0 opacity-0 h-0 m-0' : 'max-w-full opacity-100 mb-1'}`}>
            <p className="text-xs text-text-muted">Status System</p>
          </div>
          <div className={`flex items-center transition-all duration-300 ease-in-out ${isCollapsed ? 'justify-center mt-3' : 'gap-2'}`}>
            <div className="w-2.5 h-2.5 min-w-[10px] bg-success rounded-full animate-pulse" title="System Operational" />
            <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap text-sm font-medium ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[100px] opacity-100'}`}>
              Operational
            </span>
            
            {/* Small Visitor Analytics Link */}
            {!isCollapsed && (
              <button 
                onClick={() => onSelectMenu('visitors')}
                className={`ml-auto p-1.5 rounded-lg transition-all duration-200 hover:bg-white/10 ${activeMenu === 'visitors' ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text'}`}
                title="Visitor Analytics"
              >
                <Users size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
