
import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'dashboard', label: 'Painel', icon: 'fa-chart-pie' },
  { id: 'segments', label: 'Modalidades/Turnos', icon: 'fa-layer-group' },
  { id: 'teachers', label: 'Professores', icon: 'fa-chalkboard-user' },
  { id: 'classes', label: 'Turmas', icon: 'fa-users' },
  { id: 'calendar', label: 'Calendários', icon: 'fa-calendar-days' },
  { id: 'schedule', label: 'Grade Horária', icon: 'fa-table' },
  { id: 'absences', label: 'Faltas', icon: 'fa-user-xmark' },
  { id: 'reports', label: 'Relatórios RAPI', icon: 'fa-file-lines' },
];

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="bg-brand-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-brand-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand-600 font-bold text-xl shadow">
            R
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">RAPI Escolar</h1>
            <p className="text-xs text-brand-100 opacity-70">Pro Multi-Turno</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {TABS.map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-brand-600 text-white shadow-lg translate-x-1' 
                      : 'text-brand-100 hover:bg-brand-800 hover:text-white'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} w-5 text-center`}></i>
                  <span className="font-medium">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-brand-700 text-xs text-brand-200 text-center">
          &copy; 2025 Sistema RAPI
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200 font-medium">
              <i className="fa-solid fa-wifi mr-1"></i> Online / PWA
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scroll">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
