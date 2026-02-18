
import React from 'react';
import { 
  Home,
  LayoutDashboard, 
  Construction, 
  Package, 
  CalendarCheck, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setView: (view: any) => void;
  isOpen: boolean;
  toggleOpen: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, isOpen, toggleOpen, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prospecting', label: 'Prospecção', icon: Construction },
    { id: 'orders', label: 'Pedidos', icon: Package },
    { id: 'tasks', label: 'Tarefas', icon: CalendarCheck },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="h-full bg-brand-card flex flex-col border-r border-brand-border relative">
      <div className="p-6 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center text-black border-2 border-brand-dark shrink-0 shadow-lg">
          <Home size={24} fill="currentColor" />
        </div>
        {isOpen && <span className="font-bold text-xl tracking-tight">ENG<span className="text-brand-orange">MAT</span></span>}
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
              activeView === item.id 
                ? 'bg-brand-orange text-black shadow-lg shadow-brand-orange/20' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={22} className={activeView === item.id ? 'text-black' : 'text-gray-400 group-hover:text-brand-orange'} />
            {isOpen && <span className="font-bold whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-brand-border">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
        >
          <LogOut size={22} />
          {isOpen && <span className="font-medium">Sair</span>}
        </button>
      </div>

      <button 
        onClick={toggleOpen}
        className="absolute -right-3 top-20 w-6 h-6 bg-brand-orange rounded-full flex items-center justify-center text-black border-2 border-brand-dark transition-transform active:scale-90 shadow-md"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </aside>
  );
};

export default Sidebar;
