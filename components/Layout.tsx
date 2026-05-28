import React, { useState } from 'react';
import {
  LayoutDashboard, ScanLine, FileBarChart, Settings, GraduationCap,
  LogOut, Menu, X, ChevronRight, ChevronLeft, CloudLightning, RefreshCw
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSyncing?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isSyncing }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'attendance', icon: ScanLine, label: 'Scan Attendance' },
    { id: 'reports', icon: FileBarChart, label: 'Reports' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Insights' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col shadow-sm transition-all duration-300 ease-in-out transform
        lg:relative lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64 w-64'}`}
      >
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap overflow-hidden">
              BusAttend
            </span>
          )}
          <button className="lg:hidden ml-auto p-2 text-slate-400 hover:text-slate-600" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all relative group ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-xl transition-all ${isCollapsed ? 'justify-center' : ''}`}>
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 lg:hidden text-slate-500 hover:bg-slate-50 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-base lg:text-lg font-bold text-slate-800 capitalize truncate">
              {activeTab === 'attendance' ? 'QR Scanner' : activeTab.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isSyncing ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CloudLightning className="w-3 h-3" />}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isSyncing ? 'Syncing...' : 'Cloud Link'}
              </span>
            </div>
            <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-1"></div>
            <img src="https://picsum.photos/seed/dean/64/64" alt="Profile" className="w-8 h-8 rounded-full border border-slate-200" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
